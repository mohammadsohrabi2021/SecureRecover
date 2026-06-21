import nodemailer from "nodemailer";

const emailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(emailConfig);
  }
  return transporter;
}

export async function sendEmailOtp(to, code) {
  try {
    const transporter = getTransporter();
    
    await transporter.sendMail({
      from: `"SecureRecover" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: "کد تأیید ورود - SecureRecover",
      html: `
        <div dir="rtl" style="font-family: Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">کد تأیید شما</h2>
          <p style="font-size: 16px; color: #555;">برای ورود به حساب کاربری خود، کد زیر را وارد کنید:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; border-radius: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p style="font-size: 14px; color: #999; text-align: center;">این کد تا ۵ دقیقه اعتبار دارد.</p>
          <p style="font-size: 12px; color: #aaa; text-align: center;">اگر درخواست نکرده‌اید، این ایمیل را نادیده بگیرید.</p>
        </div>
      `,
      text: `کد تأیید شما: ${code}\n\nاین کد تا ۵ دقیقه اعتبار دارد.`,
    });
    
    console.log(`📧 Email sent to ${to} with code: ${code} (DEV MODE)`);
    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    throw new Error("ارسال ایمیل با خطا مواجه شد");
  }
}

export async function sendSmsOtp(to, code) {
  // در محیط توسعه فقط لاگ می‌زنیم
  console.log(`📱 [SMS] به شماره ${to} کد ${code} ارسال شد (DEV MODE)`);
  
  // برای تولید واقعی می‌توانید از سرویس‌هایی مثل Kavenegar استفاده کنید
  /*
  const response = await fetch("https://api.kavenegar.com/v1/YOUR_API_KEY/verify/lookup.json", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      receptor: to,
      token: code,
      template: "verify-template"
    })
  });
  */
  
  return { success: true };
}

export async function sendSecurityAlert(email, action, ip, device) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`🔐 [SECURITY ALERT] ${action} from ${ip} on ${device}`);
    return;
  }
  
  try {
    const transporter = getTransporter();
    
    await transporter.sendMail({
      from: `"SecureRecover Security" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `هشدار امنیتی: ${action}`,
      html: `
        <div dir="rtl" style="font-family: Tahoma, sans-serif; padding: 20px;">
          <h3>فعالیت جدید در حساب شما</h3>
          <p>عملیات: ${action}</p>
          <p>IP: ${ip}</p>
          <p>دستگاه: ${device}</p>
          <p>زمان: ${new Date().toLocaleString("fa-IR")}</p>
          <hr/>
          <small>اگر این فعالیت توسط شما نبوده، لطفاً سریعاً با پشتیبانی تماس بگیرید.</small>
        </div>
      `,
    });
  } catch (error) {
    console.error("Security alert email error:", error);
  }
}