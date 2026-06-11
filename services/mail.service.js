// services/mail.service.js - نسخه Mock کامل (بدون خطا)
export async function sendEmailOtp(to, code, type = 'login') {
  // فقط در ترمینال لاگ بگیر (ایمیل واقعی ارسال نمی‌شود)
  console.log(`\n📧 =========================================`);
  console.log(`📧 To: ${to}`);
  console.log(`📧 OTP Code: ${code}`);
  console.log(`📧 Purpose: ${type}`);
  console.log(`📧 =========================================\n`);
  
  // همیشه موفقیت برگردان (برای ادامه تست)
  return { success: true, mock: true };
}

export async function sendSmsOtp(to, code) {
  console.log(`\n📱 =========================================`);
  console.log(`📱 SMS to: ${to}`);
  console.log(`📱 OTP Code: ${code}`);
  console.log(`📱 =========================================\n`);
  
  return { success: true, mock: true };
}

export async function sendSecurityAlert(email, action, ip, device) {
  console.log(`⚠️ Security Alert: ${email} - ${action} from ${ip}`);
  return { success: true, mock: true };
}