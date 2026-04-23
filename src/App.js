import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import LoginPage from "./LoginPage";

import { css, Ic, today, initEvents } from "./shared.js";

import { AdminDashboard, AdminChildren, AdminStaff, AdminSchedule, AdminEvents, AdminReports } from "./AdminPages.js";
import { TeacherDashboard, TeacherAttendance, TeacherSchedule, TeacherNotes } from "./TeacherPages.js";
import { ChefDashboard, ChefAI, ChefMealPlan } from "./ChefPages.js";

const ADMIN_NAV = [
  { id:"dashboard", ic:Ic.home,   lb:"Dashboard" },
  { id:"children",  ic:Ic.child,  lb:"Children"  },
  { id:"staff",     ic:Ic.staff,  lb:"Staff"     },
  { id:"schedule",  ic:Ic.sched,  lb:"Schedule"  },
  { id:"events",    ic:Ic.event,  lb:"Events"    },
  { id:"reports",   ic:Ic.report, lb:"Reports"   },
];
const TEACHER_NAV = [
  { id:"dashboard",  ic:Ic.home,  lb:"Dashboard"    },
  { id:"attendance", ic:Ic.att,   lb:"Attendance"   },
  { id:"schedule",   ic:Ic.sched, lb:"Schedule"     },
  { id:"notes",      ic:Ic.note,  lb:"Observations" },
];
const CHEF_NAV = [
  { id:"dashboard", ic:Ic.home, lb:"Dashboard"      },
  { id:"ai",        ic:Ic.ai,   lb:"AI Meal Planner"},
  { id:"mealplan",  ic:Ic.meal, lb:"Weekly Meal Plan"},
];

export default function App() {
  const [user, setUser]         = useState(null); // { id, username, role }
  const [page, setPage]         = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  // Data
  const [children,  setChildren]  = useState([]);
  const [teachers,  setTeachers]  = useState([]);
  const [chefs,     setChefs]     = useState([]);
  const [classes,   setClasses]   = useState([]);
  const [attendance,setAtt]       = useState({});
  const [events,    setEvents]    = useState([]);
  const [schedule,  setSchedule]  = useState({});
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  // Teacher-specific: which class this teacher teaches
  const [myClass,   setMyClass]   = useState(null); // { id, className }

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      // Fetch classes
      const { data: classData, error: classErr } = await supabase
        .from("class").select("id, className, teacher_id");
      if (classErr) throw classErr;
      setClasses(classData || []);

      // Fetch kids with class info and parent info
      const { data: kidsData, error: kidsErr } = await supabase
        .from("kids")
        .select(`
          id,
          name,
          surname,
          age,
          gender,
          allergies,
          class_id,
          class(id, className),
          parent1_info:parents!kids_parent1_fkey(id, name, surname, email, phone, address),
          parent2_info:parents!kids_parent2_fkey(id, name, surname, email, phone, address)
        `)
      if (kidsErr) throw kidsErr;
      // Normalize kids to shape used by components
      const normalizedKids = (kidsData || []).map(k => ({
        id: k.id,
        name: `${k.name} ${k.surname}`,
        firstName: k.name,
        surname: k.surname,
        age: k.age,
        gender: k.gender,
        allergies: k.allergies || "None",
        class_id: k.class_id,
        class: k.class?.className || "—",
        parent: k.parent1_info ? `${k.parent1_info.name} ${k.parent1_info.surname}` : "—",
        phone: k.parent1_info?.phone || "—",
        parent1: k.parent1_info || null,
        parent2: k.parent2_info || null,
      }));
      setChildren(normalizedKids);

      // Fetch teachers (joined with user + class)
      const { data: teacherData, error: teacherErr } = await supabase
        .from("teacher")
        .select(`
          id,
          name,
          surname,
          email,
          phone,
          user_id,
          class!teacher_id(id, className)
        `);
      if (teacherErr) throw teacherErr;
      const normalizedTeachers = (teacherData || []).map(t => ({
        id: t.id,
        name: `${t.name} ${t.surname}`,
        firstName: t.name,
        surname: t.surname,
        email: t.email,
        phone: t.phone,
        user_id: t.user_id,
        class: t.class?.[0]?.className || "Unassigned",
        class_id: t.class?.[0]?.id || null,
      }));
      setTeachers(normalizedTeachers);

      // Fetch chefs
      const { data: chefData, error: chefErr } = await supabase
        .from("chef")
        .select("id, name, surname, email, phone, address, user_id");
      if (chefErr) throw chefErr;
      setChefs((chefData || []).map(c => ({
        id: c.id,
        name: `${c.name || ""} ${c.surname || ""}`.trim(),
        firstName: c.name,
        surname: c.surname,
        email: c.email,
        phone: c.phone,
        address: c.address,
        user_id: c.user_id,
      })));

      // If current user is a teacher, find their class
      if (user.role === "teacher") {
        const myTeacher = normalizedTeachers.find(t => t.user_id === user.id);
        if (myTeacher) {
          const myC = classData?.find(c => c.teacher_id === myTeacher.id);
          setMyClass(myC || null);
        }
      }

      // Fetch events
      const { data: eventData, error: eventErr } = await supabase
        .from("event").select("id, name, date, description");
      if (eventErr) throw eventErr;
      setEvents((eventData || []).map((e, i) => ({
        id: e.id,
        name: e.name,
        date: e.date,
        desc: e.description || "",
        colorClass: ["c1","c2","c3"][i % 3],
      })));

      // Fetch schedule — DB rows have weekday + timeframe + name
      // timeframe values: "8:30-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00"
      const { data: schedData, error: schedErr } = await supabase
        .from("schedule").select("id, weekday, name, timeframe");
      if (schedErr) throw schedErr;
      const schedMap = {};
      const dayOrder = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
      dayOrder.forEach(day => {
        schedMap[day] = {};
        (schedData || []).filter(s => s.weekday === day).forEach(item => {
          if (item.timeframe) schedMap[day][item.timeframe] = item.name;
        });
      });
      setSchedule(schedMap);

      // Fetch attendance
      const { data: attData, error: attErr } = await supabase
        .from("attendance").select("id, child_id, date, status");
      if (attErr) throw attErr;
      const attMap = {};
      (attData || []).forEach(({ child_id, date, status }) => {
        if (!attMap[date]) attMap[date] = {};
        attMap[date][child_id] = status;
      });
      setAtt(attMap);

    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(userData) {
    setUser(userData);
    setPage("dashboard");
  }

  function handleLogout() {
    setUser(null);
    setPage("dashboard");
    setChildren([]); setTeachers([]); setChefs([]); setClasses([]);
    setAtt({}); setEvents([]); setSchedule({});
  }

  function goPage(p) { setPage(p); setMenuOpen(false); }

  function renderPage() {
    const role = user?.role;
    if (role === "admin") {
      switch (page) {
        case "dashboard": return <AdminDashboard children={children} teachers={teachers} events={events} attendance={attendance} />;
        case "children":  return <AdminChildren  children={children} setChildren={setChildren} classes={classes} setClasses={setClasses} />;
        case "staff":     return <AdminStaff     teachers={teachers} setTeachers={setTeachers} chefs={chefs} setChefs={setChefs} classes={classes} setClasses={setClasses} />;
        case "schedule":  return <AdminSchedule  schedule={schedule} setSchedule={setSchedule} />;
        case "events":    return <AdminEvents    events={events}     setEvents={setEvents} />;
        case "reports":   return <AdminReports   attendance={attendance} />;
        default: return null;
      }
    }
    if (role === "teacher") {
      const classLabel = myClass?.className || "—";
      const classId    = myClass?.id || null;
      switch (page) {
        case "dashboard":  return <TeacherDashboard  myClass={classLabel} classId={classId} children={children} attendance={attendance} events={events} />;
        case "attendance": return <TeacherAttendance myClass={classLabel} classId={classId} children={children} attendance={attendance} setAttendance={setAtt} />;
        case "schedule":   return <TeacherSchedule   schedule={schedule} />;
        case "notes":      return <TeacherNotes      myClass={classLabel} classId={classId} children={children} />;
        default: return null;
      }
    }
    if (role === "chef") {
      switch (page) {
        case "dashboard": return <ChefDashboard children={children} />;
        case "ai":        return <ChefAI        children={children} />;
        case "mealplan":  return <ChefMealPlan children={children} />;
        default: return null;
      }
    }
    return null;
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <>
        <style>{css}</style>
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  const role = user.role;
  const nav  = role === "admin" ? ADMIN_NAV : role === "teacher" ? TEACHER_NAV : CHEF_NAV;

  const userInfo = {
    initials: user.username.slice(0,2).toUpperCase(),
    name: user.username,
    role: role.charAt(0).toUpperCase() + role.slice(1),
  };

  return (
    <>
      <style>{css}</style>
      <div className={`overlay-bg${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(false)} />
      <div className="app">
        {/* Sidebar */}
        <aside className={`sb${menuOpen ? " open" : ""}`}>
          <div className="sb-logo">
            <div className="sb-logo-row">
              <div className="sb-ico">{Ic.nest}</div>
              <span className="sb-brand">Nestify</span>
            </div>
            <span className="sb-sub">Management System</span>
          </div>

          <nav className="sb-nav" style={{ marginTop: 12 }}>
            {nav.map(item => (
              <div key={item.id} className={`ni${page === item.id ? " on" : ""}`} onClick={() => goPage(item.id)}>
                {item.ic}{item.lb}
              </div>
            ))}
          </nav>

          <div className="sb-user">
            <div className="sb-av">{userInfo.initials}</div>
            <div className="sb-ui">
              <p>{userInfo.name}</p>
              <span>{userInfo.role}</span>
            </div>
          </div>
          <button className="logout" onClick={handleLogout}>Log out</button>
        </aside>

        {/* Main */}
        <div className="main">
          <div className="topbar">
            <button onClick={() => setMenuOpen(o => !o)}
              style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", gap:"4px", padding:"4px" }}>
              <span style={{ display:"block", width:"20px", height:"2px", background:"var(--text)", borderRadius:"2px" }}/>
              <span style={{ display:"block", width:"20px", height:"2px", background:"var(--text)", borderRadius:"2px" }}/>
              <span style={{ display:"block", width:"20px", height:"2px", background:"var(--text)", borderRadius:"2px" }}/>
            </button>
            <span>Nestify</span>
            <div style={{ width:28 }}/>
          </div>

          <div className="content">
            {loading ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", flexDirection:"column", gap:12 }}>
                <div style={{ width:36, height:36, border:"3px solid var(--border)", borderTop:"3px solid var(--salmon)", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
                <p style={{ color:"var(--text2)", fontWeight:600 }}>Loading data…</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : error ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", flexDirection:"column", gap:10 }}>
                <p style={{ color:"var(--red-t)", fontWeight:700, fontSize:16 }}>⚠️ Could not load data</p>
                <p style={{ color:"var(--text2)", fontSize:13 }}>{error}</p>
                <button className="btn btn-p" onClick={fetchAll}>Retry</button>
              </div>
            ) : renderPage()}
          </div>
        </div>
      </div>
    </>
  );
}