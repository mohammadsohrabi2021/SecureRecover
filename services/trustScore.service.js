import connectDB from "@/lib/db";
import TrustScore from "@/models/TrustScore";
import TrustEvent from "@/models/TrustEvent";
import TrustedDevice from "@/models/TrustedDevice";
import SecurityLog from "@/models/SecurityLog";
import { UAParser } from "ua-parser-js";
import {
  resolveTrustLevel,
  TRUST_LEVELS,
  REQUIRED_ACTIONS,
  TRUST_LEVEL_CONFIG,
} from "@/types/trust";

const SCORE_WEIGHTS = {
  NEW_LOCATION: -15,
  UNUSUAL_TIME: -10,
  NEW_DEVICE: -12,
  SUSPICIOUS_IP: -25,
  WRONG_OTP: -8,
  FAILED_LOGIN: -10,
  SUCCESS_LOGIN: 8,
  SUCCESS_WITH_OTP: 5,
  SUCCESS_WITHOUT_OTP: 12,
  TRUSTED_DEVICE: 10,
  RECOVERY_USED: 3,
};

class TrustScoreService {
  /**
   * Idempotent upsert of a trusted device within a user's TrustScore document.
   * Updates lastSeen if deviceId exists; otherwise adds to the array.
   */
  async upsertTrustedDeviceEntry(userId, deviceInfo = {}, _retry = false) {
    await connectDB();

    const {
      deviceId,
      deviceName = "دستگاه ناشناس",
      deviceType,
      browser,
      os,
    } = deviceInfo;

    if (!deviceId) return null;

    const now = new Date();
    const updateOpts = { returnDocument: "after" };

    try {
      const updated = await TrustScore.findOneAndUpdate(
        { userId, "trustedDevices.deviceId": deviceId },
        {
          $set: {
            "trustedDevices.$.lastSeen": now,
            "trustedDevices.$.deviceName": deviceName,
            ...(deviceType && { "trustedDevices.$.deviceType": deviceType }),
            ...(browser && { "trustedDevices.$.browser": browser }),
            ...(os && { "trustedDevices.$.os": os }),
            lastUpdated: now,
          },
          $inc: { "trustedDevices.$.loginCount": 1 },
        },
        updateOpts
      );

      if (updated) {
        const entry = updated.trustedDevices.find((d) => d.deviceId === deviceId);
        if (entry) {
          entry.trustMultiplier = Math.min(1.5, (entry.trustMultiplier || 1) + 0.05);
          updated.trustedDevices = this.dedupeTrustedDevices(updated.trustedDevices);
          await updated.save();
        }
        return updated;
      }

      const inserted = await TrustScore.findOneAndUpdate(
        {
          userId,
          "trustedDevices.deviceId": { $ne: deviceId },
        },
        {
          $push: {
            trustedDevices: {
              deviceId,
              deviceName,
              deviceType,
              browser,
              os,
              lastSeen: now,
              trustMultiplier: 1.0,
              loginCount: 1,
              successRate: 100,
            },
          },
          $set: { lastUpdated: now },
          $setOnInsert: { currentScore: 50, baseScore: 50 },
        },
        { upsert: true, setDefaultsOnInsert: true, ...updateOpts }
      );

      if (inserted && !inserted.trustedDevices.some((d) => d.deviceId === deviceId)) {
        return this.upsertTrustedDeviceEntry(userId, deviceInfo);
      }

      return inserted;
    } catch (error) {
      // Prevent duplicate trusted device entries caused by legacy global unique index
      if (
        !_retry &&
        error.code === 11000 &&
        error.keyPattern?.["trustedDevices.deviceId"]
      ) {
        const { ensureTrustScoreIndexes } = await import("@/lib/trustScoreIndexes");
        await ensureTrustScoreIndexes(true);
        return this.upsertTrustedDeviceEntry(userId, deviceInfo, true);
      }
      throw error;
    }
  }

  /** Remove duplicate deviceId entries within a single user's trustedDevices array. */
  dedupeTrustedDevices(devices = []) {
    const map = new Map();
    for (const d of devices) {
      const prev = map.get(d.deviceId);
      if (!prev || new Date(d.lastSeen) > new Date(prev.lastSeen || 0)) {
        map.set(d.deviceId, d);
      }
    }
    return Array.from(map.values());
  }

  /** Sync embedded trustedDevices from TrustedDevice collection (deduped by deviceId). */
  async syncTrustedDevicesFromCollection(userId) {
    await connectDB();

    const devices = await TrustedDevice.find({ userId, isActive: true }).lean();
    const byDeviceId = new Map();

    for (const device of devices) {
      const prev = byDeviceId.get(device.deviceId);
      if (!prev || new Date(device.lastUsedAt) > new Date(prev.lastUsedAt)) {
        byDeviceId.set(device.deviceId, device);
      }
    }

    for (const device of byDeviceId.values()) {
      await this.upsertTrustedDeviceEntry(userId, {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        browser: device.browser,
        os: device.os,
      });
    }
  }

  async calculateTrustLevel(userId, deviceId, context = {}) {
    await connectDB();

    let trustRecord = await TrustScore.findOne({ userId });
    if (!trustRecord) {
      return {
        level: TRUST_LEVELS.MEDIUM,
        requiredAction: REQUIRED_ACTIONS.OTP,
        score: 50,
        reasons: ["اولین ورود — نیاز به تأیید OTP"],
        message: TRUST_LEVEL_CONFIG.MEDIUM.message,
      };
    }

    let score = trustRecord.currentScore;
    const reasons = [];
    const now = new Date();

    const trustedDevice = await TrustedDevice.findOne({
      userId,
      deviceId,
      isActive: true,
    });

    const deviceTrust = trustRecord.trustedDevices?.find(
      (d) => d.deviceId === deviceId
    );

    if (!trustedDevice) {
      score += SCORE_WEIGHTS.NEW_DEVICE;
      reasons.push("دستگاه جدید");
      await this.addUnusualPattern(userId, "NEW_DEVICE", 2);
    }

    if (
      context.location?.city &&
      trustRecord.lastLoginLocation &&
      trustRecord.lastLoginLocation !== context.location.city
    ) {
      score += SCORE_WEIGHTS.NEW_LOCATION;
      reasons.push(`مکان جدید: ${context.location.city}`);
      await this.addUnusualPattern(userId, "NEW_LOCATION", 2);
    }

    const hour = now.getHours();
    const usualHours = await this.getUsualLoginHours(userId);
    if (usualHours.length >= 3 && !usualHours.includes(hour)) {
      score += SCORE_WEIGHTS.UNUSUAL_TIME;
      reasons.push(`ساعت غیرمعمول (${hour}:00)`);
      await this.addUnusualPattern(userId, "UNUSUAL_TIME", 1);
    }

    if (context.isSuspiciousIP) {
      score += SCORE_WEIGHTS.SUSPICIOUS_IP;
      reasons.push("IP مشکوک");
      await this.addUnusualPattern(userId, "SUSPICIOUS_IP", 3);
    }

    if (trustedDevice && deviceTrust?.trustMultiplier) {
      score = Math.floor(score * deviceTrust.trustMultiplier);
      if (deviceTrust.trustMultiplier > 1) {
        reasons.push(`ضریب دستگاه مورد اعتماد (${deviceTrust.trustMultiplier})`);
      }
      score += SCORE_WEIGHTS.TRUSTED_DEVICE;
      reasons.push("دستگاه مورد اعتماد");
    }

    score = Math.max(-50, Math.min(100, Math.floor(score)));

    const { level, requiredAction, config } = resolveTrustLevel(score);

    trustRecord.currentScore = score;
    trustRecord.lastUpdated = now;
    await trustRecord.save();

    await this.recordTrustEvent(userId, deviceId, {
      ipAddress: context.ip,
      location: context.location,
      timeOfDay: hour,
      dayOfWeek: now.getDay(),
      isSuccessful: false,
      score,
      usedOTP: false,
    });

    return {
      level,
      requiredAction,
      score,
      reasons,
      message: config.message,
    };
  }

  async updateTrustScore(userId, event) {
    await connectDB();

    let trustRecord = await TrustScore.findOne({ userId });
    if (!trustRecord) {
      trustRecord = await TrustScore.create({ userId, currentScore: 50 });
    }

    const trustedDevicesFromDB = await TrustedDevice.find({
      userId,
      isActive: true,
    }).lean();

    const seen = new Set();
    for (const device of trustedDevicesFromDB) {
      if (seen.has(device.deviceId)) continue;
      seen.add(device.deviceId);
      await this.upsertTrustedDeviceEntry(userId, {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        browser: device.browser,
        os: device.os,
      });
    }

    trustRecord = await TrustScore.findOne({ userId });

    // Calculate trust score change based on login event — always initialize to prevent ReferenceError
    let scoreChange = 0;
    let reason = "";

    if (event.isSuccessful) {
      if (event.noOTPNeeded) {
        scoreChange = SCORE_WEIGHTS.SUCCESS_WITHOUT_OTP;
        reason = "ورود بدون OTP";
      } else if (event.usedBackupCode) {
        scoreChange = SCORE_WEIGHTS.RECOVERY_USED;
        reason = "ورود با کد بازیابی";
      } else if (event.usedOTP) {
        scoreChange = SCORE_WEIGHTS.SUCCESS_WITH_OTP;
        reason = "ورود با OTP";
      } else {
        scoreChange = SCORE_WEIGHTS.SUCCESS_LOGIN;
        reason = "ورود موفق";
      }

      if (event.isTrustedDevice) {
        scoreChange += SCORE_WEIGHTS.TRUSTED_DEVICE;
      }

      trustRecord.lastLoginAt = new Date();
      if (event.location?.city) {
        trustRecord.lastLoginLocation = event.location.city;
      }

      if (event.userAgent) {
        const parser = new UAParser(event.userAgent);
        const info = parser.getResult();
        trustRecord.lastLoginOS = info.os.name || "Unknown";
        trustRecord.lastLoginBrowser = info.browser.name || "Unknown";
      }
    } else {
      scoreChange = event.wrongOTPCount > 2
        ? SCORE_WEIGHTS.WRONG_OTP
        : SCORE_WEIGHTS.FAILED_LOGIN;
      reason = "تلاش ناموفق ورود";
    }

    const newScore = event.isSuccessful
      ? Math.min(100, trustRecord.currentScore + scoreChange)
      : Math.max(-50, trustRecord.currentScore + scoreChange);

    trustRecord.currentScore = newScore;
    trustRecord.lastUpdated = new Date();
    await trustRecord.save();

    await this.addTrustHistory(userId, newScore, reason);

    const now = new Date();
    await this.recordTrustEvent(userId, event.deviceId || "unknown", {
      ipAddress: event.ip,
      location: event.location,
      timeOfDay: now.getHours(),
      dayOfWeek: now.getDay(),
      isSuccessful: event.isSuccessful,
      score: newScore,
      scoreChange,
      reason,
      usedOTP: event.usedOTP || false,
      usedBackupCode: event.usedBackupCode || false,
    });

    await SecurityLog.create({
      userId,
      action: "TRUST_SCORE_UPDATED",
      status: "success",
      ip: event.ip,
      deviceId: event.deviceId,
      details: { scoreChange, newScore, reason },
    });

    return { oldScore: newScore - scoreChange, newScore, scoreChange, reason };
  }

  async recordTrustEvent(userId, deviceId, data) {
    await TrustEvent.create({
      userId,
      deviceId,
      ipAddress: data.ipAddress,
      location: data.location,
      timeOfDay: data.timeOfDay,
      dayOfWeek: data.dayOfWeek,
      isSuccessful: data.isSuccessful,
      score: data.score ?? 0,
      scoreChange: data.scoreChange ?? 0,
      reason: data.reason ?? "",
      usedOTP: data.usedOTP ?? false,
      usedBackupCode: data.usedBackupCode ?? false,
    });
  }

  async getUsualLoginHours(userId) {
    const events = await TrustEvent.find({ userId, isSuccessful: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("timeOfDay");

    if (events.length === 0) {
      return [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    }

    return [...new Set(events.map((e) => e.timeOfDay).filter((h) => h != null))];
  }

  async addUnusualPattern(userId, pattern, severity) {
    let trustRecord = await TrustScore.findOne({ userId });
    if (!trustRecord) {
      await TrustScore.create({
        userId,
        currentScore: 50,
        unusualPatterns: [{ pattern, severity, detectedAt: new Date() }],
      });
      return;
    }

    trustRecord.unusualPatterns.push({
      pattern,
      severity,
      detectedAt: new Date(),
      resolved: false,
    });

    if (trustRecord.unusualPatterns.length > 20) {
      trustRecord.unusualPatterns = trustRecord.unusualPatterns.slice(-20);
    }

    await trustRecord.save();
  }

  async addTrustHistory(userId, score, reason) {
    let trustRecord = await TrustScore.findOne({ userId });
    if (!trustRecord) {
      trustRecord = await TrustScore.create({ userId, currentScore: 50 });
    }

    trustRecord.trustHistory.push({ score, reason, changedAt: new Date() });

    if (trustRecord.trustHistory.length > 50) {
      trustRecord.trustHistory = trustRecord.trustHistory.slice(-50);
    }

    await trustRecord.save();
  }

  async getTrustStatistics(userId) {
    await connectDB();

    const trustRecord = await TrustScore.findOne({ userId });
    if (!trustRecord) {
      return {
        currentScore: 50,
        level: TRUST_LEVELS.MEDIUM,
        trustedDevicesCount: 0,
        unusualPatternsCount: 0,
        lastLoginLocation: null,
        lastLoginAt: null,
        recommendation: "با ورودهای موفق، امتیاز اعتماد شما افزایش می‌یابد",
      };
    }

    const { level } = resolveTrustLevel(trustRecord.currentScore);

    return {
      currentScore: trustRecord.currentScore,
      level,
      trustedDevicesCount: trustRecord.trustedDevices?.length || 0,
      unusualPatternsCount: trustRecord.unusualPatterns?.filter((p) => !p.resolved).length || 0,
      lastLoginLocation: trustRecord.lastLoginLocation || null,
      lastLoginAt: trustRecord.lastLoginAt || null,
      recommendation: this.getRecommendation(trustRecord.currentScore),
    };
  }

  getRecommendation(score) {
    if (score < TRUST_LEVEL_CONFIG.LOW.minScore) {
      return "امتیاز اعتماد بحرانی است. با پشتیبانی تماس بگیرید.";
    }
    if (score < TRUST_LEVEL_CONFIG.MEDIUM.minScore) {
      return "از دستگاه و مکان‌های آشنا برای ورود استفاده کنید.";
    }
    if (score < TRUST_LEVEL_CONFIG.HIGH.minScore) {
      return "با ورودهای موفق مکرر، امتیاز اعتماد افزایش می‌یابد.";
    }
    return "سطح اعتماد عالی — ورود بدون OTP فعال است.";
  }
}

export default new TrustScoreService();
