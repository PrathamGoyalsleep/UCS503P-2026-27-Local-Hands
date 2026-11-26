/**
 * Development Admin Seed Script
 * Creates or updates the development admin account in MongoDB with bcrypt hashing.
 * Demo credentials:
 *   Email:    admin@serveconnect.com
 *   Password: admin123
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");

const seedAdmin = async () => {
    try {
        await connectDB();

        const email = (process.env.ADMIN_SEED_EMAIL || "admin@serveconnect.com").toLowerCase().trim();
        const plainPassword = process.env.ADMIN_SEED_PASSWORD || "admin123";

        const existing = await User.findOne({ email });

        if (existing) {
            existing.role = "admin";
            existing.password = await bcrypt.hash(plainPassword, 10);
            await existing.save();
            console.log("✓ Demo Admin account updated in MongoDB.");
            console.log(`  Email:    ${email}`);
            console.log("  Role:     admin");
        } else {
            const hashedPassword = await bcrypt.hash(plainPassword, 10);
            await User.create({
                name: "System Administrator",
                email,
                password: hashedPassword,
                role: "admin",
            });
            console.log("✓ Demo Admin account created successfully in MongoDB!");
            console.log(`  Email:    ${email}`);
            console.log("  Role:     admin");
        }

        console.log("\n→ Use these credentials to sign in at /login.");
        console.log("→ The backend verifies the 'admin' role from MongoDB and routes to /admin.");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding admin:", error.message);
        process.exit(1);
    }
};

seedAdmin();

