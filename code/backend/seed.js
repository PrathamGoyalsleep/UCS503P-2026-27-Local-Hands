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
            // Patiala (5 Workers)
            { name: "Raj Kumar", email: "raj@test.com", category: "Electrician", phone: "9876543210", exp: 8, charges: 300, loc: "Patiala", rating: 4.8 },
            { name: "Amar Singh", email: "amar@test.com", category: "Plumber", phone: "9876543211", exp: 6, charges: 350, loc: "Patiala", rating: 4.7 },
            { name: "Manpreet Singh", email: "manpreet@test.com", category: "Carpenter", phone: "9876543212", exp: 10, charges: 400, loc: "Patiala", rating: 4.6 },
            { name: "Manpreet Singh", email: "manpreet@test.com", category: "Carpenter", phone: "9876543212", exp: 10, charges: 400, loc: "Patiala", rating: 4.9 },
            { name: "Harpreet Kaur", email: "harpreet@test.com", category: "Cleaning", phone: "9876543216", exp: 4, charges: 250, loc: "Patiala", rating: 4.6 },
            { name: "Gurpreet Singh", email: "gurpreet@test.com", category: "AC Repair", phone: "9876543217", exp: 7, charges: 550, loc: "Patiala", rating: 4.8 },

            // Delhi (5 Workers)
            { name: "Amit Sharma", email: "amit@example.com", category: "Painter", phone: "9876543213", exp: 5, charges: 500, loc: "Delhi", rating: 4.5 },
            { name: "Ramesh Chand", email: "ramesh@example.com", category: "Plumber", phone: "9876543218", exp: 9, charges: 450, loc: "Delhi", rating: 4.8 },
            { name: "Suresh Kumar", email: "suresh@example.com", category: "Electrician", phone: "9876543219", exp: 12, charges: 400, loc: "Delhi", rating: 4.9 },
            { name: "Rajesh Verma", email: "rajesh@example.com", category: "Carpenter", phone: "9876543220", exp: 8, charges: 500, loc: "Delhi", rating: 4.6 },
            { name: "Deepak Malhotra", email: "deepak@example.com", category: "AC Repair", phone: "9876543221", exp: 6, charges: 650, loc: "Delhi", rating: 4.7 },

            // Chandigarh (5 Workers)
            { name: "Sunil Verma", email: "sunil@example.com", category: "Cleaning", phone: "9876543214", exp: 3, charges: 200, loc: "Chandigarh", rating: 4.5 },
            { name: "Anita Rani", email: "anita@example.com", category: "Painter", phone: "9876543222", exp: 6, charges: 450, loc: "Chandigarh", rating: 4.8 },
            { name: "Rohit Sharma", email: "rohit@example.com", category: "Plumber", phone: "9876543223", exp: 5, charges: 350, loc: "Chandigarh", rating: 4.7 },
            { name: "Vikram Jeet", email: "vikram@example.com", category: "Electrician", phone: "9876543224", exp: 7, charges: 350, loc: "Chandigarh", rating: 4.6 },
            { name: "Davinder Singh", email: "davinder@example.com", category: "Carpenter", phone: "9876543225", exp: 11, charges: 450, loc: "Chandigarh", rating: 4.9 },

            // Ludhiana (5 Workers)
            { name: "Vikas Gupta", email: "vikas@example.com", category: "AC Repair", phone: "9876543215", exp: 7, charges: 600, loc: "Ludhiana", rating: 4.5 },
            { name: "Jaswinder Singh", email: "jaswinder@example.com", category: "Plumber", phone: "9876543226", exp: 8, charges: 380, loc: "Ludhiana", rating: 4.8 },
            { name: "Baldev Raj", email: "baldev@example.com", category: "Electrician", phone: "9876543227", exp: 10, charges: 320, loc: "Ludhiana", rating: 4.7 },
            { name: "Satnam Singh", email: "satnam@example.com", category: "Carpenter", phone: "9876543228", exp: 9, charges: 420, loc: "Ludhiana", rating: 4.6 },
            { name: "Kuldeep Singh", email: "kuldeep@example.com", category: "Painter", phone: "9876543229", exp: 5, charges: 480, loc: "Ludhiana", rating: 4.7 },
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
                console.log(`Successfully seeded: ${w.name} (${w.loc} - ${w.category})`);
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

