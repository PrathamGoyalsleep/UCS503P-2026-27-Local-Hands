const Booking = require('../models/Booking');
const Worker = require('../models/Worker');

// POST /api/bookings
const createBooking = async (req, res) => {
    try {
        const { workerId, date, time, notes } = req.body;
        // Strictly determine customer ID from authenticated session
        const customerId = req.user.id;

        if (!workerId || !date || !time) {
            return res.status(400).json({ message: "Worker, date, and time are required." });
        }

        // Verify worker exists
        const worker = await Worker.findById(workerId);
        if (!worker) {
            return res.status(404).json({ message: "Worker not found." });
        }

        // Prevent self-booking
        if (worker.userId && worker.userId.toString() === customerId.toString()) {
            return res.status(400).json({ message: "You cannot book your own service." });
        }

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
        // Enforce strict data isolation: strictly scoped to req.user.id
        const userId = req.user.id;
        const role = req.user.role;
        const type = req.query.type;

        let bookings;
        if (role === 'worker' && type !== 'customer') {
            const worker = await Worker.findOne({ userId });
            if (!worker) {
                // If worker profile is not yet created, return customer bookings
                bookings = await Booking.find({ customerId: userId })
                    .populate({
                        path: 'workerId',
                        populate: { path: 'userId', select: 'name email phone' }
                    })
                    .sort({ date: 1 });
            } else {
                bookings = await Booking.find({ workerId: worker._id })
                    .populate('customerId', 'name email phone')
                    .sort({ date: 1 });
            }
        } else {
            // Customer role or customer view: strictly fetch bookings where customerId matches authenticated user
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

        const booking = await Booking.findById(req.params.id).populate('workerId');
        if (!booking) return res.status(404).json({ message: "Booking not found." });

        // Authorization check: Only assigned worker, customer, or admin may modify
        const isWorker = booking.workerId && booking.workerId.userId && booking.workerId.userId.toString() === req.user.id.toString();
        const isCustomer = booking.customerId && booking.customerId.toString() === req.user.id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isWorker && !isCustomer && !isAdmin) {
            return res.status(403).json({ message: "Not authorized to update this booking." });
        }

        booking.status = status;
        await booking.save();
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createBooking, getMyBookings, updateBookingStatus };

