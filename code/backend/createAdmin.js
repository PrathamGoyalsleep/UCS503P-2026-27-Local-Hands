require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");

const createAdmin = async () => {
    await connectDB();

    try {
        const email = "admin@serveconnect.com";
        const existing = await User.findOne({ email });

        if (existing) {
            // Make sure it has admin role
            existing.role = "admin";
            await existing.save();
            console.log("✓ Admin already exists — role updated to admin.");
            console.log("  Email:    admin@serveconnect.com");
            console.log("  Password: Admin@1234");
        } else {
            const hashedPassword = await bcrypt.hash("Admin@1234", 10);
            await User.create({
                name: "Admin",
                email: "admin@serveconnect.com",
                password: hashedPassword,
                role: "admin",
            });
            console.log("✓ Admin user created successfully!");
            console.log("  Email:    admin@serveconnect.com");
            console.log("  Password: Admin@1234");
        }

        console.log("\n→ Go to http://localhost:5173/login and login with the above credentials.");
        console.log("→ The 'Admin Panel' link will appear in the Navbar automatically.");
        process.exit();
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
};

createAdmin();

