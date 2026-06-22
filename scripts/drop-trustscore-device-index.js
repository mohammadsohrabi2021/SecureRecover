/**
 * One-time fix: drop the legacy global unique index on trustedDevices.deviceId.
 * Run: node --env-file=.env scripts/drop-trustscore-device-index.js
 */
import connectDB from "../lib/db.js";
import { ensureTrustScoreIndexes } from "../lib/trustScoreIndexes.js";

async function main() {
  await connectDB();
  await ensureTrustScoreIndexes(true);
  console.log("TrustScore legacy index cleanup complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
