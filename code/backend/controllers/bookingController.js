const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const { calculateBookingPrice } = require('../utils/pricingCalculator');

/**
 * Helper to parse time slot starting time in minutes from midnight.
 * Supports ranges like "09:00 AM - 11:00 AM" (start: 09:00 AM = 540 mins)
 * or single times like "10:00 AM" (start: 10:00 AM = 600 mins).
 */
function parseSlotStartMinutes(slotStr) {
    if (!slotStr || typeof slotStr !== "string") return null;
    const parts = slotStr.split(/[-–]/);
    const target = parts[0].trim();
    const match = target.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const modifier = match[3] ? match[3].toUpperCase() : null;

    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
}

/**
 * Helper to parse time slot ending time in minutes from midnight.
 * Supports ranges like "07:00 PM - 09:00 PM" (end: 09:00 PM = 1260 mins)
 * or single times like "10:00 AM" (end: 10:00 AM = 600 mins).
 */
function parseSlotEndMinutes(slotStr) {
    if (!slotStr || typeof slotStr !== "string") return null;
    const parts = slotStr.split(/[-–]/);
    const target = parts.length > 1 ? parts[1].trim() : parts[0].trim();
    const match = target.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const modifier = match[3] ? match[3].toUpperCase() : null;

    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
}

/**
 * Calculates slot duration in hours from start and end times.
 */
function parseSlotDurationHours(slotStr) {
    if (!slotStr || typeof slotStr !== "string") return 2;
    const start = parseSlotStartMinutes(slotStr);
    const end = parseSlotEndMinutes(slotStr);
    if (start !== null && end !== null && end > start) {
        return Math.round(((end - start) / 60) * 10) / 10;
    }
    return 2;
}

/**
 * Returns current date (YYYY-MM-DD) and current minutes from midnight in Asia/Kolkata timezone.
 */
function getKolkataTime() {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
    const parts = formatter.formatToParts(new Date());
    const p = {};
    for (const part of parts) {
        p[part.type] = part.value;
    }
    const dateStr = `${p.year}-${p.month}-${p.day}`;
    const totalMinutes = parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10);
    return { dateStr, totalMinutes };
}

// POST /api/bookings
const createBooking = async (req, res) => {
    try {
        const { workerId, service, date, time, address, notes, estimatedPrice, estimatedHours, priceBreakdown } = req.body;
        const customerId = req.user.id; 

        if (!workerId || !date || !time) {
            return res.status(400).json({ message: "Worker, date, and time are required." });
        }

        const { dateStr: todayKolkata, totalMinutes: currentKolkataMinutes } = getKolkataTime();

        // 1. Reject past dates
        if (date < todayKolkata) {
            return res.status(400).json({ 
                message: "Cannot book an appointment for a past date. Please select today or a future date." 
            });
        }

        // 2. Reject expired time slots for today
        // If a slot's starting time has already passed or is exact, mark it unavailable.
        // Do not allow booking a partially elapsed slot!
        if (date === todayKolkata) {
            const slotStartMinutes = parseSlotStartMinutes(time);
            if (slotStartMinutes !== null) {
                if (slotStartMinutes <= currentKolkataMinutes) {
                    return res.status(400).json({ 
                        message: "Your selected time slot has already passed. Please choose another available slot." 
                    });
                }
            }
        }

        // 3. Check for double booking collision for active bookings
        const existingBooking = await Booking.findOne({
            workerId,
            date,
            time,
            status: { $in: ['pending', 'accepted'] }
        });

        if (existingBooking) {
            return res.status(400).json({ message: "This professional is already booked for this date and time slot. Please choose another time." });
        }

        // 4. Server-Side Canonical Pricing Calculation (Source of Truth)
        const worker = await Worker.findById(workerId);
        const hourlyRate = worker && worker.charges ? Number(worker.charges) : 250;
        const durationHours = Number(estimatedHours) > 0 ? Number(estimatedHours) : parseSlotDurationHours(time);

        const pricing = calculateBookingPrice({
            hourlyRate,
            durationHours,
            platformFee: 0,
            taxes: 0,
            additionalCharges: 0
        });

        const newBooking = new Booking({
            customerId,
            workerId,
            service: service || "General Service",
            date,
            time,
            address: address || "",
            estimatedHours: pricing.durationHours,
            estimatedPrice: pricing.totalAmount,
            priceBreakdown: pricing,
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

        const booking = await Booking.findById(req.params.id).populate("workerId");
        if (!booking) return res.status(404).json({ message: "Booking not found." });

        const reqUserId = req.user?._id ? req.user._id.toString() : req.user?.id?.toString();
        const isAdmin = req.user?.role === "admin";
        const customerIdStr = booking.customerId?._id ? booking.customerId._id.toString() : booking.customerId?.toString();
        const workerUserIdStr = booking.workerId?.userId?._id 
            ? booking.workerId.userId._id.toString() 
            : booking.workerId?.userId 
                ? booking.workerId.userId.toString() 
                : null;

        const isCustomer = Boolean(reqUserId && customerIdStr && customerIdStr === reqUserId);
        const isWorker = Boolean(reqUserId && workerUserIdStr && workerUserIdStr === reqUserId);

        // Security check: Verify booking participant ownership unless admin
        if (!isAdmin) {
            if (['accepted', 'completed'].includes(status)) {
                if (workerUserIdStr && !isWorker) {
                    return res.status(403).json({ message: "Only the assigned professional can update this booking status." });
                }
            } else if (status === 'rejected') {
                if (workerUserIdStr && customerIdStr && !isCustomer && !isWorker) {
                    return res.status(403).json({ message: "You are not authorized to cancel or decline this booking." });
                }
            }
        }

        // Enforce rule: Unverified workers cannot accept bookings
        if (status === 'accepted') {
            const worker = booking.workerId;
            if (!worker || (worker.status !== 'approved' && worker.verificationStatus !== 'approved')) {
                return res.status(403).json({ 
                    message: "Only verified and approved professionals can accept bookings." 
                });
            }
        }

        booking.status = status;
        if (status === 'paid') {
            booking.paymentStatus = 'paid';
        }

        await booking.save();
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createBooking,
    getMyBookings,
    updateBookingStatus,
    parseSlotStartMinutes,
    parseSlotEndMinutes,
    parseSlotDurationHours,
    getKolkataTime
};
