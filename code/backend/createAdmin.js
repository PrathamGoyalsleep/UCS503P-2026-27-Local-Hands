const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");

const createAdmin = async () => {
    await connectDB();

    try {
        const email = "admin@serveconnect.com";
        const password = process.env.ADMIN_SEED_PASSWORD || "admin123";
        const existing = await User.findOne({ email });

        if (existing) {
            existing.role = "admin";
            existing.password = await bcrypt.hash(password, 10);
            await existing.save();
            console.log("✓ Admin already exists — role and password updated.");
            console.log("  Email:    admin@serveconnect.com");
            console.log("  Role:     admin");
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.create({
                name: "System Administrator",
                email: "admin@serveconnect.com",
                password: hashedPassword,
                role: "admin",
            });
            console.log("✓ Admin user created successfully!");
            console.log("  Email:    admin@serveconnect.com");
            console.log("  Role:     admin");
        }

        console.log("\n→ Go to http://localhost:5173/login and login with admin@serveconnect.com / admin123.");
        console.log("→ Automatic role detection will direct you to /admin.");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
};

createAdmin();
