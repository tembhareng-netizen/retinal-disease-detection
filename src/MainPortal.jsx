import { useState, useRef } from "react";

// ─── AI Bank ──────────────────────────────────────────────
const AI_BANK = [
  { diagnosis: "Diabetic Retinopathy", stage: "Stage 1", confidence: 82, risk: "Moderate", findings: "Early microaneurysms detected. Mild vascular changes in peripheral retina. No significant exudates present." },
  { diagnosis: "Normal Retina",        stage: "N/A",     confidence: 94, risk: "Low",      findings: "Retinal examination within normal limits. Healthy optic nerve. No lesions or abnormalities detected." },
  { diagnosis: "Macular Degeneration", stage: "Dry AMD", confidence: 71, risk: "High",     findings: "Drusen deposits visible near macula. Geographic atrophy suspected. Immediate specialist consultation advised." },
  { diagnosis: "Glaucoma",             stage: "Suspect", confidence: 78, risk: "High",     findings: "Cup-to-disc ratio elevated. Asymmetry noted. IOP measurement and visual field testing strongly advised." },
  { diagnosis: "Diabetic Retinopathy", stage: "Stage 2", confidence: 85, risk: "Moderate", findings: "Multiple microaneurysms and hard exudates identified. Moderate non-proliferative changes detected." },
];

const RISK_COLORS = { Low: "#00d4aa", Moderate: "#f5a623", High: "#e84040" };
const RISK_BG     = { Low: "rgba(0,212,170,0.15)", Moderate: "rgba(245,166,35,0.15)", High: "rgba(232,64,64,0.15)" };

// ── Canvas: Laplacian Edge Detection ─────────────────────
function applyLaplacian(imgSrc, cb) {
  const img = new Image(); img.crossOrigin = "anonymous";
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height);
    const src = new Uint8ClampedArray(d.data);
    const kern = [0, -1, 0, -1, 4, -1, 0, -1, 0];
    const out = new Uint8ClampedArray(d.data.length);
    const w = c.width;
    for (let y = 1; y < c.height - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let r = 0, g = 0, b = 0;
        for (let ky = -1; ky <= 1; ky++) for (let kx = -1; kx <= 1; kx++) {
          const i = ((y + ky) * w + (x + kx)) * 4;
          const k = kern[(ky + 1) * 3 + (kx + 1)];
          r += src[i] * k; g += src[i + 1] * k; b += src[i + 2] * k;
        }
        const i = (y * w + x) * 4;
        out[i] = Math.min(255, Math.abs(r));
        out[i + 1] = Math.min(255, Math.abs(g));
        out[i + 2] = Math.min(255, Math.abs(b));
        out[i + 3] = 255;
      }
    }
    d.data.set(out); ctx.putImageData(d, 0, 0); cb(c.toDataURL());
  };
  img.src = imgSrc;
}

// ── Canvas: Grad-CAM Heatmap Simulation ──────────────────
function applyGradCAM(imgSrc, cb) {
  const img = new Image(); img.crossOrigin = "anonymous";
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0);
    const cx = c.width * 0.48, cy = c.height * 0.44;
    const r1 = Math.min(c.width, c.height) * 0.20;
    const r2 = Math.min(c.width, c.height) * 0.40;
    const g1 = ctx.createRadialGradient(cx, cy, r1 * 0.1, cx, cy, r1);
    g1.addColorStop(0, "rgba(255,40,0,0.75)");
    g1.addColorStop(0.5, "rgba(255,140,0,0.45)");
    g1.addColorStop(1, "rgba(255,220,0,0.15)");
    ctx.fillStyle = g1; ctx.fillRect(0, 0, c.width, c.height);
    const g2 = ctx.createRadialGradient(cx * 1.12, cy * 0.88, r2 * 0.05, cx * 1.12, cy * 0.88, r2);
    g2.addColorStop(0, "rgba(255,180,0,0.28)");
    g2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g2; ctx.fillRect(0, 0, c.width, c.height);
    cb(c.toDataURL());
  };
  img.src = imgSrc;
}

// ─── Shared helpers ───────────────────────────────────────
const riskBadge = (risk, sm = false) => ({
  display: "inline-flex", alignItems: "center", gap: sm ? 4 : 6,
  padding: sm ? "3px 10px" : "6px 14px", borderRadius: 20,
  background: RISK_BG[risk] || "rgba(255,255,255,0.1)",
  border: `1px solid ${RISK_COLORS[risk] || "#fff"}40`,
  color: RISK_COLORS[risk] || "#fff",
  fontSize: sm ? 11 : 13, fontWeight: 700,
});
const confColor = (n) => n >= 90 ? "#00d4aa" : n >= 70 ? "#f5a623" : "#e84040";
const confBar   = (pct) => ({
  height: 8, borderRadius: 4,
  background: `linear-gradient(90deg, #00b4ff ${pct}%, rgba(255,255,255,0.06) ${pct}%)`,
});

// ─── Main Portal ──────────────────────────────────────────
export default function MainPortal({ screen, currentUser, patients, setPatients, logout }) {
  // Patient tabs: reports | messages
  const [patientTab,    setPatientTab]    = useState("reports");

  // Doctor tabs: patients | analyze | message
  const [doctorTab,     setDoctorTab]     = useState("patients");
  const [selectedPid,   setSelectedPid]   = useState(null);

  // Doctor analyze state
  const [uploadedImg,   setUploadedImg]   = useState(null);
  const [edgeImg,       setEdgeImg]       = useState(null);
  const [gradcamImg,    setGradcamImg]    = useState(null);
  const [analyzing,     setAnalyzing]     = useState(false);
  const [aiResult,      setAiResult]      = useState(null);
  const [vizTab,        setVizTab]        = useState("original");
  const [doctorNote,    setDoctorNote]    = useState("");
  const [prescription,  setPrescription]  = useState("");
  const [sendingReport, setSendingReport] = useState(false);
  const [reportSent,    setReportSent]    = useState(false);

  // Messaging
  const [msgText,  setMsgText]  = useState("");
  const [msgSent,  setMsgSent]  = useState(false);
  const [messages, setMessages] = useState({});

  const fileRef = useRef();

  // ── Doctor helpers ─────────────────────────────────────
  const handleImageUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setUploadedImg(ev.target.result);
      setEdgeImg(null); setGradcamImg(null); setAiResult(null);
      setReportSent(false); setVizTab("original");
    };
    reader.readAsDataURL(file);
  };

  const runAnalysis = () => {
    if (!uploadedImg || !selectedPid) return;
    setAnalyzing(true); setEdgeImg(null); setGradcamImg(null); setAiResult(null);
    applyLaplacian(uploadedImg, edge => {
      setEdgeImg(edge);
      applyGradCAM(uploadedImg, gcam => {
        setGradcamImg(gcam);
        setTimeout(() => {
          setAiResult(AI_BANK[Math.floor(Math.random() * AI_BANK.length)]);
          setAnalyzing(false); setVizTab("original");
        }, 400);
      });
    });
  };

  const sendReportToPatient = () => {
    if (!aiResult || !selectedPid || !doctorNote.trim()) return;
    setSendingReport(true);
    setTimeout(() => {
      const report = {
        id: "R" + Date.now(),
        date: new Date().toISOString().split("T")[0],
        originalImage: uploadedImg, edgeImage: edgeImg, gradcamImage: gradcamImg,
        diagnosis: aiResult.diagnosis, stage: aiResult.stage,
        confidence: aiResult.confidence, risk: aiResult.risk,
        findings: aiResult.findings, doctorNote, prescription, sentByDoctor: true,
      };
      setPatients(prev => prev.map(p => p.id === selectedPid ? { ...p, reports: [report, ...p.reports] } : p));
      setSendingReport(false); setReportSent(true);
    }, 1200);
  };

  const sendMessage = (pid) => {
    if (!msgText.trim()) return;
    setMessages(prev => ({ ...prev, [pid]: [...(prev[pid] || []), { from: "doctor", text: msgText, time: new Date().toLocaleTimeString() }] }));
    setMsgText(""); setMsgSent(true); setTimeout(() => setMsgSent(false), 3000);
  };

  const resetAnalyze = () => {
    setUploadedImg(null); setEdgeImg(null); setGradcamImg(null);
    setAiResult(null); setReportSent(false); setDoctorNote(""); setPrescription("");
  };

  // ══════════════════════════════════════════════════════════
  //  PATIENT DASHBOARD
  // ══════════════════════════════════════════════════════════
  if (screen === "patient") {
    const user        = patients.find(p => p.id === currentUser.id) || currentUser;
    const sentReports = (user.reports || []).filter(r => r.sentByDoctor);
    const myMsgs      = messages[user.id] || [];

    return (
      <div className="dashboard">
        {/* Header */}
        <header className="dash-header">
          <div className="dash-header-left">
            <div className="status-dot" />
            <span className="dash-logo-text">RetinaAI Portal</span>
            <span className="role-chip patient">Patient</span>
          </div>
          <div className="dash-header-right">
            <div className="user-chip">
              <div className="avatar patient">{user.name[0]}</div>
              <div><div className="user-name">{user.name}</div><div className="user-id">ID: {user.id}</div></div>
            </div>
            <button className="btn-logout" onClick={logout}>Sign Out</button>
          </div>
        </header>

        <main className="dash-content">
          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card blue">  <div className="stat-val">{sentReports.length}</div><div className="stat-lbl">Reports Received</div></div>
            <div className="stat-card green"> <div className="stat-val">{sentReports.filter(r => r.risk === "Low").length}</div><div className="stat-lbl">Normal Results</div></div>
            <div className="stat-card orange"><div className="stat-val">{sentReports.filter(r => r.risk !== "Low").length}</div><div className="stat-lbl">Needs Attention</div></div>
          </div>

          {/* Tabs — NO upload tab */}
          <div className="tab-bar">
            {[["reports", "📋 My Reports"], ["messages", "💬 Messages"]].map(([k, l]) => (
              <button key={k} className={`tab-btn${patientTab === k ? " active" : ""}`} onClick={() => setPatientTab(k)}>{l}</button>
            ))}
          </div>

          {/* ── My Reports ── */}
          {patientTab === "reports" && (
            <div className="fade-up">
              {sentReports.length === 0
                ? <div className="card"><div className="no-data">No reports yet. Your doctor will send results here after reviewing your scan.</div></div>
                : sentReports.map(r => (
                  <div key={r.id} className="patient-report-card">

                    {/* Report header */}
                    <div className="pr-header">
                      <div>
                        <div className="pr-diagnosis">{r.diagnosis}</div>
                        <div className="pr-stage">{r.stage !== "N/A" ? `Stage: ${r.stage}` : "No staging required"}</div>
                        <div className="pr-date">{r.date}</div>
                      </div>
                      <div className="pr-header-right">
                        <span style={riskBadge(r.risk)}>● {r.risk} Risk</span>
                        <div className="pr-conf-block">
                          <div className="pr-conf-label">AI Confidence</div>
                          <div className="pr-conf-val" style={{ color: confColor(r.confidence) }}>{r.confidence}%</div>
                        </div>
                      </div>
                    </div>

                    {/* 3 images: original, edge detection, grad-cam */}
                    {(r.originalImage || r.edgeImage || r.gradcamImage) && (
                      <div className="pr-images">
                        {r.originalImage && <div className="pr-img-box"><img src={r.originalImage} className="pr-img" alt="Original Scan" /><div className="pr-img-label">Original Scan</div></div>}
                        {r.edgeImage     && <div className="pr-img-box"><img src={r.edgeImage}     className="pr-img pr-img-edge" alt="Edge Detection" /><div className="pr-img-label">Edge Detection</div></div>}
                        {r.gradcamImage  && <div className="pr-img-box"><img src={r.gradcamImage}  className="pr-img" alt="Grad-CAM" /><div className="pr-img-label">Grad-CAM</div></div>}
                      </div>
                    )}

                    {/* Confidence bar */}
                    <div className="pr-conf-bar-wrap">
                      <div className="flex-between" style={{ marginBottom: 6 }}>
                        <span className="section-label" style={{ margin: 0 }}>Confidence Score</span>
                        <span style={{ color: "#00d4aa", fontWeight: 700, fontSize: 13 }}>{r.confidence}%</span>
                      </div>
                      <div style={confBar(r.confidence)} />
                    </div>

                    <div className="divider" />
                    <div className="section-label">AI Findings</div>
                    <div className="findings-text">{r.findings}</div>

                    {r.doctorNote && (
                      <div className="doctor-note-box mt-16">
                        <div className="section-label">👨‍⚕️ Doctor's Note</div>
                        <div className="doctor-note-text">"{r.doctorNote}"</div>
                      </div>
                    )}
                    {r.prescription && (
                      <div className="prescription-box mt-12">
                        <div className="rx-header-row"><span className="rx-icon">℞</span><span className="section-label" style={{ margin: 0 }}>Prescription</span></div>
                        <div className="rx-text">{r.prescription}</div>
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          )}

          {/* ── Messages ── */}
          {patientTab === "messages" && (
            <div className="fade-up">
              <div className="card">
                <div className="card-title">Messages from Doctor</div>
                {myMsgs.length === 0
                  ? <div className="no-data">No messages yet.</div>
                  : myMsgs.map((m, i) => (
                    <div key={i} className="msg-bubble doctor-msg">
                      <div className="msg-bubble-meta">👨‍⚕️ Doctor · {m.time}</div>
                      <div className="msg-bubble-text">{m.text}</div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  //  DOCTOR DASHBOARD
  // ══════════════════════════════════════════════════════════
  if (screen === "doctor") {
    const selP = selectedPid ? patients.find(p => p.id === selectedPid) : null;

    return (
      <div className="dashboard">
        {/* Header */}
        <header className="dash-header">
          <div className="dash-header-left">
            <div className="status-dot" />
            <span className="dash-logo-text">RetinaAI Portal</span>
            <span className="role-chip doctor">Doctor</span>
          </div>
          <div className="dash-header-right">
            <div className="user-chip">
              <div className="avatar doctor">{currentUser.name[4]}</div>
              <div><div className="user-name">{currentUser.name}</div><div className="user-id">{currentUser.specialization}</div></div>
            </div>
            <button className="btn-logout" onClick={logout}>Sign Out</button>
          </div>
        </header>

        <main className="dash-content">
          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card blue"> <div className="stat-val">{patients.length}</div><div className="stat-lbl">Total Patients</div></div>
            <div className="stat-card green"><div className="stat-val">{patients.reduce((a, p) => a + p.reports.length, 0)}</div><div className="stat-lbl">Reports Sent</div></div>
            <div className="stat-card red">  <div className="stat-val">{patients.reduce((a, p) => a + p.reports.filter(r => r.risk === "High").length, 0)}</div><div className="stat-lbl">High Risk Cases</div></div>
          </div>

          {/* Tabs */}
          <div className="tab-bar">
            {[["patients", "👥 Patients"], ["analyze", "🔬 Analyze & Send"], ["message", "💬 Message"]].map(([k, l]) => (
              <button key={k} className={`tab-btn${doctorTab === k ? " active" : ""}`} onClick={() => setDoctorTab(k)}>{l}</button>
            ))}
          </div>

          {/* ── PATIENTS TAB ── */}
          {doctorTab === "patients" && (
            <div className={`fade-up patient-grid${selP ? "" : " single"}`}>
              {/* Patient list */}
              <div>
                <div className="card">
                  <div className="card-title">All Patients</div>
                  {patients.map(p => (
                    <div key={p.id} className={`patient-row${selectedPid === p.id ? " selected" : ""}`}
                      onClick={() => setSelectedPid(selectedPid === p.id ? null : p.id)}>
                      <div className="patient-row-inner">
                        <div className="patient-avatar">{p.name[0]}</div>
                        <div style={{ flex: 1 }}>
                          <div className="patient-name">{p.name}</div>
                          <div className="patient-meta">Age {p.age} · {p.reports.length} report{p.reports.length !== 1 ? "s" : ""}</div>
                        </div>
                        <div className="patient-badges">
                          {p.reports.some(r => r.risk === "High")     && <span style={riskBadge("High", true)}>High Risk</span>}
                          {!p.reports.some(r => r.risk === "High") && p.reports.some(r => r.risk === "Moderate") && <span style={riskBadge("Moderate", true)}>Moderate</span>}
                          {p.reports.length > 0 && p.reports.every(r => r.risk === "Low") && <span style={riskBadge("Low", true)}>Clear</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patient detail panel */}
              {selP && (
                <div>
                  <div className="card">
                    <div className="patient-detail-header">
                      <div>
                        <div className="patient-detail-name">{selP.name}</div>
                        <div className="patient-detail-meta">Age {selP.age} · {selP.email}</div>
                      </div>
                      <button className="btn-analyze-small" onClick={() => setDoctorTab("analyze")}>+ New Analysis</button>
                    </div>
                    <div className="divider" />
                    <div className="section-label">Sent Reports</div>
                    {selP.reports.length === 0
                      ? <div className="no-data">No reports sent yet.</div>
                      : selP.reports.map(r => (
                        <div key={r.id} className="report-row" style={{ cursor: "default" }}>
                          <div className="report-row-header">
                            <div>
                              <div className="report-diagnosis">{r.diagnosis}</div>
                              <span className="stage-chip">{r.stage}</span>
                            </div>
                            <span style={riskBadge(r.risk)}>{r.risk}</span>
                          </div>
                          <div className="report-meta">{r.date}</div>

                          {/* Confidence bar — visible on doctor portal */}
                          <div className="doctor-conf-row">
                            <span className="section-label" style={{ margin: 0 }}>Confidence</span>
                            <div className="confidence-track-wrap">
                              <div style={confBar(r.confidence)} />
                            </div>
                            <span className="conf-pct" style={{ color: confColor(r.confidence) }}>{r.confidence}%</span>
                          </div>

                          <div className="report-findings">{r.findings}</div>
                          {r.doctorNote   && <div className="report-doctor-note">👨‍⚕️ {r.doctorNote}</div>}
                          {r.prescription && <div className="report-rx">℞ {r.prescription}</div>}

                          {/* Thumbnail previews */}
                          {(r.originalImage || r.edgeImage || r.gradcamImage) && (
                            <div className="report-thumbs">
                              {r.originalImage && <img src={r.originalImage} className="report-thumb" title="Original Scan" alt="orig" />}
                              {r.edgeImage     && <img src={r.edgeImage}     className="report-thumb thumb-edge" title="Edge Detection" alt="edge" />}
                              {r.gradcamImage  && <img src={r.gradcamImage}  className="report-thumb" title="Grad-CAM" alt="gcam" />}
                            </div>
                          )}
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ANALYZE & SEND TAB ── */}
          {doctorTab === "analyze" && (
            <div className="fade-up">

              {/* Step 1 — Select patient */}
              <div className="card">
                <div className="card-title">Step 1 — Select Patient</div>
                <div className="msg-patient-pills">
                  {patients.map(p => (
                    <button key={p.id} className={`btn-pill${selectedPid === p.id ? " active" : ""}`}
                      onClick={() => { setSelectedPid(p.id); resetAnalyze(); }}>
                      {p.name}
                    </button>
                  ))}
                </div>
                {!selectedPid && <div className="no-data" style={{ paddingTop: 16 }}>Select a patient to begin analysis.</div>}
              </div>

              {selectedPid && (
                <>
                  {/* Step 2 — Upload */}
                  <div className="card">
                    <div className="card-title">Step 2 — Upload Retinal Image</div>
                    <div className="upload-area" onClick={() => fileRef.current.click()}>
                      <div className="upload-icon">🔬</div>
                      <div className="upload-title">{uploadedImg ? "Image Loaded ✓" : "Click to Upload Retinal Scan"}</div>
                      <div className="upload-sub">JPG · PNG · Max 10 MB</div>
                      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
                    </div>
                    {uploadedImg && (
                      <button className="btn-analyze" onClick={runAnalysis} disabled={analyzing}>
                        {analyzing ? <><span className="spinner" />Running AI Analysis...</> : "🧠 Run Analysis"}
                      </button>
                    )}
                  </div>

                  {/* Step 3 — AI Results */}
                  {(uploadedImg && (analyzing || aiResult)) && (
                    <div className="card">
                      <div className="card-title">Step 3 — AI Analysis Results</div>

                      {analyzing && (
                        <div className="analyzing-state">
                          <div className="analyzing-spinner" />
                          <div className="analyzing-text">Running Laplacian Edge Detection &amp; Grad-CAM visualization...</div>
                        </div>
                      )}

                      {!analyzing && aiResult && (
                        <>
                          {/* AI summary with confidence + stage */}
                          <div className="ai-result-summary">
                            <div className="ai-result-left">
                              <div className="section-label">Diagnosis</div>
                              <div className="ai-diagnosis">{aiResult.diagnosis}</div>
                              <div className="ai-stage-badge">{aiResult.stage}</div>
                              <span style={{ ...riskBadge(aiResult.risk), marginTop: 12, display: "inline-flex" }}>● {aiResult.risk} Risk</span>
                            </div>
                            <div className="ai-result-right">
                              <div className="section-label">AI Confidence Score</div>
                              <div className="ai-conf-big" style={{ color: confColor(aiResult.confidence) }}>{aiResult.confidence}%</div>
                              <div className="confidence-track" style={{ width: 160, marginTop: 10 }}>
                                <div style={{ height: "100%", borderRadius: 4, width: `${aiResult.confidence}%`, background: aiResult.confidence >= 90 ? "#00d4aa" : aiResult.confidence >= 70 ? "linear-gradient(90deg,#f5a623,#ffd166)" : "linear-gradient(90deg,#e84040,#ff6b6b)" }} />
                              </div>
                              <div className="ai-conf-label" style={{ color: confColor(aiResult.confidence), marginTop: 6 }}>
                                {aiResult.confidence >= 90 ? "High Confidence" : aiResult.confidence >= 70 ? "Moderate Confidence" : "Low Confidence"}
                              </div>
                            </div>
                          </div>

                          <div className="divider" />

                          {/* Visual tabs: Original | Laplacian Edge | Grad-CAM */}
                          <div className="section-label">Visual Analysis</div>
                          <div className="viz-tabs">
                            {[["original", "🖼 Original"], ["edge", "📐 Laplacian Edge"], ["gradcam", "🔥 Grad-CAM"]].map(([k, l]) => (
                              <button key={k} className={`viz-tab${vizTab === k ? " active" : ""}`} onClick={() => setVizTab(k)}>{l}</button>
                            ))}
                          </div>
                          <div className="viz-panel">
                            {vizTab === "original" && uploadedImg  && <img src={uploadedImg}  className="viz-image" alt="Original" />}
                            {vizTab === "edge"     && edgeImg      && <img src={edgeImg}      className="viz-image viz-edge" alt="Edge" />}
                            {vizTab === "gradcam"  && gradcamImg   && <img src={gradcamImg}   className="viz-image" alt="Grad-CAM" />}
                            {vizTab === "edge"    && <div className="viz-caption">Laplacian edge detection — highlights retinal vessel boundaries and lesion borders</div>}
                            {vizTab === "gradcam" && <div className="viz-caption">Grad-CAM activation map — red regions are most influential to the AI diagnosis</div>}
                          </div>

                          <div className="divider" />
                          <div className="section-label">AI Findings</div>
                          <div className="findings-text">{aiResult.findings}</div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Step 4 — Note + Prescription + Send */}
                  {!analyzing && aiResult && (
                    <div className="card">
                      <div className="card-title">Step 4 — Add Note &amp; Send to Patient</div>
                      <div className="form-field">
                        <div className="section-label">Doctor's Note *</div>
                        <textarea className="msg-textarea" placeholder="Clinical assessment, recommendations, follow-up instructions..."
                          value={doctorNote} onChange={e => setDoctorNote(e.target.value)} style={{ minHeight: 90 }} />
                      </div>
                      <div className="form-field mt-12">
                        <div className="section-label">Prescription (optional)</div>
                        <textarea className="msg-textarea rx-textarea" placeholder="e.g. Timolol 0.5% eye drops twice daily. Follow-up in 6 weeks..."
                          value={prescription} onChange={e => setPrescription(e.target.value)} style={{ minHeight: 70 }} />
                      </div>

                      {!reportSent ? (
                        <button className="btn-send-report" onClick={sendReportToPatient} disabled={sendingReport || !doctorNote.trim()}>
                          {sendingReport ? <><span className="spinner" />Sending...</> : "📤 Send Report & Prescription to Patient"}
                        </button>
                      ) : (
                        <div className="report-sent-confirm">
                          <span>✓</span> Report sent to {selP?.name}!
                          <button className="link-btn" style={{ marginLeft: 12 }} onClick={resetAnalyze}>New Analysis</button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── MESSAGE TAB ── */}
          {doctorTab === "message" && (
            <div className="fade-up">
              <div className="card">
                <div className="card-title">Message a Patient</div>
                <div style={{ marginBottom: 20 }}>
                  <div className="section-label">Select Patient</div>
                  <div className="msg-patient-pills">
                    {patients.map(p => (
                      <button key={p.id} className={`btn-pill${selectedPid === p.id ? " active" : ""}`}
                        onClick={() => { setSelectedPid(p.id); setMsgSent(false); }}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
                {!selectedPid && <div className="no-data">Select a patient to start messaging.</div>}
                {selectedPid && (
                  <>
                    {(messages[selectedPid] || []).length > 0 && (
                      <>
                        <div className="section-label">Sent Messages</div>
                        {(messages[selectedPid] || []).map((m, i) => (
                          <div key={i} className="msg-bubble doctor-msg">
                            <div className="msg-bubble-meta">You · {m.time}</div>
                            <div className="msg-bubble-text">{m.text}</div>
                          </div>
                        ))}
                        <div className="divider" />
                      </>
                    )}
                    <div className="section-label">New Message to {patients.find(p => p.id === selectedPid)?.name}</div>
                    <div className="msg-box">
                      <textarea className="msg-textarea" placeholder="Type your message, treatment note, or follow-up instruction..."
                        value={msgText} onChange={e => setMsgText(e.target.value)} />
                      <div className="msg-actions">
                        <button className="btn-send" onClick={() => sendMessage(selectedPid)}>Send Message →</button>
                        {msgSent && <span className="msg-sent-confirm">✓ Sent!</span>}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    );
  }

  return null;
}