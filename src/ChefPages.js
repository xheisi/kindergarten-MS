import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import { DAYS_ORDER, todayDayName, Modal } from "./shared.js";

// ── Groq API helper ─────────────────────────────────────────────────────────
// Uses OpenAI-compatible format (fast + free tier friendly)

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;

async function askAI(systemPrompt, userMessage) {
  if (!GROQ_API_KEY) {
    throw new Error("REACT_APP_GROQ_API_KEY is not set in your .env file.");
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    }),
  });

  const data = await res.json();
  console.log("GROQ RESPONSE:", data);

  if (!res.ok) {
    throw new Error(data.error?.message || "Groq API error");
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned empty response.");

  return text;
}

// ── Chef Dashboard ────────────────────────────────────────────────────────────
export function ChefDashboard({ children }) {
  const allergyCounts = {};
  children.forEach(c => {
    if (c.allergies !== "None") {
      allergyCounts[c.allergies] = (allergyCounts[c.allergies] || 0) + 1;
    }
  });
  const allergyList = Object.entries(allergyCounts).sort((a, b) => b[1] - a[1]);
  const COLORS = [
    "var(--amber-t)","var(--red-t)","var(--pink-t)",
    "var(--blue-t)","var(--teal)","var(--purple)",
  ];

  return (
    <div>
      <div className="ph"><h1>Kitchen Dashboard</h1><p>Today's overview for meal preparation</p></div>

      <div className="sr" style={{ gridTemplateColumns:"repeat(2,1fr)" }}>
        <div className="sc"><p className="sv" style={{ color:"var(--text)" }}>{children.length}</p><p className="sl">Total Children</p></div>
        <div className="sc"><p className="sv" style={{ color:"var(--salmon)" }}>{children.filter(c => c.allergies !== "None").length}</p><p className="sl">With Allergies</p></div>
      </div>

      <div className="card">
        <div className="ch">Allergy Summary</div>
        <div className="cb">
          {allergyList.length === 0
            ? <p style={{ color:"var(--textm)", fontSize:13, padding:"8px 0" }}>No allergies recorded</p>
            : <div style={{ display:"flex", flexWrap:"wrap", gap:6, padding:"8px 0" }}>
                {allergyList.map(([allergy, count], i) => (
                  <div key={allergy} className="allergy-pill"
                    style={{ borderColor:COLORS[i%COLORS.length], color:COLORS[i%COLORS.length], background:"white" }}>
                    {allergy}
                    <span className="allergy-count" style={{ background:COLORS[i%COLORS.length] }}>{count}</span>
                  </div>
                ))}
              </div>
          }
          <p style={{ fontSize:12, color:"var(--textm)", marginTop:12 }}>
            Numbers indicate how many children have each allergy. Always check individual records before meal prep.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Chef AI Meal Planner (chat-style assistant) ───────────────────────────────
export function ChefAI({ children }) {
  const allergies = [...new Set(children.filter(c => c.allergies !== "None").map(c => c.allergies))];

  // messages: [{ role: "user"|"assistant", text: "..." }]
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `Hello! I'm your kitchen assistant 👨‍🍳 I can help you plan safe, nutritious lunches for the kindergarten.${
        allergies.length > 0
          ? `\n\n⚠️ I'm aware of these allergies in your group: **${allergies.join(", ")}**. I will never suggest meals containing these.`
          : "\n\nNo allergies are currently recorded for your group."
      }\n\nAsk me anything — e.g. "Suggest a healthy lunch for Monday" or "Give me a high-protein meal idea."`,
    },
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const SYSTEM_PROMPT = `You are a professional kindergarten chef assistant. 
The kindergarten serves LUNCH ONLY (no breakfast or snack).
There are ${children.length} children aged 3–6.
Known allergies: ${allergies.length > 0 ? allergies.join(", ") : "none"}.
CRITICAL: Never suggest anything containing the listed allergens.
Keep responses friendly, practical, and concise. Use bullet points when listing multiple items.
When suggesting a meal, include: meal name, main ingredients, and a brief description.`;

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await askAI(SYSTEM_PROMPT, text);
      setMessages(prev => [...prev, { role: "assistant", text: response || "Sorry, I couldn't generate a response. Please try again." }]);
    } catch (err) {
      const isQuota = err.message?.includes("quota") || err.message?.includes("429") || err.message?.includes("rate");
      const msg = isQuota
        ? "⚠️ Gemini quota exceeded (429). Your free-tier daily limit is used up — wait a few hours and try again."
        : `⚠️ ${err.message || "Error connecting to AI. Check your API key."}`;
      setMessages(prev => [...prev, { role: "assistant", text: msg }]);
    }
    setLoading(false);
  }

  // Simple markdown-ish renderer: bold **text** and newlines
  function renderText(text) {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
          {i < text.split("\n").length - 1 && <br />}
        </span>
      );
    });
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 120px)" }}>
      <div className="ph" style={{ flexShrink:0 }}>
        <h1>AI Meal Planner</h1>
        <p>Chat with your AI kitchen assistant — allergy-aware meal suggestions</p>
      </div>

      {/* Allergy banner */}
      {allergies.length > 0 && (
        <div style={{
          background:"var(--amber-l)", border:"1.5px solid #E8C87A",
          borderRadius:12, padding:"10px 16px", marginBottom:12,
          fontSize:13, display:"flex", alignItems:"center", gap:8, flexShrink:0,
        }}>
          <span style={{ fontSize:16 }}>⚠️</span>
          <span><strong style={{ color:"var(--amber-t)" }}>Allergies excluded from all suggestions:</strong>{" "}{allergies.join(", ")}</span>
        </div>
      )}

      {/* Chat window */}
      <div style={{
        flex:1, overflowY:"auto", background:"var(--bg2)",
        borderRadius:14, border:"1.5px solid var(--border)",
        padding:"16px 12px", display:"flex", flexDirection:"column", gap:12,
        marginBottom:12,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display:"flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
          }}>
            {msg.role === "assistant" && (
              <div style={{
                width:32, height:32, borderRadius:"50%", background:"var(--salmon)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:16, flexShrink:0, marginRight:8, alignSelf:"flex-end",
              }}>👨‍🍳</div>
            )}
            <div style={{
              maxWidth:"75%",
              background: msg.role === "user" ? "var(--salmon)" : "white",
              color: msg.role === "user" ? "white" : "var(--text)",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding:"10px 14px",
              fontSize:13,
              lineHeight:1.6,
              boxShadow:"0 1px 4px rgba(0,0,0,0.07)",
              whiteSpace:"pre-wrap",
            }}>
              {renderText(msg.text)}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display:"flex", alignItems:"flex-end", gap:8 }}>
            <div style={{
              width:32, height:32, borderRadius:"50%", background:"var(--salmon)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:16,
            }}>👨‍🍳</div>
            <div style={{
              background:"white", borderRadius:"18px 18px 18px 4px",
              padding:"10px 16px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)",
            }}>
              <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width:7, height:7, borderRadius:"50%", background:"var(--salmon)",
                    animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`,
                  }}/>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div style={{ display:"flex", gap:10, flexShrink:0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask e.g. Suggest a healthy Monday lunch…"
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          disabled={loading}
          style={{ flex:1 }}
        />
        <button className="btn btn-p" onClick={sendMessage} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}

// ── Default empty plan structure (LUNCH ONLY) ─────────────────────────────────
const EMPTY_PLAN = () => ({
  Monday:    { mealName:"", ingredients:"", description:"" },
  Tuesday:   { mealName:"", ingredients:"", description:"" },
  Wednesday: { mealName:"", ingredients:"", description:"" },
  Thursday:  { mealName:"", ingredients:"", description:"" },
  Friday:    { mealName:"", ingredients:"", description:"" },
});

// ── Chef Weekly Meal Plan ─────────────────────────────────────────────────────
// TABLE: meal_plan (see SQL below in the README comment at the bottom of this file)
export function ChefMealPlan({ children = [] }) {
  const [plan, setPlan]           = useState(EMPTY_PLAN());
  const [editing, setEditing]     = useState(null); // { day }
  const [editVal, setEditVal]     = useState({ mealName:"", ingredients:"", description:"" });
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [dbLoading, setDbLoading] = useState(true);
  const [aiError, setAiError]     = useState("");
  const [aiSuccess, setAiSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [generatingDay, setGeneratingDay] = useState(null);

  const allergies = [...new Set(
    (children || []).filter(c => c.allergies && c.allergies !== "None").map(c => c.allergies)
  )];

  const allergyDetails = (children || [])
    .filter(c => c.allergies && c.allergies !== "None")
    .map(c => `${c.name || "A child"}: ${c.allergies}`)
    .join("; ");

  // ── Load plan from Supabase on mount ──────────────────────────────────────
  useEffect(() => {
    async function loadPlan() {
      setDbLoading(true);
      try {
        const { data, error } = await supabase
          .from("meal_plan")
          .select("day, meal_name, ingredients, description");
        if (error) throw error;

        if (data && data.length > 0) {
          const loaded = EMPTY_PLAN();
          data.forEach(row => {
            if (loaded[row.day] !== undefined) {
              loaded[row.day] = {
                mealName:    row.meal_name    || "",
                ingredients: row.ingredients  || "",
                description: row.description  || "",
              };
            }
          });
          setPlan(loaded);
        }
      } catch (err) {
        console.error("Could not load meal plan:", err.message);
      }
      setDbLoading(false);
    }
    loadPlan();
  }, []);

  // ── Save full plan to Supabase ────────────────────────────────────────────
  async function savePlan() {
    setSaving(true);
    try {
      const rows = DAYS_ORDER.map(day => ({
        day,
        meal_name:   plan[day].mealName,
        ingredients: plan[day].ingredients,
        description: plan[day].description,
      }));

      // Upsert: insert or update based on the "day" column (unique key)
      const { error } = await supabase
        .from("meal_plan")
        .upsert(rows, { onConflict: "day" });

      if (error) throw error;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setAiError("Could not save plan: " + err.message);
      setTimeout(() => setAiError(""), 4000);
    }
    setSaving(false);
  }

  // ── Edit a single day ─────────────────────────────────────────────────────
  function startEdit(day) {
    setEditing(day);
    setEditVal({ ...plan[day] });
  }

  function saveEdit() {
    if (!editing) return;
    setPlan(prev => ({ ...prev, [editing]: { ...editVal } }));
    setEditing(null);
  }

  // ── AI: Generate full week ────────────────────────────────────────────────
  async function generateFullWeekAI() {
    setAiLoading(true);
    setAiError("");
    setAiSuccess(false);

    const allergyContext = allergies.length > 0
      ? `CRITICAL RULE: The following allergens must NEVER appear in any meal: ${allergies.join(", ")}. Individual allergies: ${allergyDetails}.`
      : "No known allergies in this group.";

    const systemPrompt = `You are a professional kindergarten nutritionist. 
You create safe, nutritious, age-appropriate LUNCH meal plans for children aged 3–6.
The kindergarten serves LUNCH ONLY.
${allergyContext}
Return ONLY valid JSON — no markdown, no code fences, no explanation — just the raw JSON object.
Use exactly this structure:
{
  "Monday":    {"mealName":"...","ingredients":"...","description":"..."},
  "Tuesday":   {"mealName":"...","ingredients":"...","description":"..."},
  "Wednesday": {"mealName":"...","ingredients":"...","description":"..."},
  "Thursday":  {"mealName":"...","ingredients":"...","description":"..."},
  "Friday":    {"mealName":"...","ingredients":"...","description":"..."}
}
Rules:
- mealName: short meal name, 3–5 words
- ingredients: comma-separated main ingredients, 4–6 items
- description: one sentence describing the meal, max 15 words
- Vary meals for nutritional balance across the week
- All meals must be allergy-safe`;

    try {
      const raw = await askAI(systemPrompt, "Generate a full week lunch plan for our kindergarten.");      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setPlan(prev => {
        const next = { ...prev };
        DAYS_ORDER.forEach(day => {
          if (parsed[day]) {
            next[day] = {
              mealName:    parsed[day].mealName    || prev[day]?.mealName    || "",
              ingredients: parsed[day].ingredients || prev[day]?.ingredients || "",
              description: parsed[day].description || prev[day]?.description || "",
            };
          }
        });
        return next;
      });
      setAiSuccess(true);
      setTimeout(() => setAiSuccess(false), 3500);
    } catch (err) {
      setAiError("AI couldn't generate the plan. Please try again.");
      setTimeout(() => setAiError(""), 4000);
    }
    setAiLoading(false);
  }

  // ── AI: Regenerate a single day ───────────────────────────────────────────
  async function regenerateDayAI(day) {
    setGeneratingDay(day);

    const allergyContext = allergies.length > 0
      ? `NEVER use these allergens: ${allergies.join(", ")}.`
      : "No known allergies.";

    const systemPrompt = `You are a kindergarten chef. ${allergyContext}
Return ONLY valid JSON — no markdown, no code fences — just:
{"mealName":"...","ingredients":"...","description":"..."}
Rules:
- mealName: short meal name, 3–5 words
- ingredients: comma-separated main ingredients, 4–6 items  
- description: one sentence, max 15 words`;

    try {
      const raw = await askAI(systemPrompt, `Suggest a lunch for ${day} for children aged 3–6.`);      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (parsed.mealName) {
        setPlan(prev => ({
          ...prev,
          [day]: {
            mealName:    parsed.mealName    || prev[day].mealName,
            ingredients: parsed.ingredients || prev[day].ingredients,
            description: parsed.description || prev[day].description,
          },
        }));
      }
    } catch {
      // Silently fail per-cell
    }
    setGeneratingDay(null);
  }

  if (dbLoading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:200, flexDirection:"column", gap:12 }}>
        <div style={{ width:32, height:32, border:"3px solid var(--border)", borderTop:"3px solid var(--salmon)", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
        <p style={{ color:"var(--text2)", fontSize:13 }}>Loading meal plan…</p>
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div className="ph">
        <h1>Weekly Meal Plan</h1>
        <p>Lunch plan for the week — generate with AI or edit manually, then save to database</p>
      </div>

      {/* Allergy warning */}
      {allergies.length > 0 && (
        <div style={{
          background:"var(--amber-l)", border:"1.5px solid #E8C87A",
          borderRadius:12, padding:"12px 16px", marginBottom:16,
          fontSize:13, display:"flex", alignItems:"center", gap:8,
        }}>
          <span style={{ fontSize:16 }}>⚠️</span>
          <div>
            <strong style={{ color:"var(--amber-t)" }}>AI is allergy-aware:</strong>{" "}
            <span style={{ color:"var(--text2)" }}>
              {allergies.join(", ")} — excluded from all generated meals.
            </span>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div style={{ display:"flex", gap:10, marginBottom:16, alignItems:"center", flexWrap:"wrap" }}>
        <button
          className="btn btn-p"
          onClick={generateFullWeekAI}
          disabled={aiLoading || generatingDay !== null || saving}
          style={{ display:"flex", alignItems:"center", gap:8 }}
        >
          {aiLoading
            ? <><span style={{ display:"inline-block", animation:"spin 1s linear infinite" }}>⟳</span> Generating…</>
            : <>✨ Generate Full Week with AI</>}
        </button>

        <button
          className="btn btn-o"
          onClick={savePlan}
          disabled={saving || aiLoading || generatingDay !== null}
          style={{ display:"flex", alignItems:"center", gap:8 }}
        >
          {saving ? "Saving…" : "💾 Save to Database"}
        </button>

        {aiSuccess    && <span style={{ color:"var(--teal)",  fontSize:13, fontWeight:600 }}>✓ Plan generated!</span>}
        {saveSuccess  && <span style={{ color:"var(--teal)",  fontSize:13, fontWeight:600 }}>✓ Plan saved!</span>}
        {aiError      && <span style={{ color:"var(--red-t)", fontSize:13 }}>⚠ {aiError}</span>}
      </div>

      {/* Meal plan table */}
      <div className="card">
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th style={{ width:"10%" }}>Day</th>
                <th style={{ width:"20%" }}>Meal Name</th>
                <th style={{ width:"30%" }}>Ingredients</th>
                <th style={{ width:"28%" }}>Description</th>
                <th style={{ width:"12%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {DAYS_ORDER.map(day => {
                const isToday    = day === todayDayName;
                const isGenDay   = generatingDay === day;
                const row        = plan[day] || {};

                return (
                  <tr key={day} style={{ opacity: isGenDay ? 0.55 : 1, transition:"opacity 0.2s" }}>
                    {/* Day */}
                    <td style={{ fontWeight:700, color: isToday ? "var(--salmon)" : "var(--text)", whiteSpace:"nowrap" }}>
                      {day}
                      {isToday && <span style={{ fontSize:10, color:"var(--salmon)", display:"block" }}>Today</span>}
                    </td>

                    {/* Meal Name */}
                    <td style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>
                      {isGenDay ? <em style={{ color:"var(--textm)" }}>Generating…</em> : (row.mealName || <span style={{ color:"var(--textm)" }}>—</span>)}
                    </td>

                    {/* Ingredients */}
                    <td style={{ fontSize:12, color:"var(--text2)" }}>
                      {isGenDay ? "" : (row.ingredients
                        ? <span>{row.ingredients.split(",").map((ing, i) => (
                            <span key={i} style={{
                              display:"inline-block", background:"var(--bg2)",
                              border:"1px solid var(--border)", borderRadius:6,
                              padding:"1px 7px", fontSize:11, margin:"2px 2px",
                            }}>{ing.trim()}</span>
                          ))}</span>
                        : <span style={{ color:"var(--textm)" }}>—</span>
                      )}
                    </td>

                    {/* Description */}
                    <td style={{ fontSize:12, color:"var(--text2)", fontStyle: row.description ? "normal" : "italic" }}>
                      {isGenDay ? "" : (row.description || <span style={{ color:"var(--textm)" }}>—</span>)}
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display:"flex", gap:4 }}>
                        <button
                          className="btn btn-o btn-s"
                          onClick={() => startEdit(day)}
                          disabled={isGenDay || aiLoading}
                        >Edit</button>
                        <button
                          className="btn btn-o btn-s"
                          onClick={() => regenerateDayAI(day)}
                          disabled={aiLoading || generatingDay !== null}
                          title="Regenerate this day with AI"
                          style={{ opacity:(aiLoading || generatingDay !== null) ? 0.5 : 1 }}
                        >
                          {isGenDay ? "…" : "✨"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ fontSize:12, color:"var(--textm)", marginTop:10, textAlign:"center" }}>
        ✨ regenerates one day · "Generate Full Week" replaces entire plan · "Save" persists to database
        {allergies.length > 0 && " · All AI meals exclude known allergens"}
      </p>

      {/* Edit modal */}
      {editing && (
        <Modal
          title={`Edit Lunch — ${editing}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn btn-o" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-p" onClick={saveEdit}>Save</button>
            </>
          }
        >
          <div className="fg" style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"var(--text2)", display:"block", marginBottom:4 }}>
                Meal Name
              </label>
              <input
                value={editVal.mealName}
                onChange={e => setEditVal(v => ({ ...v, mealName: e.target.value }))}
                placeholder="e.g. Grilled Chicken with Rice"
                autoFocus
              />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"var(--text2)", display:"block", marginBottom:4 }}>
                Ingredients (comma-separated)
              </label>
              <input
                value={editVal.ingredients}
                onChange={e => setEditVal(v => ({ ...v, ingredients: e.target.value }))}
                placeholder="e.g. chicken, rice, carrots, olive oil"
              />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"var(--text2)", display:"block", marginBottom:4 }}>
                Description
              </label>
              <input
                value={editVal.description}
                onChange={e => setEditVal(v => ({ ...v, description: e.target.value }))}
                placeholder="e.g. A light and nutritious grilled chicken meal"
                onKeyDown={e => e.key === "Enter" && saveEdit()}
              />
            </div>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:none; } }
      `}</style>
    </div>
  );
}

/*
═══════════════════════════════════════════════════════════════════
  SUPABASE TABLE — Run this SQL in your Supabase SQL Editor
═══════════════════════════════════════════════════════════════════

CREATE TABLE public.meal_plan (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  day         VARCHAR(10) UNIQUE NOT NULL,  -- 'Monday' .. 'Friday'
  meal_name   VARCHAR(100),
  ingredients TEXT,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the 5 weekday rows so upsert always finds a row to update:
INSERT INTO public.meal_plan (day) VALUES
  ('Monday'), ('Tuesday'), ('Wednesday'), ('Thursday'), ('Friday')
ON CONFLICT (day) DO NOTHING;

-- Optional: auto-update the timestamp on every save
CREATE OR REPLACE FUNCTION update_meal_plan_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meal_plan_updated
BEFORE UPDATE ON public.meal_plan
FOR EACH ROW EXECUTE FUNCTION update_meal_plan_timestamp();

═══════════════════════════════════════════════════════════════════
*/