// models/TrustEvent.js
import mongoose from "mongoose";

const TrustEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  },
  location: {
    lat: Number,
    lng: Number,
    city: String,
    country: String
  },
  timeOfDay: {
    type: Number
  },
  dayOfWeek: {
    type: Number
  },
  isSuccessful: {
    type: Boolean,
    default: false
  },
  scoreChange: {
    type: Number,
    default: 0,
  },
  reason: String,
  score: {
    type: Number,
    default: 0
  },
  usedOTP: {
    type: Boolean,
    default: false
  },
  usedBackupCode: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

TrustEventSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.TrustEvent ||
  mongoose.model("TrustEvent", TrustEventSchema);