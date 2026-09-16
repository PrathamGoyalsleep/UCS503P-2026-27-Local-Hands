const Booking = require('../models/Booking');
const Worker = require('../models/Worker');

// POST /api/bookings
const createBooking = async (req, res) => {
    try {
        const { workerId, date, time, notes } = req.body;
        const customerId = req.user.id; 

        // Check for double booking
        const existingBooking = await Booking.findOne({
            workerId,
            date,
            time,
            status: { $in: ['pending', 'accepted'] }
        });

        if (existingBooking) {
            return res.status(400).json({ message: "Worker is already booked for this time slot." });
        }

        const newBooking = new Booking({
            customerId,
            workerId,
            date,
            time,
            notes
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

