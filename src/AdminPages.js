import { useState } from "react";
import { supabase } from "./supabaseClient";
import {
  DAYS_ORDER, SLOTS, FIXED_TOP, FIXED_ROWS, LUNCH, today, todayDayName,
  fmtDate, getCC, upcomingEvents,
  Ic, Modal, Chart, WeeklyScheduleGrid, ChildDetailModal,
} from "./shared.js";

const chartData   = [52, 58, 68, 45, 38, 22];
const chartLabels = ["Wk1","Wk2","Wk3","Wk4","Wk5","Wk6"];

// ── Admin Dashboard ───────────────────────────────────────────────────────────
export function AdminDashboard({ children, teachers, events, attendance }) {
  const att      = attendance[today] || {};
  const present  = Object.values(att).filter(v => v === "Present").length;
  const upcoming = upcomingEvents(events);

  // Build last 6 weeks of attendance data from the DB attendance object
  // Each entry: { label: "Wk N", presentCount }
  const weeklyData = (() => {
    const weeks = [];
    for (let w = 5; w >= 0; w--) {
      const start = new Date();
      start.setDate(start.getDate() - start.getDay() + 1 - w * 7); // Monday of week
      let totalPresent = 0;
      for (let d = 0; d < 5; d++) {
        const dd = new Date(start);
        dd.setDate(start.getDate() + d);
        const dateStr = dd.toISOString().split("T")[0];
        const dayMap = attendance[dateStr] || {};
        totalPresent += Object.values(dayMap).filter(v => v === "Present").length;
      }
      weeks.push({ label: w === 0 ? "This Wk" : `${5 - w}wk ago`, value: totalPresent });
    }
    return weeks;
  })();

  const chartData   = weeklyData.map(w => w.value);
  const chartLabels = weeklyData.map(w => w.label.replace(" ago","").replace("This ",""));

  return (
    <div>
      <div className="ph">
        <h1>Welcome back, Admin</h1>
        <p>Here's what's happening at Nestify today</p>
      </div>
      <div className="sr" style={{ gridTemplateColumns:"repeat(4,1fr)" }}>
        <div className="sc"><p className="sv" style={{ color:"var(--text)" }}>{children.length}</p><p className="sl">Total Children</p></div>
        <div className="sc"><p className="sv" style={{ color:"var(--salmon)" }}>{teachers.length}</p><p className="sl">Teachers</p></div>
        <div className="sc"><p className="sv" style={{ color:"var(--teal)" }}>{present}</p><p className="sl">Present Today</p></div>
        <div className="sc"><p className="sv" style={{ color:"var(--yellow)" }}>{events.length}</p><p className="sl">Events</p></div>
      </div>
      <div className="tc">
        <div className="card" style={{ marginBottom:0 }}>
          <div className="ch">Attendance Overview <span style={{ fontSize:11, color:"var(--textm)", fontWeight:600 }}>Last 6 weeks</span></div>
          <div className="cb" style={{ height:150 }}><Chart data={chartData} labels={chartLabels} /></div>
        </div>
        <div className="card" style={{ marginBottom:0 }}>
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
    </div>
  );
}

// ── Admin Children ────────────────────────────────────────────────────────────
export function AdminChildren({ children, setChildren, classes, setClasses, attendance }) {
  const [q, setQ]       = useState("");
  const [add, setAdd]   = useState(false);
  const [view, setView] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const blankParent = { name:"", surname:"", email:"", phone:"", address:"" };
  const blank = {
    firstName:"", surname:"", age:"", gender:"Male", class_id:"", allergies:"None",
    p1: { ...blankParent },
    p2: { ...blankParent },
    hasP2: false,
  };
  const [form, setForm]     = useState(blank);
  const [errors, setErrors] = useState({});
  const [classWarn, setClassWarn] = useState("");

  const filtered = children.filter(c =>
    `${c.name} ${c.class}`.toLowerCase().includes(q.toLowerCase())
  );

  function setP1(field, val) { setForm(f => ({ ...f, p1: { ...f.p1, [field]: val } })); }
  function setP2(field, val) { setForm(f => ({ ...f, p2: { ...f.p2, [field]: val } })); }

  function checkClassCapacity(classId) {
    if (!classId) { setClassWarn(""); return; }
    const count = children.filter(c => String(c.class_id) === String(classId)).length;
    if (count >= 10) {
      setClassWarn("⚠️ This class has reached its 10-child limit. Please choose another class.");
    } else if (count >= 9) {
      setClassWarn("⚠️ This class has 9/10 children — only 1 spot remaining.");
    } else {
      setClassWarn("");
    }
  }

  function validate() {
    const err = {};
    if (!form.firstName.trim()) err.firstName = "Required";
    if (!form.surname.trim())   err.surname   = "Required";
    if (!form.age || +form.age < 1 || +form.age > 10) err.age = "1–10";
    if (!form.class_id) err.class_id = "Required";
    // Check capacity
    const count = children.filter(c => String(c.class_id) === String(form.class_id)).length;
    if (count >= 10) err.class_id = "Class is full (10/10)";
    // Parent 1 required
    if (!form.p1.name.trim())    err.p1name    = "Required";
    if (!form.p1.surname.trim()) err.p1surname = "Required";
    if (!form.p1.phone.trim())   err.p1phone   = "Required";
    return err;
  }

  async function save() {
    const err = validate();
    if (Object.keys(err).length) { setErrors(err); return; }
    setSaving(true);
    try {
      // Insert parent 1
      const { data: p1Data, error: p1Err } = await supabase.from("parents").insert({
        name: form.p1.name.trim(), surname: form.p1.surname.trim(),
        email: form.p1.email.trim() || null, phone: form.p1.phone.trim(),
        address: form.p1.address.trim() || null,
      }).select("id, name, surname, email, phone, address").single();
      if (p1Err) throw p1Err;

      // Insert parent 2 if provided
      let p2Data = null;
      if (form.hasP2 && form.p2.name.trim()) {
        const { data: p2, error: p2Err } = await supabase.from("parents").insert({
          name: form.p2.name.trim(), surname: form.p2.surname.trim(),
          email: form.p2.email.trim() || null, phone: form.p2.phone.trim() || null,
          address: form.p2.address.trim() || null,
        }).select("id, name, surname, email, phone, address").single();
        if (p2Err) throw p2Err;
        p2Data = p2;
      }

      // Insert child — "None" allergies saved as null
      const allergyVal = form.allergies === "None" ? null : form.allergies;
      const { data, error } = await supabase.from("kids").insert({
        name: form.firstName.trim(), surname: form.surname.trim(),
        age: +form.age, gender: form.gender,
        class_id: +form.class_id,
        allergies: allergyVal,
        parent1: p1Data.id,
        parent2: p2Data ? p2Data.id : null,
      }).select(`id, name, surname, age, gender, allergies, class_id,
                 class:class_id(id, className)`).single();
      if (error) throw error;

      const classObj = classes.find(c => c.id === +form.class_id);
      setChildren([...children, {
        id: data.id,
        name: `${data.name} ${data.surname}`,
        firstName: data.name, surname: data.surname,
        age: data.age, gender: data.gender,
        allergies: data.allergies || "None",
        class_id: data.class_id,
        class: classObj?.className || "—",
        parent: `${p1Data.name} ${p1Data.surname}`,
        phone: p1Data.phone || "—",
        parent1: p1Data,
        parent2: p2Data,
      }]);
      setAdd(false); setForm(blank); setErrors({}); setClassWarn("");
    } catch(e) {
      alert("Error saving: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function del(id) {
    if (!window.confirm("Remove this child?")) return;
    setDeleting(id);
    const { error } = await supabase.from("kids").delete().eq("id", id);
    setDeleting(null);
    if (error) { alert("Error: " + error.message); return; }
    setChildren(children.filter(c => c.id !== id));
  }

  return (
    <div>
      <div className="ph"><h1>Children Records</h1></div>
      <div className="fbar">
        <div className="srch">{Ic.search}<input placeholder="Search name or class…" value={q} onChange={x => setQ(x.target.value)}/></div>
        <button className="btn btn-p" onClick={() => setAdd(true)}>+ Add Child</button>
      </div>
      <div className="card">
        <div className="ch">All Children <span style={{ fontSize:12, color:"var(--textm)", fontWeight:600 }}>{filtered.length}</span></div>
        <div className="tw">
          <table>
            <thead><tr><th>Name</th><th>Age</th><th>Gender</th><th>Class</th><th>Parent</th><th>Allergies</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight:700 }}>{c.name}</td>
                  <td>{c.age} yrs</td>
                  <td><span className={`b ${c.gender === "Male" ? "bb2" : "bp2"}`}>{c.gender}</span></td>
                  <td><span className="b bs2">{c.class}</span></td>
                  <td>{c.parent}</td>
                  <td><span className={`b ${c.allergies === "None" ? "bg2" : "ba2"}`}>{c.allergies}</span></td>
                  <td>
                    <div style={{ display:"flex", gap:5 }}>
                      <button className="btn btn-o btn-s" onClick={() => setView(c)}>View</button>
                      <button className="btn btn-d btn-s" onClick={() => del(c.id)} disabled={deleting === c.id}>
                        {deleting === c.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7}><div className="empty">No children found</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {add && (
        <Modal title="Add New Child" onClose={() => { setAdd(false); setErrors({}); setClassWarn(""); }}
          footer={<><button className="btn btn-o" onClick={() => { setAdd(false); setErrors({}); setClassWarn(""); }}>Cancel</button><button className="btn btn-p" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Child"}</button></>}>
          <div className="fg2">
            <div className="fg"><label>First Name *</label><input value={form.firstName} onChange={x => setForm({...form,firstName:x.target.value})}/>{errors.firstName && <span className="err">{errors.firstName}</span>}</div>
            <div className="fg"><label>Surname *</label><input value={form.surname} onChange={x => setForm({...form,surname:x.target.value})}/>{errors.surname && <span className="err">{errors.surname}</span>}</div>
            <div className="fg"><label>Age *</label><input type="number" value={form.age} onChange={x => setForm({...form,age:x.target.value})} min={1} max={10}/>{errors.age && <span className="err">{errors.age}</span>}</div>
            <div className="fg"><label>Gender</label><select value={form.gender} onChange={x => setForm({...form,gender:x.target.value})}><option>Male</option><option>Female</option></select></div>
            <div className="fg"><label>Class *</label>
              <select value={form.class_id} onChange={x => { setForm({...form,class_id:x.target.value}); checkClassCapacity(x.target.value); }}>
                <option value="">Select class…</option>
                {classes.map(c => {
                  const cnt = children.filter(ch => String(ch.class_id) === String(c.id)).length;
                  return <option key={c.id} value={c.id} disabled={cnt >= 10}>{c.className} ({cnt}/10){cnt >= 10 ? " — FULL" : ""}</option>;
                })}
              </select>
              {errors.class_id && <span className="err">{errors.class_id}</span>}
              {classWarn && !errors.class_id && <span className="err">{classWarn}</span>}
            </div>
            <div className="fg"><label>Allergies</label>
              <select value={form.allergies} onChange={x => setForm({...form,allergies:x.target.value})}>
                <option>None</option><option>Peanuts</option><option>Dairy</option><option>Gluten</option><option>Eggs</option><option>Soy</option><option>Other</option>
              </select>
            </div>
          </div>
          {/* Parent 1 */}
          <div style={{ margin:"18px 0 8px", borderTop:"1px solid var(--border)", paddingTop:14 }}>
            <p className="sec-title" style={{ marginBottom:10 }}>Parent / Guardian 1 <span style={{ color:"var(--salmon)" }}>*</span></p>
            <div className="fg2">
              <div className="fg"><label>First Name *</label><input value={form.p1.name} onChange={x => setP1("name",x.target.value)}/>{errors.p1name && <span className="err">{errors.p1name}</span>}</div>
              <div className="fg"><label>Surname *</label><input value={form.p1.surname} onChange={x => setP1("surname",x.target.value)}/>{errors.p1surname && <span className="err">{errors.p1surname}</span>}</div>
              <div className="fg"><label>Phone *</label><input value={form.p1.phone} onChange={x => setP1("phone",x.target.value)}/>{errors.p1phone && <span className="err">{errors.p1phone}</span>}</div>
              <div className="fg"><label>Email</label><input type="email" value={form.p1.email} onChange={x => setP1("email",x.target.value)}/></div>
              <div className="fg full"><label>Address</label><input value={form.p1.address} onChange={x => setP1("address",x.target.value)}/></div>
            </div>
          </div>
          {/* Parent 2 toggle */}
          <div style={{ marginBottom: form.hasP2 ? 0 : 8 }}>
            <button className="btn btn-o btn-s" style={{ marginBottom: form.hasP2 ? 10 : 0 }}
              onClick={() => setForm(f => ({ ...f, hasP2: !f.hasP2, p2: { ...blankParent } }))}>
              {form.hasP2 ? "− Remove Second Parent" : "+ Add Second Parent (optional)"}
            </button>
          </div>
          {form.hasP2 && (
            <div style={{ marginBottom:8 }}>
              <p className="sec-title" style={{ marginBottom:10 }}>Parent / Guardian 2 <span style={{ color:"var(--textm)", fontWeight:400, textTransform:"none", fontSize:11 }}>(optional)</span></p>
              <div className="fg2">
                <div className="fg"><label>First Name</label><input value={form.p2.name} onChange={x => setP2("name",x.target.value)}/></div>
                <div className="fg"><label>Surname</label><input value={form.p2.surname} onChange={x => setP2("surname",x.target.value)}/></div>
                <div className="fg"><label>Phone</label><input value={form.p2.phone} onChange={x => setP2("phone",x.target.value)}/></div>
                <div className="fg"><label>Email</label><input type="email" value={form.p2.email} onChange={x => setP2("email",x.target.value)}/></div>
                <div className="fg full"><label>Address</label><input value={form.p2.address} onChange={x => setP2("address",x.target.value)}/></div>
              </div>
            </div>
          )}
        </Modal>
      )}
{view && <ChildDetailModal child={view} attendance={attendance} onClose={() => setView(null)} />}    </div>
  );
}

// ── Admin Staff ───────────────────────────────────────────────────────────────
export function AdminStaff({ teachers, setTeachers, chefs, setChefs, classes, setClasses }) {
  const [addT, setAddT]     = useState(false);
  const [addC, setAddC]     = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const bT = { firstName:"", surname:"", email:"", phone:"", address:"", class_id:"" };
  const bC = { firstName:"", surname:"", email:"", phone:"", address:"" };
  const [fT, setFT] = useState(bT);
  const [fC, setFC] = useState(bC);
  const [eT, setET] = useState({});
  const [eC, setEC] = useState({});
  const [classWarnT, setClassWarnT] = useState("");

  function checkTeacherClass(classId) {
    if (!classId) { setClassWarnT(""); return; }
    const assigned = teachers.find(t => String(t.class_id) === String(classId));
    if (assigned) {
      setClassWarnT(`⚠️ ${assigned.name} is already assigned to this class.`);
    } else {
      setClassWarnT("");
    }
  }

  async function saveTch() {
    const err = {};
    if (!fT.firstName.trim()) err.firstName = "Required";
    if (!fT.email.trim())     err.email     = "Required";
    // Warn but don't block if class already has a teacher
    if (Object.keys(err).length) { setET(err); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.from("teacher").insert({
        name: fT.firstName.trim(), surname: fT.surname.trim(),
        email: fT.email.trim(), phone: fT.phone.trim(), address: fT.address.trim(),
      }).select("id, name, surname, email, phone").single();
      if (error) throw error;

      // If class selected, update the class's teacher_id
      let assignedClass = "Unassigned";
      let assignedClassId = null;
      if (fT.class_id) {
        const { error: clsErr } = await supabase.from("class")
          .update({ teacher_id: data.id }).eq("id", +fT.class_id);
        if (clsErr) console.warn("Class assign error:", clsErr.message);
        const classObj = classes.find(c => c.id === +fT.class_id);
        assignedClass = classObj?.className || "Unassigned";
        assignedClassId = +fT.class_id;
        // Update local classes state so other components see the new assignment
        setClasses(prev => prev.map(c => c.id === +fT.class_id ? { ...c, teacher_id: data.id } : c));
      }

      setTeachers([...teachers, {
        id: data.id, name: `${data.name} ${data.surname}`,
        email: data.email, phone: data.phone,
        class: assignedClass, class_id: assignedClassId,
      }]);
      setAddT(false); setFT(bT); setET({}); setClassWarnT("");
    } catch(e) {
      alert("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveChef() {
    const err = {};
    if (!fC.firstName.trim()) err.firstName = "Required";
    if (!fC.email.trim())     err.email     = "Required";
    if (Object.keys(err).length) { setEC(err); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.from("chef").insert({
        name: fC.firstName.trim(), surname: fC.surname.trim(),
        email: fC.email.trim(), phone: fC.phone.trim(), address: fC.address.trim(),
      }).select("id, name, surname, email, phone").single();
      if (error) throw error;
      setChefs([...chefs, {
        id: data.id, name: `${data.name} ${data.surname}`,
        firstName: data.name, surname: data.surname,
        email: data.email, phone: data.phone,
      }]);
      setAddC(false); setFC(bC); setEC({});
    } catch(e) {
      alert("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function delTeacher(id) {
    if (!window.confirm("Remove this teacher?")) return;
    setDeleting(id);
    const { error } = await supabase.from("teacher").delete().eq("id", id);
    setDeleting(null);
    if (error) { alert("Error: " + error.message); return; }
    setTeachers(teachers.filter(t => t.id !== id));
  }

  async function delChef(id) {
    if (!window.confirm("Remove this chef?")) return;
    setDeleting(id);
    const { error } = await supabase.from("chef").delete().eq("id", id);
    setDeleting(null);
    if (error) { alert("Error: " + error.message); return; }
    setChefs(chefs.filter(c => c.id !== id));
  }

  return (
    <div>
      <div className="ph"><h1>Staff Management</h1></div>

      {/* Teachers */}
      <div className="fbar">
        <p className="sec-title" style={{ flex:1, marginBottom:0 }}>Teachers</p>
        <button className="btn btn-p" onClick={() => setAddT(true)}>+ Add Teacher</button>
      </div>
      <div className="card">
        <div className="tw">
          <table>
            <thead><tr><th>Name</th><th>Class</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight:700 }}>{t.name}</td>
                  <td><span className="b bs2">{t.class}</span></td>
                  <td style={{ color:"var(--salmon)" }}>{t.email}</td>
                  <td>{t.phone}</td>
                  <td><button className="btn btn-d btn-s" onClick={() => delTeacher(t.id)} disabled={deleting === t.id}>{deleting === t.id ? "…" : "Remove"}</button></td>
                </tr>
              ))}
              {teachers.length === 0 && <tr><td colSpan={5}><div className="empty">No teachers</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chefs */}
      <div className="fbar" style={{ marginTop:8 }}>
        <p className="sec-title" style={{ flex:1, marginBottom:0 }}>Chefs</p>
        <button className="btn btn-p" onClick={() => setAddC(true)}>+ Add Chef</button>
      </div>
      <div className="card">
        <div className="tw">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Actions</th></tr></thead>
            <tbody>
              {chefs.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight:700 }}>{c.name}</td>
                  <td style={{ color:"var(--teal)" }}>{c.email}</td>
                  <td>{c.phone}</td>
                  <td style={{ color:"var(--text2)" }}>{c.address || "—"}</td>
                  <td><button className="btn btn-d btn-s" onClick={() => delChef(c.id)} disabled={deleting === c.id}>{deleting === c.id ? "…" : "Remove"}</button></td>
                </tr>
              ))}
              {chefs.length === 0 && <tr><td colSpan={5}><div className="empty">No chefs</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Teacher Modal */}
      {addT && (
        <Modal title="Add Teacher" onClose={() => { setAddT(false); setClassWarnT(""); }}
          footer={<><button className="btn btn-o" onClick={() => { setAddT(false); setClassWarnT(""); }}>Cancel</button><button className="btn btn-p" onClick={saveTch} disabled={saving}>{saving ? "Saving…" : "Save"}</button></>}>
          <div className="fg2">
            <div className="fg"><label>First Name *</label><input value={fT.firstName} onChange={x => setFT({...fT,firstName:x.target.value})}/>{eT.firstName && <span className="err">{eT.firstName}</span>}</div>
            <div className="fg"><label>Surname</label><input value={fT.surname} onChange={x => setFT({...fT,surname:x.target.value})}/></div>
            <div className="fg"><label>Email *</label><input type="email" value={fT.email} onChange={x => setFT({...fT,email:x.target.value})}/>{eT.email && <span className="err">{eT.email}</span>}</div>
            <div className="fg"><label>Phone</label><input value={fT.phone} onChange={x => setFT({...fT,phone:x.target.value})}/></div>
            <div className="fg full"><label>Address</label><input value={fT.address} onChange={x => setFT({...fT,address:x.target.value})}/></div>
            <div className="fg full"><label>Assign Class</label>
              <select value={fT.class_id} onChange={x => { setFT({...fT,class_id:x.target.value}); checkTeacherClass(x.target.value); }}>
                <option value="">No class assigned</option>
                {classes.map(c => {
                  const isAssigned = teachers.find(t => String(t.class_id) === String(c.id));
                  return <option key={c.id} value={c.id}>{c.className}{isAssigned ? ` (${isAssigned.name})` : ""}</option>;
                })}
              </select>
              {classWarnT && <span className="err">{classWarnT}</span>}
            </div>
          </div>
        </Modal>
      )}

      {/* Add Chef Modal */}
      {addC && (
        <Modal title="Add Chef" onClose={() => setAddC(false)}
          footer={<><button className="btn btn-o" onClick={() => setAddC(false)}>Cancel</button><button className="btn btn-p" onClick={saveChef} disabled={saving}>{saving ? "Saving…" : "Save"}</button></>}>
          <div className="fg2">
            <div className="fg"><label>First Name *</label><input value={fC.firstName} onChange={x => setFC({...fC,firstName:x.target.value})}/>{eC.firstName && <span className="err">{eC.firstName}</span>}</div>
            <div className="fg"><label>Surname</label><input value={fC.surname} onChange={x => setFC({...fC,surname:x.target.value})}/></div>
            <div className="fg"><label>Email *</label><input type="email" value={fC.email} onChange={x => setFC({...fC,email:x.target.value})}/>{eC.email && <span className="err">{eC.email}</span>}</div>
            <div className="fg"><label>Phone</label><input value={fC.phone} onChange={x => setFC({...fC,phone:x.target.value})}/></div>
            <div className="fg full"><label>Address</label><input value={fC.address} onChange={x => setFC({...fC,address:x.target.value})}/></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Admin Schedule ────────────────────────────────────────────────────────────
export function AdminSchedule({ schedule, setSchedule }) {
  const [editing, setEditing] = useState(null);
  const [val, setVal]         = useState("");
  const [saving, setSaving]   = useState(false);

  function startEdit(day, slotKey, slotTime, cur) {
    setEditing({ day, slotKey, slotTime });
    setVal(cur || "");
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from("schedule").upsert({
      weekday: editing.day,
      name: val,
      timeframe: editing.slotKey,
    }, { onConflict: "weekday,timeframe" });
    setSaving(false);
    if (error) { alert("Error saving: " + error.message); return; }
    setSchedule(prev => ({
      ...prev,
      [editing.day]: { ...prev[editing.day], [editing.slotKey]: val }
    }));
    setEditing(null);
  }

  return (
    <div>
      <div className="ph"><h1>Weekly Schedule</h1><p>Click any activity cell to edit</p></div>
      <div className="card">
        <div className="cb" style={{ paddingTop:16 }}>
          <div className="wsg">
            {DAYS_ORDER.map(day => (
              <div key={day} className="wsg-col">
                <div className={`wsg-head ${day === todayDayName ? "tod" : ""}`}>{day.slice(0,3).toUpperCase()}</div>
                {/* Fixed top */}
                <div className={`wsg-cell ${FIXED_TOP.color} wsg-fixed`}>
                  <div className="wsg-name">{FIXED_TOP.name}</div>
                  <div className="wsg-time">{FIXED_TOP.time} · Fixed</div>
                </div>
                {/* Editable slots */}
                {SLOTS.map(sl => (
                  <div key={sl.key} className={`wsg-cell ${sl.color}`}
                    style={{ cursor:"pointer", position:"relative" }}
                    onClick={() => startEdit(day, sl.key, sl.time, schedule[day]?.[sl.key])}>
                    <div className="wsg-name">{schedule[day]?.[sl.key] || "—"}</div>
                    <div className="wsg-time">{sl.time}</div>
                    <span style={{ position:"absolute", top:4, right:4, fontSize:10, opacity:.4 }}>{Ic.edit}</span>
                  </div>
                ))}
                {/* Fixed bottom rows */}
                {FIXED_ROWS.map(fr => (
                  <div key={fr.key} className={`wsg-cell ${fr.color} wsg-fixed`}>
                    <div className="wsg-name">{fr.name}</div>
                    <div className="wsg-time">{fr.time} · Fixed</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {editing && (
        <Modal title={`Edit — ${editing.day} · ${editing.slotTime}`} onClose={() => setEditing(null)}
          footer={<><button className="btn btn-o" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-p" onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</button></>}>
          <div className="fg">
            <label>Activity Name</label>
            <input value={val} onChange={e => setVal(e.target.value)} placeholder="e.g. Story Time" autoFocus onKeyDown={e => e.key === "Enter" && saveEdit()}/>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Admin Events ──────────────────────────────────────────────────────────────
export function AdminEvents({ events, setEvents }) {
  const [add, setAdd]       = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm]     = useState({ name:"", date:"", desc:"" });
  const [errors, setErrors] = useState({});

  async function save() {
    const err = {};
    if (!form.name.trim()) err.name = "Required";
    if (!form.date)        err.date = "Required";
    if (Object.keys(err).length) { setErrors(err); return; }
    setSaving(true);
    const { data, error } = await supabase.from("event").insert({
      name: form.name.trim(),
      date: form.date,
      description: form.desc.trim(),
    }).select("id, name, date, description").single();
    setSaving(false);
    if (error) { alert("Error: " + error.message); return; }
    setEvents(prev => [...prev, {
      id: data.id, name: data.name, date: data.date,
      desc: data.description || "",
      colorClass: ["c1","c2","c3"][prev.length % 3],
    }]);
    setAdd(false); setForm({ name:"", date:"", desc:"" }); setErrors({});
  }

  async function del(id) {
    if (!window.confirm("Remove this event?")) return;
    setDeleting(id);
    const { error } = await supabase.from("event").delete().eq("id", id);
    setDeleting(null);
    if (error) { alert("Error: " + error.message); return; }
    setEvents(events.filter(x => x.id !== id));
  }

  return (
    <div>
      <div className="ph"><h1>Events</h1></div>
      <div className="fbar" style={{ justifyContent:"flex-end" }}>
        <button className="btn btn-p" onClick={() => setAdd(true)}>+ Add Event</button>
      </div>
      <div className="card">
        <div className="ch">Events <span style={{ fontSize:12, color:"var(--textm)", fontWeight:600 }}>{events.length} total</span></div>
        <div className="tw">
          <table>
            <thead><tr><th>Event Name</th><th>Date</th><th>Description</th><th>Actions</th></tr></thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id}>
                  <td style={{ fontWeight:700 }}>{ev.name}</td>
                  <td>{fmtDate(ev.date)}</td>
                  <td style={{ color:"var(--text2)" }}>{ev.desc || "—"}</td>
                  <td><button className="btn btn-d btn-s" onClick={() => del(ev.id)} disabled={deleting === ev.id}>{deleting === ev.id ? "…" : "Remove"}</button></td>
                </tr>
              ))}
              {events.length === 0 && <tr><td colSpan={4}><div className="empty">No events yet</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {add && (
        <Modal title="Add Event" onClose={() => setAdd(false)}
          footer={<><button className="btn btn-o" onClick={() => setAdd(false)}>Cancel</button><button className="btn btn-p" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Event"}</button></>}>
          <div className="fg2">
            <div className="fg full"><label>Event Name *</label><input value={form.name} onChange={x => setForm({...form,name:x.target.value})}/>{errors.name && <span className="err">{errors.name}</span>}</div>
            <div className="fg"><label>Date *</label><input type="date" value={form.date} onChange={x => setForm({...form,date:x.target.value})}/>{errors.date && <span className="err">{errors.date}</span>}</div>
            <div className="fg full"><label>Description</label><textarea value={form.desc} onChange={x => setForm({...form,desc:x.target.value})} placeholder="Brief description…"/></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Admin Reports ─────────────────────────────────────────────────────────────
export function AdminReports({ attendance }) {
  const [start, setStart] = useState(today);
  const [end, setEnd]     = useState(today);

  const dates   = Object.keys(attendance).filter(d => d >= start && d <= end);
  const total   = dates.reduce((a, d) => a + Object.values(attendance[d]).length, 0);
  const present = dates.reduce((a, d) => a + Object.values(attendance[d]).filter(v => v === "Present").length, 0);
  const absent  = total - present;

  return (
    <div>
      <div className="ph"><h1>Reports</h1></div>
      <div className="card">
        <div className="ch">Attendance Report</div>
        <div className="cb">
          <div className="fbar" style={{ marginBottom:18 }}>
            <div className="fg"><label>From</label><input type="date" value={start} onChange={x => setStart(x.target.value)}/></div>
            <div className="fg"><label>To</label><input type="date" value={end} onChange={x => setEnd(x.target.value)}/></div>
          </div>
          <div className="rs2">
            <div className="rsi"><p className="rv" style={{ color:"var(--teal)" }}>{present}</p><p className="rl">Present</p></div>
            <div className="rsi"><p className="rv" style={{ color:"var(--salmon)" }}>{absent}</p><p className="rl">Absent</p></div>
            <div className="rsi"><p className="rv">{total > 0 ? Math.round((present/total)*100) : 0}%</p><p className="rl">Rate</p></div>
          </div>
          {dates.length > 0
            ? <div className="tw"><table>
                <thead><tr><th>Date</th><th>Present</th><th>Absent</th><th>Rate</th></tr></thead>
                <tbody>
                  {dates.map(d => {
                    const vs = Object.values(attendance[d]);
                    const p  = vs.filter(v => v === "Present").length;
                    const a  = vs.length - p;
                    return (
                      <tr key={d}>
                        <td>{fmtDate(d)}</td>
                        <td><span className="b bg2">{p}</span></td>
                        <td><span className="b br2">{a}</span></td>
                        <td>{vs.length > 0 ? Math.round((p/vs.length)*100) : 0}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table></div>
            : <div className="empty">No data in selected range</div>
          }
        </div>
      </div>
    </div>
  );
}