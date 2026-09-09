require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const Worker = require("./models/Worker");

const seedWorkers = async () => {
    await connectDB();
    console.log("Connected to DB, seeding workers...");
    
    try {
        const workersData = [
            { name: "Raj Kumar", email: "raj@test.com", category: "Electrician", phone: "9876543210", exp: 8, charges: 300, loc: "Patiala", rating: 4.5 },
            { name: "Amar Singh", email: "amar@test.com", category: "Plumber", phone: "9876543211", exp: 6, charges: 350, loc: "Patiala", rating: 4.7 },
            { name: "Manpreet Singh", email: "manpreet@test.com", category: "Carpenter", phone: "9876543212", exp: 10, charges: 400, loc: "Patiala", rating: 4.6 },
        ];

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        for (const w of workersData) {
            let user = await User.findOne({ email: w.email });
            if (!user) {
                user = await User.create({ name: w.name, email: w.email, password: hashedPassword, role: "worker" });
                await Worker.create({
                    userId: user._id,
                    phone: w.phone,
                    category: w.category,
                    experience: w.exp,
                    charges: w.charges,
                    location: w.loc,
                    status: "approved", 
                    rating: w.rating
                });
                console.log(`Successfully seeded: ${w.name}`);
            } else {
                console.log(`Worker already exists: ${w.name}`);
            }
        }
        console.log("Seeding complete!");
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedWorkers();

