// cron/decayTrustScore.js
import connectDB from "@/lib/db";
import TrustScore from "@/models/TrustScore";

export async function decayTrustScores() {
  try {
    await connectDB();
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const users = await TrustScore.find({
      lastUpdated: { $lt: thirtyDaysAgo },
      currentScore: { $gt: 30 }
    });
    
    let modifiedCount = 0;
    
    for (const user of users) {
      user.currentScore = Math.max(30, Math.floor(user.currentScore * 0.9));
      user.lastUpdated = new Date();
      
      user.trustHistory = user.trustHistory || [];
      user.trustHistory.push({
        score: user.currentScore,
        reason: "کاهش خودکار امتیاز به دلیل عدم فعالیت",
        changedAt: new Date()
      });
      
      await user.save();
      modifiedCount++;
    }
    
    console.log(`✅ Decayed trust scores for ${modifiedCount} users`);
    return { modifiedCount };
    
  } catch (error) {
    console.error("❌ Decay trust scores error:", error);
    return { modifiedCount: 0 };
  }
}