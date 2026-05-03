import { useState } from "react";

const API_URL = "http://localhost:5000/api";

// ── Color palette: editorial academic aesthetic ──
const colors = {
  bg: "#0F1419",
  card: "#1A2029",
  cardHover: "#212A35",
  border: "#2D3A47",
  accent: "#4ECDC4",
  accentDim: "rgba(78, 205, 196, 0.15)",
  danger: "#FF6B6B",
  dangerDim: "rgba(255, 107, 107, 0.15)",
  warning: "#FDCB6E",
  warningDim: "rgba(253, 203, 110, 0.15)",
  success: "#6BCB77",
  successDim: "rgba(107, 203, 119, 0.15)",
  text: "#E8ECF0",
  textMuted: "#8899A6",
  textDim: "#556677",
  white: "#FFFFFF",
};

const riskColors = {
  Critical: { bg: colors.dangerDim, text: colors.danger, border: colors.danger },
  Moderate: { bg: colors.warningDim, text: colors.warning, border: colors.warning },
  Low: { bg: colors.successDim, text: colors.success, border: colors.success },
};

const classColors = {
  "High Distinction": "#A78BFA",
  Distinction: "#4ECDC4",
  Credit: "#74B9FF",
  Pass: "#6BCB77",
  Fail: "#FF6B6B",
  Withdrawn: "#FDCB6E",
};

// ── Form field definitions ──
const formFields = [
  { key: "StudyHours", label: "Study Hours / Week", type: "number", min: 0, max: 50, step: 1, default: 15, group: "academic" },
  { key: "Attendance", label: "Attendance %", type: "number", min: 0, max: 100, step: 1, default: 75, group: "academic" },
  { key: "AssignmentCompletion", label: "Assignment Completion %", type: "number", min: 0, max: 100, step: 1, default: 70, group: "academic" },
  { key: "ExamScore", label: "Exam Score", type: "number", min: 0, max: 100, step: 1, default: 65, group: "academic" },
  { key: "OnlineCourses", label: "Online Courses", type: "number", min: 0, max: 30, step: 1, default: 5, group: "academic" },
  { key: "Discussions", label: "Discussion Participation", type: "number", min: 0, max: 10, step: 1, default: 2, group: "academic" },
  { key: "Age", label: "Age", type: "number", min: 18, max: 40, step: 1, default: 20, group: "demographic" },
  { key: "Gender", label: "Gender", type: "select", options: [{ v: "0", l: "Male" }, { v: "1", l: "Female" }], default: "0", group: "demographic" },
  { key: "Internet", label: "Internet Access", type: "select", options: [{ v: "0", l: "No" }, { v: "1", l: "Yes" }], default: "1", group: "resources" },
  { key: "EduTech", label: "Uses EduTech", type: "select", options: [{ v: "0", l: "No" }, { v: "1", l: "Yes" }], default: "1", group: "resources" },
  { key: "Resources", label: "Learning Resources", type: "select", options: [{ v: "0", l: "None" }, { v: "1", l: "Some" }, { v: "2", l: "Full" }], default: "1", group: "resources" },
  { key: "LearningStyle", label: "Learning Style", type: "select", options: [{ v: "0", l: "Visual" }, { v: "1", l: "Auditory" }, { v: "2", l: "Kinesthetic" }, { v: "3", l: "Reading/Writing" }], default: "0", group: "preferences" },
  { key: "StressLevel", label: "Stress Level", type: "select", options: [{ v: "0", l: "Low" }, { v: "1", l: "Medium" }, { v: "2", l: "High" }], default: "1", group: "preferences" },
  { key: "Motivation", label: "Motivation Level", type: "select", options: [{ v: "0", l: "Low" }, { v: "1", l: "Medium" }, { v: "2", l: "High" }], default: "1", group: "preferences" },
  { key: "Extracurricular", label: "Extracurricular", type: "select", options: [{ v: "0", l: "No" }, { v: "1", l: "Yes" }], default: "0", group: "preferences" },
];

const groupLabels = {
  academic: "Academic Performance",
  demographic: "Demographics",
  resources: "Resources & Access",
  preferences: "Learning Profile",
};

// ── Components ──

function ProbabilityBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: colors.textMuted, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{ height: 8, background: colors.border, borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: color,
            borderRadius: 4,
            transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>
    </div>
  );
}

function ContributionItem({ feature, impact, direction }) {
  const isRisk = direction === "risk";
  const color = isRisk ? colors.danger : colors.accent;
  const icon = isRisk ? "▲" : "▼";
  const barWidth = Math.min(Math.abs(impact) * 300, 100);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 0",
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <span style={{ color, fontSize: 11, width: 14, textAlign: "center", flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 13, color: colors.text, fontFamily: "'DM Sans', sans-serif" }}>{feature}</span>
      <div style={{ width: 100, height: 6, background: colors.border, borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${barWidth}%`, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color, width: 65, textAlign: "right", flexShrink: 0 }}>
        {impact > 0 ? "+" : ""}{impact.toFixed(4)}
      </span>
    </div>
  );
}

const priorityConfig = {
  high:   { bg: colors.dangerDim,  text: colors.danger,  border: colors.danger,  label: "HIGH" },
  medium: { bg: colors.warningDim, text: colors.warning,  border: colors.warning, label: "MED" },
  low:    { bg: colors.successDim, text: colors.success,  border: colors.success, label: "LOW" },
};

function RecommendationItem({ rec, index }) {
  const cfg = priorityConfig[rec.priority] || priorityConfig.low;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: 14,
        marginBottom: 8,
        background: colors.bg,
        borderRadius: 8,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <div style={{
          width: 24, height: 24, borderRadius: "50%",
          background: colors.accentDim,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: colors.accent,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {index + 1}
        </div>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 1,
          padding: "2px 5px", borderRadius: 3,
          background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {cfg.label}
        </span>
      </div>
      <span style={{ fontSize: 13, color: colors.text, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
        {rec.action}
      </span>
    </div>
  );
}

function FactorList({ items, color, icon }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "10px 14px",
            background: colors.bg,
            borderRadius: 8,
            borderLeft: `3px solid ${color}`,
          }}
        >
          <span style={{ color, fontSize: 12, flexShrink: 0, marginTop: 1 }}>{icon}</span>
          <span style={{ fontSize: 13, color: colors.text, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
            {item}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [formData, setFormData] = useState(() => {
    const defaults = {};
    formFields.forEach((f) => (defaults[f.key] = f.default));
    return defaults;
  });

  // Ensure ExamScore is always a number before submitting
  const getCleanFormData = () => {
    const clean = { ...formData };
    if (typeof clean.ExamScore !== 'number') {
      clean.ExamScore = Number(clean.ExamScore);
      if (isNaN(clean.ExamScore)) clean.ExamScore = 0;
    }
    return clean;
  };
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("prediction");

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getCleanFormData()),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Prediction failed");
      }
      const data = await res.json();
      setResult(data);
      setActiveTab("prediction");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaults = {};
    formFields.forEach((f) => (defaults[f.key] = f.default));
    setFormData(defaults);
    setResult(null);
    setError(null);
  };

  // Group fields
  const groups = {};
  formFields.forEach((f) => {
    if (!groups[f.group]) groups[f.group] = [];
    groups[f.group].push(f);
  });

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, color: colors.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* ── Header ── */}
      <header
        style={{
          padding: "32px 0 24px",
          borderBottom: `1px solid ${colors.border}`,
          textAlign: "center",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 10, height: 10, background: colors.accent, borderRadius: "50%" }} />
          <span style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: colors.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
            Explainable Boosting Machine
          </span>
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, margin: "8px 0 0", letterSpacing: -0.5, color: colors.white }}>
          Academic Outcome Predictor
        </h1>
        <p style={{ color: colors.textMuted, fontSize: 14, marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>
          Interpretable multi-class prediction with transparent explanations
        </p>
      </header>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px", display: "grid", gridTemplateColumns: result ? "380px 1fr" : "1fr", gap: 24 }}>

        {/* ── Input Form ── */}
        <div style={{ background: colors.card, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", margin: 0, color: colors.white }}>
              Student Profile
            </h2>
          </div>

          <div style={{ padding: "16px 20px", maxHeight: result ? "calc(100vh - 250px)" : "none", overflowY: result ? "auto" : "visible" }}>
            {Object.entries(groups).map(([groupKey, fields]) => (
              <div key={groupKey} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: colors.accent, marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>
                  {groupLabels[groupKey]}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {fields.map((field) => (
                    <div key={field.key} style={{ gridColumn: field.type === "number" && field.key === "ExamScore" ? "1 / -1" : "auto" }}>
                      <label style={{ display: "block", fontSize: 12, color: colors.textMuted, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>
                        {field.label}
                      </label>
                      {field.type === "number" ? (
                        <input
                          type="number"
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          value={formData[field.key]}
                          onChange={(e) => handleChange(field.key, parseFloat(e.target.value) || 0)}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 6,
                            color: colors.text,
                            fontSize: 14,
                            fontFamily: "'JetBrains Mono', monospace",
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      ) : (
                        <select
                          value={formData[field.key]}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 6,
                            color: colors.text,
                            fontSize: 13,
                            fontFamily: "'DM Sans', sans-serif",
                            outline: "none",
                            boxSizing: "border-box",
                            cursor: "pointer",
                          }}
                        >
                          {field.options.map((opt) => (
                            <option key={opt.v} value={opt.v}>{opt.l}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "12px 20px 16px", borderTop: `1px solid ${colors.border}`, display: "flex", gap: 10 }}>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px 0",
                background: loading ? colors.textDim : colors.accent,
                color: colors.bg,
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                cursor: loading ? "wait" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {loading ? "Analyzing..." : "Predict Outcome"}
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: "10px 16px",
                background: "transparent",
                color: colors.textMuted,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>

          {error && (
            <div style={{ padding: "10px 20px", background: colors.dangerDim, color: colors.danger, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
              {error}
            </div>
          )}
        </div>

        {/* ── Results Panel ── */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            
            {/* Prediction header */}
            <div
              style={{
                background: colors.card,
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                padding: 24,
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 20,
              }}
            >
              {/* Predicted outcome */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: colors.textMuted, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                  Predicted Outcome
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    fontFamily: "'Playfair Display', serif",
                    color: classColors[result.prediction] || colors.text,
                  }}
                >
                  {result.prediction}
                </div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                  Exam Score: {result.exam_score}/100
                </div>
              </div>

              {/* Risk score */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: colors.textMuted, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                  Risk Score
                </div>
                <div style={{ fontSize: 36, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: riskColors[result.risk_level]?.text || colors.text }}>
                  {result.risk_score.toFixed(0)}%
                </div>
              </div>

              {/* Risk level badge */}
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: colors.textMuted, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                  Risk Level
                </div>
                <div
                  style={{
                    display: "inline-block",
                    padding: "6px 20px",
                    borderRadius: 20,
                    background: riskColors[result.risk_level]?.bg,
                    border: `1px solid ${riskColors[result.risk_level]?.border}`,
                    color: riskColors[result.risk_level]?.text,
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: 1,
                  }}
                >
                  {result.risk_level}
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <div style={{ display: "flex", gap: 0, background: colors.card, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
              {[
                { id: "prediction", label: "Probabilities" },
                { id: "explanation", label: "Explanation" },
                { id: "interventions", label: "Interventions" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    background: activeTab === tab.id ? colors.accentDim : "transparent",
                    color: activeTab === tab.id ? colors.accent : colors.textMuted,
                    border: "none",
                    borderBottom: activeTab === tab.id ? `2px solid ${colors.accent}` : `2px solid transparent`,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ background: colors.card, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 24 }}>
              
              {activeTab === "prediction" && (
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.white, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
                    Outcome Probabilities
                  </h3>
                  {Object.entries(result.probabilities)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cls, prob]) => (
                      <ProbabilityBar key={cls} label={cls} value={prob} color={classColors[cls] || colors.textMuted} />
                    ))}
                  <div style={{ marginTop: 20, padding: 14, background: colors.bg, borderRadius: 8, border: `1px solid ${colors.border}` }}>
                    <div style={{ fontSize: 12, color: colors.textMuted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                      The model assigns a <strong style={{ color: classColors[result.prediction] }}>{result.probabilities[result.prediction].toFixed(1)}%</strong> probability
                      to <strong style={{ color: classColors[result.prediction] }}>{result.prediction}</strong> as the most likely outcome.
                      {result.risk_level === "Critical" && " This student is flagged as critical risk and may require immediate intervention."}
                      {result.risk_level === "Moderate" && " This student shows moderate risk indicators and should be monitored."}
                      {result.risk_level === "Low" && " This student appears to be on track for a positive outcome."}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "explanation" && (
                <div>
                  {/* Plain-language summary */}
                  {result.explanation?.summary && (
                    <div style={{
                      padding: "14px 16px",
                      marginBottom: 20,
                      background: riskColors[result.risk_level]?.bg || colors.accentDim,
                      borderLeft: `4px solid ${riskColors[result.risk_level]?.border || colors.accent}`,
                      borderRadius: "0 8px 8px 0",
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: 14,
                        lineHeight: 1.7,
                        color: colors.text,
                        fontFamily: "'DM Sans', sans-serif",
                      }}>
                        {result.explanation.summary}
                      </p>
                    </div>
                  )}

                  {/* Risk factors */}
                  {result.explanation?.risk_factors?.length > 0 && (
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: colors.danger, marginBottom: 8, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                        Risk Factors
                      </div>
                      <FactorList items={result.explanation.risk_factors} color={colors.danger} icon="▲" />
                    </div>
                  )}

                  {/* Protective factors */}
                  {result.explanation?.protective_factors?.length > 0 && (
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: colors.accent, marginBottom: 8, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                        Protective Factors
                      </div>
                      <FactorList items={result.explanation.protective_factors} color={colors.accent} icon="▼" />
                    </div>
                  )}

                  {/* Collapsible technical detail */}
                  <details style={{ marginTop: 8 }}>
                    <summary style={{
                      fontSize: 12,
                      color: colors.textMuted,
                      fontFamily: "'DM Sans', sans-serif",
                      cursor: "pointer",
                      userSelect: "none",
                      padding: "8px 0",
                      borderTop: `1px solid ${colors.border}`,
                    }}>
                      Technical feature contributions
                    </summary>
                    <div style={{ marginTop: 10 }}>
                      {result.contributions.map((c, i) => (
                        <ContributionItem key={i} {...c} />
                      ))}
                      <div style={{ marginTop: 12, padding: 12, background: colors.bg, borderRadius: 8, border: `1px solid ${colors.border}` }}>
                        <div style={{ fontSize: 12, color: colors.textMuted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                          <span style={{ color: colors.danger }}>▲ Risk factors</span> push the prediction toward Fail/Withdrawn.{" "}
                          <span style={{ color: colors.accent }}>▼ Protective factors</span> push toward Pass/Distinction.
                          Larger bars indicate stronger influence.
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {activeTab === "interventions" && (
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.white, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>
                    Recommended Actions
                  </h3>
                  <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
                    Prioritised steps based on which factors are driving this student's risk
                  </p>
                  {result.explanation?.recommendations?.length > 0 ? (
                    result.explanation.recommendations.map((rec, i) => (
                      <RecommendationItem key={i} rec={rec} index={i} />
                    ))
                  ) : (
                    <div style={{ padding: 20, textAlign: "center", color: colors.success, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
                      No interventions needed — this student is on track.
                    </div>
                  )}
                  {result.risk_level !== "Low" && (
                    <div style={{ marginTop: 16, padding: 14, borderRadius: 8, background: riskColors[result.risk_level]?.bg, border: `1px solid ${riskColors[result.risk_level]?.border}` }}>
                      <div style={{ fontSize: 13, color: riskColors[result.risk_level]?.text, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                        This student has a <strong>{result.risk_level.toLowerCase()}</strong> risk level ({result.risk_score.toFixed(0)}% combined Fail + Withdrawn probability).
                        {result.risk_level === "Critical" ? " Immediate academic support is strongly recommended." : " Periodic monitoring and check-ins are advised."}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "24px 0", borderTop: `1px solid ${colors.border}`, marginTop: 40 }}>
        <span style={{ fontSize: 12, color: colors.textDim, fontFamily: "'DM Sans', sans-serif" }}>
          Powered by Explainable Boosting Machine (EBM) · Interpretable Academic Outcome Prediction Framework
        </span>
      </footer>
    </div>
  );
}
