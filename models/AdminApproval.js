import mongoose from "mongoose";

const AdminApprovalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    twoFactorSessionId: String,
    deviceId: {
      type: String,
      required: true,
    },
    identifier: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["low_trust_login", "admin_approval", "security_review", "critical_login"],
      default: "admin_approval",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "denied", "expired", "blocked"],
      default: "pending",
    },
    trustScore: {
      type: Number,
      default: 0,
    },
    trustLevel: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW", "CRITICAL"],
    },
    riskFactors: [String],
    approvalTokenHash: String,
    approvalTokenUsed: {
      type: Boolean,
      default: false,
    },
    ip: String,
    userAgent: String,
    location: {
      city: String,
      country: String,
      lat: Number,
      lng: Number,
    },
    requestContext: mongoose.Schema.Types.Mixed,
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    adminNote: String,
    decisionReason: String,
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 60 * 1000),
    },
  },
  { timestamps: true }
);

AdminApprovalSchema.index({ status: 1, createdAt: -1 });
AdminApprovalSchema.index({ userId: 1, status: 1 });
AdminApprovalSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.AdminApproval ||
  mongoose.model("AdminApproval", AdminApprovalSchema);
