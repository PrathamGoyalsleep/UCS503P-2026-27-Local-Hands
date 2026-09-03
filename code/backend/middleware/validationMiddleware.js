// Author: Pratham Goyal
// Week 4 Task: Validation Rules for Worker Registration

const validateWorkerRegistration = (req, res, next) => {
    const { phone, category, experience, charges, location } = req.body;

    // Rule 1: Required Fields
    if (!phone || !category || !experience || !charges || !location) {
        return res.status(400).json({ message: "All fields are required for a worker profile." });
    }

    // Rule 2: Invalid Data Types
    if (isNaN(experience) || experience < 0) {
        return res.status(400).json({ message: "Experience must be a valid positive number." });
    }
    
    if (isNaN(charges) || charges <= 0) {
        return res.status(400).json({ message: "Charges must be a valid number greater than 0." });
    }

    // Rule 3: Phone number length validation (Basic check)
    if (phone.length < 10) {
        return res.status(400).json({ message: "Please provide a valid phone number." });
    }

    next(); // Move to the controller if validation passes
};

module.exports = { validateWorkerRegistration };

