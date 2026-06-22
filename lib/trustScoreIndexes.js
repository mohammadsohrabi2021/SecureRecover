import mongoose from "mongoose";

let legacyIndexChecked = false;

/**
 * Drop the legacy global unique index on embedded trustedDevices.deviceId.
 * deviceId must be unique per user document only — not across the collection.
 */
export async function ensureTrustScoreIndexes(force = false) {
  if (legacyIndexChecked && !force) return;

  try {
    const collection = mongoose.connection.collection("trustscores");
    const indexes = await collection.indexes();
    const legacy = indexes.find(
      (idx) =>
        idx.name === "trustedDevices.deviceId_1" ||
        (idx.key?.["trustedDevices.deviceId"] && idx.unique)
    );

    if (legacy) {
      await collection.dropIndex(legacy.name);
      console.warn(`⚠️ Dropped legacy TrustScore index: ${legacy.name}`);
    }

    legacyIndexChecked = true;
  } catch (error) {
    if (!force) legacyIndexChecked = true;
    console.warn("TrustScore index check skipped:", error.message);
  }
}
