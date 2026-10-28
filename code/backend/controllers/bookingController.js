const Booking = require('../models/Booking');
const Worker = require('../models/Worker');

// POST /api/bookings
const createBooking = async (req, res) => {
    try {
        const { workerId, service, date, time, address, notes, estimatedPrice, estimatedHours } = req.body;
        const customerId = req.user.id; 

        if (!workerId || !date || !time) {
            return res.status(400).json({ message: "Worker, date, and time are required." });
        }

        // Recheck: Prevent booking past dates
        const todayStr = new Date().toISOString().split('T')[0];
        if (date < todayStr) {
            return res.status(400).json({ message: "Cannot book an appointment for a past date." });
        }

        // Check for double booking collision
        const existingBooking = await Booking.findOne({
            workerId,
            date,
            time,
            status: { $in: ['pending', 'accepted'] }
        });

        if (existingBooking) {
            return res.status(400).json({ message: "This professional is already booked for this date and time slot. Please choose another time." });
        }

        const newBooking = new Booking({
            customerId,
            workerId,
            service: service || "General Service",
            date,
            time,
            address: address || "",
            estimatedHours: estimatedHours || 1,
            estimatedPrice: estimatedPrice || 0,
            notes: notes || ""
        });

        await newBooking.save();
        res.status(201).json(newBooking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/bookings/my-bookings 
const getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let bookings;
        if (role === 'worker') {
            const worker = await Worker.findOne({ userId });
            if (!worker) return res.status(404).json({ message: "Worker profile not found." });
            
            bookings = await Booking.find({ workerId: worker._id })
                .populate('customerId', 'name email phone')
                .sort({ date: 1 });
        } else {
            bookings = await Booking.find({ customerId: userId })
                .populate({
                    path: 'workerId',
                    populate: { path: 'userId', select: 'name email phone' }
                })
                .sort({ date: 1 });
        }

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/bookings/:id/status
const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['accepted', 'rejected', 'completed', 'paid'].includes(status)) {
            return res.status(400).json({ message: "Invalid status." });
        }

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!booking) return res.status(404).json({ message: "Booking not found." });
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createBooking, getMyBookings, updateBookingStatus };
