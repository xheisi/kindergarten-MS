import { supabase } from "../supabaseClient";

// ---------- USERS ----------
export async function getUserRole(username) {
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("username", username)
    .single();

  if (error) throw error;
  return data.role;
}

// ---------- KIDS ----------
export async function getKids() {
  const { data, error } = await supabase
    .from("kids")
    .select("id, name, surname, class_id");

  if (error) throw error;
  return data;
}

// ---------- CLASSES ----------
export async function getClasses() {
  const { data, error } = await supabase
    .from("class")
    .select("id, className, teacher_id");

  if (error) throw error;
  return data;
}

// ---------- TEACHERS ----------
export async function getTeachers() {
  const { data, error } = await supabase
    .from("teacher")
    .select("*");

  if (error) throw error;
  return data;
}
// ---------- ATTENDANCE ----------
export async function getTodayAttendance() {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("date", today);

  if (error) throw error;

  const formatted = {};
  data.forEach((row) => {
    formatted[row.child_id] = row.status;
  });

  return { date: today, data: formatted };
}

export async function markAttendance(child_id, status, date) {
  const { error } = await supabase
    .from("attendance")
    .upsert(
      [
        {
          child_id,
          date,
          status,
        },
      ],
      { onConflict: "child_id,date" }
    );

  if (error) throw error;
}

// ---------- EVENTS ----------
export async function getEvents() {
  const { data, error } = await supabase
    .from("event")
    .select("*");

  if (error) throw error;
  return data;
}
// ---------- NOTES ----------
export async function getNotes() {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw error;
  return data;
}

export async function addNote(child_id, text, date) {
  const { error } = await supabase.from("notes").insert([
    {
      child_id,
      text,
      date,
    },
  ]);

  if (error) throw error;
}