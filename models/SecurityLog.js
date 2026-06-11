// models/SecurityLog.js
import mongoose from 'mongoose';

const SecurityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  action: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  },
  ip: String,
  userAgent: String,
  details: Object,
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: 2592000 } // 30 روز
  }
});

export default mongoose.models.SecurityLog || mongoose.model('SecurityLog', SecurityLogSchema);