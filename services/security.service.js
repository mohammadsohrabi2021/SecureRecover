// services/security.service.js
import connectDB from '@/lib/mongodb';
import SecurityLog from '@/models/SecurityLog';

export async function logSecurityEvent({ userId, action, status, request, details = {} }) {
  try {
    await connectDB();
    
    const ip = request?.headers?.get?.('x-forwarded-for') || 'unknown';
    const userAgent = request?.headers?.get?.('user-agent') || 'unknown';
    
    const log = await SecurityLog.create({
      userId: userId || null,
      action,
      status: status || 'success',
      ip,
      userAgent,
      details
    });
    
    return log;
  } catch (error) {
    console.error('Error logging security event:', error);
    return null;
  }
}