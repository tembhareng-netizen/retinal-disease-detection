import { useState } from "react";
import MainPortal from "./MainPortal";
import "./App.css";

const DEMO_DOCTOR = {
  id: "D001", name: "Dr. Elena Vasquez",
  specialization: "Ophthalmologist", email: "dr.vasquez@clinic.com"
};

const INITIAL_PATIENTS = [
  {
    id: "P001", name: "Sarah Mitchell", age: 34, email: "sarah@email.com",
    reports: [
      {
        id: "R001", date: "2026-02-15",
        originalImage: null, edgeImage: null, gradcamImage: null,
        diagnosis: "Diabetic Retinopathy", stage: "Stage 2",
        confidence: 87, risk: "Moderate",
        findings: "Microaneurysms detected in superior temporal quadrant. Mild hard exudates present. No neovascularization observed.",
        doctorNote: "Recommend follow-up in 3 months. Continue current medication regimen.",
        prescription: "Metformin 500mg twice daily. Avoid high-sugar diet. Annual ophthalmology review.",
        sentByDoctor: true,
      },
      {
        id: "R002", date: "2025-11-10",
        originalImage: null, edgeImage: null, gradcamImage: null,
        diagnosis: "Normal Retina", stage: "N/A",
        confidence: 96, risk: "Low",
        findings: "No abnormalities detected. Optic disc appears healthy. Macula and vessels within normal parameters.",
        doctorNote: "All clear. Next routine scan in 6 months.",
        prescription: "No medication required. Maintain regular check-ups.",
        sentByDoctor: true,
      },
    ],
  },
  {
    id: "P002", name: "James Thornton", age: 52, email: "james@email.com",
    reports: [
      {
        id: "R003", date: "2026-01-22",
        originalImage: null, edgeImage: null, gradcamImage: null,
        diagnosis: "Glaucoma", stage: "Suspect / Early",
        confidence: 78, risk: "High",
        findings: "Cup-to-disc ratio elevated at 0.7. Suspicious for early glaucomatous changes. Asymmetry noted between eyes.",
        doctorNote: "Urgent referral to glaucoma specialist. IOP measurement needed.",
        prescription: "Timolol 0.5% eye drops twice daily. IOP monitoring every 2 weeks.",
        sentByDoctor: true,
      },
    ],
  },
];

const passStrength = (p) => {
  if (!p.length) return null;
  if (p.length < 6)  return { label: "Weak",     color: "#e84040", w: "25%" };
  if (p.length < 10) return { label: "Moderate", color: "#f5a623", w: "60%" };
  return                    { label: "Strong",   color: "#00d4aa", w: "100%" };
};

export default function App() {
  const [screen,       setScreen]       = useState("login");
  const [currentUser,  setCurrentUser]  = useState(null);
  const [patients,     setPatients]     = useState(INITIAL_PATIENTS);
  const [authMode,     setAuthMode]     = useState("signin");
  const [loginRole,    setLoginRole]    = useState("patient");
  const [loginEmail,   setLoginEmail]   = useState("");
  const [loginPass,    setLoginPass]    = useState("");
  const [loginError,   setLoginError]   = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");
  const [showPass,     setShowPass]     = useState(false);
  const [regName,      setRegName]      = useState("");
  const [regEmail,     setRegEmail]     = useState("");
  const [regPass,      setRegPass]      = useState("");
  const [regConfirm,   setRegConfirm]   = useState("");
  const [regAge,       setRegAge]       = useState("");
  const [regGender,    setRegGender]    = useState("");
  const [regPhone,     setRegPhone]     = useState("");
  const [regSpec,      setRegSpec]      = useState("");
  const [regLic,       setRegLic]       = useState("");
  const [regHosp,      setRegHosp]      = useState("");

  const resetAuth = () => {
    setLoginEmail(""); setLoginPass(""); setLoginError(""); setLoginSuccess("");
    setRegName(""); setRegEmail(""); setRegPass(""); setRegConfirm("");
    setRegAge(""); setRegGender(""); setRegPhone(""); setRegSpec(""); setRegLic(""); setRegHosp("");
    setShowPass(false);
  };
  const switchMode = (m) => { resetAuth(); setAuthMode(m); };
  const switchRole = (r) => { resetAuth(); setLoginRole(r); };

  const handleLogin = () => {
    setLoginError("");
    if (loginRole === "patient") {
      const found = patients.find(p => p.email === loginEmail);
      const ok    = found && (found._pwd ? loginPass === found._pwd : loginPass === "patient123");
      if (ok) { setCurrentUser(found); setScreen("patient"); }
      else setLoginError("Invalid credentials. Demo: sarah@email.com / patient123");
    } else {
      const rd = (window._regDocs || []).find(d => d.email === loginEmail && d._pwd === loginPass);
      if (loginEmail === DEMO_DOCTOR.email && loginPass === "doctor123") {
        setCurrentUser(DEMO_DOCTOR); setScreen("doctor");
      } else if (rd) {
        setCurrentUser({ id: "D" + Date.now(), name: rd.name, specialization: rd.spec, email: rd.email });
        setScreen("doctor");
      } else {
        setLoginError("Invalid credentials. Demo: dr.vasquez@clinic.com / doctor123");
      }
    }
  };

  const handleRegister = () => {
    setLoginError(""); setLoginSuccess("");
    if (!regName.trim())                    return setLoginError("Full name is required.");
    if (!/^\S+@\S+\.\S+$/.test(regEmail))   return setLoginError("Enter a valid email.");
    if (regPass.length < 6)                 return setLoginError("Password must be 6+ characters.");
    if (regPass !== regConfirm)             return setLoginError("Passwords do not match.");
    if (loginRole === "patient" && !regAge) return setLoginError("Age is required.");
    if (loginRole === "doctor"  && !regSpec)return setLoginError("Specialization is required.");
    if (patients.find(p => p.email === regEmail)) return setLoginError("Email already in use.");
    if (loginRole === "patient") {
      setPatients(prev => [...prev, {
        id: "P" + Date.now(), name: regName, age: parseInt(regAge),
        email: regEmail, gender: regGender, phone: regPhone, _pwd: regPass, reports: [],
      }]);
    } else {
      window._regDocs = window._regDocs || [];
      window._regDocs.push({ name: regName, email: regEmail, _pwd: regPass, spec: regSpec });
    }
    setLoginSuccess("Account created! You can now sign in.");
    setTimeout(() => switchMode("signin"), 2000);
  };

  const logout = () => { setScreen("login"); setCurrentUser(null); resetAuth(); };

  // ── Render MainPortal after login ────────────────────────
  if (screen !== "login") {
    return (
      <MainPortal
        screen={screen}
        currentUser={currentUser}
        patients={patients}
        setPatients={setPatients}
        logout={logout}
      />
    );
  }

  // ── Auth Screen ──────────────────────────────────────────
  const isReg = authMode === "register";
  const str   = passStrength(isReg ? regPass : "");

  return (
    <div className="auth-wrap">
      <div className="auth-glow-1" />
      <div className="auth-glow-2" />
      <div className={`auth-card${isReg ? " wide" : ""}`}>

        <div className="auth-logo">
          <div className="auth-logo-icon">👁️</div>
          <div className="auth-logo-title">RetinaAI Portal</div>
          <div className="auth-logo-sub">Intelligent Retinal Analysis System</div>
        </div>

        <div className="auth-mode-toggle">
          <button className={`auth-mode-btn${!isReg ? " active" : ""}`} onClick={() => switchMode("signin")}>Sign In</button>
          <button className={`auth-mode-btn${isReg  ? " active" : ""}`} onClick={() => switchMode("register")}>Create Account</button>
        </div>

        <div className="auth-role-toggle">
          <button className={`auth-role-btn${loginRole === "patient" ? " active" : ""}`} onClick={() => switchRole("patient")}>🧑 Patient</button>
          <button className={`auth-role-btn${loginRole === "doctor"  ? " active" : ""}`} onClick={() => switchRole("doctor")}>👨‍⚕️ Doctor</button>
        </div>

        {loginError   && <div className="alert-error">⚠ {loginError}</div>}
        {loginSuccess && <div className="alert-success">✓ {loginSuccess}</div>}

        {!isReg && (
          <div className="auth-form">
            <div className="form-field">
              <input className="form-input" type="email" placeholder="Email address"
                value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            <div className="form-field pass-wrap">
              <input className="form-input" type={showPass ? "text" : "password"} placeholder="Password"
                value={loginPass} onChange={e => setLoginPass(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()} />
              <button className="pass-eye" onClick={() => setShowPass(p => !p)}>{showPass ? "🙈" : "👁"}</button>
            </div>
            <button className="btn-primary" onClick={handleLogin}>
              Sign In as {loginRole === "patient" ? "Patient" : "Doctor"} →
            </button>
            <div className="auth-hint">
              {loginRole === "patient" ? "Demo: sarah@email.com / patient123" : "Demo: dr.vasquez@clinic.com / doctor123"}
            </div>
            <div className="auth-switch">
              Don't have an account?{" "}
              <button className="link-btn" onClick={() => switchMode("register")}>Create one</button>
            </div>
          </div>
        )}

        {isReg && (
          <div className="auth-form">
            <div className="form-field">
              <input className="form-input" type="text" placeholder="Full name *" value={regName} onChange={e => setRegName(e.target.value)} />
            </div>
            <div className="form-row">
              <input className="form-input" type="email" placeholder="Email *"  value={regEmail} onChange={e => setRegEmail(e.target.value)} />
              <input className="form-input" type="tel"   placeholder="Phone"    value={regPhone} onChange={e => setRegPhone(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="pass-wrap">
                <input className="form-input" type={showPass ? "text" : "password"} placeholder="Password * (min 6)" value={regPass} onChange={e => setRegPass(e.target.value)} />
                <button className="pass-eye" onClick={() => setShowPass(p => !p)}>{showPass ? "🙈" : "👁"}</button>
              </div>
              <input className="form-input" type={showPass ? "text" : "password"} placeholder="Confirm password *" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} />
            </div>

            {str && (
              <div className="strength-wrap">
                <div className="strength-track">
                  <div className="strength-fill" style={{ width: str.w, background: str.color }} />
                </div>
                <div className="strength-label" style={{ color: str.color }}>{str.label} password</div>
              </div>
            )}

            {loginRole === "patient" && (
              <div className="form-row mt-12">
                <input className="form-input" type="number" placeholder="Age *" value={regAge} onChange={e => setRegAge(e.target.value)} />
                <select className="form-input" value={regGender} onChange={e => setRegGender(e.target.value)}>
                  <option value="">Gender (optional)</option>
                  <option>male</option><option>female</option><option>other</option>
                </select>
              </div>
            )}

            {loginRole === "doctor" && (
              <>
                <div className="form-field mt-12">
                  <input className="form-input" type="text" placeholder="Specialization *" value={regSpec} onChange={e => setRegSpec(e.target.value)} />
                </div>
                <div className="form-row">
                  <input className="form-input" type="text" placeholder="License No."       value={regLic}  onChange={e => setRegLic(e.target.value)} />
                  <input className="form-input" type="text" placeholder="Hospital / Clinic" value={regHosp} onChange={e => setRegHosp(e.target.value)} />
                </div>
              </>
            )}

            <button className="btn-primary mt-8" onClick={handleRegister}>
              Create {loginRole === "patient" ? "Patient" : "Doctor"} Account →
            </button>
            <div className="auth-switch">
              Already have an account?{" "}
              <button className="link-btn" onClick={() => switchMode("signin")}>Sign in</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}