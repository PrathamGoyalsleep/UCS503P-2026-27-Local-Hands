const Worker = require("../models/Worker");
const User = require("../models/User");
const Review = require("../models/Review");

// Official supported service areas (Backend single source of truth)
const SUPPORTED_CITIES = [
    {
        name: "Patiala",
        state: "Punjab",
        synonyms: ["patiala", "tiet", "patiala city", "thapar", "urban estate", "model town", "tripuri", "leela bhawan"],
        landmarks: ["TIET Campus", "Urban Estate Phase 1 & 2", "Model Town", "Leela Bhawan", "Tripuri"]
    },
    {
        name: "Delhi",
        state: "Delhi NCR",
        synonyms: ["delhi", "new delhi", "ncr", "south delhi", "dwarka", "rohini", "connaught place", "saket"],
        landmarks: ["Connaught Place", "South Extension", "Dwarka Sector 1-22", "Rohini", "Saket"]
    },
    {
        name: "Chandigarh",
        state: "Chandigarh (UT)",
        synonyms: ["chandigarh", "chd", "tricity", "sector 17", "sector 35"],
        landmarks: ["Sector 17 Market", "Sector 35", "Sector 22", "Sector 43", "Manimajra"]
    },
    {
        name: "Ludhiana",
        state: "Punjab",
        synonyms: ["ludhiana", "ludhiana city", "sarabha nagar", "civil lines", "brs nagar"],
        landmarks: ["Model Town", "Sarabha Nagar", "BRS Nagar", "Civil Lines", "Ferozepur Road"]
    },
    {
        name: "Mohali",
        state: "Punjab",
        synonyms: ["mohali", "sas nagar", "sahibzada ajit singh nagar", "phase 7", "phase 3b2"],
        landmarks: ["Phase 3B2", "Phase 7", "Sector 70", "Aerocity", "Kharar Highway"]
    }
];

function checkServiceArea(locString) {
    if (!locString || !locString.trim()) {
        return { isSupported: true, canonicalCity: "" };
    }
    const clean = locString.trim().toLowerCase();

    for (const city of SUPPORTED_CITIES) {
        if (clean === city.name.toLowerCase()) {
            return { isSupported: true, canonicalCity: city.name };
        }
        if (city.synonyms.some(s => clean.includes(s) || s.includes(clean))) {
            return { isSupported: true, canonicalCity: city.name };
        }
    }

    return { isSupported: false, canonicalCity: locString.trim() };
}

const getServiceAreas = (req, res) => {
    res.json({
        supportedCities: SUPPORTED_CITIES.map(c => c.name),
        serviceAreas: SUPPORTED_CITIES
    });
};

// High-resolution professional portraits for marketplace cards
const categoryPhotos = {
    Electrician: [
        "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
    ],
    Plumber: [
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80"
    ],
    Carpenter: [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80"
    ],
    Painter: [
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80"
    ],
    Cleaning: [
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80"
    ],
    "AC Repair": [
        "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80"
    ]
};

// Rich curated portfolio showcases by category
const categoryPortfolios = {
    Electrician: [
        {
            title: "Smart Home Distribution Board Upgrade",
            description: "Upgraded outdated porcelain fuse system to a certified ABB MCB modular box with surge and residual current protection.",
            serviceType: "Electrical Wiring & Safety",
            imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
            completedDate: "12 Oct 2026"
        },
        {
            title: "Concealed Living Room Ambient LED Lighting",
            description: "Installed recessed architectural ceiling COB spotlights and dual-tone warm profile lights with 2-way dimming controllers.",
            serviceType: "Lighting Installation",
            imageUrl: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=800&q=80",
            completedDate: "28 Sep 2026"
        },
        {
            title: "Heavy Load Appliance Wiring & Pure Sine Wave Inverter",
            description: "Complete heavy-gauge copper cabling for instant geyser, 2-ton AC and 1500VA inverter transfer relay integration.",
            serviceType: "Power Backup Setup",
            imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
            completedDate: "15 Sep 2026"
        }
    ],
    Plumber: [
        {
            title: "Concealed Wall Shower Mixer & Diverter Installation",
            description: "Precision core drilling, high-pressure CPVC piping, and installation of luxury Kohler thermostatic rain shower diverter.",
            serviceType: "Bathroom Fitting",
            imageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80",
            completedDate: "18 Oct 2026"
        },
        {
            title: "Multi-Chamber Kitchen Grease Trap & Line Jetting",
            description: "Cleared chronic pipeline grease build-up and installed anti-odor SS grease trap under double-bowl sink.",
            serviceType: "Drainage & Sewer Repair",
            imageUrl: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80",
            completedDate: "04 Oct 2026"
        },
        {
            title: "1HP Automatic Rooftop Water Booster Pump",
            description: "Connected silent pressure pump with bypass valve to ensure equal water flow across 4 bathrooms simultaneously.",
            serviceType: "Motor & Pump Setup",
            imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
            completedDate: "22 Sep 2026"
        }
    ],
    Carpenter: [
        {
            title: "Modular Acrylic Finish Kitchen Wall & Base Units",
            description: "Built BWP marine grade ply carcass cabinets with soft-close Blum hinges, pull-out wire baskets, and quartz edge banding.",
            serviceType: "Custom Cabinetry",
            imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
            completedDate: "10 Oct 2026"
        },
        {
            title: "Floating Media Console with Natural Wood Slat Wall",
            description: "Solid walnut veneer paneling, concealed conduits for zero cable clutter, and acoustic felt sound-dampening backing.",
            serviceType: "Furniture & Decor",
            imageUrl: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80",
            completedDate: "25 Sep 2026"
        },
        {
            title: "Floor-to-Ceiling 3-Track Sliding Wardrobe",
            description: "Frameless lacquered glass sliding doors with customized trouser racks, inner motion sensor LEDs, and locker drawers.",
            serviceType: "Wardrobe Installation",
            imageUrl: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80",
            completedDate: "11 Sep 2026"
        }
    ],
    Painter: [
        {
            title: "Royal Italian Stucco Feature Wall & Velvet Emulsion",
            description: "Full wall leveling, 3 coats of Asian Paints Royale Luxury Emulsion with hand-troweled metallic stucco marble effect.",
            serviceType: "Interior Accent Painting",
            imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
            completedDate: "14 Oct 2026"
        },
        {
            title: "Anti-Algae Weather-Proof Exterior Silicone Coat",
            description: "Pressure washed facade, sealed surface fissures with elastomeric caulk, and double coated UV-resistant silicone paint.",
            serviceType: "Exterior Waterproofing",
            imageUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",
            completedDate: "30 Sep 2026"
        },
        {
            title: "Negative Side Moisture Barrier & Wall Restoration",
            description: "Chipped salt-affected plaster, applied crystalline waterproofing slurry, followed by moisture-proof polymer putty.",
            serviceType: "Damp Treatment",
            imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
            completedDate: "19 Sep 2026"
        }
    ],
    Cleaning: [
        {
            title: "3-BHK Move-In Deep Disinfection & Floor Buffing",
            description: "Rotary floor machine scrubbing of Italian marble, window track degreasing, bathroom tile descaling, and ozone air sanitization.",
            serviceType: "Full Home Deep Clean",
            imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
            completedDate: "17 Oct 2026"
        },
        {
            title: "7-Seater Fabric Sofa & Carpet Hot Extraction",
            description: "High-pressure warm shampoo injection and twin vacuum extraction removing tough tea stains, allergens, and dust mites.",
            serviceType: "Upholstery Treatment",
            imageUrl: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80",
            completedDate: "02 Oct 2026"
        },
        {
            title: "Modular Kitchen Chimney & Grease Descaling",
            description: "Immersion ultrasonic degreasing of stainless steel baffle filters, blower fan scraping, and anti-bacterial counter steaming.",
            serviceType: "Kitchen Deep Clean",
            imageUrl: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80",
            completedDate: "20 Sep 2026"
        }
    ],
    "AC Repair": [
        {
            title: "High-Pressure Hydro Jet Foam Coil Servicing",
            description: "Deep chemical foam spray on indoor cooling fins, motorized jet wash clearing mold and dust, achieving 18°C vent output.",
            serviceType: "Deep Jet Service",
            imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
            completedDate: "19 Oct 2026"
        },
        {
            title: "R32 Inverter Gas Leak Repair & Precision Recharging",
            description: "Electronic sniff detector pinpointed condenser valve flare leak. Brazed joint, vacuumed down to 500 microns, and weighed in pure gas.",
            serviceType: "Gas Refill & Brazing",
            imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
            completedDate: "05 Oct 2026"
        },
        {
            title: "Dual Inverter PCB Component Level Diagnostics",
            description: "Diagnosed communication error code CH-05. Replaced blown optocoupler and capacitor on outdoor power circuit board.",
            serviceType: "PCB & Electronics Repair",
            imageUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
            completedDate: "21 Sep 2026"
        }
    ]
};

const defaultServices = {
    Electrician: [
        { name: "General Electrical Repair & Inspection", priceMultiplier: 1.0, duration: "1 hr" },
        { name: "MCB Distribution Box & Fuse Upgrade", priceMultiplier: 1.8, duration: "2 hrs" },
        { name: "Ceiling Fan & Chandelier Installation", priceMultiplier: 1.2, duration: "1.5 hrs" },
        { name: "Complete Room Re-Wiring & Concealed Points", priceMultiplier: 2.5, duration: "3 hrs" }
    ],
    Plumber: [
        { name: "Tap, Shower & Valve Leakage Repair", priceMultiplier: 1.0, duration: "1 hr" },
        { name: "Drainage Unclogging & Jet Jetting", priceMultiplier: 1.5, duration: "1.5 hrs" },
        { name: "Water Heater / Geyser Piping Connection", priceMultiplier: 1.3, duration: "1.5 hrs" },
        { name: "Full Bathroom Sanitary Ware Installation", priceMultiplier: 2.5, duration: "3 hrs" }
    ],
    Carpenter: [
        { name: "Door Locks, Hinges & Latches Repair", priceMultiplier: 1.0, duration: "1 hr" },
        { name: "Furniture Assembly (Bed, Wardrobe, Desk)", priceMultiplier: 1.5, duration: "2 hrs" },
        { name: "Cabinet Repair & Soft-Close Channel Fitting", priceMultiplier: 1.2, duration: "1.5 hrs" },
        { name: "Custom Woodworking & Slat Partition", priceMultiplier: 2.5, duration: "3 hrs" }
    ],
    Painter: [
        { name: "Touch-up & Water Damage Patching", priceMultiplier: 1.0, duration: "1 hr" },
        { name: "Single Room Interior Fresh Coat Painting", priceMultiplier: 2.0, duration: "3 hrs" },
        { name: "Designer Feature Wall (Stucco/Texture)", priceMultiplier: 2.5, duration: "3 hrs" },
        { name: "Waterproofing & Anti-Damp Primer Treatment", priceMultiplier: 1.8, duration: "2 hrs" }
    ],
    Cleaning: [
        { name: "Bathroom & Kitchen Intensive Deep Clean", priceMultiplier: 1.5, duration: "2 hrs" },
        { name: "Full Home Move-In Sanitization (2-3 BHK)", priceMultiplier: 2.8, duration: "4 hrs" },
        { name: "Fabric Sofa & Upholstery Steam Shampoo", priceMultiplier: 1.3, duration: "1.5 hrs" },
        { name: "Balcony & Window Slider Track Scrubbing", priceMultiplier: 1.0, duration: "1 hr" }
    ],
    "AC Repair": [
        { name: "Deep Foam Hydro-Jet Servicing (Split/Window)", priceMultiplier: 1.0, duration: "1 hr" },
        { name: "Gas Leak Check & Precision Recharging", priceMultiplier: 2.2, duration: "2 hrs" },
        { name: "AC Uninstallation & New Location Mounting", priceMultiplier: 1.6, duration: "2 hrs" },
        { name: "PCB Board Diagnostics & Sensor Replacement", priceMultiplier: 1.5, duration: "1.5 hrs" }
    ]
};

const defaultSkills = {
    Electrician: ["MCB Distribution", "Surge Protection", "Concealed Conduit", "Appliance Diagnostics", "Safety Earthing"],
    Plumber: ["CPVC / PPR Piping", "Pressure Booster Pumps", "Drain Snake Clearing", "Thermostatic Mixers", "Sanitary Fittings"],
    Carpenter: ["BWP Plywood", "Hydraulic Hinges", "Laminate Pasting", "Frameless Glass", "Acoustic Wall Slats"],
    Painter: ["Royale Luxury Emulsion", "Wall Putty Smoothing", "Stucco Marble Finish", "Exterior Silicone", "Epoxy Damp Barrier"],
    Cleaning: ["Rotary Buffer Machine", "Steam Jet Sanitization", "Hot Water Extraction", "Eco-friendly Chemicals", "Odor Neutralizer"],
    "AC Repair": ["R32 / R410A Refrigerant", "Nitrogen Pressure Test", "Hydro Jet Cleaning", "Inverter PCB Diagnostic", "Copper Brazing"]
};

const defaultReviews = [
    {
        name: "Vikram Malhotra",
        rating: 5,
        date: "3 days ago",
        comment: "Outstanding professionalism! Arrived right on time with all proper specialized tools. Finished the job cleanly without leaving any mess. Highly recommended!",
        service: "Inspection & Repair"
    },
    {
        name: "Pooja Sharma",
        rating: 5,
        date: "2 weeks ago",
        comment: "Very polite, knowledgeable, and transparent about costs. Clearly explained the issue before starting work and solved it in under 45 minutes.",
        service: "Installation & Setup"
    },
    {
        name: "Rohit Verma",
        rating: 4.8,
        date: "Last month",
        comment: "Super reliable service. Much better than searching for unverified local contacts. Booked easily on ServeConnect and quality was top tier.",
        service: "Standard Service"
    }
];

// Helper to calculate deterministic photo & metadata based on worker id/category
function enrichWorker(worker) {
    const raw = worker.toObject ? worker.toObject() : { ...worker };
    const cat = raw.category || "Electrician";
    const photos = categoryPhotos[cat] || categoryPhotos.Electrician;
    const charCode = (raw.userId?.name || "Pro").charCodeAt(0) || 0;
    const photoIdx = charCode % photos.length;

    if (!raw.photo) {
        raw.photo = photos[photoIdx];
    }

    if (!raw.bio) {
        raw.bio = `Certified and background-checked ${cat} specialist with ${raw.experience || 5}+ years of hands-on experience in residential and commercial projects. Dedicated to safety, transparent pricing, and 100% customer satisfaction.`;
    }

    if (!raw.portfolio || raw.portfolio.length === 0) {
        raw.portfolio = categoryPortfolios[cat] || categoryPortfolios.Electrician;
    }

    if (!raw.servicesOffered || raw.servicesOffered.length === 0) {
        raw.servicesOffered = defaultServices[cat] || defaultServices.Electrician;
    }

    if (!raw.skills || raw.skills.length === 0) {
        raw.skills = defaultSkills[cat] || defaultSkills.Electrician;
    }

    if (!raw.workingHours) {
        raw.workingHours = "8:00 AM – 8:00 PM (Monday – Sunday)";
    }

    if (!raw.reviewsCount || raw.reviewsCount === 0) {
        raw.reviewsCount = Math.floor(18 + (charCode % 40));
    }

    raw.isAvailableToday = true;

    return raw;
}

const registerWorkerProfile = async (req, res) => {
    try {
        const { phone, category, experience, charges, location, bio } = req.body;

        const existingProfile = await Worker.findOne({ userId: req.user._id });
        if (existingProfile) {
            return res.status(400).json({ message: "Worker profile already exists" });
        }

        const workerProfile = await Worker.create({
            userId: req.user._id,
            phone,
            category,
            experience,
            charges,
            location,
            bio,
            status: "pending"
        });

        res.status(201).json(workerProfile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getWorkerById = async (req, res) => {
    try {
        const worker = await Worker.findById(req.params.id).populate('userId', 'name email phone');
        
        if (!worker) {
            return res.status(404).json({ message: "Worker not found" });
        }

        if (worker.status !== 'approved') {
            worker.phone = undefined;
        }

        // Fetch real reviews from DB
        const dbReviews = await Review.find({ workerId: worker._id })
            .populate('customerId', 'name')
            .sort({ createdAt: -1 })
            .limit(10);

        const enriched = enrichWorker(worker);

        if (dbReviews && dbReviews.length > 0) {
            enriched.reviews = dbReviews.map(r => ({
                name: r.customerId?.name || "Customer",
                rating: r.rating,
                comment: r.comment,
                date: new Date(r.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
                service: "Verified Service"
            }));
            enriched.reviewsCount = dbReviews.length;
        } else {
            enriched.reviews = defaultReviews;
        }

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const searchWorkers = async (req, res) => {
    try {
        const { category, location } = req.query;
        let query = { status: 'approved' };
        
        let areaCheck = { isSupported: true, canonicalCity: "" };
        const rawLoc = (location || "").trim();
        const isDetectingOrUnknown = ["", "detecting...", "location error", "location denied", "unknown"].includes(rawLoc.toLowerCase());

        if (rawLoc && !isDetectingOrUnknown) {
            areaCheck = checkServiceArea(rawLoc);

            // If outside supported service area, return clean service-area notice
            if (!areaCheck.isSupported) {
                return res.json({
                    isServiceAreaSupported: false,
                    requestedLocation: rawLoc,
                    supportedCities: SUPPORTED_CITIES.map(c => c.name),
                    message: "Sorry, ServeConnect isn't available in your area yet.",
                    workers: []
                });
            }

            // Query by verified canonical city
            query.location = new RegExp(areaCheck.canonicalCity || rawLoc, 'i');
        }

        if (category) query.category = new RegExp(category, 'i');

        const workers = await Worker.find(query)
            .sort({ rating: -1 })
            .populate('userId', 'name email');

        const enrichedList = workers.map(w => enrichWorker(w));
            
        res.json({
            isServiceAreaSupported: true,
            requestedLocation: areaCheck.canonicalCity || (isDetectingOrUnknown ? "All Areas" : rawLoc),
            supportedCities: SUPPORTED_CITIES.map(c => c.name),
            workers: enrichedList,
            count: enrichedList.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerWorkerProfile,
    getWorkerById,
    searchWorkers,
    getServiceAreas
};
