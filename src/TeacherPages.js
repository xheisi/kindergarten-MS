import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { getNotes, addNote } from "./api/supabaseApi";
import {
  today, fmtDate, getCC, upcomingEvents,
  Ic, Modal, WeeklyScheduleGrid, ChildDetailModal,
} from "./shared.js";

// ── Teacher Dashboard ─────────────────────────────────────────────────────────
export function TeacherDashboard({ myClass, classId, children, attendance, events }) {
  const att      = attendance[today] || {};
  const myKids   = classId ? children.filter(c => c.class_id === classId) : children.filter(c => c.class === myClass);
  const present  = myKids.filter(c => att[c.id] === "Present").length;
  const upcoming = upcomingEvents(events);

  return (
    <div>
      <div className="ph">
        <h1>Welcome back!</h1>
        <p>Class: {myClass} — {fmtDate(today)}</p>
      </div>
      <div className="sr" style={{ gridTemplateColumns:"repeat(3,1fr)" }}>
        <div className="sc"><p className="sv" style={{ color:"var(--text)" }}>{myKids.length}</p><p className="sl">My Children</p></div>
        <div className="sc"><p className="sv" style={{ color:"var(--teal)" }}>{present}</p><p className="sl">Present Today</p></div>
        <div className="sc"><p className="sv" style={{ color:"var(--salmon)" }}>{myKids.length - present}</p><p className="sl">Absent Today</p></div>
      </div>
      <div className="card">
        <div className="ch">Upcoming Events</div>
        <div className="cb">
          {upcoming.length > 0
            ? upcoming.map((e, i) => (
                <div key={e.id} className={`evc ${e.colorClass || getCC(i)}`} style={{ marginBottom:8 }}>
                  <p className="ev-name">{e.name}</p>
                  <p className="ev-date">{fmtDate(e.date)}</p>
                  <p className="ev-desc">{e.desc}</p>
                </div>
              ))
            : <p style={{ color:"var(--textm)", fontSize:13, padding:"8px 0" }}>No upcoming events</p>
          }
        </div>
      </div>
    </div>
  );
}

// ── Teacher Attendance ────────────────────────────────────────────────────────
export function TeacherAttendance({ myClass, classId, children, attendance, setAttendance }) {
  const myKids = classId ? children.filter(c => c.class_id === classId) : children.filter(c => c.class === myClass);
  const [date, setDate]   = useState(today);
  const [local, setLocal] = useState({});
  const [view, setView]   = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocal(attendance[date] ? { ...attendance[date] } : {});
  }, [date, attendance]);

  function mark(id, value) { setLocal(prev => ({ ...prev, [id]: value })); }

  async function save() {
    setSaving(true);
    // Upsert each kid's attendance for this date
    const rows = myKids
      .filter(c => local[c.id])
      .map(c => ({ child_id: c.id, date, status: local[c.id] }));

    if (rows.length > 0) {
      const { error } = await supabase.from("attendance")
        .upsert(rows, { onConflict: "child_id,date" });
      if (error) { alert("Error saving attendance: " + error.message); setSaving(false); return; }
    }

    setAttendance(prev => ({ ...prev, [date]: { ...prev[date], ...local } }));
    setSaving(false);
    alert("Attendance saved!");
  }

  const present  = myKids.filter(c => local[c.id] === "Present").length;
  const absent   = myKids.filter(c => local[c.id] === "Absent").length;
  const unmarked = myKids.length - present - absent;

  return (
    <div>
      <div className="ph"><h1>Attendance</h1><p>Class: {myClass}</p></div>
      <div className="fbar">
        <div className="fg"><label>Date</label><input type="date" value={date} onChange={x => setDate(x.target.value)}/></div>
        <button className="btn btn-p" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Attendance"}</button>
      </div>
      <div className="sr" style={{ gridTemplateColumns:"repeat(3,1fr)", marginBottom:18 }}>
        <div className="sc"><p className="sv" style={{ color:"var(--teal)" }}>{present}</p><p className="sl">Present</p></div>
        <div className="sc"><p className="sv" style={{ color:"var(--salmon)" }}>{absent}</p><p className="sl">Absent</p></div>
        <div className="sc"><p className="sv" style={{ color:"var(--textm)" }}>{unmarked}</p><p className="sl">Unmarked</p></div>
      </div>
      <div className="card">
        <div className="ch">Class: {myClass} — {fmtDate(date)}</div>
        <div className="tw">
          <table>
            <thead><tr><th>Name</th><th>Age</th><th>Mark Attendance</th><th>Actions</th></tr></thead>
            <tbody>
              {myKids.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight:700 }}>{c.name}</td>
                  <td>{c.age} yrs</td>
                  <td>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <button className={`att-p ${local[c.id] === "Present" ? "sel" : ""}`} onClick={() => mark(c.id, "Present")}>Present</button>
                      <button className={`att-a ${local[c.id] === "Absent"  ? "sel" : ""}`} onClick={() => mark(c.id, "Absent")}>Absent</button>
                      {!local[c.id] && <span style={{ fontSize:11, color:"var(--textm)" }}>Not marked</span>}
                    </div>
                  </td>
                  <td><button className="btn btn-o btn-s" onClick={() => setView(c)}>View</button></td>
                </tr>
              ))}
              {myKids.length === 0 && <tr><td colSpan={4}><div className="empty">No children in this class</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {view && <ChildDetailModal child={view} onClose={() => setView(null)} />}
    </div>
  );
}

// ── Teacher Schedule ──────────────────────────────────────────────────────────
export function TeacherSchedule({ schedule }) {
  return (
    <div>
      <div className="ph"><h1>Weekly Schedule</h1></div>
      <div className="card">
        <div className="cb" style={{ paddingTop:16 }}>
          <WeeklyScheduleGrid schedule={schedule} />
        </div>
      </div>
    </div>
  );
}

// ── Teacher Observations / Notes ──────────────────────────────────────────────
export function TeacherNotes({ myClass, classId, children }) {
  const myKids = classId
    ? children.filter(c => c.class_id === classId)
    : children.filter(c => c.class === myClass);

  const [notes, setNotes] = useState([]);
  const [add, setAdd] = useState(false);
  const [form, setForm] = useState({ childId: "", text: "" });

  // ✅ LOAD FROM DATABASE
  useEffect(() => {
    loadNotes();
  }, []);

async function loadNotes() {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.log("FETCH ERROR:", error);
    return;
  }

  const enriched = data.map(n => {
    const child = children.find(c => c.id === n.child_id);

    return {
      ...n,
      childName: child ? child.name : "Unknown"
    };
  });

  setNotes(enriched);
}

  // ✅ SAVE TO DATABASE
  async function save() {
  if (!form.childId || !form.text.trim()) return;

  const { error } = await supabase
    .from("notes")
    .insert([
      {
        child_id: Number(form.childId), // 🔥 IMPORTANT FIX
        text: form.text.trim(),
        date: today
      }
    ]);

  if (error) {
    console.log("SUPABASE ERROR:", error);
    alert("Error saving note: " + error.message);
    return;
  }

  setForm({ childId: "", text: "" });
  setAdd(false);
  await loadNotes();
}

  return (
    <div>
      <div className="ph"><h1>Observations</h1></div>

      <div className="fbar">
        <button className="btn btn-p" onClick={() => setAdd(true)}>
          + Add Note
        </button>
      </div>

      {notes.map(n => (
        <div key={n.id} className="note">
          <div className="nm">
            <span className="nc">{n.childName}</span>
            <span className="nd">{fmtDate(n.date)}</span>
          </div>
          <p>{n.text}</p>
        </div>
      ))}

      {notes.length === 0 && (
        <div className="empty" style={{ marginTop: 24 }}>
          No observations yet
        </div>
      )}

      {add && (
        <Modal
          title="Add Observation Note"
          onClose={() => setAdd(false)}
          footer={
            <>
              <button className="btn btn-o" onClick={() => setAdd(false)}>Cancel</button>
              <button className="btn btn-p" onClick={save}>Save Note</button>
            </>
          }
        >
          <div className="fg">
            <label>Child</label>
            <select
              value={form.childId}
              onChange={(e) => setForm({ ...form, childId: e.target.value })}
            >
              <option value="">Select child…</option>
              {myKids.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="fg">
            <label>Observation</label>
            <textarea
              rows={4}
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder="Describe behavior or progress..."
            />
          </div>
        </Modal>
      )}
    </div>
  );
}