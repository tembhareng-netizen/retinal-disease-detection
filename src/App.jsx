import { useState, useRef, useEffect } from "react";

const DEMO_PATIENTS = [
  {
    id: "P001", name: "Sarah Mitchell", age: 34, email: "sarah@email.com",
    reports: [
      { id: "R001", date: "2026-02-15", image: null, diagnosis: "Diabetic Retinopathy - Stage 2", confidence: 87, risk: "Moderate", findings: "Microaneurysms detected in superior temporal quadrant. Mild hard exudates present. No neovascularization observed.", doctorNote: "Recommend follow-up in 3 months. Continue current medication regimen." },
      { id: "R002", date: "2025-11-10", image: null, diagnosis: "Normal Retina", confidence: 96, risk: "Low", findings: "No abnormalities detected. Optic disc appears healthy. Macula and vessels within normal parameters.", doctorNote: "All clear. Next routine scan in 6 months." },
    ]
  },
  {
    id: "P002", name: "James Thornton", age: 52, email: "james@email.com",
    reports: [
      { id: "R003", date: "2026-01-22", image: null, diagnosis: "Glaucoma Suspect", confidence: 78, risk: "High", findings: "Cup-to-disc ratio elevated at 0.7. Suspicious for early glaucomatous changes. Asymmetry noted between eyes.", doctorNote: "Urgent referral to glaucoma specialist. IOP measurement needed." },
    ]
  }
];

const DEMO_DOCTOR = { id: "D001", name: "Dr. Elena Vasquez", specialization: "Ophthalmologist", email: "dr.vasquez@clinic.com" };

const RISK_COLORS = { Low: "#00d4aa", Moderate: "#f5a623", High: "#e84040" };
const RISK_BG = { Low: "rgba(0,212,170,0.15)", Moderate: "rgba(245,166,35,0.15)", High: "rgba(232,64,64,0.15)" };

export default function App() {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { width: 100%; height: 100%; overflow-x: hidden; background: #030b1a; }
      #root { width: 100%; min-height: 100vh; display: flex; flex-direction: column; }
      body { font-family: 'DM Sans', sans-serif; }
    `;
    style.id = "retina-global-reset";
    if (!document.getElementById("retina-global-reset")) document.head.appendChild(style);
    return () => { const el = document.getElementById("retina-global-reset"); if (el) el.remove(); };
  }, []);

  const [screen, setScreen] = useState("login");
  const [role, setRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [patients, setPatients] = useState(DEMO_PATIENTS);
  const [loginRole, setLoginRole] = useState("patient");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");
  // Auth mode: "signin" | "register"
  const [authMode, setAuthMode] = useState("signin");
  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regAge, setRegAge] = useState("");
  const [regGender, setRegGender] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regSpecialization, setRegSpecialization] = useState("");
  const [regLicense, setRegLicense] = useState("");
  const [regHospital, setRegHospital] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [patientTab, setPatientTab] = useState("upload");
  const [doctorTab, setDoctorTab] = useState("patients");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  const [messages, setMessages] = useState({});
  const fileRef = useRef();

  const resetAuthFields = () => {
    setLoginEmail(""); setLoginPass(""); setLoginError(""); setLoginSuccess("");
    setRegName(""); setRegEmail(""); setRegPass(""); setRegConfirm("");
    setRegAge(""); setRegGender(""); setRegPhone("");
    setRegSpecialization(""); setRegLicense(""); setRegHospital("");
    setShowPass(false);
  };

  const switchMode = (mode) => { resetAuthFields(); setAuthMode(mode); };
  const switchRole = (r) => { resetAuthFields(); setLoginRole(r); };

  const handleLogin = () => {
    setLoginError("");
    if (loginRole === "patient") {
      const found = patients.find(p => p.email === loginEmail);
      const validPass = found && (found._pwd ? loginPass === found._pwd : loginPass === "patient123");
      if (found && validPass) {
        setCurrentUser(found); setRole("patient"); setScreen("patient");
      } else {
        setLoginError("Invalid credentials.");
      }
    } else {
      // Check demo doctor or registered doctors
      const regDoctors = window._registeredDoctors || [];
      const regDoc = regDoctors.find(d => d.email === loginEmail && d._pwd === loginPass);
      if (loginEmail === DEMO_DOCTOR.email && loginPass === "doctor123") {
        setCurrentUser(DEMO_DOCTOR); setRole("doctor"); setScreen("doctor");
      } else if (regDoc) {
        setCurrentUser({ id: "D" + Date.now(), name: regDoc.name, specialization: regDoc.specialization, email: regDoc.email });
        setRole("doctor"); setScreen("doctor");
      } else {
        setLoginError("Invalid credentials. Try dr.vasquez@clinic.com / doctor123");
      }
    }
  };

  const handleRegister = () => {
    setLoginError(""); setLoginSuccess("");
    if (!regName.trim()) return setLoginError("Full name is required.");
    if (!regEmail.trim() || !/^\S+@\S+\.\S+$/.test(regEmail)) return setLoginError("Enter a valid email address.");
    if (regPass.length < 6) return setLoginError("Password must be at least 6 characters.");
    if (regPass !== regConfirm) return setLoginError("Passwords do not match.");
    if (loginRole === "patient" && !regAge) return setLoginError("Age is required.");
    if (loginRole === "doctor" && !regSpecialization.trim()) return setLoginError("Specialization is required.");
    const existing = patients.find(p => p.email === regEmail);
    if (existing) return setLoginError("An account with this email already exists.");
    if (loginRole === "patient") {
      const newPatient = {
        id: "P" + Date.now(), name: regName, age: parseInt(regAge), email: regEmail,
        gender: regGender, phone: regPhone, _pwd: regPass, reports: []
      };
      setPatients(prev => [...prev, newPatient]);
    } else {
      // Store doctor credentials for demo
      window._registeredDoctors = window._registeredDoctors || [];
      window._registeredDoctors.push({ name: regName, email: regEmail, _pwd: regPass, specialization: regSpecialization });
    }
    setLoginSuccess("Account created successfully! You can now sign in into your account.");
    setTimeout(() => { switchMode("signin"); }, 2000);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedImage(ev.target.result);
    reader.readAsDataURL(file);
    setAnalysisResult(null);
  };

  const runAnalysis = () => {
    if (!uploadedImage) return;
    setAnalyzing(true);
    setTimeout(() => {
      const results = [
        { diagnosis: "Diabetic Retinopathy - Stage 1", confidence: 82, risk: "Moderate", findings: "Early microaneurysms detected. Mild vascular changes in peripheral retina. No significant exudates present." },
        { diagnosis: "Normal Retina", confidence: 94, risk: "Low", findings: "Retinal examination within normal limits. Healthy optic nerve. No lesions or abnormalities detected." },
        { diagnosis: "Age-Related Macular Degeneration", confidence: 71, risk: "High", findings: "Drusen deposits visible near macula. Geographic atrophy suspected. Immediate specialist consultation advised." },
      ];
      const r = results[Math.floor(Math.random() * results.length)];
      const newReport = {
        id: "R" + Date.now(),
        date: new Date().toISOString().split("T")[0],
        image: uploadedImage,
        ...r,
        doctorNote: null
      };
      setAnalysisResult(newReport);
      setPatients(prev => prev.map(p =>
        p.id === currentUser.id ? { ...p, reports: [newReport, ...p.reports] } : p
      ));
      setCurrentUser(prev => ({ ...prev, reports: [newReport, ...prev.reports] }));
      setAnalyzing(false);
    }, 3000);
  };

  const sendMessage = (patientId) => {
    if (!messageText.trim()) return;
    setMessages(prev => ({
      ...prev,
      [patientId]: [...(prev[patientId] || []), {
        from: "doctor", text: messageText, time: new Date().toLocaleTimeString()
      }]
    }));
    setMessageText("");
    setMessageSent(true);
    setTimeout(() => setMessageSent(false), 3000);
  };

  const logout = () => {
    setScreen("login"); setRole(null); setCurrentUser(null);
    setUploadedImage(null); setAnalysisResult(null);
    setLoginEmail(""); setLoginPass(""); setLoginError(""); setLoginSuccess("");
    setAuthMode("signin"); setShowPass(false);
    setPatientTab("upload"); setDoctorTab("patients");
    setSelectedPatient(null);
  };

  // STYLES
  const S = {
    app: { minHeight: "100vh", background: "#030b1a", fontFamily: "'DM Sans', sans-serif", color: "#e8eef8" },
    loginWrap: { width: "100%", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse at 30% 50%, #0a1f3d 0%, #030b1a 70%)", position: "relative", overflow: "hidden" },
    loginCard: { background: "rgba(10,24,50,0.9)", border: "1px solid rgba(0,180,255,0.2)", borderRadius: 20, padding: "48px 44px", width: 420, backdropFilter: "blur(20px)", boxShadow: "0 0 80px rgba(0,120,255,0.15), 0 24px 48px rgba(0,0,0,0.6)", position: "relative", zIndex: 2 },
    logo: { textAlign: "center", marginBottom: 32 },
    logoTitle: { fontSize: 26, fontWeight: 800, background: "linear-gradient(135deg, #00b4ff, #00d4aa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: -0.5 },
    logoSub: { fontSize: 12, color: "#4a6fa5", letterSpacing: 3, textTransform: "uppercase", marginTop: 4 },
    roleToggle: { display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 4, marginBottom: 28, gap: 4 },
    roleBtn: (active) => ({ flex: 1, padding: "10px 0", border: "none", borderRadius: 9, fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.3s", background: active ? "linear-gradient(135deg, #0066cc, #00a3cc)" : "transparent", color: active ? "#fff" : "#4a6fa5", boxShadow: active ? "0 4px 12px rgba(0,120,255,0.3)" : "none" }),
    input: { width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(0,180,255,0.15)", borderRadius: 10, padding: "13px 16px", color: "#e8eef8", fontSize: 14, marginBottom: 14, outline: "none", boxSizing: "border-box", transition: "border 0.2s" },
    loginBtn: { width: "100%", padding: "14px", background: "linear-gradient(135deg, #0066cc, #00c4aa)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", marginTop: 8, boxShadow: "0 8px 24px rgba(0,120,200,0.4)", transition: "transform 0.15s, box-shadow 0.15s" },
    error: { background: "rgba(232,64,64,0.15)", border: "1px solid rgba(232,64,64,0.4)", borderRadius: 8, padding: "10px 14px", color: "#ff6b6b", fontSize: 13, marginBottom: 14 },
    hint: { color: "#3a5a8a", fontSize: 12, textAlign: "center", marginTop: 16 },
    // Dashboard common
    dash: { width: "100%", minHeight: "100vh", background: "#030b1a", display: "flex", flexDirection: "column" },
    header: { width: "100%", background: "rgba(5,15,35,0.95)", borderBottom: "1px solid rgba(0,180,255,0.12)", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 100 },
    headerLeft: { display: "flex", alignItems: "center", gap: 12 },
    pulse: { width: 10, height: 10, borderRadius: "50%", background: "#00d4aa", boxShadow: "0 0 10px #00d4aa", animation: "pulse 2s infinite" },
    headerTitle: { fontSize: 18, fontWeight: 700, background: "linear-gradient(135deg, #00b4ff, #00d4aa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    userChip: { display: "flex", alignItems: "center", gap: 10, background: "rgba(0,180,255,0.08)", border: "1px solid rgba(0,180,255,0.2)", borderRadius: 30, padding: "6px 14px 6px 6px" },
    avatar: (color) => ({ width: 32, height: 32, borderRadius: "50%", background: color || "linear-gradient(135deg, #0066cc, #00c4aa)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#fff" }),
    logoutBtn: { background: "rgba(232,64,64,0.15)", border: "1px solid rgba(232,64,64,0.3)", borderRadius: 8, padding: "6px 14px", color: "#ff6b6b", cursor: "pointer", fontSize: 13, fontWeight: 600 },
    content: { padding: 32, maxWidth: 1400, width: "100%", margin: "0 auto", flex: 1 },
    // Tabs
    tabs: { display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 5, marginBottom: 32, width: "fit-content" },
    tab: (active) => ({ padding: "10px 22px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, transition: "all 0.25s", background: active ? "linear-gradient(135deg, #0055bb, #007aaa)" : "transparent", color: active ? "#fff" : "#4a6fa5", boxShadow: active ? "0 4px 16px rgba(0,100,220,0.35)" : "none" }),
    // Cards
    card: { background: "rgba(8,20,46,0.8)", border: "1px solid rgba(0,180,255,0.12)", borderRadius: 16, padding: 28, marginBottom: 24 },
    cardTitle: { fontSize: 17, fontWeight: 700, color: "#c8deff", marginBottom: 18 },
    // Upload area
    uploadArea: (dragging) => ({ border: `2px dashed ${dragging ? "#00b4ff" : "rgba(0,180,255,0.25)"}`, borderRadius: 16, padding: "48px 32px", textAlign: "center", cursor: "pointer", transition: "all 0.3s", background: dragging ? "rgba(0,120,255,0.08)" : "rgba(0,60,120,0.15)" }),
    uploadIcon: { fontSize: 48, marginBottom: 12 },
    uploadText: { color: "#4a8ac4", fontSize: 15, fontWeight: 500 },
    // Result badge
    badge: (risk) => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: RISK_BG[risk] || "rgba(255,255,255,0.1)", border: `1px solid ${RISK_COLORS[risk] || "#fff"}40`, color: RISK_COLORS[risk] || "#fff", fontSize: 13, fontWeight: 700 }),
    // Stats row
    statRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 },
    statCard: (color) => ({ background: `linear-gradient(135deg, rgba(${color},0.15), rgba(${color},0.05))`, border: `1px solid rgba(${color},0.25)`, borderRadius: 14, padding: "20px 22px" }),
    statVal: { fontSize: 32, fontWeight: 800, color: "#fff" },
    statLbl: { fontSize: 13, color: "#4a6fa5", marginTop: 4 },
    // Report row
    reportRow: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,180,255,0.08)", borderRadius: 12, padding: "18px 22px", marginBottom: 12, cursor: "pointer", transition: "all 0.2s" },
    // Patient list row  
    patientRow: (sel) => ({ background: sel ? "rgba(0,120,255,0.12)" : "rgba(255,255,255,0.03)", border: sel ? "1px solid rgba(0,180,255,0.3)" : "1px solid rgba(0,180,255,0.08)", borderRadius: 12, padding: "16px 20px", marginBottom: 10, cursor: "pointer", transition: "all 0.2s" }),
    // Scan result panel
    resultPanel: { background: "linear-gradient(135deg, rgba(0,40,100,0.6), rgba(0,60,80,0.4))", border: "1px solid rgba(0,220,180,0.2)", borderRadius: 16, padding: 28 },
    confidenceBar: (pct) => ({ height: 8, borderRadius: 4, background: `linear-gradient(90deg, #00b4ff ${pct}%, rgba(255,255,255,0.06) ${pct}%)` }),
    // Retinal image display
    retinalFrame: { width: "100%", maxWidth: 300, aspectRatio: "1", borderRadius: "50%", overflow: "hidden", border: "4px solid rgba(0,180,255,0.3)", boxShadow: "0 0 40px rgba(0,120,255,0.3)", margin: "0 auto", display: "block" },
    // Message box
    msgBox: { background: "rgba(5,15,35,0.8)", border: "1px solid rgba(0,180,255,0.15)", borderRadius: 12, padding: 20 },
    msgInput: { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,180,255,0.2)", borderRadius: 10, padding: "12px 16px", color: "#e8eef8", fontSize: 14, resize: "vertical", minHeight: 80, boxSizing: "border-box", outline: "none", fontFamily: "inherit" },
    sendBtn: { background: "linear-gradient(135deg, #0066cc, #00a3cc)", border: "none", borderRadius: 10, padding: "11px 24px", color: "#fff", fontWeight: 700, cursor: "pointer", marginTop: 10 },
    msgBubble: { background: "rgba(0,80,180,0.2)", border: "1px solid rgba(0,180,255,0.15)", borderRadius: 12, padding: "12px 16px", marginBottom: 10 },
    divider: { height: 1, background: "rgba(0,180,255,0.1)", margin: "24px 0" },
    sectionLabel: { fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#3a5a8a", fontWeight: 700, marginBottom: 12 },
    noData: { textAlign: "center", color: "#2a4a7a", padding: "40px 0", fontSize: 15 },
    glow: { position: "absolute", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" },
  };

  // ======= AUTH SCREEN =======
  if (screen === "login") {
    const isRegister = authMode === "register";
    const inputRow = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
    const selStyle = { ...S.input, marginBottom: 0, appearance: "none", WebkitAppearance: "none", background: "rgba(255,255,255,0.06)", cursor: "pointer" };

    return (
      <div style={S.loginWrap}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { width: 100% !important; height: 100% !important; background: #030b1a !important; overflow-x: hidden; }
          #root { width: 100% !important; min-height: 100vh !important; display: flex !important; flex-direction: column !important; }
          @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
          @keyframes floatIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
          @keyframes fadeSlide { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
          .login-card { animation: floatIn 0.5s ease; }
          .auth-form { animation: fadeSlide 0.35s ease; }
          input:focus, select:focus { border-color: rgba(0,180,255,0.5) !important; box-shadow: 0 0 0 3px rgba(0,120,255,0.15) !important; }
          .login-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,120,200,0.5) !important; }
          .grid-bg { position:absolute; inset:0; background-image: linear-gradient(rgba(0,120,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,120,255,0.04) 1px, transparent 1px); background-size:50px 50px; }
          .mode-tab { transition: all 0.25s; }
          .mode-tab:hover { color: #7ab4df !important; }
          select option { background: #0a1830; color: #e8eef8; }
          .pass-wrap { position: relative; margin-bottom: 14px; }
          .pass-wrap input { margin-bottom: 0 !important; padding-right: 44px !important; }
          .pass-eye { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:none; border:none; color:#4a6fa5; cursor:pointer; font-size:16px; padding:0; }
          .pass-eye:hover { color: #7ab4df; }
          .field-group { margin-bottom: 14px; }
          .strength-bar { height:3px; border-radius:2px; margin-top:6px; transition: all 0.3s; }
          .link-btn { background: none; border: none; color: #00b4ff; cursor: pointer; font-size: 14px; font-weight: 600; padding: 0; text-decoration: underline; text-underline-offset: 2px; }
          .link-btn:hover { color: #00d4aa; }
        `}</style>
        <div className="grid-bg" />
        <div style={{ ...S.glow, width: 500, height: 500, background: "rgba(0,80,200,0.12)", top: "-20%", left: "10%" }} />
        <div style={{ ...S.glow, width: 400, height: 400, background: "rgba(0,180,150,0.08)", bottom: "-10%", right: "15%" }} />

        <div style={{ ...S.loginCard, width: isRegister ? 500 : 420, transition: "width 0.3s ease" }} className="login-card">

          {/* Logo */}
          <div style={{ ...S.logo, marginBottom: 24 }}>
            <div style={{ fontSize: 38, marginBottom: 6 }}>👁️</div>
            <div style={S.logoTitle}>Retinal  Portal</div>
            <div style={S.logoSub}>Intelligent Retinal Analysis System</div>
          </div>

          {/* Mode toggle: Sign In / Register */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 4, marginBottom: 24, border: "1px solid rgba(0,180,255,0.1)" }}>
            <button className="mode-tab" style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.25s", background: !isRegister ? "linear-gradient(135deg, #0055bb, #007aaa)" : "transparent", color: !isRegister ? "#fff" : "#3a5a8a", boxShadow: !isRegister ? "0 4px 14px rgba(0,100,220,0.35)" : "none" }} onClick={() => switchMode("signin")}>
              Sign In
            </button>
            <button className="mode-tab" style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.25s", background: isRegister ? "linear-gradient(135deg, #0055bb, #007aaa)" : "transparent", color: isRegister ? "#fff" : "#3a5a8a", boxShadow: isRegister ? "0 4px 14px rgba(0,100,220,0.35)" : "none" }} onClick={() => switchMode("register")}>
              Create Account
            </button>
          </div>

          {/* Role selector */}
          <div style={{ ...S.roleToggle, marginBottom: 20 }}>
            <button style={S.roleBtn(loginRole === "patient")} onClick={() => switchRole("patient")}>🧑 Patient</button>
            <button style={S.roleBtn(loginRole === "doctor")} onClick={() => switchRole("doctor")}>👨‍⚕️ Doctor</button>
          </div>

          {/* Alerts */}
          {loginError && <div style={S.error}>⚠ {loginError}</div>}
          {loginSuccess && <div style={{ background: "rgba(0,212,130,0.12)", border: "1px solid rgba(0,212,130,0.35)", borderRadius: 8, padding: "10px 14px", color: "#00e09a", fontSize: 13, marginBottom: 14 }}>✓ {loginSuccess}</div>}

          {/* ── SIGN IN FORM ── */}
          {!isRegister && (
            <div className="auth-form">
              <input style={S.input} type="email" placeholder="Email address" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
              <div className="pass-wrap">
                <input style={{ ...S.input }} type={showPass ? "text" : "password"} placeholder="Password" value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
                <button className="pass-eye" onClick={() => setShowPass(p => !p)}>{showPass ? "🙈" : "👁"}</button>
              </div>
              <button style={S.loginBtn} className="login-btn" onClick={handleLogin}>
                Sign In as {loginRole === "patient" ? "Patient" : "Doctor"} →
              </button>
              <div style={S.hint}>
                {loginRole === "patient" ? "Demo: sarah@email.com / patient123" : "Demo: dr.vasquez@clinic.com / doctor123"}
              </div>
              <div style={{ textAlign: "center", marginTop: 18, fontSize: 14, color: "#3a5a8a" }}>
                Don't have an account?{" "}
                <button className="link-btn" onClick={() => switchMode("register")}>Create one</button>
              </div>
            </div>
          )}

          {/* ── REGISTER FORM ── */}
          {isRegister && (
            <div className="auth-form">

              {/* Name */}
              <div className="field-group">
                <input style={{ ...S.input, marginBottom: 0 }} type="text" placeholder="Full name *" value={regName} onChange={e => setRegName(e.target.value)} />
              </div>

              {/* Email + Phone */}
              <div style={{ ...inputRow, marginBottom: 14 }}>
                <input style={{ ...S.input, marginBottom: 0 }} type="email" placeholder="Email address *" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                <input style={{ ...S.input, marginBottom: 0 }} type="tel" placeholder="Phone number" value={regPhone} onChange={e => setRegPhone(e.target.value)} />
              </div>

              {/* Password + Confirm */}
              <div style={{ ...inputRow, marginBottom: 0 }}>
                <div className="pass-wrap" style={{ marginBottom: 0 }}>
                  <input style={{ ...S.input, marginBottom: 0 }} type={showPass ? "text" : "password"} placeholder="Password * (min 6)" value={regPass} onChange={e => setRegPass(e.target.value)} />
                  <button className="pass-eye" onClick={() => setShowPass(p => !p)}>{showPass ? "🙈" : "👁"}</button>
                </div>
                <input style={{ ...S.input, marginBottom: 0 }} type={showPass ? "text" : "password"} placeholder="Confirm password *" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} />
              </div>

              {/* Password strength */}
              {regPass.length > 0 && (
                <div style={{ marginBottom: 14, marginTop: 6 }}>
                  <div className="strength-bar" style={{ width: "100%", background: "rgba(255,255,255,0.06)" }}>
                    <div className="strength-bar" style={{ width: regPass.length < 6 ? "25%" : regPass.length < 10 ? "60%" : "100%", background: regPass.length < 6 ? "#e84040" : regPass.length < 10 ? "#f5a623" : "#00d4aa", marginTop: 0 }} />
                  </div>
                  <div style={{ fontSize: 11, color: regPass.length < 6 ? "#e84040" : regPass.length < 10 ? "#f5a623" : "#00d4aa", marginTop: 4 }}>
                    {regPass.length < 6 ? "Weak" : regPass.length < 10 ? "Moderate" : "Strong"} password
                  </div>
                </div>
              )}

              {/* Patient-specific fields */}
              {loginRole === "patient" && (
                <div style={{ ...inputRow, marginBottom: 14 }}>
                  <input style={{ ...S.input, marginBottom: 0 }} type="number" placeholder="Age *" min="1" max="120" value={regAge} onChange={e => setRegAge(e.target.value)} />
                  <select style={selStyle} value={regGender} onChange={e => setRegGender(e.target.value)}>
                    <option value="">Gender (optional)</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

              {/* Doctor-specific fields */}
              {loginRole === "doctor" && (
                <>
                  <div className="field-group">
                    <input style={{ ...S.input, marginBottom: 0 }} type="text" placeholder="Specialization * (e.g. Ophthalmologist)" value={regSpecialization} onChange={e => setRegSpecialization(e.target.value)} />
                  </div>
                  <div style={{ ...inputRow, marginBottom: 14 }}>
                    <input style={{ ...S.input, marginBottom: 0 }} type="text" placeholder="License number" value={regLicense} onChange={e => setRegLicense(e.target.value)} />
                    <input style={{ ...S.input, marginBottom: 0 }} type="text" placeholder="Hospital / Clinic" value={regHospital} onChange={e => setRegHospital(e.target.value)} />
                  </div>
                </>
              )}

              <button style={{ ...S.loginBtn, marginTop: 6 }} className="login-btn" onClick={handleRegister}>
                Create {loginRole === "patient" ? "Patient" : "Doctor"} Account →
              </button>

              <div style={{ textAlign: "center", marginTop: 18, fontSize: 14, color: "#3a5a8a" }}>
                Already have an account?{" "}
                <button className="link-btn" onClick={() => switchMode("signin")}>Sign in</button>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ======= PATIENT DASHBOARD =======
  if (screen === "patient") {
    const updatedPatient = patients.find(p => p.id === currentUser.id) || currentUser;

    return (
      <div style={S.dash}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { width: 100% !important; height: 100% !important; background: #030b1a !important; overflow-x: hidden; }
          #root { width: 100% !important; min-height: 100vh !important; }
          @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
          @keyframes spin { to{transform:rotate(360deg)} }
          @keyframes slideIn { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
          .fade-up { animation: fadeUp 0.4s ease; }
          .report-row:hover { background: rgba(0,120,255,0.08) !important; border-color: rgba(0,180,255,0.2) !important; }
          .upload-area:hover { border-color: rgba(0,180,255,0.5) !important; background: rgba(0,80,200,0.1) !important; }
        `}</style>
        <div style={S.header}>
          <div style={S.headerLeft}>
            <div style={S.pulse} />
            <span style={S.headerTitle}>RetinaAI Portal</span>
            <span style={{ fontSize: 12, color: "#2a5a8a", background: "rgba(0,100,200,0.15)", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>Patient</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={S.userChip}>
              <div style={S.avatar("linear-gradient(135deg, #0066cc, #00c4aa)")}>{updatedPatient.name[0]}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#c8deff" }}>{updatedPatient.name}</div>
                <div style={{ fontSize: 11, color: "#3a5a8a" }}>ID: {updatedPatient.id}</div>
              </div>
            </div>
            <button style={S.logoutBtn} onClick={logout}>Sign Out</button>
          </div>
        </div>

        <div style={S.content}>
          <div style={S.statRow}>
            <div style={S.statCard("0,120,255")}>
              <div style={S.statVal}>{updatedPatient.reports.length}</div>
              <div style={S.statLbl}>Total Scans</div>
            </div>
            <div style={S.statCard("0,212,170")}>
              <div style={S.statVal}>{updatedPatient.reports.filter(r => r.risk === "Low").length}</div>
              <div style={S.statLbl}>Normal Results</div>
            </div>
            <div style={S.statCard("245,166,35")}>
              <div style={S.statVal}>{updatedPatient.reports.filter(r => r.risk !== "Low").length}</div>
              <div style={S.statLbl}>Flagged Results</div>
            </div>
          </div>

          <div style={S.tabs}>
            {[["upload", "🔬 Upload & Analyze"], ["results", "📋 View Results"], ["history", "🗂️ History"]].map(([key, label]) => (
              <button key={key} style={S.tab(patientTab === key)} onClick={() => setPatientTab(key)}>{label}</button>
            ))}
          </div>

          {/* UPLOAD TAB */}
          {patientTab === "upload" && (
            <div className="fade-up">
              <div style={S.card}>
                <div style={S.cardTitle}>Upload Retinal Image</div>
                <div style={S.uploadArea(false)} className="upload-area" onClick={() => fileRef.current.click()}>
                  <div style={S.uploadIcon}>🔍</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#7ab4df", marginBottom: 8 }}>
                    {uploadedImage ? "Image Selected ✓" : "Click to Upload Retinal Image"}
                  </div>
                  <div style={S.uploadText}>{uploadedImage ? "Ready for AI analysis" : "Supports JPG, PNG, DICOM formats"}</div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
                </div>

                {uploadedImage && (
                  <div style={{ marginTop: 24, textAlign: "center" }}>
                    <img src={uploadedImage} style={S.retinalFrame} alt="Uploaded retinal scan" />
                    <div style={{ marginTop: 20 }}>
                      <button
                        style={{ ...S.loginBtn, width: "auto", padding: "13px 40px", opacity: analyzing ? 0.7 : 1 }}
                        onClick={runAnalysis}
                        disabled={analyzing}
                      >
                        {analyzing ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                            <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                            Analyzing with AI...
                          </span>
                        ) : "🧠 Run AI Analysis"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {analysisResult && (
                <div style={S.resultPanel} className="fade-up">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div>
                      <div style={S.sectionLabel}>AI Analysis Complete</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{analysisResult.diagnosis}</div>
                      <div style={S.badge(analysisResult.risk)}>● {analysisResult.risk} Risk</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={S.sectionLabel}>Confidence</div>
                      <div style={{ fontSize: 36, fontWeight: 800, color: "#00d4aa" }}>{analysisResult.confidence}%</div>
                    </div>
                  </div>
                  <div style={S.confidenceBar(analysisResult.confidence)} />
                  <div style={S.divider} />
                  <div style={S.sectionLabel}>Findings</div>
                  <div style={{ color: "#8ab4d4", lineHeight: 1.7 }}>{analysisResult.findings}</div>
                  {analysisResult.doctorNote && (
                    <>
                      <div style={S.divider} />
                      <div style={S.sectionLabel}>Doctor's Note</div>
                      <div style={{ color: "#7adccc", lineHeight: 1.7, fontStyle: "italic" }}>"{analysisResult.doctorNote}"</div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* RESULTS TAB */}
          {patientTab === "results" && (
            <div className="fade-up">
              {updatedPatient.reports.length === 0 ? (
                <div style={{ ...S.card, ...S.noData }}>No analysis results yet. Upload an image to get started.</div>
              ) : (
                updatedPatient.reports.slice(0, 1).map(r => (
                  <div key={r.id}>
                    <div style={S.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                        <div>
                          <div style={S.sectionLabel}>Latest Analysis — {r.date}</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{r.diagnosis}</div>
                        </div>
                        <div style={S.badge(r.risk)}>● {r.risk} Risk</div>
                      </div>
                      {r.image && <img src={r.image} style={S.retinalFrame} alt="Retinal scan" />}
                      <div style={{ marginTop: 24 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ color: "#4a6fa5", fontSize: 13 }}>AI Confidence Score</span>
                          <span style={{ color: "#00d4aa", fontWeight: 700 }}>{r.confidence}%</span>
                        </div>
                        <div style={S.confidenceBar(r.confidence)} />
                      </div>
                      <div style={S.divider} />
                      <div style={S.sectionLabel}>Clinical Findings</div>
                      <div style={{ color: "#8ab4d4", lineHeight: 1.7 }}>{r.findings}</div>
                      {r.doctorNote && (
                        <>
                          <div style={S.divider} />
                          <div style={{ background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 12, padding: 18 }}>
                            <div style={S.sectionLabel}>Doctor's Note</div>
                            <div style={{ color: "#7adccc", lineHeight: 1.7, fontStyle: "italic" }}>"{r.doctorNote}"</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {patientTab === "history" && (
            <div className="fade-up">
              <div style={S.card}>
                <div style={S.cardTitle}>All Previous Reports</div>
                {updatedPatient.reports.length === 0 ? (
                  <div style={S.noData}>No previous reports.</div>
                ) : updatedPatient.reports.map((r, i) => (
                  <div key={r.id} style={S.reportRow} className="report-row">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: RISK_BG[r.risk], border: `1px solid ${RISK_COLORS[r.risk]}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                          {r.risk === "Low" ? "✓" : r.risk === "High" ? "⚠" : "~"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#c8deff", marginBottom: 3 }}>{r.diagnosis}</div>
                          <div style={{ fontSize: 12, color: "#3a5a8a" }}>{r.date} · Report #{r.id}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={S.badge(r.risk)}>{r.risk}</div>
                        <div style={{ color: "#00d4aa", fontWeight: 700, fontSize: 14 }}>{r.confidence}%</div>
                      </div>
                    </div>
                    {r.doctorNote && (
                      <div style={{ marginTop: 12, fontSize: 13, color: "#4a8a80", borderTop: "1px solid rgba(0,180,255,0.08)", paddingTop: 10 }}>
                        👨‍⚕️ <em>{r.doctorNote}</em>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ======= DOCTOR DASHBOARD =======
  if (screen === "doctor") {
    const allPatients = patients;
    const selPatient = selectedPatient ? allPatients.find(p => p.id === selectedPatient) : null;

    return (
      <div style={S.dash}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { width: 100% !important; height: 100% !important; background: #030b1a !important; overflow-x: hidden; }
          #root { width: 100% !important; min-height: 100vh !important; }
          @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
          .fade-up { animation: fadeUp 0.4s ease; }
          .patient-row:hover { background: rgba(0,120,255,0.1) !important; }
          .report-row:hover { background: rgba(0,120,255,0.08) !important; }
        `}</style>
        <div style={S.header}>
          <div style={S.headerLeft}>
            <div style={S.pulse} />
            <span style={S.headerTitle}>RetinaAI Portal</span>
            <span style={{ fontSize: 12, color: "#7adccc", background: "rgba(0,200,150,0.12)", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>Doctor</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={S.userChip}>
              <div style={S.avatar("linear-gradient(135deg, #006644, #00a878)")}>{currentUser.name[2]}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#c8deff" }}>{currentUser.name}</div>
                <div style={{ fontSize: 11, color: "#3a5a8a" }}>{currentUser.specialization}</div>
              </div>
            </div>
            <button style={S.logoutBtn} onClick={logout}>Sign Out</button>
          </div>
        </div>

        <div style={S.content}>
          <div style={S.statRow}>
            <div style={S.statCard("0,120,255")}>
              <div style={S.statVal}>{allPatients.length}</div>
              <div style={S.statLbl}>Total Patients</div>
            </div>
            <div style={S.statCard("0,212,170")}>
              <div style={S.statVal}>{allPatients.reduce((a, p) => a + p.reports.length, 0)}</div>
              <div style={S.statLbl}>Total Reports</div>
            </div>
            <div style={S.statCard("232,64,64")}>
              <div style={S.statVal}>{allPatients.reduce((a, p) => a + p.reports.filter(r => r.risk === "High").length, 0)}</div>
              <div style={S.statLbl}>High Risk Cases</div>
            </div>
          </div>

          <div style={S.tabs}>
            {[["patients", "👥 Patient Reports"], ["images", "🔬 Retinal Images"], ["message", "💬 Message Patient"]].map(([key, label]) => (
              <button key={key} style={S.tab(doctorTab === key)} onClick={() => setDoctorTab(key)}>{label}</button>
            ))}
          </div>

          {/* PATIENT REPORTS */}
          {doctorTab === "Patients" && (
            <div className="fade-up" style={{ display: "grid", gridTemplateColumns: selPatient ? "1fr 1.5fr" : "1fr", gap: 24 }}>
              <div>
                <div style={S.card}>
                  <div style={S.cardTitle}>All Patients</div>
                  {allPatients.map(p => (
                    <div key={p.id} style={S.patientRow(selectedPatient === p.id)} className="patient-row"
                      onClick={() => setSelectedPatient(selectedPatient === p.id ? null : p.id)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={S.avatar("linear-gradient(135deg, #0044aa, #0088cc)")}>{p.name[0]}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: "#c8deff" }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: "#3a5a8a" }}>Age {p.age} · {p.reports.length} reports</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                          {p.reports.some(r => r.risk === "High") && <span style={{ ...S.badge("High"), fontSize: 11, padding: "3px 10px" }}>High Risk</span>}
                          {!p.reports.some(r => r.risk === "High") && p.reports.some(r => r.risk === "Moderate") && <span style={{ ...S.badge("Moderate"), fontSize: 11, padding: "3px 10px" }}>Moderate</span>}
                          {p.reports.every(r => r.risk === "Low") && p.reports.length > 0 && <span style={{ ...S.badge("Low"), fontSize: 11, padding: "3px 10px" }}>Clear</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selPatient && (
                <div>
                  <div style={S.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                      <div>
                        <div style={S.cardTitle}>{selPatient.name}</div>
                        <div style={{ fontSize: 13, color: "#3a5a8a" }}>ID: {selPatient.id} · Age {selPatient.age}</div>
                      </div>
                      <div style={{ textAlign: "right", fontSize: 13, color: "#4a6fa5" }}>{selPatient.email}</div>
                    </div>
                    <div style={S.divider} />
                    <div style={S.sectionLabel}>AI Predictions & Reports</div>
                    {selPatient.reports.map(r => (
                      <div key={r.id} style={{ ...S.reportRow, cursor: "default" }} className="report-row">
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                          <div style={{ fontWeight: 600, color: "#c8deff" }}>{r.diagnosis}</div>
                          <div style={S.badge(r.risk)}>{r.risk}</div>
                        </div>
                        <div style={{ fontSize: 12, color: "#3a5a8a", marginBottom: 10 }}>{r.date} · {r.confidence}% confidence</div>
                        <div style={S.confidenceBar(r.confidence)} />
                        <div style={{ marginTop: 12, fontSize: 13, color: "#6a9abf", lineHeight: 1.6 }}>{r.findings}</div>
                        {r.doctorNote && (
                          <div style={{ marginTop: 10, fontSize: 13, color: "#5a9a8a", fontStyle: "italic", borderTop: "1px solid rgba(0,180,255,0.08)", paddingTop: 10 }}>
                            👨‍⚕️ {r.doctorNote}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RETINAL IMAGES */}
          {doctorTab === "images" && (
            <div className="fade-up">
              {allPatients.map(p => {
                const imagesOnly = p.reports.filter(r => r.image);
                if (imagesOnly.length === 0) return null;
                return (
                  <div key={p.id} style={S.card}>
                    <div style={S.cardTitle}>{p.name} — Retinal Scans</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 20 }}>
                      {imagesOnly.map(r => (
                        <div key={r.id} style={{ textAlign: "center" }}>
                          <img src={r.image} style={{ width: 140, height: 140, borderRadius: "50%", border: `3px solid ${RISK_COLORS[r.risk]}60`, boxShadow: `0 0 20px ${RISK_COLORS[r.risk]}30`, objectFit: "cover" }} alt="Retinal" />
                          <div style={{ marginTop: 10, fontSize: 13, color: "#6a9abf" }}>{r.date}</div>
                          <div style={{ marginTop: 4 }}><span style={S.badge(r.risk)}>{r.risk}</span></div>
                          <div style={{ fontSize: 12, color: "#4a6fa5", marginTop: 6 }}>{r.diagnosis}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {allPatients.every(p => p.reports.every(r => !r.image)) && (
                <div style={{ ...S.card, ...S.noData }}>No retinal images uploaded yet.</div>
              )}
            </div>
          )}

          {/* MESSAGE PATIENT */}
          {doctorTab === "message" && (
            <div className="fade-up">
              <div style={S.card}>
                <div style={S.cardTitle}>Message a Patient</div>
                <div style={{ marginBottom: 20 }}>
                  <div style={S.sectionLabel}>Select Patient</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {allPatients.map(p => (
                      <button key={p.id}
                        style={{ ...S.tab(selectedPatient === p.id), padding: "8px 18px" }}
                        onClick={() => { setSelectedPatient(p.id); setMessageSent(false); }}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedPatient && (
                  <div>
                    {(messages[selectedPatient] || []).length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={S.sectionLabel}>Sent Messages</div>
                        {(messages[selectedPatient] || []).map((m, i) => (
                          <div key={i} style={S.msgBubble}>
                            <div style={{ fontSize: 12, color: "#3a5a8a", marginBottom: 4 }}>You · {m.time}</div>
                            <div style={{ color: "#c8deff" }}>{m.text}</div>
                          </div>
                        ))}
                        <div style={S.divider} />
                      </div>
                    )}
                    <div style={S.sectionLabel}>New Message to {allPatients.find(p => p.id === selectedPatient)?.name}</div>
                    <div style={S.msgBox}>
                      <textarea
                        style={S.msgInput}
                        placeholder="Type your message, treatment recommendation, or follow-up instructions..."
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <button style={S.sendBtn} onClick={() => sendMessage(selectedPatient)}>Send Message →</button>
                        {messageSent && <span style={{ color: "#00d4aa", fontSize: 14, fontWeight: 600 }}>✓ Message sent!</span>}
                      </div>
                    </div>
                  </div>
                )}

                {!selectedPatient && (
                  <div style={S.noData}>Select a patient above to send a message.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}