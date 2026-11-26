const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { uploadBufferToCloudinary } = require("../config/cloudinary");

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "defaultsecret", {
        expiresIn: "30d",
    });
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Security: Public registration is restricted to customer or worker roles only.
        // Administrative accounts cannot be self-registered publicly.
        const assignedRole = role === "worker" ? "worker" : "customer";

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: assignedRole,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage || "",
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage || "",
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const uploadCustomerProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided." });
        }

        if (req.file.mimetype && !req.file.mimetype.startsWith("image/")) {
            return res.status(400).json({ message: "Invalid file type. Only image files (JPEG, PNG, WEBP) are allowed for profile pictures." });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const result = await uploadBufferToCloudinary(req.file.buffer, {
            folder: "ServeConnect/customers/profile-images",
            public_id: `customer_profile_${user._id}`
        });

        user.profileImage = result.secure_url;
        user.profileImagePublicId = result.public_id;
        await user.save();

        res.json({
            message: "Profile image uploaded successfully",
            profileImage: result.secure_url,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error("[Auth] uploadCustomerProfileImage error:", error);
        res.status(500).json({ message: error.message || "Failed to upload profile picture." });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage || "",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, uploadCustomerProfileImage, getMe };
