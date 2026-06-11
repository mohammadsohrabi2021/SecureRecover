// models/RecoveryCode.js
import mongoose from 'mongoose';

const RecoveryCodeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  codeHash: {
    type: String,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  }
}, {
  timestamps: true
});

RecoveryCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RecoveryCodeSchema.index({ userId: 1, used: 1 });

export default mongoose.models.RecoveryCode || mongoose.model('RecoveryCode', RecoveryCodeSchema);