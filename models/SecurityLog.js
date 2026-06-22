import mongoose from "mongoose";

const SecurityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ["success", "failed", "pending"],
    required: true
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  deviceId: {
    type: String
  },
  details: {
    type: Object
  }
}, {
  timestamps: true
});

// Indexes
SecurityLogSchema.index({ userId: 1, createdAt: -1 });
SecurityLogSchema.index({ action: 1, status: 1 });
SecurityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.models.SecurityLog ||
  mongoose.model("SecurityLog", SecurityLogSchema);