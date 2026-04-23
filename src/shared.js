import { useState } from "react";

// ── CSS ───────────────────────────────────────────────────────────────────────
export const css = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#FDF6F0;--white:#FFFFFF;
  --salmon:#F0715A;--salmon-l:#FDEAE6;--salmon-hover:#E8604A;
  --teal:#4BBFAD;--teal-l:#E0F5F2;
  --yellow:#F5C842;--yellow-l:#FEF8E1;
  --purple:#9B7EDE;--purple-l:#F0EBFF;
  --green-l:#E4F5EC;--green-t:#3A9E6A;
  --red-l:#FADADD;--red-t:#C0394B;
  --amber-l:#FFF0D6;--amber-t:#B07A1A;
  --pink-l:#F9E8F5;--pink-t:#9B5EAB;
  --blue-l:#E8F2FB;--blue-t:#2E7DC0;
  --sch-blue-bg:#DDEEFF;--sch-blue-br:#7BB8E8;
  --sch-green-bg:#D8F0E4;--sch-green-br:#5BAB82;
  --sch-purple-bg:#EAE0FF;--sch-purple-br:#9B7EDE;
  --text:#2C2C2C;--text2:#6B7280;--textm:#A0AEC0;
  --border:#EDE8E3;--r:16px;--rs:10px;
  --shadow:0 2px 10px rgba(0,0,0,.06);
}
html,body,#root{height:100%;width:100%}
body{font-family:'Nunito',sans-serif;background:var(--bg);color:var(--text);font-size:14px}
.app{display:flex;height:100vh;width:100vw;max-width:100vw;overflow:hidden}
.sb{width:220px;min-width:220px;flex-shrink:0;background:var(--white);display:flex;flex-direction:column;border-right:1px solid var(--border);transition:transform .25s;z-index:100;height:100vh;overflow-y:auto;overflow-x:hidden;position:sticky;top:0;align-self:flex-start}
.sb::-webkit-scrollbar{width:0}
.main{flex:1;min-width:0;max-width:calc(100vw - 220px);display:flex;flex-direction:column;overflow:hidden}
.content{flex:1;overflow-y:auto;overflow-x:hidden;padding:24px 28px}
.content::-webkit-scrollbar{width:4px}
.content::-webkit-scrollbar-thumb{background:var(--border);border-radius:10px}
.sb-logo{padding:20px 18px 14px;display:flex;flex-direction:column;gap:3px;border-bottom:1px solid var(--border)}
.sb-logo-row{display:flex;align-items:center;gap:10px}
.sb-ico{width:36px;height:36px;border-radius:11px;background:linear-gradient(135deg,#F0715A,#F5A68A);display:flex;align-items:center;justify-content:center}
.sb-ico svg{width:18px;height:18px;color:white}
.sb-brand{font-size:17px;font-weight:800}
.sb-sub{font-size:11px;color:var(--textm);margin-left:46px}
.role-tabs{margin:10px 12px 8px;display:flex;background:var(--bg);border-radius:9px;padding:3px}
.rt{flex:1;padding:5px 0;text-align:center;font-size:12px;font-weight:700;border:none;border-radius:7px;cursor:pointer;transition:all .15s;background:transparent;color:var(--textm);font-family:'Nunito',sans-serif}
.rt.on{background:var(--white);color:var(--salmon);box-shadow:var(--shadow)}
.sb-nav{flex:1;padding:4px 10px;overflow-y:auto}
.sb-nav::-webkit-scrollbar{width:0}
.ni{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:11px;cursor:pointer;font-size:13px;font-weight:600;color:var(--text2);transition:all .15s;margin-bottom:2px}
.ni:hover{background:var(--bg);color:var(--text)}
.ni.on{background:var(--salmon);color:white}
.ni.on svg{color:white}
.ni svg{width:16px;height:16px;flex-shrink:0;color:var(--text2)}
.sb-user{padding:12px 14px;border-top:1px solid var(--border);display:flex;align-items:center;gap:9px}
.sb-av{width:34px;height:34px;border-radius:50%;background:var(--teal-l);color:var(--teal);font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sb-ui p{font-size:13px;font-weight:700;line-height:1.2}
.sb-ui span{font-size:11px;color:var(--textm)}
.logout{margin:0 12px 12px;padding:8px;background:var(--text);color:white;border:none;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Nunito',sans-serif;width:calc(100% - 24px)}
.logout:hover{opacity:.85}
.topbar{display:none;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--white);border-bottom:1px solid var(--border)}
.topbar span{font-size:16px;font-weight:800}
.overlay-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:99}
.ph{margin-bottom:20px}
.ph h1{font-size:21px;font-weight:800}
.ph p{font-size:13px;color:var(--text2);margin-top:2px}
.card{background:var(--white);border-radius:var(--r);box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px}
.ch{padding:14px 20px 10px;font-size:15px;font-weight:800;display:flex;align-items:center;justify-content:space-between}
.cb{padding:2px 20px 18px}
.sr{display:grid;gap:12px;margin-bottom:20px}
.sc{background:var(--white);border-radius:var(--r);padding:15px 17px;box-shadow:var(--shadow)}
.sc .sv{font-size:26px;font-weight:800;margin-bottom:2px}
.sc .sl{font-size:12px;font-weight:600;color:var(--text2)}
.tc{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
.evc{background:var(--white);border-radius:var(--r);padding:13px 15px;margin-bottom:10px;border-left:4px solid var(--salmon);box-shadow:var(--shadow)}
.evc.c1{border-color:var(--salmon)}.evc.c2{border-color:var(--teal)}.evc.c3{border-color:var(--yellow)}
.evc.c1 .ev-date{color:var(--salmon)}.evc.c2 .ev-date{color:var(--teal)}.evc.c3 .ev-date{color:var(--yellow)}
.evc .ev-name{font-size:14px;font-weight:800;margin-bottom:3px}
.evc .ev-date{font-size:12px;font-weight:700;margin-bottom:4px}
.evc .ev-desc{font-size:12px;color:var(--text2);line-height:1.4}
.tw{overflow-x:auto;max-width:100%}
table{width:100%;border-collapse:collapse;font-size:13px;table-layout:auto}
th{padding:9px 14px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--textm);background:var(--bg);border-bottom:1px solid var(--border)}
td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:#FBF7F4}
.b{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700}
.bg2{background:var(--green-l);color:var(--green-t)}
.br2{background:var(--red-l);color:var(--red-t)}
.bb2{background:var(--blue-l);color:var(--blue-t)}
.ba2{background:var(--amber-l);color:var(--amber-t)}
.bp2{background:var(--pink-l);color:var(--pink-t)}
.bt2{background:var(--teal-l);color:var(--teal)}
.bs2{background:var(--salmon-l);color:var(--salmon)}
.bx2{background:var(--bg);color:var(--text2)}
.btn{display:inline-flex;align-items:center;gap:5px;padding:8px 16px;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:all .15s;font-family:'Nunito',sans-serif}
.btn-p{background:var(--salmon);color:white}.btn-p:hover{background:var(--salmon-hover)}
.btn-o{background:transparent;color:var(--text2);border:1.5px solid var(--border)}.btn-o:hover{background:var(--bg)}
.btn-d{background:var(--red-l);color:var(--red-t)}
.btn-s{padding:5px 11px;font-size:12px}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.fg{display:flex;flex-direction:column;gap:5px}
.fg.full{grid-column:1/-1}
.fg label{font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.4px}
.fg input,.fg select,.fg textarea{padding:9px 11px;border:1.5px solid var(--border);border-radius:var(--rs);font-size:13px;font-family:'Nunito',sans-serif;background:var(--bg);color:var(--text);outline:none}
.fg input:focus,.fg select:focus,.fg textarea:focus{border-color:var(--salmon);background:white}
.fg textarea{resize:vertical;min-height:70px}
.err{font-size:11px;color:var(--red-t)}
.ov{position:fixed;inset:0;background:rgba(44,44,44,.4);display:flex;align-items:center;justify-content:center;z-index:1000}
.modal{background:white;border-radius:var(--r);width:540px;max-width:95vw;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.16)}
.mh{padding:15px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:white;z-index:1}
.mh h3{font-size:16px;font-weight:800}
.mx{background:none;border:none;font-size:24px;cursor:pointer;color:var(--textm);line-height:1}
.mf{padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px}
.fbar{display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;margin-bottom:16px}
.srch{display:flex;align-items:center;gap:7px;background:white;border:1.5px solid var(--border);border-radius:20px;padding:7px 13px}
.srch input{border:none;background:transparent;outline:none;font-size:13px;font-family:'Nunito',sans-serif;width:155px}
.att-p,.att-a{padding:4px 11px;border-radius:20px;border:none;font-size:12px;font-weight:700;cursor:pointer;font-family:'Nunito',sans-serif;transition:all .12s}
.att-p{background:var(--green-l);color:var(--green-t)}.att-p.sel{background:#3A9E6A;color:white}
.att-a{background:var(--red-l);color:var(--red-t)}.att-a.sel{background:#C0394B;color:white}
.note{background:var(--white);border-radius:var(--rs);padding:12px 14px;margin-bottom:9px;border-left:3px solid var(--salmon);box-shadow:var(--shadow)}
.nm{display:flex;justify-content:space-between;margin-bottom:5px}
.nc{font-size:13px;font-weight:700}
.nd{font-size:11px;color:var(--textm)}
.note p{font-size:13px;line-height:1.5;color:var(--text2)}
.rs2{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}
.rsi{background:var(--bg);border-radius:var(--rs);padding:14px;text-align:center}
.rsi .rv{font-size:26px;font-weight:800}
.rsi .rl{font-size:11px;font-weight:700;color:var(--textm);text-transform:uppercase;letter-spacing:.4px;margin-top:2px}
.sec-title{font-size:13px;font-weight:800;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.empty{text-align:center;padding:36px;color:var(--textm);font-size:13px}
.wsg{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;padding:4px 0}
.wsg-col{}
.wsg-head{text-align:center;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:var(--textm);margin-bottom:10px}
.wsg-head.tod{color:var(--salmon)}
.wsg-cell{border-radius:12px;padding:14px 12px;margin-bottom:10px;border:2px solid transparent;text-align:center}
.wsg-cell:last-child{margin-bottom:0}
.wsg-cell.blue{background:var(--sch-blue-bg);border-color:var(--sch-blue-br)}
.wsg-cell.green{background:var(--sch-green-bg);border-color:var(--sch-green-br)}
.wsg-cell.purple{background:var(--sch-purple-bg);border-color:var(--sch-purple-br)}
.wsg-cell.lunch{background:#FFF8E8;border-color:#E8C860}
.wsg-cell.wsg-fixed{opacity:.85}
.wsg-cell.wsg-fixed .wsg-time{font-style:italic}
.wsg-name{font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px}
.wsg-time{font-size:11px;color:var(--text2)}
.ai-box{background:var(--white);border-radius:var(--r);box-shadow:var(--shadow);padding:22px;margin-bottom:16px}
.ai-input-row{display:flex;gap:10px;margin-bottom:16px}
.ai-input-row input{flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:20px;font-size:13px;font-family:'Nunito',sans-serif;background:var(--bg);outline:none}
.ai-input-row input:focus{border-color:var(--salmon);background:white}
.ai-response{background:var(--bg);border-radius:var(--rs);padding:16px;font-size:13px;line-height:1.7;color:var(--text2);white-space:pre-wrap;min-height:80px}
.allergy-pill{display:inline-flex;align-items:center;gap:6px;background:var(--amber-l);border:1.5px solid #E8C87A;border-radius:20px;padding:6px 14px;margin:4px;font-size:13px;font-weight:700;color:var(--amber-t)}
.allergy-count{background:var(--amber-t);color:white;border-radius:20px;padding:1px 8px;font-size:12px}
@media(max-width:768px){
  .app{flex-direction:column;overflow-x:hidden}
  .sb{position:fixed;top:0;left:0;height:100vh;transform:translateX(-100%);align-self:auto}
  .sb.open{transform:translateX(0)}
  .main{max-width:100vw}
  .overlay-bg.open{display:block}
  .topbar{display:flex}
  .content{padding:14px}
  .tc{grid-template-columns:1fr}
  .sr{grid-template-columns:repeat(2,1fr) !important}
  .fg2{grid-template-columns:1fr}
  .fg.full{grid-column:1/-1}
  table{font-size:12px}
  th,td{padding:8px 10px}
  .rs2{grid-template-columns:1fr}
  .wsg{grid-template-columns:repeat(3,1fr)}
}
@media(max-width:480px){
  .sr{grid-template-columns:1fr 1fr !important}
  .wsg{grid-template-columns:repeat(2,1fr)}
  .btn{font-size:12px;padding:7px 12px}
}
`;

// ── Constants ─────────────────────────────────────────────────────────────────
export const CLASSES = ["Sunflower", "Bluebell", "Daisy", "Rainbow", "Maple"];
export const today = new Date().toISOString().split("T")[0];
export const WEEK_DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
export const todayDayName = WEEK_DAYS[new Date().getDay()];
export const DAYS_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday"];

// Fixed rows (not editable)
export const FIXED_TOP  = { key: "arrival",  name: "Arrival & Morning Prep", time: "8:00–8:30",  color: "blue"   };
export const FIXED_ROWS = [
  { key: "lunch",   name: "Lunch",              time: "12:00–1:00", color: "lunch"  },
  { key: "nap",     name: "Nap Time",            time: "1:00–2:30",  color: "green"  },
  { key: "prepare", name: "Preparing to Go Home",time: "2:30–3:00",  color: "purple" },
];

// Editable slots — stored in DB by weekday+timeframe
export const SLOTS = [
  { key: "8:30-9:00",   time: "8:30–9:00",   color: "blue"   },
  { key: "9:00-10:00",  time: "9:00–10:00",  color: "green"  },
  { key: "10:00-11:00", time: "10:00–11:00", color: "purple" },
  { key: "11:00-12:00", time: "11:00–12:00", color: "blue"   },
];

// Legacy compat
export const LUNCH = { name: "Lunch", time: "12:00–1:00", color: "lunch" };

// ── Initial Data ──────────────────────────────────────────────────────────────
export const initialChildren = [
  { id:"KID-001", name:"Lior Bensalem",  age:5, gender:"Male",   class:"Sunflower", parent:"Ahmed Bensalem",  phone:"068 123 4567", allergies:"Peanuts", medNotes:"EpiPen required" },
  { id:"KID-002", name:"Sofia Marini",   age:4, gender:"Female", class:"Bluebell",  parent:"Giulia Marini",  phone:"068 234 5678", allergies:"None",    medNotes:"" },
  { id:"KID-003", name:"Arjun Sharma",   age:5, gender:"Male",   class:"Sunflower", parent:"Priya Sharma",   phone:"068 345 6789", allergies:"Dairy",   medNotes:"Lactose intolerant" },
  { id:"KID-004", name:"Emma Johansson", age:4, gender:"Female", class:"Daisy",     parent:"Lars Johansson", phone:"068 456 7890", allergies:"None",    medNotes:"" },
  { id:"KID-005", name:"Mateo García",   age:5, gender:"Male",   class:"Bluebell",  parent:"Carlos García",  phone:"068 567 8901", allergies:"Gluten",  medNotes:"Celiac disease" },
  { id:"KID-006", name:"Hana Tanaka",    age:4, gender:"Female", class:"Daisy",     parent:"Kenji Tanaka",   phone:"068 678 9012", allergies:"None",    medNotes:"" },
];
export const initialTeachers = [
  { id:"TCH-001", name:"Ms. Amara Diallo", class:"Sunflower", email:"a.diallo@nestify.edu",   phone:"069 100 0001" },
  { id:"TCH-002", name:"Mr. Jonas Weber",  class:"Bluebell",  email:"j.weber@nestify.edu",    phone:"069 100 0002" },
  { id:"TCH-003", name:"Ms. Priya Nair",   class:"Daisy",     email:"p.nair@nestify.edu",     phone:"069 100 0003" },
  { id:"TCH-004", name:"Ms. Lea Fontaine", class:"Rainbow",   email:"l.fontaine@nestify.edu", phone:"069 100 0004" },
];
export const initialChefs = [
  { id:"CHF-001", name:"Chef Rina Costa", email:"r.costa@nestify.edu", phone:"069 200 0001" },
  { id:"CHF-002", name:"Chef Omar Bassi", email:"o.bassi@nestify.edu", phone:"069 200 0002" },
];
export const initAttendance = {
  [today]: {
    "KID-001":"Present","KID-002":"Present","KID-003":"Absent",
    "KID-004":"Present","KID-005":"Present","KID-006":"Absent",
  },
};
export const initEvents = [
  { id:1, name:"Spring Festival Preparation", date:"2026-04-16", desc:"Plan decorations and activities",          colorClass:"c1" },
  { id:2, name:"Parent Workshop",             date:"2026-04-19", desc:"Early childhood development",              colorClass:"c2" },
  { id:3, name:"Field Trip to Zoo",           date:"2026-04-25", desc:"All classes – permission forms required",  colorClass:"c3" },
];
export const initSchedule = {
  Monday:    { s1:"Circle Time",  s2:"Literacy",    s3:"Outdoor Play" },
  Tuesday:   { s1:"Morning Mtg", s2:"Math",         s3:"Art"          },
  Wednesday: { s1:"Circle Time", s2:"Science",      s3:"Story Time"   },
  Thursday:  { s1:"Morning Mtg", s2:"Music",        s3:"Free Play"    },
  Friday:    { s1:"Review Day",  s2:"Show & Tell",  s3:"Garden"       },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export function fmtDate(d) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
}
export function genId(prefix, list) {
  return `${prefix}-${String(list.length + 1).padStart(3, "0")}`;
}
export function getCC(i) {
  return ["c1","c2","c3"][i % 3];
}
export function upcomingEvents(events) {
  return events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
}

// ── Icons ─────────────────────────────────────────────────────────────────────
export const Ic = {
  nest:   <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  home:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  child:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 20a7 7 0 0 1 13 0"/></svg>,
  staff:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  event:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  report: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  att:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  sched:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  note:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  chef:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6z"/><line x1="6" y1="17" x2="18" y2="17"/><line x1="6" y1="21" x2="18" y2="21"/></svg>,
  ai:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1H1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/></svg>,
  meal:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  edit:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
};

// ── Shared Components ─────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="mh">
          <h3>{title}</h3>
          <button className="mx" onClick={onClose}>×</button>
        </div>
        <div style={{ padding:"16px 20px" }}>{children}</div>
        {footer && <div className="mf">{footer}</div>}
      </div>
    </div>
  );
}

export function Chart({ data, labels }) {
  const W=400, H=130, pad={t:6,r:6,b:24,l:24};
  const iW=W-pad.l-pad.r, iH=H-pad.t-pad.b, max=Math.max(...data)||1;
  const pts=data.map((v,i)=>[pad.l+i*(iW/(data.length-1)), pad.t+iH-((v/max)*iH)]);
  const d=pts.map((p,i)=>i===0?`M${p[0]},${p[1]}`:`L${p[0]},${p[1]}`).join(" ");
  const area=d+` L${pts[pts.length-1][0]},${pad.t+iH} L${pts[0][0]},${pad.t+iH} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{overflow:"visible"}}>
      <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F0715A" stopOpacity=".15"/><stop offset="100%" stopColor="#F0715A" stopOpacity="0"/></linearGradient></defs>
      {[0,20,40,60].map(v=>{const y=pad.t+iH-((v/max)*iH);return<g key={v}><line x1={pad.l} x2={pad.l+iW} y1={y} y2={y} stroke="#EDE8E3" strokeWidth="1"/><text x={pad.l-4} y={y+4} textAnchor="end" fontSize="10" fill="#A0AEC0">{v}</text></g>;})}
      {labels.map((l,i)=><text key={l} x={pad.l+i*(iW/(data.length-1))} y={H-2} textAnchor="middle" fontSize="10" fill="#A0AEC0">{l}</text>)}
      <path d={area} fill="url(#cg)"/>
      <path d={d} fill="none" stroke="#F0715A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke="#F0715A" strokeWidth="2"/>)}
    </svg>
  );
}

export function WeeklyScheduleGrid({ schedule }) {
  return (
    <div className="wsg">
      {DAYS_ORDER.map(day => (
        <div key={day} className="wsg-col">
          <div className={`wsg-head ${day === todayDayName ? "tod" : ""}`}>{day.slice(0,3).toUpperCase()}</div>
          {/* Fixed top row */}
          <div className={`wsg-cell ${FIXED_TOP.color} wsg-fixed`}>
            <div className="wsg-name">{FIXED_TOP.name}</div>
            <div className="wsg-time">{FIXED_TOP.time} · Fixed</div>
          </div>
          {/* Editable slots */}
          {SLOTS.map(sl => (
            <div key={sl.key} className={`wsg-cell ${sl.color}`}>
              <div className="wsg-name">{schedule[day]?.[sl.key] || "—"}</div>
              <div className="wsg-time">{sl.time}</div>
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
  );
}

export function ChildDetailModal({ child, attendance, onClose }) {
  // Count absences across all dates
  const absenceCount = attendance
    ? Object.values(attendance).filter(dayMap => dayMap[String(child.id)] === "Absent").length
    : 0;

  const p1 = child.parent1;
  const p2 = child.parent2;

  return (
    <Modal title={child.name} onClose={onClose} footer={<button className="btn btn-o" onClick={onClose}>Close</button>}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {[["Name",child.name],["Age",child.age+" yrs"],["Gender",child.gender],["Class",child.class],
          ["Allergies",child.allergies]
        ].map(([k,v]) => (
          <div key={k} style={{ background:"var(--bg)", borderRadius:10, padding:"11px 13px" }}>
            <p style={{ fontSize:11, color:"var(--textm)", fontWeight:700, textTransform:"uppercase" }}>{k}</p>
            <p style={{ fontSize:14, fontWeight:700, marginTop:2 }}>{v || "—"}</p>
          </div>
        ))}
        {/* Absence count */}
        <div style={{ background:"var(--red-l)", borderRadius:10, padding:"11px 13px" }}>
          <p style={{ fontSize:11, color:"var(--red-t)", fontWeight:700, textTransform:"uppercase" }}>Absences</p>
          <p style={{ fontSize:14, fontWeight:700, marginTop:2, color:"var(--red-t)" }}>{absenceCount} day{absenceCount !== 1 ? "s" : ""}</p>
        </div>
        {child.medNotes && (
          <div style={{ gridColumn:"1/-1", background:"var(--amber-l)", borderRadius:10, padding:"11px 13px", borderLeft:"3px solid var(--yellow)" }}>
            <p style={{ fontSize:11, color:"var(--amber-t)", fontWeight:700, textTransform:"uppercase" }}>Medical Notes</p>
            <p style={{ fontSize:13, marginTop:3 }}>{child.medNotes}</p>
          </div>
        )}
      </div>

      {/* Parent(s) section */}
      {p1 && (
        <div style={{ marginTop:14, borderTop:"1px solid var(--border)", paddingTop:12 }}>
          <p style={{ fontSize:11, fontWeight:800, color:"var(--text2)", textTransform:"uppercase", letterSpacing:".4px", marginBottom:8 }}>
            {p2 ? "Parent / Guardian 1" : "Parent / Guardian"}
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[["Name",`${p1.name} ${p1.surname}`],["Phone",p1.phone||"—"],["Email",p1.email||"—"],["Address",p1.address||"—"]].map(([k,v]) => (
              <div key={k} style={{ background:"var(--bg)", borderRadius:10, padding:"10px 12px" }}>
                <p style={{ fontSize:10, color:"var(--textm)", fontWeight:700, textTransform:"uppercase" }}>{k}</p>
                <p style={{ fontSize:13, fontWeight:700, marginTop:2 }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {p2 && (
        <div style={{ marginTop:12, borderTop:"1px solid var(--border)", paddingTop:12 }}>
          <p style={{ fontSize:11, fontWeight:800, color:"var(--text2)", textTransform:"uppercase", letterSpacing:".4px", marginBottom:8 }}>Parent / Guardian 2</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[["Name",`${p2.name} ${p2.surname}`],["Phone",p2.phone||"—"],["Email",p2.email||"—"],["Address",p2.address||"—"]].map(([k,v]) => (
              <div key={k} style={{ background:"var(--bg)", borderRadius:10, padding:"10px 12px" }}>
                <p style={{ fontSize:10, color:"var(--textm)", fontWeight:700, textTransform:"uppercase" }}>{k}</p>
                <p style={{ fontSize:13, fontWeight:700, marginTop:2 }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}