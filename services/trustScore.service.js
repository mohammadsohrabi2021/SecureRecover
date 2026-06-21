// services/trustScore.service.js
import connectDB from "@/lib/db";
import TrustScore from "@/models/TrustScore";
import TrustedDevice from "@/models/TrustedDevice";
import SecurityLog from "@/models/SecurityLog";
import { getGeoLocation, isSuspiciousIP } from "@/lib/utils/geo";
import { UAParser } from "ua-parser-js";

class TrustScoreService {
  constructor() {
    this.SCORE_WEIGHTS = {
      NEW_LOCATION: -3,
      UNUSUAL_TIME: -2,
      NEW_DEVICE: -2,
      SUSPICIOUS_IP: -8,
      WRONG_OTP: -2,
      MULTIPLE_WRONG_OTP: -5,
      FAILED_LOGIN: -2,
      
      SUCCESS_LOGIN: 12,
      SUCCESS_LOGIN_WITH_OTP: 6,
      SUCCESS_LOGIN_WITHOUT_OTP: 18,
      TRUSTED_DEVICE_LOGIN: 8,
      CONSISTENT_PATTERN: 4,
      LONG_TERM_USER: 20,
      TWO_FA_COMPLETED: 15
    };
    
    this.TRUST_LEVELS = {
      HIGH: { 
        minScore: 60, 
        requiredAction: "NONE", 
        label: "امنیت بالا", 
        color: "green", 
        icon: "✅",
        message: "سطح اعتماد بالا - ورود بدون نیاز به کد تأیید"
      },
      MEDIUM: { 
        minScore: 30, 
        requiredAction: "OTP", 
        label: "امنیت متوسط", 
        color: "yellow", 
        icon: "🟡",
        message: "سطح اعتماد متوسط - لطفاً کد تأیید را وارد کنید"
      },
      LOW: { 
        minScore: 10, 
        requiredAction: "OTP_AND_BACKUP", 
        label: "امنیت پایین", 
        color: "orange", 
        icon: "⚠️",
        message: "سطح اعتماد پایین - لطفاً کد تأیید و کد بازیابی را وارد کنید"
      },
      CRITICAL: { 
        minScore: -Infinity, 
        requiredAction: "ADMIN_APPROVAL", 
        label: "امنیت بحرانی", 
        color: "red", 
        icon: "🔴",
        message: "سطح اعتماد بحرانی - لطفاً با پشتیبانی تماس بگیرید"
      }
    };
  }
  
  async calculateTrustLevel(userId, currentDeviceId, context = {}) {
    await connectDB();
    
    let trustRecord = await TrustScore.findOne({ userId });
    
    if (!trustRecord) {
      return {
        level: "MEDIUM",
        requiredAction: "OTP",
        score: 50,
        message: "برای اولین ورود، لطفاً کد تأیید را وارد کنید",
        trustLevelConfig: this.TRUST_LEVELS.MEDIUM
      };
    }
    
    let score = trustRecord.currentScore;
    let reasons = [];
    let penaltyApplied = false;
    
    // ✅ 1. بررسی دستگاه با TrustedDevice
    const trustedDevice = await TrustedDevice.findOne({
      userId,
      deviceId: currentDeviceId,
      isActive: true
    });
    
    const deviceTrust = trustRecord.trustedDevices.find(d => d.deviceId === currentDeviceId);
    
    // ✅ 2. تشخیص تغییرات (دستگاه جدید، مکان جدید، OS جدید، Browser جدید)
    let isNewDevice = false;
    let isNewLocation = false;
    let isNewOS = false;
    let isNewBrowser = false;
    
    // بررسی دستگاه جدید
    if (!trustedDevice) {
      isNewDevice = true;
      console.log(`🔍 New device detected: ${currentDeviceId}`);
    }
    
    // بررسی مکان جدید
    if (context.location && trustRecord.lastLoginLocation) {
      if (trustRecord.lastLoginLocation !== context.location.city) {
        isNewLocation = true;
        console.log(`🔍 New location detected: ${context.location.city}`);
      }
    }
    
    // بررسی OS و Browser جدید
    if (context.userAgent) {
      const parser = new UAParser(context.userAgent);
      const deviceInfo = parser.getResult();
      const currentOS = deviceInfo.os.name || "Unknown";
      const currentBrowser = deviceInfo.browser.name || "Unknown";
      
      if (trustRecord.lastLoginOS && trustRecord.lastLoginOS !== currentOS) {
        isNewOS = true;
        console.log(`🔍 New OS detected: ${currentOS} (was: ${trustRecord.lastLoginOS})`);
      }
      
      if (trustRecord.lastLoginBrowser && trustRecord.lastLoginBrowser !== currentBrowser) {
        isNewBrowser = true;
        console.log(`🔍 New Browser detected: ${currentBrowser} (was: ${trustRecord.lastLoginBrowser})`);
      }
    }
    
    // ✅ 3. اگر هر کدام از موارد زیر تغییر کرده باشد، الزام به OTP
    const requiresOTP = isNewDevice || isNewLocation || isNewOS || isNewBrowser;
    
    if (requiresOTP) {
      console.log(`🔐 New device/location/OS/Browser detected - Requiring OTP`);
      
      if (isNewDevice) {
        score += this.SCORE_WEIGHTS.NEW_DEVICE;
        reasons.push(`دستگاه جدید (جریمه: ${Math.abs(this.SCORE_WEIGHTS.NEW_DEVICE)} امتیاز)`);
        await this.addUnusualPattern(userId, "NEW_DEVICE", 2);
      }
      
      if (isNewLocation) {
        const penalty = Math.max(-6, this.SCORE_WEIGHTS.NEW_LOCATION);
        score += penalty;
        reasons.push(`ورود از شهر جدید: ${context.location.city} (جریمه: ${Math.abs(penalty)} امتیاز)`);
        await this.addUnusualPattern(userId, "NEW_LOCATION", 2);
      }
      
      if (isNewOS) {
        score += -2;
        reasons.push(`سیستم عامل جدید (جریمه: 2 امتیاز)`);
        await this.addUnusualPattern(userId, "UNUSUAL_TIME", 1);
      }
      
      if (isNewBrowser) {
        score += -1;
        reasons.push(`مرورگر جدید (جریمه: 1 امتیاز)`);
      }
      
      penaltyApplied = true;
    }
    
    // ✅ 4. اگر دستگاه معتبر و هیچ تغییری نکرده، اجازه ورود بدون کد
    if (!requiresOTP && trustedDevice) {
      if (deviceTrust) {
        score = score * deviceTrust.trustMultiplier;
        if (deviceTrust.trustMultiplier > 1) {
          reasons.push(`دستگاه مورد اعتماد (ضریب ${deviceTrust.trustMultiplier})`);
        }
      }
      score += this.SCORE_WEIGHTS.TRUSTED_DEVICE_LOGIN;
      reasons.push(`ورود از دستگاه معتبر (+${this.SCORE_WEIGHTS.TRUSTED_DEVICE_LOGIN} امتیاز)`);
      
      if (trustedDevice.loginCount > 3) {
        const bonus = Math.min(5, Math.floor(trustedDevice.loginCount / 3));
        score += bonus;
        reasons.push(`استفاده مکرر از دستگاه (+${bonus} امتیاز)`);
      }
    }
    
    // 5. بررسی ساعت غیرمعمول
    const currentHour = new Date().getHours();
    const usualHours = await this.getUsualLoginHours(userId);
    if (!usualHours.includes(currentHour) && usualHours.length >= 3) {
      const penalty = Math.max(-5, this.SCORE_WEIGHTS.UNUSUAL_TIME);
      score += penalty;
      reasons.push(`ورود در ساعت غیرمعمول (${currentHour}:00) (جریمه: ${Math.abs(penalty)} امتیاز)`);
      penaltyApplied = true;
    }
    
    // 6. بررسی IP مشکوک
    if (context.isSuspiciousIP) {
      const penalty = Math.max(-12, this.SCORE_WEIGHTS.SUSPICIOUS_IP);
      score += penalty;
      reasons.push(`IP مشکوک تشخیص داده شد (جریمه: ${Math.abs(penalty)} امتیاز)`);
      penaltyApplied = true;
      await this.addUnusualPattern(userId, "SUSPICIOUS_IP", 3);
    }
    
    // 7. محدود کردن امتیاز نهایی
    if (context.isSuspiciousIP && context.ip !== "127.0.0.1") {
      score = Math.max(-15, Math.min(100, Math.floor(score)));
    } else {
      score = Math.max(0, Math.min(100, Math.floor(score)));
    }
    
    // 8. تعیین سطح نهایی
    let level = "MEDIUM";
    let requiredAction = "OTP";
    
    if (requiresOTP) {
      level = "MEDIUM";
      requiredAction = "OTP";
      reasons.push("⚠️ تغییر در دستگاه/مکان/سیستم عامل - نیاز به تأیید");
    } else {
      for (const [key, config] of Object.entries(this.TRUST_LEVELS)) {
        if (score >= config.minScore) {
          level = key;
          requiredAction = config.requiredAction;
          break;
        }
      }
    }
    
    // 9. ذخیره تغییرات در دیتابیس
    if (trustRecord.currentScore !== score && penaltyApplied) {
      trustRecord.currentScore = score;
      trustRecord.lastUpdated = new Date();
      await trustRecord.save();
    }
    
    if (reasons.length > 0) {
      await this.addTrustHistory(userId, score, reasons.join(", "));
    }
    
    return {
      level,
      requiredAction,
      score,
      reasons,
      message: this.TRUST_LEVELS[level].message,
      trustLevelConfig: this.TRUST_LEVELS[level]
    };
  }
  
  async updateTrustScore(userId, event) {
    await connectDB();
    
    let trustRecord = await TrustScore.findOne({ userId });
    if (!trustRecord) {
      trustRecord = await TrustScore.create({ userId, currentScore: 50 });
    }
    
    // ✅ همگام‌سازی trustedDevices با TrustedDevice
    const trustedDevicesFromDB = await TrustedDevice.find({
      userId,
      isActive: true
    });
    
    trustRecord.trustedDevices = trustedDevicesFromDB.map(device => ({
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      lastSeen: device.lastUsedAt,
      loginCount: device.loginCount,
      trustMultiplier: Math.min(1.5, 1 + (device.loginCount / 20)),
      successRate: device.loginCount > 0 ? 100 : 100
    }));
    
    let scoreChange = 0;
    let reason = "";
    
    if (event.isSuccessful) {
      if (event.isTrustedDevice) {
        scoreChange = this.SCORE_WEIGHTS.TRUSTED_DEVICE_LOGIN;
        reason = "ورود موفق از دستگاه معتبر";
      } else if (event.noOTPNeeded) {
        scoreChange = this.SCORE_WEIGHTS.SUCCESS_LOGIN_WITHOUT_OTP;
        reason = "ورود موفق بدون کد (امتیاز بالا)";
      } else if (event.used2FA) {
        scoreChange = this.SCORE_WEIGHTS.TWO_FA_COMPLETED;
        reason = "تأیید دو مرحله‌ای کامل شد";
      } else if (event.usedOTP) {
        scoreChange = this.SCORE_WEIGHTS.SUCCESS_LOGIN_WITH_OTP;
        reason = "ورود موفق با کد یکبار مصرف";
      } else if (event.usedBackupCode) {
        scoreChange = this.SCORE_WEIGHTS.SUCCESS_LOGIN_WITH_OTP - 2;
        reason = "ورود موفق با کد پشتیبان";
      } else {
        scoreChange = this.SCORE_WEIGHTS.SUCCESS_LOGIN;
        reason = "ورود موفق";
      }
      
      if (event.deviceId) {
        await this.updateTrustedDevice(trustRecord, event.deviceId, event.deviceInfo, true);
      }
      
      trustRecord.lastLoginAt = new Date();
      if (event.location) {
        trustRecord.lastLoginLocation = event.location.city;
      }
      
      if (event.userAgent) {
        const parser = new UAParser(event.userAgent);
        const deviceInfo = parser.getResult();
        trustRecord.lastLoginOS = deviceInfo.os.name || "Unknown";
        trustRecord.lastLoginBrowser = deviceInfo.browser.name || "Unknown";
        console.log(`📱 Saved OS: ${trustRecord.lastLoginOS}, Browser: ${trustRecord.lastLoginBrowser}`);
      }
    } else {
      scoreChange = this.SCORE_WEIGHTS.FAILED_LOGIN;
      reason = "تلاش ناموفق برای ورود";
      
      if (event.wrongOTPCount > 3) {
        scoreChange = this.SCORE_WEIGHTS.MULTIPLE_WRONG_OTP;
        reason = "تعداد تلاش‌های ناموفق زیاد";
      }
      
      if (event.deviceId) {
        await this.updateTrustedDevice(trustRecord, event.deviceId, event.deviceInfo, false);
      }
    }
    
    let newScore = trustRecord.currentScore + scoreChange;
    if (event.isSuccessful) {
      newScore = Math.min(100, newScore);
    } else {
      newScore = Math.max(0, newScore);
    }
    
    trustRecord.currentScore = newScore;
    trustRecord.lastUpdated = new Date();
    await trustRecord.save();
    await this.addTrustHistory(userId, newScore, reason);
    
    await SecurityLog.create({
      userId,
      action: "TRUST_SCORE_UPDATED",
      status: "success",
      details: { scoreChange, newScore, reason, event }
    });
    
    return { oldScore: newScore - scoreChange, newScore, scoreChange, reason };
  }
  
  async increaseTrustScore(userId, deviceId, eventData = {}) {
    await connectDB();
    
    let trustRecord = await TrustScore.findOne({ userId });
    if (!trustRecord) {
      trustRecord = await TrustScore.create({ userId, currentScore: 50 });
    }
    
    let increaseAmount = 0;
    let reason = "";
    
    if (eventData.directLogin) {
      increaseAmount = this.SCORE_WEIGHTS.SUCCESS_LOGIN_WITHOUT_OTP;
      reason = "ورود مستقیم (دستگاه可信)";
    } else if (eventData.used2FA) {
      increaseAmount = this.SCORE_WEIGHTS.TWO_FA_COMPLETED;
      reason = "تأیید دو مرحله‌ای کامل";
    } else if (eventData.usedOTPOnly) {
      increaseAmount = this.SCORE_WEIGHTS.SUCCESS_LOGIN_WITH_OTP;
      reason = "ورود موفق با کد یکبار مصرف";
    } else {
      increaseAmount = this.SCORE_WEIGHTS.SUCCESS_LOGIN;
      reason = "ورود موفق";
    }
    
    let newScore = Math.min(100, trustRecord.currentScore + increaseAmount);
    trustRecord.currentScore = newScore;
    trustRecord.lastUpdated = new Date();
    trustRecord.lastLoginAt = new Date();
    
    if (deviceId) {
      const deviceExists = trustRecord.trustedDevices.find(d => d.deviceId === deviceId);
      if (deviceExists) {
        deviceExists.lastSeen = new Date();
        deviceExists.loginCount += 1;
        deviceExists.trustMultiplier = Math.min(1.5, deviceExists.trustMultiplier + 0.05);
      } else {
        trustRecord.trustedDevices.push({
          deviceId,
          deviceName: eventData.deviceName || "New Device",
          lastSeen: new Date(),
          loginCount: 1,
          trustMultiplier: 1.0,
          successRate: 100
        });
      }
    }
    
    await trustRecord.save();
    await this.addTrustHistory(userId, newScore, reason);
    
    return { oldScore: newScore - increaseAmount, newScore, increaseAmount, reason };
  }
  
  async getUsualLoginHours(userId) {
    const trustRecord = await TrustScore.findOne({ userId });
    if (!trustRecord) return [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    
    const hours = new Set();
    trustRecord.trustHistory.forEach(history => {
      if (history.changedAt) {
        const hour = new Date(history.changedAt).getHours();
        hours.add(hour);
      }
    });
    
    if (hours.size === 0) {
      return [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    }
    
    return Array.from(hours);
  }
  
  async updateTrustedDevice(trustRecord, deviceId, deviceInfo, isSuccess) {
    const existingDevice = trustRecord.trustedDevices.find(d => d.deviceId === deviceId);
    
    if (existingDevice) {
      existingDevice.lastSeen = new Date();
      existingDevice.loginCount += 1;
      
      if (isSuccess) {
        existingDevice.successRate = (existingDevice.successRate * (existingDevice.loginCount - 1) + (isSuccess ? 100 : 0)) / existingDevice.loginCount;
        existingDevice.trustMultiplier = Math.min(1.5, 1.0 + (existingDevice.successRate - 50) / 100);
      }
    } else if (isSuccess && deviceInfo) {
      trustRecord.trustedDevices.push({
        deviceId,
        deviceName: deviceInfo.deviceName || "Unknown",
        deviceType: deviceInfo.deviceType || "unknown",
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        lastSeen: new Date(),
        loginCount: 1,
        successRate: 100,
        trustMultiplier: 1.0
      });
    }
    
    await trustRecord.save();
  }
  
  async addUnusualPattern(userId, pattern, severity) {
    await connectDB();
    
    const trustRecord = await TrustScore.findOne({ userId });
    if (!trustRecord) {
      await TrustScore.create({ 
        userId, 
        currentScore: 50,
        unusualPatterns: [{
          pattern,
          severity,
          detectedAt: new Date(),
          resolved: false
        }]
      });
      return;
    }
    
    trustRecord.unusualPatterns.push({
      pattern,
      severity,
      detectedAt: new Date(),
      resolved: false
    });
    
    if (trustRecord.unusualPatterns.length > 20) {
      trustRecord.unusualPatterns = trustRecord.unusualPatterns.slice(-20);
    }
    
    await trustRecord.save();
    console.log(`⚠️ Unusual pattern added: ${pattern} (severity: ${severity})`);
  }
  
  async addTrustHistory(userId, score, reason) {
    await connectDB();
    
    let trustRecord = await TrustScore.findOne({ userId });
    if (!trustRecord) {
      trustRecord = await TrustScore.create({ userId, currentScore: 50 });
    }
    
    trustRecord.trustHistory.push({
      score,
      reason,
      changedAt: new Date()
    });
    
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
        level: "MEDIUM",
        trustedDevicesCount: 0,
        unusualPatternsCount: 0,
        lastLoginLocation: null,
        lastLoginAt: null,
        recommendation: "ورودهای موفق بیشتری داشته باشید تا امتیاز اعتماد شما افزایش یابد"
      };
    }
    
    let level = "MEDIUM";
    for (const [key, config] of Object.entries(this.TRUST_LEVELS)) {
      if (trustRecord.currentScore >= config.minScore) {
        level = key;
        break;
      }
    }
    
    return {
      currentScore: trustRecord.currentScore,
      level: level,
      trustedDevicesCount: trustRecord.trustedDevices.length,
      unusualPatternsCount: trustRecord.unusualPatterns.filter(p => !p.resolved).length,
      lastLoginLocation: trustRecord.lastLoginLocation || null,
      lastLoginAt: trustRecord.lastLoginAt || null,
      recommendation: this.getRecommendation(trustRecord.currentScore, trustRecord.trustedDevices.length)
    };
  }
  
  getRecommendation(score, deviceCount) {
    if (score < 30) {
      return "⚠️ امتیاز اعتماد شما پایین است. توصیه می‌شود از دستگاه‌های آشنا و مکان‌های معمول وارد شوید.";
    }
    if (deviceCount === 0) {
      return "💡 دستگاه خود را به عنوان دستگاه قابل اعتماد ثبت کنید تا ورود سریع‌تری داشته باشید.";
    }
    if (score < 60) {
      return "📈 با ورودهای موفق مکرر، امتیاز اعتماد شما افزایش می‌یابد.";
    }
    return "✅ سطح اعتماد شما عالی است. می‌توانید بدون کد تأیید وارد شوید.";
  }
  
  async resetTrustScore(userId) {
    await connectDB();
    await TrustScore.deleteOne({ userId });
    return { success: true, message: "Trust score reset successfully" };
  }
}

export default new TrustScoreService();