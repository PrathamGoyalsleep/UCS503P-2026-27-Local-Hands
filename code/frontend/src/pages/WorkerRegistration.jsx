import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { registerWorker } from "../services/workerService";
import { useNavigate } from "react-router-dom";

const steps = ["Personal Info", "Professional Info", "Review & Submit"];

const categories = [
  { value: "Electrician", icon: "⚡", desc: "Wiring, fuse boxes, appliances" },
  { value: "Plumber", icon: "🔧", desc: "Pipes, leaks, installations" },
  { value: "Carpenter", icon: "🪚", desc: "Furniture, doors, woodwork" },
  { value: "Painter", icon: "🎨", desc: "Interior, exterior, walls" },
  { value: "Cleaning", icon: "✨", desc: "Deep clean, sanitization" },
  { value: "AC Repair", icon: "❄️", desc: "Service, gas refill, repair" },
];

function WorkerRegistration() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    phone: "",
    category: "",
    experience: "",
    charges: "",
    location: "",
    bio: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validateStep0() {
    const errs = {};
    if (!formData.phone.trim()) errs.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone)) errs.phone = "Must be exactly 10 digits";
    if (!formData.location.trim()) errs.location = "Location is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep1() {
    const errs = {};
    if (!formData.category) errs.category = "Please select a service category";
    if (formData.experience === "") errs.experience = "Years of experience is required";
    else if (Number(formData.experience) < 0) errs.experience = "Cannot be negative";
    if (formData.charges === "") errs.charges = "Hourly charges are required";
    else if (Number(formData.charges) <= 0) errs.charges = "Must be greater than 0";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function nextStep() {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    setStep((s) => s + 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!token || user?.role !== "worker") {
      alert("Only registered workers can submit a profile.");
      return;
    }
    try {
      await registerWorker({
        phone: formData.phone,
        category: formData.category,
        experience: Number(formData.experience),
        charges: Number(formData.charges),
        location: formData.location,
        bio: formData.bio,
      }, token);
      setSubmitted(true);
    } catch (error) {
      alert(error.message);
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ background: "white", borderRadius: "20px", padding: "3rem", textAlign: "center", maxWidth: "500px", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }}>
          <div style={{ width: "80px", height: "80px", background: "linear-gradient(135deg, #10B981, #059669)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", fontSize: "2rem" }}>✓</div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "1rem", color: "#1a1a2e" }}>Application Submitted!</h2>
          <p style={{ color: "#6b7280", lineHeight: 1.7, marginBottom: "2rem" }}>
            Your profile has been submitted for admin review. You'll receive an <strong>SMS</strong> on <strong>{formData.phone}</strong> once you're approved and visible to customers.
          </p>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "1rem", marginBottom: "2rem", fontSize: "0.9rem", color: "#15803d" }}>
            ⏱ Average review time: <strong>24–48 hours</strong>
          </div>
          <button onClick={() => navigate("/")} className="btn btn-primary" style={{ width: "100%" }}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)", padding: "3rem 1rem" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <span style={{ display: "inline-block", background: "linear-gradient(135deg, var(--primary), #6366f1)", color: "white", padding: "0.3rem 1rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "1px", marginBottom: "1rem" }}>
            JOIN SERVECONNECT
          </span>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#1a1a2e", marginBottom: "0.75rem" }}>
            Register as a Professional
          </h1>
          <p style={{ color: "#6b7280", fontSize: "1.05rem" }}>
            Join thousands of verified workers earning more with ServeConnect.
          </p>
        </div>

        {/* Stepper */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2.5rem", gap: "0" }}>
          {steps.map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.9rem",
                  background: i < step ? "#10B981" : i === step ? "var(--primary)" : "#e5e7eb",
                  color: i <= step ? "white" : "#9ca3af",
                  boxShadow: i === step ? "0 0 0 4px rgba(99,102,241,0.15)" : "none",
                  transition: "all 0.3s"
                }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 500, color: i === step ? "var(--primary)" : "#9ca3af", whiteSpace: "nowrap" }}>{label}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: "80px", height: "2px", background: i < step ? "#10B981" : "#e5e7eb", margin: "0 0.5rem", marginBottom: "1.5rem", transition: "background 0.3s" }} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div style={{ background: "white", borderRadius: "20px", boxShadow: "0 4px 30px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          
          {/* Step 0: Personal Info */}
          {step === 0 && (
            <div style={{ padding: "2.5rem" }}>
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1a1a2e", marginBottom: "0.3rem" }}>Personal Information</h2>
                <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>Tell us about yourself so customers can reach you</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem", color: "#374151" }}>Phone Number <span style={{ color: "#EF4444" }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontWeight: 600 }}>+91</span>
                    <input name="phone" type="tel" maxLength="10" placeholder="98765 43210" value={formData.phone} onChange={handleChange}
                      style={{ width: "100%", padding: "0.875rem 1rem 0.875rem 3.5rem", border: errors.phone ? "1.5px solid #EF4444" : "1.5px solid #e5e7eb", borderRadius: "10px", fontSize: "1rem", outline: "none", boxSizing: "border-box", transition: "border 0.2s" }}
                      onFocus={e => e.target.style.borderColor = "var(--primary)"}
                      onBlur={e => e.target.style.borderColor = errors.phone ? "#EF4444" : "#e5e7eb"}
                    />
                  </div>
                  {errors.phone && <p style={{ color: "#EF4444", fontSize: "0.8rem", marginTop: "0.4rem" }}>⚠ {errors.phone}</p>}
                </div>

                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem", color: "#374151" }}>Your Location <span style={{ color: "#EF4444" }}>*</span></label>
                  <input name="location" type="text" placeholder="e.g. Patiala, Punjab" value={formData.location} onChange={handleChange}
                    style={{ width: "100%", padding: "0.875rem 1rem", border: errors.location ? "1.5px solid #EF4444" : "1.5px solid #e5e7eb", borderRadius: "10px", fontSize: "1rem", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "var(--primary)"}
                    onBlur={e => e.target.style.borderColor = errors.location ? "#EF4444" : "#e5e7eb"}
                  />
                  {errors.location && <p style={{ color: "#EF4444", fontSize: "0.8rem", marginTop: "0.4rem" }}>⚠ {errors.location}</p>}
                </div>

                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem", color: "#374151" }}>Short Bio <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
                  <textarea name="bio" rows={3} placeholder="Tell customers about your skills, why they should hire you, any specializations..." value={formData.bio} onChange={handleChange}
                    style={{ width: "100%", padding: "0.875rem 1rem", border: "1.5px solid #e5e7eb", borderRadius: "10px", fontSize: "0.95rem", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor = "var(--primary)"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Professional Info */}
          {step === 1 && (
            <div style={{ padding: "2.5rem" }}>
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1a1a2e", marginBottom: "0.3rem" }}>Professional Details</h2>
                <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>Select your expertise and set your pricing</p>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "0.75rem", fontSize: "0.9rem", color: "#374151" }}>Service Category <span style={{ color: "#EF4444" }}>*</span></label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                  {categories.map((cat) => (
                    <div key={cat.value} onClick={() => { setFormData(p => ({ ...p, category: cat.value })); setErrors(p => ({ ...p, category: "" })); }}
                      style={{
                        padding: "1rem", border: formData.category === cat.value ? "2px solid var(--primary)" : "2px solid #e5e7eb",
                        borderRadius: "12px", cursor: "pointer", transition: "all 0.2s", textAlign: "center",
                        background: formData.category === cat.value ? "rgba(99,102,241,0.05)" : "white"
                      }}>
                      <div style={{ fontSize: "1.8rem", marginBottom: "0.4rem" }}>{cat.icon}</div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1a1a2e", marginBottom: "0.2rem" }}>{cat.value}</div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{cat.desc}</div>
                    </div>
                  ))}
                </div>
                {errors.category && <p style={{ color: "#EF4444", fontSize: "0.8rem", marginTop: "0.5rem" }}>⚠ {errors.category}</p>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem", color: "#374151" }}>Years of Experience <span style={{ color: "#EF4444" }}>*</span></label>
                  <input name="experience" type="number" min="0" placeholder="e.g. 5" value={formData.experience} onChange={handleChange}
                    style={{ width: "100%", padding: "0.875rem 1rem", border: errors.experience ? "1.5px solid #EF4444" : "1.5px solid #e5e7eb", borderRadius: "10px", fontSize: "1rem", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "var(--primary)"}
                    onBlur={e => e.target.style.borderColor = errors.experience ? "#EF4444" : "#e5e7eb"}
                  />
                  {errors.experience && <p style={{ color: "#EF4444", fontSize: "0.8rem", marginTop: "0.4rem" }}>⚠ {errors.experience}</p>}
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem", color: "#374151" }}>Hourly Charges (₹) <span style={{ color: "#EF4444" }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontWeight: 600 }}>₹</span>
                    <input name="charges" type="number" min="1" placeholder="350" value={formData.charges} onChange={handleChange}
                      style={{ width: "100%", padding: "0.875rem 1rem 0.875rem 2.5rem", border: errors.charges ? "1.5px solid #EF4444" : "1.5px solid #e5e7eb", borderRadius: "10px", fontSize: "1rem", outline: "none", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = "var(--primary)"}
                      onBlur={e => e.target.style.borderColor = errors.charges ? "#EF4444" : "#e5e7eb"}
                    />
                  </div>
                  {errors.charges && <p style={{ color: "#EF4444", fontSize: "0.8rem", marginTop: "0.4rem" }}>⚠ {errors.charges}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div style={{ padding: "2.5rem" }}>
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1a1a2e", marginBottom: "0.3rem" }}>Review Your Profile</h2>
                <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>Double-check everything before submitting</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                {[
                  { label: "Phone", value: `+91 ${formData.phone}` },
                  { label: "Location", value: formData.location },
                  { label: "Category", value: formData.category },
                  { label: "Experience", value: `${formData.experience} years` },
                  { label: "Hourly Rate", value: `₹${formData.charges}/hr` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: "#f9fafb", borderRadius: "10px", padding: "1rem 1.25rem", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "0.78rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.3rem" }}>{label}</div>
                    <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: "1rem" }}>{value}</div>
                  </div>
                ))}
              </div>

              {formData.bio && (
                <div style={{ background: "#f9fafb", borderRadius: "10px", padding: "1rem 1.25rem", border: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "0.78rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.3rem" }}>Bio</div>
                  <div style={{ color: "#374151", lineHeight: 1.6 }}>{formData.bio}</div>
                </div>
              )}

              <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "10px", padding: "1rem 1.25rem" }}>
                <p style={{ color: "#92400e", fontSize: "0.9rem", margin: 0 }}>
                  ⚠ After submission, your profile will be <strong>reviewed by our admin team</strong>. You'll receive an SMS notification on your phone once approved.
                </p>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div style={{ padding: "1.5rem 2.5rem", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", background: "#fafafa" }}>
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)} style={{ padding: "0.75rem 1.5rem", border: "1.5px solid #e5e7eb", borderRadius: "10px", background: "white", cursor: "pointer", fontWeight: 600, color: "#374151" }}>
                ← Back
              </button>
            ) : <div />}
            
            {step < 2 ? (
              <button onClick={nextStep} className="btn btn-primary" style={{ padding: "0.75rem 2rem", borderRadius: "10px", fontWeight: 600 }}>
                Continue →
              </button>
            ) : (
              <button onClick={handleSubmit} className="btn btn-primary" style={{ padding: "0.75rem 2rem", borderRadius: "10px", fontWeight: 700, background: "linear-gradient(135deg, #10B981, #059669)" }}>
                Submit Application ✓
              </button>
            )}
          </div>
        </div>

        {/* Trust Badges */}
        <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "2rem", flexWrap: "wrap" }}>
          {["🔒 Secure & Private", "📱 SMS Notification on Approval", "✅ Admin Verified Profiles"].map(badge => (
            <span key={badge} style={{ color: "#6b7280", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>{badge}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WorkerRegistration;
