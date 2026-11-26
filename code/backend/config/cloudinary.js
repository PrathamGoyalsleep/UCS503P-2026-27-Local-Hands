const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const cloudinary = require("cloudinary").v2;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.CLOUD_API_SECRET;

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
});

/**
 * Uploads a file buffer directly to Cloudinary using upload_stream.
 * If running in test mode or if Cloudinary keys are unconfigured, falls back safely to simulation.
 */
function uploadBufferToCloudinary(buffer, options = {}) {
    return new Promise((resolve, reject) => {
        const cName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
        const aKey = process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY;
        const aSecret = process.env.CLOUDINARY_API_SECRET || process.env.CLOUD_API_SECRET;

        // If in test environment (and not forcing live) or credentials are missing/placeholder
        if (!options.forceLive && (process.env.NODE_ENV === "test" || !cName || !aKey || !aSecret || cName === "serveconnect-demo")) {
            const folderName = options.folder || "ServeConnect";
            const mockPublicId = `${folderName}/mock_${Date.now()}`;
            const mockUrl = `https://res.cloudinary.com/${cName || "drvwjkd6g"}/image/upload/v1/${mockPublicId}.jpg`;
            return resolve({
                secure_url: mockUrl,
                public_id: mockPublicId,
                format: "jpg",
                resource_type: "image"
            });
        }

        cloudinary.config({
            cloud_name: cName,
            api_key: aKey,
            api_secret: aSecret,
            secure: true
        });

        const stream = cloudinary.uploader.upload_stream(
            {
                folder: options.folder || "ServeConnect",
                resource_type: options.resource_type || "auto",
                ...options
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        stream.end(buffer);
    });
}

module.exports = {
    cloudinary,
    uploadBufferToCloudinary
};

