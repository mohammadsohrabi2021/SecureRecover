/** Trust level thresholds and required authentication actions */

export const TRUST_THRESHOLDS = {
  HIGH: 70,
  MEDIUM: 30,
  LOW: 0,
};

export const TRUST_LEVELS = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
  CRITICAL: "CRITICAL",
};

export const REQUIRED_ACTIONS = {
  NONE: "NONE",
  OTP: "OTP",
  OTP_AND_RECOVERY: "OTP_AND_RECOVERY",
  OTP_AND_RECOVERY_CODE: "OTP_AND_RECOVERY",
  ADMIN_APPROVAL: "ADMIN_APPROVAL",
  SECURITY_REVIEW: "SECURITY_REVIEW",
  BLOCK: "BLOCK",
};

export const TRUST_LEVEL_CONFIG = {
  HIGH: {
    minScore: TRUST_THRESHOLDS.HIGH,
    requiredAction: REQUIRED_ACTIONS.NONE,
    label: "امنیت بالا",
    color: "green",
    message: "ورود بدون نیاز به کد تأیید",
  },
  MEDIUM: {
    minScore: TRUST_THRESHOLDS.MEDIUM,
    requiredAction: REQUIRED_ACTIONS.OTP,
    label: "امنیت متوسط",
    color: "yellow",
    message: "نیاز به کد یکبار مصرف",
  },
  LOW: {
    minScore: TRUST_THRESHOLDS.LOW,
    requiredAction: REQUIRED_ACTIONS.OTP_AND_RECOVERY,
    label: "امنیت پایین",
    color: "red",
    message: "نیاز به کد تأیید و کد بازیابی",
  },
  CRITICAL: {
    minScore: -Infinity,
    requiredAction: REQUIRED_ACTIONS.ADMIN_APPROVAL,
    label: "امنیت بحرانی",
    color: "red",
    message: "ورود مسدود — نیاز به تأیید ادمین",
  },
};

export function resolveTrustLevel(score) {
  if (score >= TRUST_THRESHOLDS.HIGH) {
    return {
      level: TRUST_LEVELS.HIGH,
      requiredAction: REQUIRED_ACTIONS.NONE,
      config: TRUST_LEVEL_CONFIG.HIGH,
    };
  }
  if (score >= TRUST_THRESHOLDS.MEDIUM) {
    return {
      level: TRUST_LEVELS.MEDIUM,
      requiredAction: REQUIRED_ACTIONS.OTP,
      config: TRUST_LEVEL_CONFIG.MEDIUM,
    };
  }
  if (score >= TRUST_THRESHOLDS.LOW) {
    return {
      level: TRUST_LEVELS.LOW,
      requiredAction: REQUIRED_ACTIONS.OTP_AND_RECOVERY,
      config: TRUST_LEVEL_CONFIG.LOW,
    };
  }
  return {
    level: TRUST_LEVELS.CRITICAL,
    requiredAction: REQUIRED_ACTIONS.ADMIN_APPROVAL,
    config: TRUST_LEVEL_CONFIG.CRITICAL,
  };
}
