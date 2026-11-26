/**
 * Live Cloudinary Integration Verification Script
 * Performs real end-to-end uploads to the configured Cloudinary account.
 * Tests:
 * 1. Worker Profile Image Upload (ServeConnect/workers/profile-images)
 * 2. Worker Certificate PDF Upload (ServeConnect/workers/certificates)
 * 3. Customer Profile Image Upload (ServeConnect/customers/profile-images)
 * 4. Verifies Cloudinary CDN secure URL generation
 * 5. Cleans up test assets from Cloudinary
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { cloudinary, uploadBufferToCloudinary } = require("../config/cloudinary");

// Minimal valid 1x1 transparent PNG buffer
const TINY_PNG_BUFFER = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
);

// Minimal valid PDF buffer
const MINIMAL_PDF_BUFFER = Buffer.from(
    "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000102 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n",
    "utf-8"
);

async function runLiveVerification() {
    console.log("========================================================");
    console.log("   SERVE CONNECT — REAL CLOUDINARY E2E VERIFICATION    ");
    console.log("========================================================");

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY;

    console.log(`Cloud Name: ${cloudName}`);
    console.log(`API Key:    ${apiKey ? apiKey.slice(0, 4) + "..." + apiKey.slice(-4) : "MISSING"}`);
    console.log(`API Secret: ${process.env.CLOUDINARY_API_SECRET ? "Configured (Hidden)" : "MISSING"}`);
    console.log("--------------------------------------------------------\n");

    const uploadedAssets = [];
    let hasFailures = false;

    // TEST 1: Worker Profile Image
    try {
        console.log("Test 1: Uploading Worker Profile Image to ServeConnect/workers/profile-images...");
        const result1 = await uploadBufferToCloudinary(TINY_PNG_BUFFER, {
            folder: "ServeConnect/workers/profile-images",
            public_id: `live_worker_avatar_${Date.now()}`,
            forceLive: true
        });
        uploadedAssets.push({ public_id: result1.public_id, resource_type: result1.resource_type || "image" });
        console.log("  SUCCESS:");
        console.log(`  - Public ID:    ${result1.public_id}`);
        console.log(`  - Secure URL:   ${result1.secure_url}`);
        console.log(`  - Format:       ${result1.format}`);
        console.log(`  - Resource:     ${result1.resource_type}\n`);
    } catch (err) {
        hasFailures = true;
        console.error("  FAILED Test 1:", err.message, "\n");
    }

    // TEST 2: Worker Certificate PDF
    try {
        console.log("Test 2: Uploading Worker Certificate PDF to ServeConnect/workers/certificates...");
        const result2 = await uploadBufferToCloudinary(MINIMAL_PDF_BUFFER, {
            folder: "ServeConnect/workers/certificates",
            public_id: `live_worker_cert_${Date.now()}`,
            resource_type: "auto",
            forceLive: true
        });
        uploadedAssets.push({ public_id: result2.public_id, resource_type: result2.resource_type || "image" });
        console.log("  SUCCESS:");
        console.log(`  - Public ID:    ${result2.public_id}`);
        console.log(`  - Secure URL:   ${result2.secure_url}`);
        console.log(`  - Format:       ${result2.format}`);
        console.log(`  - Resource:     ${result2.resource_type}\n`);
    } catch (err) {
        hasFailures = true;
        console.error("  FAILED Test 2:", err.message, "\n");
    }

    // TEST 3: Customer Profile Image
    try {
        console.log("Test 3: Uploading Customer Profile Image to ServeConnect/customers/profile-images...");
        const result3 = await uploadBufferToCloudinary(TINY_PNG_BUFFER, {
            folder: "ServeConnect/customers/profile-images",
            public_id: `live_customer_avatar_${Date.now()}`,
            forceLive: true
        });
        uploadedAssets.push({ public_id: result3.public_id, resource_type: result3.resource_type || "image" });
        console.log("  SUCCESS:");
        console.log(`  - Public ID:    ${result3.public_id}`);
        console.log(`  - Secure URL:   ${result3.secure_url}`);
        console.log(`  - Format:       ${result3.format}`);
        console.log(`  - Resource:     ${result3.resource_type}\n`);
    } catch (err) {
        hasFailures = true;
        console.error("  FAILED Test 3:", err.message, "\n");
    }

    // CLEANUP TEST ASSETS
    console.log("Cleaning up live test assets from Cloudinary...");
    for (const asset of uploadedAssets) {
        try {
            const delRes = await cloudinary.uploader.destroy(asset.public_id, {
                resource_type: asset.resource_type
            });
            console.log(`  Cleaned up [${asset.public_id}]: ${delRes.result}`);
        } catch (cleanupErr) {
            console.warn(`  Warning: Could not remove test asset [${asset.public_id}]: ${cleanupErr.message}`);
        }
    }

    console.log("\n========================================================");
    if (!hasFailures && uploadedAssets.length === 3) {
        console.log("   ALL REAL CLOUDINARY UPLOADS VERIFIED SUCCESSFULLY!   ");
        console.log("========================================================");
        process.exit(0);
    } else {
        console.log("   SOME REAL CLOUDINARY UPLOADS FAILED!                ");
        console.log("========================================================");
        process.exit(1);
    }
}

runLiveVerification();

