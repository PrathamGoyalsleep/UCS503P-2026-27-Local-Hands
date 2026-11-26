import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLocationState } from "../context/LocationContext";
import { getWorkers } from "../services/workerService";
import {
  Search,
  MapPin,
  ShieldCheck,
  Star,
  Clock,
  ArrowRight,
  Wrench,
  Zap,
  Sparkles,
  Hammer,
  Paintbrush,
  Settings,
  MessageSquare,
  CreditCard,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
} from "../components/icons";

const SERVICE_CATEGORIES = [
  { name: "Plumber", description: "Leaks, taps, pipes and bathroom repairs.", detail: "Fast help for everyday plumbing", icon: Wrench, tone: "blue" },
  { name: "Electrician", description: "Wiring, lighting, fans and electrical faults.", detail: "Safe, reliable electrical work", icon: Zap, tone: "amber" },
  { name: "Cleaning", description: "Deep cleaning, kitchens, bathrooms and sofas.", detail: "A fresher home, without the hassle", icon: Sparkles, tone: "violet" },
  { name: "Carpenter", description: "Furniture, doors, locks and custom woodwork.", detail: "Repairs and made-to-fit solutions", icon: Hammer, tone: "orange" },
  { name: "Painter", description: "Interior painting, touch-ups and waterproofing.", detail: "Give your space a fresh finish", icon: Paintbrush, tone: "rose" },
  { name: "Appliance Repair", description: "AC, refrigerator, washer and appliance service.", detail: "Get essential appliances working again", icon: Settings, tone: "teal" },
];

const FAQS = [
  { q: "How are professionals verified on ServeConnect?", a: "Service professionals submit their identity and trade details during onboarding. Our admin team reviews and approves profiles before they are listed for customers." },
  { q: "How does pricing work?", a: "Professionals display their hourly rates on their profiles. You can review the rate before booking and see the booking details before confirming." },
  { q: "Can I chat with a professional after booking?", a: "Yes. Once a booking is created, you can use the in-app chat to coordinate job details and timing with your assigned professional." },
  { q: "Which payment methods are supported?", a: "ServeConnect supports secure online checkout through the payment methods enabled in the booking flow, including Razorpay where configured." },
  { q: "Can I cancel a booking?", a: "You can review and manage eligible bookings from the My Bookings section. Cancellation availability depends on the booking status." },
];

const TONES = {
  blue: { bg: "#EEF4FB", color: "#1E4E8C", border: "#CBDDF2" },
  amber: { bg: "#FFF5E5", color: "#C17A13", border: "#F8E4BF" },
  violet: { bg: "#F2EDFF", color: "#7654D6", border: "#E3D9FF" },
  orange: { bg: "#FFF0E8", color: "#D36B32", border: "#F8DCCB" },
  rose: { bg: "#FFF0F3", color: "#D65378", border: "#F7D9E1" },
  teal: { bg: "#E8F8F5", color: "#168B78", border: "#CDEDE6" },
};

const formatPrice = (value) => {
  if (value === undefined || value === null || value === "") return "Rate on request";
  return `₹${value}/hr`;
};

export default function Home() {
  const navigate = useNavigate();
  const { location, setLocation, supportedCities = [] } = useLocationState();
  const [searchQuery, setSearchQuery] = useState("");
  const [heroCity, setHeroCity] = useState(location || supportedCities[0] || "Patiala");
  const [workers, setWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    setHeroCity(location || supportedCities[0] || "Patiala");
  }, [location, supportedCities]);

  useEffect(() => {
    let active = true;
    const loadFeatured = async () => {
      try {
        const response = await getWorkers("", "");
        const list = Array.isArray(response) ? response : response?.workers || [];
        if (active) setWorkers(list);
      } catch {
        if (active) setWorkers([]);
      } finally {
        if (active) setLoadingWorkers(false);
      }
    };
    loadFeatured();
    return () => { active = false; };
  }, []);

  const metrics = useMemo(() => {
    const rated = workers.filter((worker) => Number(worker.rating) > 0);
    const average = rated.length
      ? (rated.reduce((sum, worker) => sum + Number(worker.rating), 0) / rated.length).toFixed(1)
      : null;
    const categories = new Set(workers.map((worker) => worker.category).filter(Boolean)).size;
    return {
      professionals: workers.length,
      cities: supportedCities.length,
      categories: categories || SERVICE_CATEGORIES.length,
      rating: average,
    };
  }, [workers, supportedCities]);

  const featuredWorkers = useMemo(
    () => [...workers].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0)).slice(0, 6),
    [workers]
  );

  const handleSearch = (event) => {
    event.preventDefault();
    if (heroCity) setLocation(heroCity);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("category", searchQuery.trim());
    if (heroCity) params.set("location", heroCity);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="sc-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .sc-page{--ink:#14213d;--muted:#64748b;--blue:#2864e8;--blue-dark:#1748b8;--line:#e5ebf5;--surface:#fbfcff;--canvas:#f1f5fb;font-family:'Plus Jakarta Sans',Inter,system-ui,sans-serif;color:var(--ink);background:var(--canvas);width:100%;overflow:hidden}
        .sc-page *{box-sizing:border-box}.sc-container{width:min(100% - 48px, var(--container-max, 1680px));margin-inline:auto}
        .sc-hero-title, .sc-section-title, .sc-search-submit, .sc-primary-cta, .sc-secondary-cta, .sc-kicker, .sc-partner-cta h2, .sc-worker-price, .sc-metric strong, .sc-service-card h3, .sc-worker-name, .sc-step-card h3, .sc-benefit h3 { font-family: 'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif !important; }
        .sc-hero{position:relative;isolation:isolate;overflow:hidden;padding:34px 0 76px;color:#fff;background:radial-gradient(ellipse at 82% 18%,rgba(42,100,172,.22),transparent 35%),radial-gradient(ellipse at 12% 90%,rgba(26,69,130,.22),transparent 34%),linear-gradient(118deg,#09152b 0%,#0e1f3d 58%,#142a50 100%)}
        .sc-hero:before{content:"";position:absolute;inset:0;z-index:-1;opacity:.16;background-image:linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px);background-size:54px 54px;mask-image:linear-gradient(120deg,#000,transparent 82%)}
        .sc-hero:after{content:"";position:absolute;z-index:-1;width:420px;height:420px;right:-170px;bottom:-250px;border-radius:50%;border:1px solid rgba(164,190,255,.18);box-shadow:0 0 0 45px rgba(164,190,255,.035),0 0 0 90px rgba(164,190,255,.025)}
        .sc-search-area{max-width:920px;margin:0 auto 56px}.sc-search-caption{text-align:center;margin-bottom:13px;color:#b8c9ec;font-size:11px;font-weight:800;letter-spacing:.17em;text-transform:uppercase}
        .sc-search-form{display:grid;grid-template-columns:190px minmax(0,1fr) auto;align-items:center;gap:0;padding:8px;background:#fff;border:1px solid rgba(255,255,255,.7);border-radius:18px;box-shadow:0 18px 55px rgba(0,0,0,.25),0 0 0 5px rgba(255,255,255,.055)}
        .sc-city-field{height:52px;display:flex;align-items:center;gap:9px;padding:0 15px;border-right:1px solid #e7edf5;color:#1E4E8C}.sc-city-field select{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#243451;font:700 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer}
        .sc-query-field{display:flex;align-items:center;gap:11px;min-width:0;padding:0 18px;color:#8b9ab3}.sc-query-field input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#172b4d;font:500 14px 'Plus Jakarta Sans',sans-serif}.sc-query-field input::placeholder{color:#9aa8bc}
        .sc-search-submit{height:50px;display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:0 25px;border:0;border-radius:12px;background:linear-gradient(110deg,#1E4E8C,#2E68AE);color:#fff;font:800 13px 'Plus Jakarta Sans',sans-serif;box-shadow:0 7px 18px rgba(30,78,140,.28);transition:transform .2s,box-shadow .2s}.sc-search-submit:hover{transform:translateY(-2px);box-shadow:0 12px 24px rgba(30,78,140,.34)}
        .sc-hero-grid{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(440px,.98fr);gap:clamp(38px,5vw,82px);align-items:center}.sc-hero-copy{max-width:690px;animation:scEnter .65s ease both}.sc-eyebrow{display:inline-flex;align-items:center;gap:9px;padding:8px 13px;margin-bottom:22px;border:1px solid rgba(153,185,255,.25);border-radius:999px;background:rgba(74,126,240,.13);color:#d5e3ff;font-size:11px;font-weight:800;letter-spacing:.075em;text-transform:uppercase}.sc-eyebrow i{width:7px;height:7px;border-radius:50%;background:#75b2ff;box-shadow:0 0 12px #75b2ff}
        .sc-hero-title{max-width:720px;margin:0 0 20px;color:#fff;font-size:clamp(42px,4.4vw,68px);font-weight:800;line-height:1.08;letter-spacing:-.065em}.sc-hero-title em{font-style:normal;color:#94BCF8}.sc-hero-description{max-width:570px;margin:0;color:#c1cee4;font-size:15px;line-height:1.9}.sc-hero-actions{display:flex;align-items:center;gap:13px;flex-wrap:wrap;margin-top:27px}.sc-primary-cta,.sc-secondary-cta{min-height:48px;display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:0 19px;border-radius:11px;text-decoration:none;font-size:13px;font-weight:800;transition:transform .2s,background .2s,box-shadow .2s}.sc-primary-cta{background:#fff;color:#1E4E8C;box-shadow:0 8px 20px rgba(0,0,0,.12)}.sc-primary-cta:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(0,0,0,.18)}.sc-secondary-cta{border:1px solid rgba(205,220,255,.28);color:#e8efff;background:rgba(255,255,255,.055)}.sc-secondary-cta:hover{background:rgba(255,255,255,.12)}
        .sc-trust-row{display:flex;align-items:center;gap:19px;flex-wrap:wrap;margin-top:29px;color:#b9c9e4;font-size:11px;font-weight:600}.sc-trust-item{display:inline-flex;align-items:center;gap:7px}.sc-trust-item svg{color:#94BCF8}
        .sc-hero-visual{position:relative;min-width:0;animation:scEnter .8s .08s ease both}.sc-photo-shell{position:relative;overflow:hidden;height:clamp(300px,31vw,430px);border:1px solid rgba(255,255,255,.23);border-radius:24px;background:#1A2C4A;box-shadow:0 28px 65px rgba(0,0,0,.3)}.sc-photo-shell:after{content:"";position:absolute;inset:50% 0 0;background:linear-gradient(transparent,rgba(5,15,34,.23));pointer-events:none}.sc-photo-shell img{width:100%;height:100%;object-fit:cover;object-position:center 43%;transition:transform .7s}.sc-hero-visual:hover .sc-photo-shell img{transform:scale(1.035)}
        .sc-photo-note{position:absolute;left:18px;bottom:18px;z-index:1;display:flex;align-items:center;gap:10px;padding:11px 14px;border:1px solid rgba(255,255,255,.2);border-radius:13px;background:rgba(12,27,54,.78);backdrop-filter:blur(12px);color:#fff}.sc-photo-note-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:rgba(87,142,255,.2);color:#a9c9ff}.sc-photo-note small{display:block;color:#b5c7e7;font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.sc-photo-note strong{display:block;margin-top:2px;font-size:12px}
        .sc-floating-proof{display:none!important}
        .sc-metrics{position:relative;z-index:2;margin-top:-1px;padding:25px 0;background:transparent;border-bottom:1px solid #dce5f2}.sc-metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.sc-metric{display:flex;align-items:center;gap:14px;min-height:88px;padding:17px 20px;border:1px solid #dce5f2;border-radius:15px;background:#ffffff;box-shadow:0 4px 18px rgba(14,27,51,.04)}.sc-metric-icon{display:grid;place-items:center;width:43px;height:43px;flex:0 0 43px;border-radius:13px;background:#EEF4FB;color:#1E4E8C}.sc-metric strong{display:block;color:#0F1D38;font-size:21px;line-height:1.15;font-weight:800}.sc-metric span{display:block;margin-top:4px;color:#77869d;font-size:10px;font-weight:700}
        .sc-section{padding:76px 0}.sc-section-soft{background:transparent}.sc-section-white{background:transparent}.sc-section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:28px}.sc-kicker{display:block;margin-bottom:9px;color:#1E4E8C;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}.sc-section-title{margin:0;color:#0F1D38;font-size:clamp(25px,2.5vw,34px);line-height:1.2;font-weight:800;letter-spacing:-.045em}.sc-section-subtitle{margin:9px 0 0;color:#56677F;font-size:13px;line-height:1.7}.sc-text-link{display:inline-flex;align-items:center;gap:7px;flex-shrink:0;color:#1E4E8C;text-decoration:none;font-size:12px;font-weight:800}.sc-text-link:hover{color:#133560}
        .sc-service-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px}.sc-service-card{position:relative;display:flex;flex-direction:column;min-height:190px;padding:23px;border:1px solid #dce5f2;border-radius:17px;background:#ffffff;text-decoration:none;box-shadow:0 4px 18px rgba(14,27,51,.05);overflow:hidden;transition:transform .22s,border-color .22s,box-shadow .22s}.sc-service-card:after{content:"";position:absolute;right:-44px;top:-55px;width:140px;height:140px;border-radius:50%;background:var(--tone-bg);opacity:.78;transition:transform .25s}.sc-service-card:hover{transform:translateY(-5px);border-color:var(--tone-border);box-shadow:0 16px 32px rgba(28,68,137,.11)}.sc-service-card:hover:after{transform:scale(1.18)}.sc-service-top{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between}.sc-service-icon{display:grid;place-items:center;width:48px;height:48px;border-radius:14px;background:var(--tone-bg);color:var(--tone-color);box-shadow:inset 0 0 0 1px var(--tone-border)}.sc-service-arrow{color:#9aabc5;transition:transform .2s,color .2s}.sc-service-card:hover .sc-service-arrow{color:var(--tone-color);transform:translateX(4px)}.sc-service-card h3{position:relative;z-index:1;margin:19px 0 6px;color:#0F1D38;font-size:15px;font-weight:800}.sc-service-card p{position:relative;z-index:1;margin:0;color:#56677F;font-size:11px;line-height:1.65}.sc-service-foot{position:relative;z-index:1;margin-top:auto;padding-top:13px;color:var(--tone-color);font-size:10px;font-weight:800}
        .sc-worker-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.sc-worker-card{position:relative;display:flex;flex-direction:column;min-width:0;padding:21px;border:1px solid #dce5f2;border-radius:17px;background:#ffffff;box-shadow:0 4px 18px rgba(14,27,51,.05);overflow:hidden;transition:transform .22s,border-color .22s,box-shadow .22s}.sc-worker-card:before{content:"";position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--tone-color),var(--tone-border))}.sc-worker-card:hover{transform:translateY(-4px);border-color:var(--tone-border);box-shadow:0 16px 30px rgba(22,48,91,.09)}.sc-worker-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.sc-worker-person{display:flex;align-items:center;gap:12px;min-width:0}.sc-worker-avatar{display:grid;place-items:center;width:54px;height:54px;flex:0 0 54px;overflow:hidden;border-radius:15px;background:var(--tone-bg);color:var(--tone-color);font-size:19px;font-weight:800}.sc-worker-avatar img{width:100%;height:100%;object-fit:cover}.sc-worker-name{overflow:hidden;color:#0F1D38;font-size:13px;font-weight:800;text-overflow:ellipsis;white-space:nowrap}.sc-worker-verified{display:inline-flex;align-items:center;gap:4px;margin-top:5px;color:#168b78;font-size:10px;font-weight:700}.sc-worker-rating{display:inline-flex;align-items:center;gap:4px;padding:6px 8px;border-radius:8px;background:#fff8e9;color:#8b641e;font-size:11px;font-weight:800;white-space:nowrap}.sc-worker-category{display:inline-flex;align-self:flex-start;margin-top:16px;padding:6px 9px;border-radius:7px;background:var(--tone-bg);color:var(--tone-color);font-size:10px;font-weight:800}.sc-worker-location{margin-top:9px;color:#8390a5;font-size:11px}.sc-worker-bottom{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:18px;padding-top:14px;border-top:1px solid #edf1f7}.sc-worker-price{color:#0F1D38;font-size:13px;font-weight:800}.sc-worker-price small{display:block;margin-top:2px;color:#98a3b5;font-size:9px;font-weight:600}.sc-worker-link{display:inline-flex;align-items:center;gap:6px;padding:9px 13px;border-radius:9px;background:#1E4E8C;color:#fff;text-decoration:none;font-size:10px;font-weight:800;transition:background .2s}.sc-worker-link:hover{background:#133560}
        .sc-empty{grid-column:1/-1;padding:34px;border:1px dashed #cbd8ec;border-radius:16px;background:#fff;text-align:center;color:#738199;font-size:13px}.sc-skeleton{height:205px;border-radius:17px;background:linear-gradient(90deg,#edf2fa 25%,#f7f9fd 38%,#edf2fa 62%);background-size:400% 100%;animation:scShimmer 1.4s ease infinite}
        .sc-steps-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px}.sc-step-card{position:relative;min-height:210px;padding:25px;border:1px solid #dce5f2;border-radius:17px;background:#ffffff;box-shadow:0 4px 18px rgba(14,27,51,.04)}.sc-step-number{display:grid;place-items:center;width:43px;height:43px;margin-bottom:22px;border-radius:13px;background:var(--step-bg);color:var(--step-color);font-size:13px;font-weight:800}.sc-step-card h3{margin:0 0 8px;color:#0F1D38;font-size:15px;font-weight:800}.sc-step-card p{margin:0;color:#56677F;font-size:11px;line-height:1.75}
        .sc-benefit-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}.sc-benefit{padding:22px;border:1px solid #dce5f2;border-radius:16px;background:#ffffff;box-shadow:0 4px 18px rgba(14,27,51,.04)}.sc-benefit-icon{display:grid;place-items:center;width:43px;height:43px;margin-bottom:17px;border-radius:13px;background:#EEF4FB;color:#1E4E8C}.sc-benefit h3{margin:0 0 7px;color:#0F1D38;font-size:13px;font-weight:800}.sc-benefit p{margin:0;color:#56677F;font-size:11px;line-height:1.7}
        .sc-faq-wrap{max-width:900px;margin:0 auto}.sc-faq-list{overflow:hidden;border:1px solid #dce5f2;border-radius:17px;background:#ffffff;box-shadow:0 4px 18px rgba(14,27,51,.04)}.sc-faq-item+.sc-faq-item{border-top:1px solid #edf1f7}.sc-faq-question{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:19px 22px;border:0;background:#ffffff;color:#0F1D38;text-align:left;font:700 13px 'Plus Jakarta Sans',sans-serif}.sc-faq-question:hover{background:#f9fbff}.sc-faq-answer{padding:0 22px 20px;color:#56677F;font-size:12px;line-height:1.8}
        .sc-partner-cta{position:relative;overflow:hidden;padding:48px;border-radius:22px;background:radial-gradient(circle at 90% 10%,rgba(65,120,210,.25),transparent 30%),linear-gradient(115deg,#0c1a33,#162f5c);color:#fff;box-shadow:0 20px 45px rgba(14,27,51,.18)}.sc-partner-cta:after{content:"";position:absolute;right:-70px;bottom:-170px;width:360px;height:360px;border:1px solid rgba(255,255,255,.13);border-radius:50%;box-shadow:0 0 0 35px rgba(255,255,255,.035),0 0 0 70px rgba(255,255,255,.025)}.sc-partner-inner{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:28px}.sc-partner-copy{max-width:650px}.sc-partner-kicker{color:#a9c7ff;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}.sc-partner-cta h2{margin:10px 0;color:#fff;font-size:clamp(23px,2.8vw,34px);line-height:1.2;letter-spacing:-.04em}.sc-partner-cta p{margin:0;color:#c5d3eb;font-size:12px;line-height:1.75}.sc-partner-actions{display:flex;flex-wrap:wrap;gap:10px}.sc-partner-actions a{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 16px;border-radius:10px;text-decoration:none;font-size:11px;font-weight:800}.sc-partner-primary{background:#fff;color:#1E4E8C}.sc-partner-secondary{border:1px solid rgba(255,255,255,.25);color:#fff;background:rgba(255,255,255,.07)}
        @keyframes scEnter{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}@keyframes scShimmer{to{background-position:-200% 0}}
        @media(min-width:1600px){.sc-service-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.sc-worker-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.sc-faq-wrap{max-width:1100px}}
        @media(max-width:1050px){.sc-hero-grid{grid-template-columns:minmax(0,1fr) minmax(360px,.9fr);gap:34px}.sc-hero-title{font-size:clamp(40px,5vw,58px)}.sc-floating-proof{right:10px}.sc-benefit-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:760px){.sc-container{width:min(100% - 36px,640px)}.sc-hero{padding:28px 0 52px}.sc-search-area{margin-bottom:42px}.sc-search-form{grid-template-columns:1fr;gap:0;padding:9px;border-radius:15px}.sc-city-field{height:43px;border-right:0;border-bottom:1px solid #e7edf5;padding:0 9px}.sc-query-field{height:48px;padding:0 9px}.sc-search-submit{width:100%;height:46px}.sc-hero-grid{grid-template-columns:1fr;gap:30px}.sc-hero-copy{max-width:none}.sc-hero-title{max-width:640px;font-size:clamp(40px,9vw,58px)}.sc-hero-description{font-size:13px}.sc-photo-shell{height:clamp(250px,62vw,380px)}.sc-floating-proof{top:12px;right:12px}.sc-metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.sc-section{padding:56px 0}.sc-service-grid,.sc-worker-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.sc-steps-grid{grid-template-columns:1fr}.sc-step-card{min-height:0}.sc-partner-inner{align-items:flex-start;flex-direction:column}.sc-partner-cta{padding:30px}}
        @media(max-width:520px){.sc-container{width:calc(100% - 30px)}.sc-search-caption{text-align:left;font-size:9px}.sc-hero-title{font-size:39px;letter-spacing:-.055em}.sc-hero-actions{align-items:stretch}.sc-primary-cta,.sc-secondary-cta{flex:1}.sc-trust-row{gap:12px}.sc-photo-shell{height:245px;border-radius:17px}.sc-photo-note{left:10px;bottom:10px}.sc-metric-grid{gap:9px}.sc-metric{min-height:76px;padding:12px;gap:9px}.sc-metric-icon{width:35px;height:35px;flex-basis:35px}.sc-metric strong{font-size:17px}.sc-metric span{font-size:9px}.sc-section-heading{align-items:flex-start;flex-direction:column}.sc-service-grid,.sc-worker-grid,.sc-benefit-grid{grid-template-columns:1fr}.sc-service-card{min-height:165px}.sc-partner-actions{width:100%}.sc-partner-actions a{flex:1}}
        @media(prefers-reduced-motion:reduce){.sc-page *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
      `}</style>

      <section className="sc-hero">
        <div className="sc-container">
          <div className="sc-search-area">
            <div className="sc-search-caption">Find trusted help around your home</div>
            <form className="sc-search-form" onSubmit={handleSearch}>
              <label className="sc-city-field">
                <MapPin size={18} />
                <select aria-label="Select city" value={heroCity} onChange={(event) => setHeroCity(event.target.value)}>
                  {(supportedCities.length ? supportedCities : [heroCity || "Patiala"]).map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
                <ChevronDown size={15} color="#8291a8" />
              </label>
              <label className="sc-query-field">
                <Search size={19} />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="What service do you need? e.g. plumber, electrician..." aria-label="Search for a service" />
              </label>
              <button className="sc-search-submit" type="submit">Find professionals <ArrowRight size={16} /></button>
            </form>
          </div>

          <div className="sc-hero-grid">
            <div className="sc-hero-copy">
              <div className="sc-eyebrow"><i /> A better way to care for your home</div>
              <h1 className="sc-hero-title">Trusted home experts.<br /><em>Quality work,</em> right at your door.</h1>
              <p className="sc-hero-description">From quick repairs to everyday home care, discover verified local professionals, compare transparent hourly rates and book the right expert with confidence.</p>
              <div className="sc-hero-actions">
                <Link className="sc-primary-cta" to={`/search?location=${encodeURIComponent(heroCity)}`}>Explore professionals <ArrowRight size={16} /></Link>
                <Link className="sc-secondary-cta" to="/register">Join as a professional</Link>
              </div>
              <div className="sc-trust-row">
                <span className="sc-trust-item"><ShieldCheck size={15} /> Verified professionals</span>
                <span className="sc-trust-item"><Star size={15} /> Transparent ratings</span>
                <span className="sc-trust-item"><Clock size={15} /> Convenient booking</span>
              </div>
            </div>

            <div className="sc-hero-visual">
              <div className="sc-photo-shell">
                <img src="/images/login-hero.jpg" alt="A home service professional ready to help" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                <div className="sc-photo-note"><span className="sc-photo-note-icon"><ShieldCheck size={18} /></span><span><small>ServeConnect standard</small><strong>Trusted help, closer to home</strong></span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sc-metrics">
        <div className="sc-container sc-metric-grid">
          <div className="sc-metric"><span className="sc-metric-icon"><BadgeCheck size={20} /></span><div><strong>{loadingWorkers ? "—" : metrics.professionals}</strong><span>Listed professionals</span></div></div>
          <div className="sc-metric"><span className="sc-metric-icon" style={{ background: "#e8f8f5", color: "#168b78" }}><MapPin size={20} /></span><div><strong>{metrics.cities || "—"}</strong><span>Service locations</span></div></div>
          <div className="sc-metric"><span className="sc-metric-icon" style={{ background: "#f2edff", color: "#7654d6" }}><Settings size={20} /></span><div><strong>{metrics.categories}</strong><span>Home service categories</span></div></div>
          <div className="sc-metric"><span className="sc-metric-icon" style={{ background: "#fff5e5", color: "#c17a13" }}><Star size={20} /></span><div><strong>{metrics.rating ? `${metrics.rating}/5` : "Customer rated"}</strong><span>Professional ratings</span></div></div>
        </div>
      </section>

      <section className="sc-section sc-section-soft">
        <div className="sc-container">
          <div className="sc-section-heading">
            <div><span className="sc-kicker">Services for every home</span><h2 className="sc-section-title">What can we help you with?</h2><p className="sc-section-subtitle">Explore trusted help for the jobs that keep your home running smoothly.</p></div>
            <Link className="sc-text-link" to={`/search?location=${encodeURIComponent(heroCity)}`}>Explore all services <ArrowRight size={15} /></Link>
          </div>
          <div className="sc-service-grid">
            {SERVICE_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const tone = TONES[category.tone];
              return <Link className="sc-service-card" key={category.name} to={`/search?category=${encodeURIComponent(category.name)}&location=${encodeURIComponent(heroCity)}`} style={{ "--tone-bg": tone.bg, "--tone-color": tone.color, "--tone-border": tone.border }}>
                <div className="sc-service-top"><span className="sc-service-icon"><Icon size={22} /></span><ArrowRight className="sc-service-arrow" size={18} /></div>
                <h3>{category.name}</h3><p>{category.description}</p><span className="sc-service-foot">{category.detail}</span>
              </Link>;
            })}
          </div>
        </div>
      </section>

      <section className="sc-section sc-section-white">
        <div className="sc-container">
          <div className="sc-section-heading">
            <div><span className="sc-kicker">Local talent, trusted service</span><h2 className="sc-section-title">Meet professionals near you</h2><p className="sc-section-subtitle">Compare profiles, ratings and hourly rates before you book.</p></div>
            <Link className="sc-text-link" to="/search">Browse all professionals <ArrowRight size={15} /></Link>
          </div>
          <div className="sc-worker-grid">
            {loadingWorkers ? [1, 2, 3].map((item) => <div className="sc-skeleton" key={item} />) : featuredWorkers.length === 0 ? <div className="sc-empty">No approved professionals are listed yet. Check back soon or register as a service professional.</div> : featuredWorkers.map((worker) => {
              const name = worker.userId?.name || "ServeConnect Professional";
              const avatar = worker.profileImage || worker.userId?.profileImage;
              const categoryIndex = SERVICE_CATEGORIES.findIndex((item) => item.name.toLowerCase() === String(worker.category || "").toLowerCase());
              const tone = TONES[SERVICE_CATEGORIES[Math.max(0, categoryIndex)]?.tone || "blue"];
              return <article className="sc-worker-card" key={worker._id} style={{ "--tone-bg": tone.bg, "--tone-color": tone.color, "--tone-border": tone.border }}>
                <div className="sc-worker-head"><div className="sc-worker-person"><div className="sc-worker-avatar">{avatar ? <img src={avatar} alt={name} /> : name.charAt(0).toUpperCase()}</div><div style={{ minWidth: 0 }}><div className="sc-worker-name">{name}</div><div className="sc-worker-verified"><BadgeCheck size={13} /> Verified professional</div></div></div><span className="sc-worker-rating"><Star size={12} fill="#E7A52A" color="#E7A52A" /> {Number(worker.rating) > 0 ? Number(worker.rating).toFixed(1) : "New"}</span></div>
                {worker.category && <span className="sc-worker-category">{worker.category}</span>}
                <div className="sc-worker-location">{worker.location || heroCity}</div>
                <div className="sc-worker-bottom"><div className="sc-worker-price">{formatPrice(worker.charges)}<small>Transparent hourly pricing</small></div><Link className="sc-worker-link" to={`/worker/${worker._id}`}>View profile <ArrowRight size={13} /></Link></div>
              </article>;
            })}
          </div>
        </div>
      </section>

      <section className="sc-section sc-section-soft">
        <div className="sc-container">
          <div className="sc-section-heading"><div><span className="sc-kicker">Simple from start to finish</span><h2 className="sc-section-title">A better booking experience in three steps</h2><p className="sc-section-subtitle">Find the right person, agree on a time and get the job done.</p></div></div>
          <div className="sc-steps-grid">
            {[{ n: "01", title: "Find your professional", text: "Search by service and city. Compare verified profiles, ratings and hourly rates." }, { n: "02", title: "Choose a time and book", text: "Select an available appointment slot, share the job details and submit your booking." }, { n: "03", title: "Get it done", text: "Coordinate through in-app chat, complete the service and manage payment and reviews." }].map((step, index) => <article className="sc-step-card" key={step.n} style={{ "--step-bg": ["#eaf2ff", "#fff5e5", "#f2edff"][index], "--step-color": ["#2563eb", "#c17a13", "#7654d6"][index] }}><span className="sc-step-number">{step.n}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="sc-section sc-section-white">
        <div className="sc-container">
          <div className="sc-section-heading"><div><span className="sc-kicker">Why ServeConnect</span><h2 className="sc-section-title">Confidence in every booking</h2><p className="sc-section-subtitle">The essential tools to make home services easier to arrange.</p></div></div>
          <div className="sc-benefit-grid">
            {[{ icon: ShieldCheck, title: "Reviewed professionals", text: "Profiles go through an approval process before being listed." }, { icon: Clock, title: "Clear appointment slots", text: "Choose from available time windows that fit your schedule." }, { icon: CreditCard, title: "Secure checkout", text: "Use the payment options provided in your booking flow." }, { icon: MessageSquare, title: "In-app communication", text: "Coordinate job details with your assigned professional." }].map((benefit) => { const Icon = benefit.icon; return <article className="sc-benefit" key={benefit.title}><span className="sc-benefit-icon"><Icon size={21} /></span><h3>{benefit.title}</h3><p>{benefit.text}</p></article>; })}
          </div>
        </div>
      </section>

      <section className="sc-section sc-section-soft">
        <div className="sc-container sc-faq-wrap">
          <div className="sc-section-heading" style={{ justifyContent: "center", textAlign: "center" }}><div><span className="sc-kicker">Need a little clarity?</span><h2 className="sc-section-title">Frequently asked questions</h2><p className="sc-section-subtitle">Helpful answers before you book.</p></div></div>
          <div className="sc-faq-list">{FAQS.map((item, index) => { const isOpen = openFaq === index; return <div className="sc-faq-item" key={item.q}><button className="sc-faq-question" type="button" aria-expanded={isOpen} onClick={() => setOpenFaq(isOpen ? -1 : index)}><span>{item.q}</span>{isOpen ? <ChevronUp size={18} color="#2864e8" /> : <ChevronDown size={18} color="#8391a7" />}</button>{isOpen && <div className="sc-faq-answer">{item.a}</div>}</div>; })}</div>
        </div>
      </section>

      <section className="sc-section sc-section-white">
        <div className="sc-container"><div className="sc-partner-cta"><div className="sc-partner-inner"><div className="sc-partner-copy"><span className="sc-partner-kicker">For skilled professionals</span><h2>Turn your skills into a growing business.</h2><p>Build your profile, set your hourly rates and manage customer bookings with ServeConnect.</p></div><div className="sc-partner-actions"><Link className="sc-partner-primary" to="/register">Become a partner <ArrowRight size={15} /></Link><Link className="sc-partner-secondary" to="/search">Explore services</Link></div></div></div></div>
      </section>
    </div>
  );
}
