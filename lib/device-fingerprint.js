// lib/device-fingerprint.js

// برای استفاده در کلاینت (frontend)
export async function collectDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      canvasHash: await getCanvasFingerprint(),
      webglHash: getWebGLFingerprint(),
      deviceName: `${getBrowser(navigator.userAgent)} on ${getOS(navigator.userAgent)}`,
      deviceType: getDeviceType(navigator.userAgent),
      browser: getBrowser(navigator.userAgent),
      os: getOS(navigator.userAgent)
    };
  }
  
  export function getDeviceFingerprint(deviceInfo) {
    // استفاده از یک روش ساده‌تر برای fingerprint که در مرورگر کار کنه
    const fingerprintString = JSON.stringify({
      ua: deviceInfo.userAgent,
      pf: deviceInfo.platform,
      lang: deviceInfo.language,
      tz: deviceInfo.timezone,
      screen: deviceInfo.screenResolution,
      canvas: deviceInfo.canvasHash,
      webgl: deviceInfo.webglHash
    });
    
    // استفاده از روش ساده هش (بدون crypto.subtle)
    return simpleHash(fingerprintString);
  }
  
  // تابع ساده هش برای مرورگر
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
  
  // روش جایگزین برای canvas fingerprint (بدون crypto.subtle)
  async function getCanvasFingerprint() {
    return new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('no-canvas');
          return;
        }
        
        canvas.width = 300;
        canvas.height = 100;
        
        ctx.fillStyle = '#f60';
        ctx.fillRect(0, 0, 100, 50);
        ctx.fillStyle = '#069';
        ctx.fillRect(100, 0, 100, 50);
        ctx.font = '14px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('SecureRecover', 20, 30);
        
        // متن فارسی برای unique تر شدن
        ctx.font = '16px Tahoma';
        ctx.fillStyle = 'black';
        ctx.fillText('فارسی', 20, 70);
        
        // گرفتن dataURL و هش ساده
        const dataURL = canvas.toDataURL();
        const hash = simpleHash(dataURL);
        resolve(hash);
      } catch (err) {
        console.error('Canvas fingerprint error:', err);
        resolve('canvas-error');
      }
    });
  }
  
  function getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'no-webgl';
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return 'no-debug-info';
      
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      
      return simpleHash(`${renderer}-${vendor}`);
    } catch (err) {
      console.error('WebGL fingerprint error:', err);
      return 'webgl-error';
    }
  }
  
  function getDeviceType(userAgent) {
    const ua = userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(ua)) return 'tablet';
    if (/(mobile|iphone|ipod|android|blackberry|opera mini|iemobile)/i.test(ua)) return 'mobile';
    return 'desktop';
  }
  
  function getBrowser(userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('edg')) return 'Edge';
    if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
    return 'Unknown';
  }
  
  function getOS(userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    return 'Unknown';
  }