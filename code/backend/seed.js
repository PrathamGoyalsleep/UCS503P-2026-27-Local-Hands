
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");
const User = require("./models/User");
const Worker = require("./models/Worker");

const seedWorkers = async () => {
    try {
        await connectDB();

        console.log("Connected to DB, seeding workers...");

        const workersData = [

            // ================= PATIALA (13 WORKERS) =================

            { name: "Raj Kumar", email: "raj@test.com", category: "Electrician", phone: "9876543210", exp: 8, charges: 300, loc: "Patiala", rating: 4.8 },
            { name: "Amar Singh", email: "amar@test.com", category: "Plumber", phone: "9876543211", exp: 6, charges: 350, loc: "Patiala", rating: 4.7 },
            { name: "Manpreet Singh", email: "manpreet@test.com", category: "Carpenter", phone: "9876543212", exp: 10, charges: 400, loc: "Patiala", rating: 4.9 },
            { name: "Harpreet Kaur", email: "harpreet@test.com", category: "Cleaning", phone: "9876543216", exp: 4, charges: 250, loc: "Patiala", rating: 4.6 },
            { name: "Gurpreet Singh", email: "gurpreet@test.com", category: "AC Repair", phone: "9876543217", exp: 7, charges: 550, loc: "Patiala", rating: 4.8 },

            { name: "Simranjeet Singh", email: "simranjeet@test.com", category: "Electrician", phone: "9876543230", exp: 5, charges: 350, loc: "Patiala", rating: 4.6 },
            { name: "Arjun Sharma", email: "arjun@test.com", category: "Plumber", phone: "9876543231", exp: 7, charges: 400, loc: "Patiala", rating: 4.7 },
            { name: "Karan Gill", email: "karan@test.com", category: "Painter", phone: "9876543232", exp: 4, charges: 450, loc: "Patiala", rating: 4.5 },
            { name: "Ravi Kumar", email: "ravi@test.com", category: "AC Repair", phone: "9876543233", exp: 9, charges: 600, loc: "Patiala", rating: 4.9 },
            { name: "Sandeep Kaur", email: "sandeep@test.com", category: "Cleaning", phone: "9876543234", exp: 3, charges: 250, loc: "Patiala", rating: 4.4 },
            { name: "Gagandeep Singh", email: "gagan@test.com", category: "Carpenter", phone: "9876543235", exp: 8, charges: 500, loc: "Patiala", rating: 4.8 },
            { name: "Mohit Verma", email: "mohit@test.com", category: "Electrician", phone: "9876543236", exp: 6, charges: 320, loc: "Patiala", rating: 4.7 },
            { name: "Navdeep Singh", email: "navdeep@test.com", category: "Plumber", phone: "9876543237", exp: 5, charges: 380, loc: "Patiala", rating: 4.6 },


            // ================= DELHI (12 WORKERS) =================

            { name: "Amit Sharma", email: "amit@example.com", category: "Painter", phone: "9876543213", exp: 5, charges: 500, loc: "Delhi", rating: 4.5 },
            { name: "Ramesh Chand", email: "ramesh@example.com", category: "Plumber", phone: "9876543218", exp: 9, charges: 450, loc: "Delhi", rating: 4.8 },
            { name: "Suresh Kumar", email: "suresh@example.com", category: "Electrician", phone: "9876543219", exp: 12, charges: 400, loc: "Delhi", rating: 4.9 },
            { name: "Rajesh Verma", email: "rajesh@example.com", category: "Carpenter", phone: "9876543220", exp: 8, charges: 500, loc: "Delhi", rating: 4.6 },
            { name: "Deepak Malhotra", email: "deepak@example.com", category: "AC Repair", phone: "9876543221", exp: 6, charges: 650, loc: "Delhi", rating: 4.7 },

            { name: "Ankit Sharma", email: "ankit@test.com", category: "Electrician", phone: "9876543238", exp: 8, charges: 450, loc: "Delhi", rating: 4.8 },
            { name: "Pankaj Yadav", email: "pankaj@test.com", category: "Plumber", phone: "9876543239", exp: 6, charges: 400, loc: "Delhi", rating: 4.6 },
            { name: "Neha Sharma", email: "neha@test.com", category: "Cleaning", phone: "9876543240", exp: 4, charges: 300, loc: "Delhi", rating: 4.7 },
            { name: "Rahul Mehta", email: "rahul@test.com", category: "Carpenter", phone: "9876543241", exp: 10, charges: 550, loc: "Delhi", rating: 4.9 },
            { name: "Vivek Singh", email: "vivek@test.com", category: "AC Repair", phone: "9876543242", exp: 7, charges: 700, loc: "Delhi", rating: 4.8 },
            { name: "Priya Verma", email: "priya@test.com", category: "Painter", phone: "9876543243", exp: 5, charges: 500, loc: "Delhi", rating: 4.5 },
            { name: "Ashish Kumar", email: "ashish@test.com", category: "Electrician", phone: "9876543244", exp: 12, charges: 480, loc: "Delhi", rating: 4.9 },


            // ================= CHANDIGARH (12 WORKERS) =================

            { name: "Sunil Verma", email: "sunil@example.com", category: "Cleaning", phone: "9876543214", exp: 3, charges: 200, loc: "Chandigarh", rating: 4.5 },
            { name: "Anita Rani", email: "anita@example.com", category: "Painter", phone: "9876543222", exp: 6, charges: 450, loc: "Chandigarh", rating: 4.8 },
            { name: "Rohit Sharma", email: "rohit@example.com", category: "Plumber", phone: "9876543223", exp: 5, charges: 350, loc: "Chandigarh", rating: 4.7 },
            { name: "Vikram Jeet", email: "vikram@example.com", category: "Electrician", phone: "9876543224", exp: 7, charges: 350, loc: "Chandigarh", rating: 4.6 },
            { name: "Davinder Singh", email: "davinder@example.com", category: "Carpenter", phone: "9876543225", exp: 11, charges: 450, loc: "Chandigarh", rating: 4.9 },

            { name: "Amanpreet Singh", email: "amanpreet@test.com", category: "Electrician", phone: "9876543246", exp: 6, charges: 380, loc: "Chandigarh", rating: 4.7 },
            { name: "Rohini Sharma", email: "rohini@test.com", category: "Cleaning", phone: "9876543247", exp: 4, charges: 280, loc: "Chandigarh", rating: 4.6 },
            { name: "Harish Kumar", email: "harish@test.com", category: "Plumber", phone: "9876543248", exp: 8, charges: 420, loc: "Chandigarh", rating: 4.8 },
            { name: "Sahil Arora", email: "sahil@test.com", category: "Carpenter", phone: "9876543249", exp: 7, charges: 480, loc: "Chandigarh", rating: 4.7 },
            { name: "Meena Devi", email: "meena@test.com", category: "Painter", phone: "9876543250", exp: 5, charges: 450, loc: "Chandigarh", rating: 4.5 },
            { name: "Rajat Malhotra", email: "rajat@test.com", category: "AC Repair", phone: "9876543251", exp: 11, charges: 650, loc: "Chandigarh", rating: 4.9 },
            { name: "Deepak Singh", email: "deepak@test.com", category: "Electrician", phone: "9876543252", exp: 9, charges: 400, loc: "Chandigarh", rating: 4.8 },


            // ================= LUDHIANA (13 WORKERS) =================

            { name: "Vikas Gupta", email: "vikas@example.com", category: "AC Repair", phone: "9876543215", exp: 7, charges: 600, loc: "Ludhiana", rating: 4.5 },
            { name: "Jaswinder Singh", email: "jaswinder@example.com", category: "Plumber", phone: "9876543226", exp: 8, charges: 380, loc: "Ludhiana", rating: 4.8 },
            { name: "Baldev Raj", email: "baldev@example.com", category: "Electrician", phone: "9876543227", exp: 10, charges: 320, loc: "Ludhiana", rating: 4.7 },
            { name: "Satnam Singh", email: "satnam@example.com", category: "Carpenter", phone: "9876543228", exp: 9, charges: 420, loc: "Ludhiana", rating: 4.6 },
            { name: "Kuldeep Singh", email: "kuldeep@example.com", category: "Painter", phone: "9876543229", exp: 5, charges: 480, loc: "Ludhiana", rating: 4.7 },

            { name: "Aakash Verma", email: "aakash@test.com", category: "Plumber", phone: "9876543253", exp: 6, charges: 390, loc: "Ludhiana", rating: 4.6 },
            { name: "Rohit Gupta", email: "rohit@test.com", category: "Electrician", phone: "9876543254", exp: 10, charges: 420, loc: "Ludhiana", rating: 4.9 },
            { name: "Kamaljit Singh", email: "kamaljit@test.com", category: "Carpenter", phone: "9876543255", exp: 8, charges: 450, loc: "Ludhiana", rating: 4.7 },
            { name: "Pooja Sharma", email: "pooja@test.com", category: "Cleaning", phone: "9876543256", exp: 3, charges: 260, loc: "Ludhiana", rating: 4.5 },
            { name: "Manish Kumar", email: "manish@test.com", category: "AC Repair", phone: "9876543257", exp: 7, charges: 620, loc: "Ludhiana", rating: 4.8 },
            { name: "Jatin Arora", email: "jatin@test.com", category: "Painter", phone: "9876543258", exp: 5, charges: 480, loc: "Ludhiana", rating: 4.6 },
            { name: "Surinder Kaur", email: "surinder@test.com", category: "Plumber", phone: "9876543259", exp: 11, charges: 430, loc: "Ludhiana", rating: 4.9 },
            { name: "Nitin Gupta", email: "nitin@test.com", category: "Electrician", phone: "9876543260", exp: 6, charges: 360, loc: "Ludhiana", rating: 4.7 }

        ];

        // Check duplicate emails in the seed data itself
        const emails = workersData.map(worker => worker.email);
        const uniqueEmails = new Set(emails);

        if (uniqueEmails.size !== emails.length) {
            throw new Error("Duplicate email addresses found in workersData.");
        }

        // Generate hashed password once
        const hashedPassword = await bcrypt.hash("password123", 10);

        let createdUsers = 0;
        let createdWorkers = 0;
        let skippedWorkers = 0;

        for (const w of workersData) {

            let user = await User.findOne({ email: w.email });

            if (!user) {
                user = await User.create({
                    name: w.name,
                    email: w.email,
                    password: hashedPassword,
                    role: "worker"
                });

                createdUsers++;
            } else {
                // Ensure existing user has worker role
                if (user.role !== "worker") {
                    console.log(`Skipping ${w.email}: account already has role ${user.role}`);
                    skippedWorkers++;
                    continue;
                }
            }

            // Check whether worker profile already exists
            let worker = await Worker.findOne({
                userId: user._id
            });

            if (!worker) {
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

                createdWorkers++;

                console.log(
                    `Created worker: ${w.name} | ${w.category} | ${w.loc}`
                );

            } else {
                skippedWorkers++;
                console.log(`Worker profile already exists: ${w.name}`);
            }
        }

        console.log("\n========== SEED SUMMARY ==========");
        console.log(`Total seed records: ${workersData.length}`);
        console.log(`New users created: ${createdUsers}`);
        console.log(`New worker profiles created: ${createdWorkers}`);
        console.log(`Skipped existing/incompatible records: ${skippedWorkers}`);
        console.log("==================================");
        console.log("Worker seeding completed successfully!");

    } catch (error) {
        console.error("Worker seeding failed:", error);
        process.exitCode = 1;

    } finally {
        await mongoose.connection.close();
        console.log("Database connection closed.");
    }
};

seedWorkers();
