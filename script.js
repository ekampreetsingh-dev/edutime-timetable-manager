/* =========================================================
   EDUTIME — COMPLETE SCRIPT
   Front-end application logic for index.html + style.css

   IMPORTANT SECURITY NOTE
   -----------------------
   The UI role selector is NEVER treated as proof of permission.

   For production:
   1. Enable Supabase Auth.
   2. Store the user's real role in a protected database table.
   3. Enable Row Level Security (RLS).
   4. Use server/database policies to enforce permissions.
   5. Never put Google Cloud service-account private keys in this file.
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURATION
   ========================================================= */

const APP_CONFIG = {
  name: "EduTime",
  version: "1.0.0",

  // Add your public Supabase project values here.
  // NEVER put a Supabase service_role key here.
  supabase: {
    url: "https://advktvtobjnygymmgzkv.supabase.co/rest/v1/",
    anonKey: "sb_publishable_eHjQJ1w9ovblC9Dyik8-tw_AVeOkKvk"
  },

  // Google Cloud should be connected through a secure backend/
  // Cloud Run/Cloud Functions endpoint. Do not put private
  // service-account credentials in browser JavaScript.
  googleCloud: {
    apiBaseUrl: ""
  },

  demoMode: true
};


/* =========================================================
   GLOBAL STATE
   ========================================================= */

const state = {
  currentPage: "dashboard",
  previousPage: null,

  user: null,
  profile: null,
  school: null,

  // This is UI state only. It is NOT trusted for authorization.
  selectedRole: null,

  sidebarOpen: false,
  profileMenuOpen: false,
  notificationOpen: false,
  searchOpen: false,

  timetable: [],
  students: [],
  teachers: [],
  parents: [],
  classes: [],
  subjects: [],
  rooms: [],
  announcements: [],
  notifications: [],
  attendance: [],
  assignments: [],
  exams: [],

  filters: {
    globalSearch: "",
    studentSearch: "",
    teacherSearch: "",
    classSearch: "",
    timetableClass: "",
    timetableWeek: "",
    attendanceDate: ""
  },

  settings: {
    activeTab: "school",
    darkMode: false
  }
};


/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));

function byId(id) {
  return document.getElementById(id);
}

function exists(selector) {
  return !!$(selector);
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || "")
    .join("");
}

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatTime(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function randomId(prefix = "id") {
  if (window.crypto?.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}


/* =========================================================
   SAFE LOCAL STORAGE
   ========================================================= */

const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage failures.
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage failures.
    }
  }
};


/* =========================================================
   DEMO DATA
   ========================================================= */

function seedDemoData() {
  state.school = {
    id: "school_demo_001",
    name: "EduTime Demo School",
    board: "CBSE",
    city: "Punjab, India",
    academicYear: "2026–27"
  };

  state.profile = {
    id: "user_demo_001",
    name: "School Administrator",
    email: "admin@edutime.demo",
    role: "admin",
    schoolId: state.school.id,
    verified: true
  };

  state.user = {
    id: "user_demo_001",
    email: state.profile.email
  };

  state.classes = [
    { id: "class_1", name: "Class 10-A", section: "A", students: 42, classTeacher: "Anita Sharma" },
    { id: "class_2", name: "Class 10-B", section: "B", students: 39, classTeacher: "Raj Kumar" },
    { id: "class_3", name: "Class 9-A", section: "A", students: 44, classTeacher: "Neha Singh" },
    { id: "class_4", name: "Class 8-A", section: "A", students: 38, classTeacher: "Amit Verma" }
  ];

  state.subjects = [
    { id: "sub_1", name: "Mathematics", code: "MATH", color: "#4f46e5" },
    { id: "sub_2", name: "Science", code: "SCI", color: "#16a34a" },
    { id: "sub_3", name: "English", code: "ENG", color: "#0284c7" },
    { id: "sub_4", name: "Social Science", code: "SST", color: "#d97706" },
    { id: "sub_5", name: "Computer", code: "CS", color: "#7c3aed" }
  ];

  state.teachers = [
    { id: "teacher_1", name: "Anita Sharma", email: "anita@school.demo", subject: "Mathematics", status: "Active" },
    { id: "teacher_2", name: "Raj Kumar", email: "raj@school.demo", subject: "Science", status: "Active" },
    { id: "teacher_3", name: "Neha Singh", email: "neha@school.demo", subject: "English", status: "Active" },
    { id: "teacher_4", name: "Amit Verma", email: "amit@school.demo", subject: "Computer", status: "Active" }
  ];

  state.students = [
    { id: "student_1", name: "Aarav Sharma", roll: "101", className: "Class 10-A", email: "aarav@example.com", status: "Active", attendance: 94 },
    { id: "student_2", name: "Ananya Singh", roll: "102", className: "Class 10-A", email: "ananya@example.com", status: "Active", attendance: 96 },
    { id: "student_3", name: "Arjun Kumar", roll: "103", className: "Class 10-A", email: "arjun@example.com", status: "Active", attendance: 88 },
    { id: "student_4", name: "Diya Verma", roll: "104", className: "Class 10-B", email: "diya@example.com", status: "Active", attendance: 91 },
    { id: "student_5", name: "Kabir Singh", roll: "105", className: "Class 10-B", email: "kabir@example.com", status: "Active", attendance: 86 }
  ];

  state.parents = [
    { id: "parent_1", name: "Suresh Sharma", email: "suresh@example.com", student: "Aarav Sharma", status: "Active" },
    { id: "parent_2", name: "Priya Singh", email: "priya@example.com", student: "Ananya Singh", status: "Active" }
  ];

  state.rooms = [
    { id: "room_1", name: "Room 101", capacity: 45, type: "Classroom", status: "Available" },
    { id: "room_2", name: "Science Lab", capacity: 35, type: "Laboratory", status: "Available" },
    { id: "room_3", name: "Computer Lab", capacity: 40, type: "Laboratory", status: "Available" }
  ];

  state.timetable = [
    { id: "tt_1", day: "Monday", time: "08:00", end: "08:45", className: "Class 10-A", subject: "Mathematics", teacher: "Anita Sharma", room: "Room 101" },
    { id: "tt_2", day: "Monday", time: "08:45", end: "09:30", className: "Class 10-A", subject: "Science", teacher: "Raj Kumar", room: "Science Lab" },
    { id: "tt_3", day: "Monday", time: "09:45", end: "10:30", className: "Class 10-A", subject: "English", teacher: "Neha Singh", room: "Room 101" },
    { id: "tt_4", day: "Tuesday", time: "08:00", end: "08:45", className: "Class 10-A", subject: "Social Science", teacher: "Raj Kumar", room: "Room 101" },
    { id: "tt_5", day: "Tuesday", time: "08:45", end: "09:30", className: "Class 10-A", subject: "Computer", teacher: "Amit Verma", room: "Computer Lab" }
  ];

  state.attendance = state.students.map(student => ({
    ...student,
    date: todayISO(),
    status: "Present"
  }));

  state.assignments = [
    { id: "as_1", title: "Quadratic Equations Practice", subject: "Mathematics", className: "Class 10-A", dueDate: "2026-08-28", status: "Published" },
    { id: "as_2", title: "Carbon Compounds Worksheet", subject: "Science", className: "Class 10-A", dueDate: "2026-08-30", status: "Published" }
  ];

  state.exams = [
    { id: "exam_1", name: "Unit Test 1", className: "Class 10-A", date: "2026-09-05", status: "Scheduled" },
    { id: "exam_2", name: "Half-Yearly Examination", className: "Class 10-A", date: "2026-10-12", status: "Planned" }
  ];

  state.announcements = [
    {
      id: "ann_1",
      title: "Parent-Teacher Meeting",
      message: "The next parent-teacher meeting is scheduled for Saturday.",
      author: "Administration",
      date: "2026-08-23"
    },
    {
      id: "ann_2",
      title: "Independence Day Activity",
      message: "Students should report to their assigned activity groups.",
      author: "Administration",
      date: "2026-08-14"
    }
  ];

  state.notifications = [
    {
      id: "not_1",
      title: "Timetable conflict detected",
      message: "A teacher is assigned to two classes at the same time.",
      read: false,
      date: new Date().toISOString()
    },
    {
      id: "not_2",
      title: "New assignment published",
      message: "Mathematics assignment has been published.",
      read: false,
      date: new Date().toISOString()
    }
  ];
}


/* =========================================================
   AUTHORIZATION
   ========================================================= */

/*
  SECURITY MODEL

  A malicious student can absolutely choose "Admin" in a normal
  HTML select box. That is not a security boundary.

  This function demonstrates the correct front-end pattern:
  - selectedRole comes from UI only
  - actualRole comes from the authenticated profile
  - actualRole wins
  - unauthorized UI is hidden

  Production authorization MUST ALSO be enforced by Supabase RLS.
*/

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function getActualRole() {
  return normalizeRole(
    state.profile?.role ||
    state.user?.app_metadata?.role ||
    state.user?.user_metadata?.role ||
    "student"
  );
}

function userHasRole(...allowedRoles) {
  const actualRole = getActualRole();
  return allowedRoles.map(normalizeRole).includes(actualRole);
}

function can(permission) {
  const role = getActualRole();

  const permissions = {
    admin: [
      "manage_school",
      "manage_users",
      "manage_timetable",
      "manage_classes",
      "manage_subjects",
      "manage_attendance",
      "manage_assignments",
      "manage_exams",
      "view_reports",
      "manage_billing",
      "manage_settings"
    ],

    teacher: [
      "manage_timetable",
      "manage_attendance",
      "manage_assignments",
      "manage_exams",
      "view_reports"
    ],

    student: [
      "view_timetable",
      "view_assignments",
      "view_exams"
    ],

    parent: [
      "view_timetable",
      "view_assignments",
      "view_exams"
    ],

    staff: [
      "view_timetable",
      "manage_attendance"
    ]
  };

  return permissions[role]?.includes(permission) || false;
}

function enforceRoleSelection() {
  const selectedRole = normalizeRole(state.selectedRole);
  const actualRole = getActualRole();

  if (!selectedRole) {
    return {
      allowed: true,
      actualRole
    };
  }

  if (selectedRole !== actualRole) {
    showToast(
      "Access controlled",
      `Your account is registered as ${humanize(actualRole)}. The selected role cannot change your permissions.`,
      "warning"
    );
  }

  return {
    allowed: true,
    actualRole
  };
}

function humanize(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}


/* =========================================================
   SUPABASE LOADING
   ========================================================= */

let supabaseClient = null;

async function initializeSupabase() {
  if (
    !APP_CONFIG.supabase.url ||
    !APP_CONFIG.supabase.anonKey
  ) {
    console.info(
      "[EduTime] Supabase is not configured. Running in demo mode."
    );
    return null;
  }

  if (!window.supabase?.createClient) {
    await loadScript(
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
    );
  }

  if (!window.supabase?.createClient) {
    console.warn("[EduTime] Supabase SDK could not be loaded.");
    return null;
  }

  supabaseClient = window.supabase.createClient(
    APP_CONFIG.supabase.url,
    APP_CONFIG.supabase.anonKey
  );

  await restoreSupabaseSession();

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      state.user = session.user;
      loadAuthenticatedProfile(session.user).catch(console.error);
    } else {
      state.user = null;
    }
  });

  return supabaseClient;
}

async function restoreSupabaseSession() {
  if (!supabaseClient) return;

  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error("Supabase session error:", error);
    return;
  }

  if (data.session?.user) {
    state.user = data.session.user;
    await loadAuthenticatedProfile(data.session.user);
  }
}

async function loadAuthenticatedProfile(user) {
  if (!supabaseClient || !user) return;

  /*
    Recommended table:

    profiles
      id uuid primary key references auth.users(id)
      school_id uuid
      role text
      full_name text
      email text

    The role must be read from a trusted database row.
  */

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.warn(
      "[EduTime] Could not load profile. Demo profile retained.",
      error.message
    );
    return;
  }

  if (data) {
    state.profile = {
      ...state.profile,
      ...data,
      role: normalizeRole(data.role)
    };

    enforceRoleSelection();
    updateUserUI();
    applyRoleBasedNavigation();
  }
}


/* =========================================================
   SCRIPT LOADER
   ========================================================= */

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);

    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;

    script.onload = resolve;
    script.onerror = reject;

    document.head.appendChild(script);
  });
}


/* =========================================================
   AUTH ACTIONS
   ========================================================= */

async function signIn(email, password) {
  if (!email || !password) {
    showToast("Missing information", "Enter your email and password.", "warning");
    return false;
  }

  if (!supabaseClient) {
    state.user = {
      id: "user_demo_001",
      email
    };

    state.profile = {
      ...state.profile,
      email
    };

    state.selectedRole = state.selectedRole || "admin";

    showToast("Demo login successful", "Supabase is not configured yet.", "success");
    showApp();
    return true;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showToast("Login failed", error.message, "danger");
    return false;
  }

  state.user = data.user;
  await loadAuthenticatedProfile(data.user);

  showToast("Welcome back", "You are now signed in.", "success");
  showApp();

  return true;
}

async function signUp({ name, email, password, role }) {
  if (!name || !email || !password) {
    showToast("Missing information", "Complete all required fields.", "warning");
    return false;
  }

  /*
    IMPORTANT:
    Do not trust `role` from the browser for privileged roles.

    Public signup should normally only allow:
      student / parent

    Admin accounts should be created/invited by a trusted school
    onboarding flow or backend process.
  */

  const requestedRole = normalizeRole(role);

  if (requestedRole === "admin" && !supabaseClient) {
    showToast(
      "Demo mode",
      "Admin signup is simulated. Production admin creation must be server-controlled.",
      "warning"
    );
  }

  if (!supabaseClient) {
    state.user = {
      id: randomId("user"),
      email
    };

    state.profile = {
      id: state.user.id,
      name,
      email,
      role: requestedRole === "admin" ? "student" : requestedRole,
      schoolId: state.school?.id || null,
      verified: false
    };

    showToast(
      "Account created",
      `Demo account created as ${humanize(state.profile.role)}.`,
      "success"
    );

    showApp();
    return true;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name
        // Do NOT place "admin" here and trust it later.
      }
    }
  });

  if (error) {
    showToast("Signup failed", error.message, "danger");
    return false;
  }

  state.user = data.user;

  showToast(
    "Account created",
    "Check your email if email verification is enabled.",
    "success"
  );

  return true;
}

async function signOut() {
  if (supabaseClient) {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      showToast("Sign out failed", error.message, "danger");
      return;
    }
  }

  state.user = null;
  state.profile = null;
  state.selectedRole = null;

  showAuth();
  showToast("Signed out", "Your session has been closed.", "success");
}

async function resetPassword(email) {
  if (!email) {
    showToast("Enter your email", "We need your account email.", "warning");
    return false;
  }

  if (!supabaseClient) {
    showToast(
      "Demo mode",
      "Password reset will work after Supabase is connected.",
      "info"
    );
    return true;
  }

  const redirectTo = `${window.location.origin}${window.location.pathname}`;

  const { error } = await supabaseClient.auth.resetPasswordForEmail(
    email,
    { redirectTo }
  );

  if (error) {
    showToast("Reset failed", error.message, "danger");
    return false;
  }

  showToast(
    "Reset email sent",
    "Check your inbox for the password reset link.",
    "success"
  );

  return true;
}


/* =========================================================
   AUTH / APP VIEW
   ========================================================= */

function findAuthView() {
  return (
    byId("auth-page") ||
    byId("login-page") ||
    $(".auth-page")
  );
}

function findAppView() {
  return (
    byId("app-shell") ||
    $(".app-shell")
  );
}

function showAuth() {
  const auth = findAuthView();
  const app = findAppView();

  if (auth) auth.classList.remove("hidden");
  if (app) app.classList.add("hidden");
}

function showApp() {
  const auth = findAuthView();
  const app = findAppView();

  if (auth) auth.classList.add("hidden");
  if (app) app.classList.remove("hidden");

  updateUserUI();
  applyRoleBasedNavigation();
  navigateTo("dashboard");
}

function updateUserUI() {
  const name =
    state.profile?.name ||
    state.profile?.full_name ||
    state.user?.email?.split("@")[0] ||
    "User";

  const email =
    state.profile?.email ||
    state.user?.email ||
    "";

  const role = humanize(getActualRole());

  $$("[data-user-name]").forEach(el => {
    el.textContent = name;
  });

  $$("[data-user-email]").forEach(el => {
    el.textContent = email;
  });

  $$("[data-user-role]").forEach(el => {
    el.textContent = role;
  });

  $$("[data-user-initials]").forEach(el => {
    el.textContent = initials(name);
  });

  $$("[data-school-name]").forEach(el => {
    el.textContent = state.school?.name || "Your School";
  });
}

function applyRoleBasedNavigation() {
  const role = getActualRole();

  $$("[data-permission]").forEach(element => {
    const permission = element.dataset.permission;

    if (!permission) return;

    element.classList.toggle(
      "hidden",
      !can(permission)
    );
  });

  $$("[data-role-only]").forEach(element => {
    const allowed = element.dataset.roleOnly
      .split(",")
      .map(normalizeRole);

    element.classList.toggle(
      "hidden",
      !allowed.includes(role)
    );
  });
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function navigateTo(page, options = {}) {
  if (!page) return;

  const target =
    document.querySelector(`[data-page="${page}"]`) ||
    byId(page);

  if (!target) {
    console.warn(`[EduTime] Page "${page}" not found.`);
    return;
  }

  state.previousPage = state.currentPage;
  state.currentPage = page;

  $$(".content-page").forEach(section => {
    section.classList.add("hidden");
  });

  target.classList.remove("hidden");

  $$(".nav-item").forEach(item => {
    const itemPage = item.dataset.page;

    item.classList.toggle(
      "active",
      itemPage === page
    );
  });

  updatePageTitle(page);

  if (options.closeSidebar !== false) {
    closeSidebar();
  }

  if (page === "dashboard") {
    renderDashboard();
  }

  if (page === "students") {
    renderStudents();
  }

  if (page === "teachers") {
    renderTeachers();
  }

  if (page === "classes") {
    renderClasses();
  }

  if (page === "subjects") {
    renderSubjects();
  }

  if (page === "rooms") {
    renderRooms();
  }

  if (page === "timetable") {
    renderTimetable();
  }

  if (page === "attendance") {
    renderAttendance();
  }

  if (page === "assignments") {
    renderAssignments();
  }

  if (page === "exams") {
    renderExams();
  }

  if (page === "announcements") {
    renderAnnouncements();
  }

  if (page === "notifications") {
    renderNotifications();
  }

  if (page === "analytics") {
    renderAnalytics();
  }

  if (page === "reports") {
    renderReports();
  }

  if (page === "billing") {
    renderBilling();
  }

  if (page === "settings") {
    renderSettings();
  }
}

function updatePageTitle(page) {
  const labels = {
    dashboard: ["Dashboard", "Overview of your school"],
    timetable: ["Timetable", "Build and manage school schedules"],
    students: ["Students", "Manage student records"],
    teachers: ["Teachers", "Manage teaching staff"],
    parents: ["Parents", "Manage parent accounts"],
    classes: ["Classes", "Manage classes and sections"],
    subjects: ["Subjects", "Manage subjects"],
    rooms: ["Rooms & Facilities", "Manage classrooms and facilities"],
    attendance: ["Attendance", "Track student attendance"],
    assignments: ["Assignments", "Create and manage assignments"],
    exams: ["Exams", "Manage examinations"],
    announcements: ["Announcements", "School-wide communication"],
    notifications: ["Notifications", "Recent school activity"],
    analytics: ["Analytics", "School performance insights"],
    reports: ["Reports", "Generate school reports"],
    billing: ["Billing", "Subscription and plan management"],
    settings: ["Settings", "Configure your school"]
  };

  const [title, subtitle] =
    labels[page] || ["EduTime", "School management"];

  $$("[data-page-title]").forEach(el => {
    el.textContent = title;
  });

  $$("[data-page-subtitle]").forEach(el => {
    el.textContent = subtitle;
  });
}


/* =========================================================
   SIDEBAR / MENUS
   ========================================================= */

function toggleSidebar() {
  state.sidebarOpen = !state.sidebarOpen;

  const sidebar = $(".sidebar");

  if (sidebar) {
    sidebar.classList.toggle(
      "mobile-open",
      state.sidebarOpen
    );
  }
}

function closeSidebar() {
  state.sidebarOpen = false;

  const sidebar = $(".sidebar");

  if (sidebar) {
    sidebar.classList.remove("mobile-open");
  }
}

function toggleProfileMenu() {
  state.profileMenuOpen = !state.profileMenuOpen;

  const popover =
    byId("profile-popover") ||
    $(".profile-popover") ||
    $(".popover.profile");

  if (popover) {
    popover.classList.toggle(
      "hidden",
      !state.profileMenuOpen
    );
  }
}

function closeProfileMenu() {
  state.profileMenuOpen = false;

  $$(".popover").forEach(el => {
    el.classList.add("hidden");
  });
}


/* =========================================================
   SEARCH
   ========================================================= */

function openSearch() {
  state.searchOpen = true;

  const overlay =
    byId("search-overlay") ||
    $(".search-overlay");

  if (overlay) {
    overlay.classList.remove("hidden");
  }

  const input =
    byId("global-search-input") ||
    $(".search-overlay input");

  setTimeout(() => input?.focus(), 50);
}

function closeSearch() {
  state.searchOpen = false;

  const overlay =
    byId("search-overlay") ||
    $(".search-overlay");

  if (overlay) {
    overlay.classList.add("hidden");
  }
}

function buildSearchIndex() {
  const records = [];

  state.students.forEach(item => {
    records.push({
      type: "Student",
      title: item.name,
      subtitle: `${item.className} • ${item.email}`,
      page: "students"
    });
  });

  state.teachers.forEach(item => {
    records.push({
      type: "Teacher",
      title: item.name,
      subtitle: `${item.subject} • ${item.email}`,
      page: "teachers"
    });
  });

  state.classes.forEach(item => {
    records.push({
      type: "Class",
      title: item.name,
      subtitle: `${item.students} students • ${item.classTeacher}`,
      page: "classes"
    });
  });

  state.subjects.forEach(item => {
    records.push({
      type: "Subject",
      title: item.name,
      subtitle: item.code,
      page: "subjects"
    });
  });

  state.rooms.forEach(item => {
    records.push({
      type: "Room",
      title: item.name,
      subtitle: `${item.type} • Capacity ${item.capacity}`,
      page: "rooms"
    });
  });

  return records;
}

function performSearch(query) {
  const container =
    byId("search-results") ||
    $(".search-results");

  if (!container) return;

  const q = query.trim().toLowerCase();

  if (!q) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⌕</div>
        <h3>Search your school</h3>
        <p>Try a student, teacher, class, subject or room.</p>
      </div>
    `;
    return;
  }

  const results = buildSearchIndex()
    .filter(item =>
      `${item.title} ${item.subtitle} ${item.type}`
        .toLowerCase()
        .includes(q)
    )
    .slice(0, 12);

  if (!results.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">?</div>
        <h3>No results</h3>
        <p>Try another search term.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = results.map(item => `
    <button
      class="search-result"
      type="button"
      data-search-page="${escapeHTML(item.page)}"
    >
      <span class="search-result-icon">⌕</span>
      <span>
        <strong>${escapeHTML(item.title)}</strong>
        <small>${escapeHTML(item.type)} • ${escapeHTML(item.subtitle)}</small>
      </span>
    </button>
  `).join("");
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {
  setText("[data-stat-students]", state.students.length);
  setText("[data-stat-teachers]", state.teachers.length);
  setText("[data-stat-classes]", state.classes.length);

  const attendance =
    state.students.length
      ? Math.round(
          state.students.reduce(
            (sum, student) => sum + Number(student.attendance || 0),
            0
          ) / state.students.length
        )
      : 0;

  setText("[data-stat-attendance]", `${attendance}%`);

  renderRecentActivity();
}

function renderRecentActivity() {
  const container =
    byId("recent-activity") ||
    $(".activity-list");

  if (!container) return;

  const activities = [
    ...state.notifications.map(item => ({
      title: item.title,
      message: item.message,
      date: item.date
    })),
    ...state.announcements.map(item => ({
      title: item.title,
      message: item.message,
      date: item.date
    }))
  ]
    .sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    )
    .slice(0, 6);

  container.innerHTML = activities.map(item => `
    <div class="activity-item">
      <span class="activity-dot"></span>
      <div>
        <strong>${escapeHTML(item.title)}</strong>
        <p>${escapeHTML(item.message)}</p>
      </div>
      <span class="activity-time">
        ${escapeHTML(formatDate(item.date))}
      </span>
    </div>
  `).join("");
}


/* =========================================================
   GENERIC TABLE HELPERS
   ========================================================= */

function setText(selector, value) {
  $$(selector).forEach(el => {
    el.textContent = String(value ?? "");
  });
}

function getTableBody(selectors) {
  for (const selector of selectors) {
    const el = $(selector);
    if (el) return el;
  }

  return null;
}

function renderEmptyTable(tbody, colspan, message) {
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="${colspan}">
        <div class="empty-state">
          <div class="empty-icon">—</div>
          <h3>${escapeHTML(message)}</h3>
        </div>
      </td>
    </tr>
  `;
}


/* =========================================================
   STUDENTS
   ========================================================= */

function renderStudents() {
  const tbody = getTableBody([
    "#students-table-body",
    "[data-students-table-body]"
  ]);

  if (!tbody) return;

  const q = state.filters.studentSearch.toLowerCase();

  const rows = state.students.filter(student =>
    `${student.name} ${student.email} ${student.className} ${student.roll}`
      .toLowerCase()
      .includes(q)
  );

  if (!rows.length) {
    renderEmptyTable(tbody, 7, "No students found.");
    return;
  }

  tbody.innerHTML = rows.map(student => `
    <tr>
      <td>
        <div class="table-person">
          <span class="table-avatar">${escapeHTML(initials(student.name))}</span>
          <span>
            <strong>${escapeHTML(student.name)}</strong>
            <small>${escapeHTML(student.email)}</small>
          </span>
        </div>
      </td>
      <td>${escapeHTML(student.roll)}</td>
      <td>${escapeHTML(student.className)}</td>
      <td>${escapeHTML(student.attendance)}%</td>
      <td>
        <span class="status-pill success">
          ${escapeHTML(student.status)}
        </span>
      </td>
      <td>${escapeHTML(formatDate(todayISO()))}</td>
      <td>
        <div class="table-actions">
          <button class="table-action" data-action="view-student" data-id="${student.id}">View</button>
          ${can("manage_users")
            ? `<button class="table-action" data-action="delete-student" data-id="${student.id}">Delete</button>`
            : ""}
        </div>
      </td>
    </tr>
  `).join("");
}

function addStudent(student) {
  if (!can("manage_users")) {
    showToast("Permission denied", "Only authorized staff can add students.", "danger");
    return false;
  }

  const newStudent = {
    id: randomId("student"),
    name: student.name,
    roll: student.roll || String(state.students.length + 101),
    className: student.className || state.classes[0]?.name || "Unassigned",
    email: student.email || "",
    status: "Active",
    attendance: 100
  };

  state.students.push(newStudent);
  persistDemoState();
  renderStudents();
  renderDashboard();

  showToast("Student added", `${newStudent.name} was added successfully.`, "success");
  return true;
}

function deleteStudent(id) {
  if (!can("manage_users")) {
    showToast("Permission denied", "You cannot delete student records.", "danger");
    return;
  }

  const student = state.students.find(item => item.id === id);

  if (!student) return;

  if (!confirm(`Delete ${student.name}?`)) return;

  state.students = state.students.filter(item => item.id !== id);

  persistDemoState();
  renderStudents();
  renderDashboard();

  showToast("Student removed", `${student.name} was removed.`, "success");
}


/* =========================================================
   TEACHERS
   ========================================================= */

function renderTeachers() {
  const tbody = getTableBody([
    "#teachers-table-body",
    "[data-teachers-table-body]"
  ]);

  if (!tbody) return;

  const q = state.filters.teacherSearch.toLowerCase();

  const rows = state.teachers.filter(teacher =>
    `${teacher.name} ${teacher.email} ${teacher.subject}`
      .toLowerCase()
      .includes(q)
  );

  if (!rows.length) {
    renderEmptyTable(tbody, 6, "No teachers found.");
    return;
  }

  tbody.innerHTML = rows.map(teacher => `
    <tr>
      <td>
        <div class="table-person">
          <span class="table-avatar">${escapeHTML(initials(teacher.name))}</span>
          <span>
            <strong>${escapeHTML(teacher.name)}</strong>
            <small>${escapeHTML(teacher.email)}</small>
          </span>
        </div>
      </td>
      <td>${escapeHTML(teacher.subject)}</td>
      <td>${escapeHTML(getTeacherClassCount(teacher.name))}</td>
      <td>${escapeHTML(getTeacherPeriods(teacher.name))}</td>
      <td>
        <span class="status-pill success">${escapeHTML(teacher.status)}</span>
      </td>
      <td>
        <div class="table-actions">
          <button class="table-action" data-action="view-teacher" data-id="${teacher.id}">View</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function getTeacherClassCount(name) {
  return new Set(
    state.timetable
      .filter(item => item.teacher === name)
      .map(item => item.className)
  ).size;
}

function getTeacherPeriods(name) {
  return state.timetable.filter(item => item.teacher === name).length;
}


/* =========================================================
   CLASSES
   ========================================================= */

function renderClasses() {
  const tbody = getTableBody([
    "#classes-table-body",
    "[data-classes-table-body]"
  ]);

  if (!tbody) return;

  const q = state.filters.classSearch.toLowerCase();

  const rows = state.classes.filter(item =>
    `${item.name} ${item.section} ${item.classTeacher}`
      .toLowerCase()
      .includes(q)
  );

  if (!rows.length) {
    renderEmptyTable(tbody, 5, "No classes found.");
    return;
  }

  tbody.innerHTML = rows.map(item => `
    <tr>
      <td><strong>${escapeHTML(item.name)}</strong></td>
      <td>${escapeHTML(item.section)}</td>
      <td>${escapeHTML(item.students)}</td>
      <td>${escapeHTML(item.classTeacher)}</td>
      <td>
        <div class="table-actions">
          <button class="table-action" data-action="view-class" data-id="${item.id}">View</button>
        </div>
      </td>
    </tr>
  `).join("");
}


/* =========================================================
   SUBJECTS
   ========================================================= */

function renderSubjects() {
  const tbody = getTableBody([
    "#subjects-table-body",
    "[data-subjects-table-body]"
  ]);

  if (!tbody) return;

  tbody.innerHTML = state.subjects.map(subject => `
    <tr>
      <td><strong>${escapeHTML(subject.name)}</strong></td>
      <td>${escapeHTML(subject.code)}</td>
      <td>${escapeHTML(
        state.timetable.filter(item => item.subject === subject.name).length
      )}</td>
      <td>
        <span class="status-pill success">Active</span>
      </td>
      <td>
        <div class="table-actions">
          <button class="table-action" data-action="view-subject" data-id="${subject.id}">View</button>
        </div>
      </td>
    </tr>
  `).join("");
}


/* =========================================================
   ROOMS
   ========================================================= */

function renderRooms() {
  const tbody = getTableBody([
    "#rooms-table-body",
    "[data-rooms-table-body]"
  ]);

  if (!tbody) return;

  tbody.innerHTML = state.rooms.map(room => `
    <tr>
      <td><strong>${escapeHTML(room.name)}</strong></td>
      <td>${escapeHTML(room.type)}</td>
      <td>${escapeHTML(room.capacity)}</td>
      <td>
        <span class="status-pill success">${escapeHTML(room.status)}</span>
      </td>
      <td>
        <div class="table-actions">
          <button class="table-action" data-action="view-room" data-id="${room.id}">View</button>
        </div>
      </td>
    </tr>
  `).join("");
}


/* =========================================================
   PARENTS
   ========================================================= */

function renderParents() {
  const tbody = getTableBody([
    "#parents-table-body",
    "[data-parents-table-body]"
  ]);

  if (!tbody) return;

  tbody.innerHTML = state.parents.map(parent => `
    <tr>
      <td>
        <div class="table-person">
          <span class="table-avatar">${escapeHTML(initials(parent.name))}</span>
          <span>
            <strong>${escapeHTML(parent.name)}</strong>
            <small>${escapeHTML(parent.email)}</small>
          </span>
        </div>
      </td>
      <td>${escapeHTML(parent.student)}</td>
      <td>
        <span class="status-pill success">${escapeHTML(parent.status)}</span>
      </td>
      <td>
        <div class="table-actions">
          <button class="table-action" data-action="view-parent" data-id="${parent.id}">View</button>
        </div>
      </td>
    </tr>
  `).join("");
}


/* =========================================================
   TIMETABLE
   ========================================================= */

const TIMETABLE_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

const TIMETABLE_SLOTS = [
  { time: "08:00", end: "08:45" },
  { time: "08:45", end: "09:30" },
  { time: "09:45", end: "10:30" },
  { time: "10:30", end: "11:15" },
  { time: "11:30", end: "12:15" },
  { time: "12:15", end: "13:00" }
];

function renderTimetable() {
  const container =
    byId("timetable-grid") ||
    $(".timetable-grid");

  if (!container) return;

  const selectedClass =
    state.filters.timetableClass ||
    state.classes[0]?.name ||
    "";

  const lessons = state.timetable.filter(item =>
    !selectedClass ||
    item.className === selectedClass
  );

  const cells = [];

  cells.push(`
    <div class="timetable-cell timetable-header">Time</div>
  `);

  TIMETABLE_DAYS.forEach(day => {
    cells.push(`
      <div class="timetable-cell timetable-header">
        ${escapeHTML(day)}
      </div>
    `);
  });

  TIMETABLE_SLOTS.forEach(slot => {
    cells.push(`
      <div class="timetable-cell timetable-time">
        ${escapeHTML(slot.time)}<br>
        ${escapeHTML(slot.end)}
      </div>
    `);

    TIMETABLE_DAYS.forEach(day => {
      const lesson = lessons.find(item =>
        item.day === day &&
        item.time === slot.time
      );

      if (!lesson) {
        cells.push(`
          <div class="timetable-cell">
            <button
              class="timetable-break"
              type="button"
              data-action="add-lesson"
              data-day="${escapeHTML(day)}"
              data-time="${escapeHTML(slot.time)}"
            >
              + Add
            </button>
          </div>
        `);

        return;
      }

      const conflict = hasTimetableConflict(lesson);

      cells.push(`
        <div class="timetable-cell">
          <div class="timetable-lesson ${conflict ? "conflict" : ""}">
            <strong>${escapeHTML(lesson.subject)}</strong>
            <span>${escapeHTML(lesson.teacher)}</span>
            <span>${escapeHTML(lesson.room)}</span>
            ${conflict ? `<span>⚠ Conflict</span>` : ""}
          </div>
        </div>
      `);
    });
  });

  container.innerHTML = cells.join("");

  populateTimetableClassFilter();
}

function populateTimetableClassFilter() {
  const selects = $$(
    "#timetable-class-filter, [data-timetable-class-filter]"
  );

  selects.forEach(select => {
    const current =
      state.filters.timetableClass ||
      state.classes[0]?.name ||
      "";

    select.innerHTML = state.classes.map(item => `
      <option value="${escapeHTML(item.name)}"
        ${item.name === current ? "selected" : ""}>
        ${escapeHTML(item.name)}
      </option>
    `).join("");

    state.filters.timetableClass = current;
  });
}

function hasTimetableConflict(lesson) {
  return state.timetable.some(other =>
    other.id !== lesson.id &&
    other.day === lesson.day &&
    other.time === lesson.time &&
    (
      other.teacher === lesson.teacher ||
      other.room === lesson.room
    )
  );
}

function validateLesson(lesson) {
  const conflicts = state.timetable.filter(item =>
    item.id !== lesson.id &&
    item.day === lesson.day &&
    item.time === lesson.time &&
    (
      item.teacher === lesson.teacher ||
      item.room === lesson.room
    )
  );

  return {
    valid: conflicts.length === 0,
    conflicts
  };
}

function addTimetableLesson(lesson) {
  if (!can("manage_timetable")) {
    showToast(
      "Permission denied",
      "You do not have permission to edit the timetable.",
      "danger"
    );
    return false;
  }

  const validation = validateLesson(lesson);

  if (!validation.valid) {
    const names = validation.conflicts
      .map(item => `${item.teacher} / ${item.room}`)
      .join(", ");

    showToast(
      "Timetable conflict",
      `Teacher or room already assigned: ${names}`,
      "danger"
    );

    return false;
  }

  state.timetable.push({
    ...lesson,
    id: randomId("tt")
  });

  persistDemoState();
  renderTimetable();

  showToast(
    "Lesson added",
    `${lesson.subject} has been added to the timetable.`,
    "success"
  );

  return true;
}


/* =========================================================
   ATTENDANCE
   ========================================================= */

function renderAttendance() {
  const container =
    byId("attendance-list") ||
    $(".attendance-list");

  if (!container) return;

  const date =
    state.filters.attendanceDate ||
    todayISO();

  container.innerHTML = state.students.map(student => {
    const record =
      state.attendance.find(item =>
        item.studentId === student.id &&
        item.date === date
      ) || {
        studentId: student.id,
        date,
        status: "Present"
      };

    return `
      <div class="attendance-row">
        <div class="attendance-student">
          <strong>${escapeHTML(student.name)}</strong>
          <small>${escapeHTML(student.className)} • Roll ${escapeHTML(student.roll)}</small>
        </div>

        <div>
          <span class="status-pill ${record.status === "Present" ? "success" : record.status === "Absent" ? "danger" : "warning"}">
            ${escapeHTML(record.status)}
          </span>
        </div>

        <div>
          <small>${escapeHTML(student.attendance)}% overall</small>
        </div>

        <div class="attendance-controls">
          ${["Present", "Absent", "Late"].map(status => `
            <button
              type="button"
              class="attendance-status ${record.status === status ? "selected" : ""}"
              data-action="set-attendance"
              data-student-id="${student.id}"
              data-status="${status}"
              data-date="${date}"
            >
              ${status}
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");
}

function setAttendance(studentId, status, date = todayISO()) {
  if (!can("manage_attendance")) {
    showToast(
      "Permission denied",
      "You do not have permission to change attendance.",
      "danger"
    );
    return;
  }

  const existing = state.attendance.find(item =>
    item.studentId === studentId &&
    item.date === date
  );

  if (existing) {
    existing.status = status;
  } else {
    state.attendance.push({
      studentId,
      date,
      status
    });
  }

  persistDemoState();
  renderAttendance();

  showToast(
    "Attendance updated",
    `Marked ${status.toLowerCase()}.`,
    "success"
  );
}


/* =========================================================
   ASSIGNMENTS
   ========================================================= */

function renderAssignments() {
  const tbody = getTableBody([
    "#assignments-table-body",
    "[data-assignments-table-body]"
  ]);

  if (!tbody) return;

  tbody.innerHTML = state.assignments.map(item => `
    <tr>
      <td><strong>${escapeHTML(item.title)}</strong></td>
      <td>${escapeHTML(item.subject)}</td>
      <td>${escapeHTML(item.className)}</td>
      <td>${escapeHTML(formatDate(item.dueDate))}</td>
      <td>
        <span class="status-pill success">${escapeHTML(item.status)}</span>
      </td>
      <td>
        <div class="table-actions">
          <button class="table-action" data-action="view-assignment" data-id="${item.id}">View</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function addAssignment(assignment) {
  if (!can("manage_assignments")) {
    showToast("Permission denied", "You cannot publish assignments.", "danger");
    return false;
  }

  state.assignments.push({
    id: randomId("assignment"),
    title: assignment.title,
    subject: assignment.subject,
    className: assignment.className,
    dueDate: assignment.dueDate,
    status: "Published"
  });

  persistDemoState();
  renderAssignments();

  showToast("Assignment published", assignment.title, "success");
  return true;
}


/* =========================================================
   EXAMS
   ========================================================= */

function renderExams() {
  const tbody = getTableBody([
    "#exams-table-body",
    "[data-exams-table-body]"
  ]);

  if (!tbody) return;

  tbody.innerHTML = state.exams.map(item => `
    <tr>
      <td><strong>${escapeHTML(item.name)}</strong></td>
      <td>${escapeHTML(item.className)}</td>
      <td>${escapeHTML(formatDate(item.date))}</td>
      <td>
        <span class="status-pill ${item.status === "Scheduled" ? "success" : "warning"}">
          ${escapeHTML(item.status)}
        </span>
      </td>
      <td>
        <div class="table-actions">
          <button class="table-action" data-action="view-exam" data-id="${item.id}">View</button>
        </div>
      </td>
    </tr>
  `).join("");
}


/* =========================================================
   ANNOUNCEMENTS
   ========================================================= */

function renderAnnouncements() {
  const container =
    byId("announcement-list") ||
    $(".announcement-list");

  if (!container) return;

  container.innerHTML = state.announcements.map(item => `
    <article class="announcement-card">
      <div class="announcement-meta">
        <span>${escapeHTML(formatDate(item.date))}</span>
        <span>•</span>
        <span>${escapeHTML(item.author)}</span>
      </div>
      <h3>${escapeHTML(item.title)}</h3>
      <p>${escapeHTML(item.message)}</p>
    </article>
  `).join("");
}

function addAnnouncement({ title, message }) {
  if (!can("manage_school")) {
    showToast("Permission denied", "Only authorized staff can publish announcements.", "danger");
    return false;
  }

  state.announcements.unshift({
    id: randomId("announcement"),
    title,
    message,
    author: state.profile?.name || "Administration",
    date: todayISO()
  });

  persistDemoState();
  renderAnnouncements();
  renderRecentActivity();

  showToast("Announcement published", title, "success");
  return true;
}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function renderNotifications() {
  const container =
    byId("notification-list") ||
    $(".notification-list");

  if (!container) return;

  container.innerHTML = state.notifications.map(item => `
    <div class="notification-item">
      <div class="activity-dot"></div>
      <div>
        <strong>${escapeHTML(item.title)}</strong>
        <p>${escapeHTML(item.message)}</p>
        <small class="muted">${escapeHTML(formatDate(item.date))}</small>
      </div>
      <div style="margin-left:auto">
        <span class="status-pill ${item.read ? "" : "info"}">
          ${item.read ? "Read" : "New"}
        </span>
      </div>
    </div>
  `).join("");

  updateNotificationCount();
}

function markAllNotificationsRead() {
  state.notifications.forEach(item => {
    item.read = true;
  });

  persistDemoState();
  renderNotifications();

  showToast("Notifications cleared", "All notifications are marked as read.", "success");
}

function updateNotificationCount() {
  const count = state.notifications.filter(item => !item.read).length;

  setText("[data-notification-count]", count);

  const badge =
    $(".notification-count");

  if (badge) {
    badge.textContent = count;
    badge.classList.toggle("hidden", count === 0);
  }
}


/* =========================================================
   ANALYTICS
   ========================================================= */

function renderAnalytics() {
  const attendance =
    state.students.length
      ? Math.round(
          state.students.reduce(
            (sum, student) => sum + Number(student.attendance || 0),
            0
          ) / state.students.length
        )
      : 0;

  setText("[data-analytics-attendance]", `${attendance}%`);
  setText("[data-analytics-students]", state.students.length);
  setText("[data-analytics-teachers]", state.teachers.length);
  setText("[data-analytics-classes]", state.classes.length);

  const bars = $$(".chart-bar");

  if (bars.length) {
    const values = [
      78,
      85,
      82,
      91,
      attendance,
      95
    ];

    bars.forEach((bar, index) => {
      const value = values[index] ?? 70;
      bar.style.height = `${Math.max(5, Math.min(100, value))}%`;
      bar.title = `${value}%`;
    });
  }
}


/* =========================================================
   REPORTS
   ========================================================= */

function renderReports() {
  setText("[data-report-students]", state.students.length);
  setText("[data-report-teachers]", state.teachers.length);
  setText("[data-report-classes]", state.classes.length);
  setText("[data-report-lessons]", state.timetable.length);
}

function generateReport(type) {
  const report = {
    generatedAt: new Date().toISOString(),
    school: state.school,
    type,
    summary: {
      students: state.students.length,
      teachers: state.teachers.length,
      classes: state.classes.length,
      lessons: state.timetable.length
    }
  };

  const blob = new Blob(
    [JSON.stringify(report, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download =
    `${APP_CONFIG.name}-${type}-report.json`;

  anchor.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  showToast(
    "Report generated",
    `${humanize(type)} report downloaded.`,
    "success"
  );
}


/* =========================================================
   BILLING
   ========================================================= */

function renderBilling() {
  const currentPlan =
    state.school?.plan ||
    "Professional";

  setText("[data-current-plan]", currentPlan);
}

function choosePlan(plan) {
  if (!plan) return;

  /*
    Real payment integration should happen through a secure
    backend/payment provider. Never trust price/plan data sent
    from the browser.
  */

  showToast(
    "Plan selected",
    `${plan} is ready for checkout integration.`,
    "info"
  );
}


/* =========================================================
   SETTINGS
   ========================================================= */

function renderSettings() {
  const tabs = $$(".settings-tab");
  const panels = $$(".settings-panel");

  if (!tabs.length || !panels.length) return;

  tabs.forEach(tab => {
    const active = tab.dataset.settingsTab === state.settings.activeTab;

    tab.classList.toggle("active", active);
  });

  panels.forEach(panel => {
    panel.classList.toggle(
      "hidden",
      panel.dataset.settingsPanel !== state.settings.activeTab
    );
  });
}

function setSettingsTab(tab) {
  state.settings.activeTab = tab;
  renderSettings();
}

function saveSchoolSettings(formData) {
  if (!can("manage_settings")) {
    showToast("Permission denied", "You cannot change school settings.", "danger");
    return;
  }

  state.school = {
    ...state.school,
    ...Object.fromEntries(formData.entries())
  };

  persistDemoState();
  updateUserUI();

  showToast(
    "Settings saved",
    "School settings have been updated.",
    "success"
  );
}


/* =========================================================
   MODAL SYSTEM
   ========================================================= */

function openModal(id) {
  const modal = byId(id);

  if (!modal) {
    console.warn(`[EduTime] Modal "${id}" not found.`);
    return;
  }

  modal.classList.remove("hidden");

  const firstInput = modal.querySelector(
    "input, select, textarea, button"
  );

  setTimeout(() => firstInput?.focus(), 30);

  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  const modal = byId(id);

  if (!modal) return;

  modal.classList.add("hidden");

  if (!$$(".modal:not(.hidden)").length) {
    document.body.style.overflow = "";
  }
}

function closeAllModals() {
  $$(".modal").forEach(modal => {
    modal.classList.add("hidden");
  });

  document.body.style.overflow = "";
}


/* =========================================================
   TIMETABLE MODAL
   ========================================================= */

function prepareTimetableModal({ day, time } = {}) {
  const modal =
    byId("create-timetable-modal") ||
    $(".timetable-modal");

  if (!modal) {
    showToast(
      "Timetable",
      "Create the timetable modal in index.html to use this feature.",
      "info"
    );
    return;
  }

  const dayInput =
    modal.querySelector('[name="day"]');

  const timeInput =
    modal.querySelector('[name="time"]');

  if (dayInput && day) dayInput.value = day;
  if (timeInput && time) timeInput.value = time;

  const classInput =
    modal.querySelector('[name="className"]');

  if (classInput) {
    classInput.innerHTML = state.classes.map(item => `
      <option value="${escapeHTML(item.name)}">
        ${escapeHTML(item.name)}
      </option>
    `).join("");
  }

  const subjectInput =
    modal.querySelector('[name="subject"]');

  if (subjectInput) {
    subjectInput.innerHTML = state.subjects.map(item => `
      <option value="${escapeHTML(item.name)}">
        ${escapeHTML(item.name)}
      </option>
    `).join("");
  }

  const teacherInput =
    modal.querySelector('[name="teacher"]');

  if (teacherInput) {
    teacherInput.innerHTML = state.teachers.map(item => `
      <option value="${escapeHTML(item.name)}">
        ${escapeHTML(item.name)}
      </option>
    `).join("");
  }

  const roomInput =
    modal.querySelector('[name="room"]');

  if (roomInput) {
    roomInput.innerHTML = state.rooms.map(item => `
      <option value="${escapeHTML(item.name)}">
        ${escapeHTML(item.name)}
      </option>
    `).join("");
  }

  openModal(modal.id);
}


/* =========================================================
   CSV IMPORT / EXPORT
   ========================================================= */

function parseCSV(text) {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const headers = lines[0]
    .split(",")
    .map(header => header.trim());

  return lines.slice(1).map(line => {
    const values = line.split(",");

    return headers.reduce((row, header, index) => {
      row[header] = values[index]?.trim() || "";
      return row;
    }, {});
  });
}

function importStudentsCSV(file) {
  if (!can("manage_users")) {
    showToast("Permission denied", "You cannot import student records.", "danger");
    return;
  }

  if (!file) return;

  const reader = new FileReader();

  reader.onload = event => {
    const rows = parseCSV(event.target.result);

    let imported = 0;

    rows.forEach(row => {
      if (!row.name) return;

      state.students.push({
        id: randomId("student"),
        name: row.name,
        roll: row.roll || String(state.students.length + 101),
        className: row.className || row.class || "Unassigned",
        email: row.email || "",
        status: "Active",
        attendance: 100
      });

      imported++;
    });

    persistDemoState();
    renderStudents();
    renderDashboard();

    showToast(
      "Import complete",
      `${imported} student record(s) imported.`,
      "success"
    );
  };

  reader.readAsText(file);
}

function exportStudentsCSV() {
  const headers = [
    "name",
    "roll",
    "className",
    "email",
    "status",
    "attendance"
  ];

  const rows = state.students.map(student =>
    headers.map(header => csvEscape(student[header]))
  );

  const csv = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  downloadText(
    csv,
    "students.csv",
    "text/csv;charset=utf-8"
  );

  showToast(
    "Export complete",
    "Student records exported to CSV.",
    "success"
  );
}

function csvEscape(value) {
  const text = String(value ?? "");

  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function downloadText(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


/* =========================================================
   GOOGLE CLOUD BACKEND
   ========================================================= */

async function callGoogleCloud(endpoint, payload = {}) {
  if (!APP_CONFIG.googleCloud.apiBaseUrl) {
    showToast(
      "Google Cloud not connected",
      "Add your secure Cloud Run/Cloud Functions API URL first.",
      "info"
    );
    return null;
  }

  const url =
    `${APP_CONFIG.googleCloud.apiBaseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(payload)
    });

    const contentType =
      response.headers.get("content-type") || "";

    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new Error(
        typeof data === "string"
          ? data
          : data?.message || "Cloud request failed."
      );
    }

    return data;
  } catch (error) {
    console.error("[EduTime] Google Cloud request failed:", error);
    showToast(
      "Cloud request failed",
      error.message,
      "danger"
    );
    return null;
  }
}


/* =========================================================
   SUPABASE DATABASE HELPERS
   ========================================================= */

async function dbSelect(table, columns = "*", filters = {}) {
  if (!supabaseClient) {
    return {
      data: getLocalCollection(table),
      error: null
    };
  }

  let query = supabaseClient
    .from(table)
    .select(columns);

  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  return await query;
}

async function dbInsert(table, rows) {
  if (!supabaseClient) {
    const collection = getLocalCollection(table);
    collection.push(...(Array.isArray(rows) ? rows : [rows]));
    saveLocalCollection(table, collection);

    return {
      data: rows,
      error: null
    };
  }

  return await supabaseClient
    .from(table)
    .insert(rows)
    .select();
}

async function dbUpdate(table, values, filters = {}) {
  if (!supabaseClient) {
    return {
      data: null,
      error: new Error("Demo database update is not implemented.")
    };
  }

  let query = supabaseClient
    .from(table)
    .update(values);

  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  return await query.select();
}

async function dbDelete(table, filters = {}) {
  if (!supabaseClient) {
    return {
      data: null,
      error: new Error("Demo database delete is not implemented.")
    };
  }

  let query = supabaseClient
    .from(table)
    .delete();

  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  return await query;
}


/* =========================================================
   LOCAL DEMO PERSISTENCE
   ========================================================= */

const LOCAL_KEYS = {
  students: "edutime_students",
  teachers: "edutime_teachers",
  parents: "edutime_parents",
  classes: "edutime_classes",
  subjects: "edutime_subjects",
  rooms: "edutime_rooms",
  timetable: "edutime_timetable",
  attendance: "edutime_attendance",
  assignments: "edutime_assignments",
  exams: "edutime_exams",
  announcements: "edutime_announcements",
  notifications: "edutime_notifications",
  school: "edutime_school"
};

function loadPersistedDemoState() {
  state.students = storage.get(
    LOCAL_KEYS.students,
    state.students
  );

  state.teachers = storage.get(
    LOCAL_KEYS.teachers,
    state.teachers
  );

  state.parents = storage.get(
    LOCAL_KEYS.parents,
    state.parents
  );

  state.classes = storage.get(
    LOCAL_KEYS.classes,
    state.classes
  );

  state.subjects = storage.get(
    LOCAL_KEYS.subjects,
    state.subjects
  );

  state.rooms = storage.get(
    LOCAL_KEYS.rooms,
    state.rooms
  );

  state.timetable = storage.get(
    LOCAL_KEYS.timetable,
    state.timetable
  );

  state.attendance = storage.get(
    LOCAL_KEYS.attendance,
    state.attendance
  );

  state.assignments = storage.get(
    LOCAL_KEYS.assignments,
    state.assignments
  );

  state.exams = storage.get(
    LOCAL_KEYS.exams,
    state.exams
  );

  state.announcements = storage.get(
    LOCAL_KEYS.announcements,
    state.announcements
  );

  state.notifications = storage.get(
    LOCAL_KEYS.notifications,
    state.notifications
  );

  state.school = storage.get(
    LOCAL_KEYS.school,
    state.school
  );
}

function persistDemoState() {
  storage.set(LOCAL_KEYS.students, state.students);
  storage.set(LOCAL_KEYS.teachers, state.teachers);
  storage.set(LOCAL_KEYS.parents, state.parents);
  storage.set(LOCAL_KEYS.classes, state.classes);
  storage.set(LOCAL_KEYS.subjects, state.subjects);
  storage.set(LOCAL_KEYS.rooms, state.rooms);
  storage.set(LOCAL_KEYS.timetable, state.timetable);
  storage.set(LOCAL_KEYS.attendance, state.attendance);
  storage.set(LOCAL_KEYS.assignments, state.assignments);
  storage.set(LOCAL_KEYS.exams, state.exams);
  storage.set(LOCAL_KEYS.announcements, state.announcements);
  storage.set(LOCAL_KEYS.notifications, state.notifications);
  storage.set(LOCAL_KEYS.school, state.school);
}

function getLocalCollection(table) {
  const map = {
    students: state.students,
    teachers: state.teachers,
    parents: state.parents,
    classes: state.classes,
    subjects: state.subjects,
    rooms: state.rooms,
    timetable: state.timetable,
    attendance: state.attendance,
    assignments: state.assignments,
    exams: state.exams,
    announcements: state.announcements,
    notifications: state.notifications
  };

  return map[table] || [];
}

function saveLocalCollection(table, collection) {
  const mapping = {
    students: "students",
    teachers: "teachers",
    parents: "parents",
    classes: "classes",
    subjects: "subjects",
    rooms: "rooms",
    timetable: "timetable",
    attendance: "attendance",
    assignments: "assignments",
    exams: "exams",
    announcements: "announcements",
    notifications: "notifications"
  };

  const stateKey = mapping[table];

  if (!stateKey) return;

  state[stateKey] = collection;

  const storageKey = LOCAL_KEYS[stateKey];

  if (storageKey) {
    storage.set(storageKey, collection);
  }
}


/* =========================================================
   TOASTS
   ========================================================= */

function showToast(title, message = "", type = "info") {
  let container =
    byId("toast-container") ||
    $(".toast-container");

  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const icons = {
    success: "✓",
    danger: "!",
    warning: "!",
    info: "i"
  };

  const toast = document.createElement("div");
  toast.className = "toast";

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || "i"}</span>
    <div class="toast-content">
      <strong>${escapeHTML(title)}</strong>
      <p>${escapeHTML(message)}</p>
    </div>
    <button class="icon-button" type="button" aria-label="Close">×</button>
  `;

  container.appendChild(toast);

  const closeButton = toast.querySelector("button");

  closeButton?.addEventListener("click", () => {
    toast.remove();
  });

  setTimeout(() => {
    toast.remove();
  }, 4500);
}


/* =========================================================
   EVENT HANDLERS
   ========================================================= */

function bindNavigation() {
  document.addEventListener("click", event => {
    const nav = event.target.closest("[data-page]");

    if (nav && nav.dataset.page) {
      event.preventDefault();

      const page = nav.dataset.page;

      if (page === "admin") {
        enforceRoleSelection();
        navigateTo("dashboard");
        return;
      }

      navigateTo(page);
    }
  });
}

function bindActionDelegation() {
  document.addEventListener("click", event => {
    const actionElement =
      event.target.closest("[data-action]");

    if (!actionElement) return;

    const action = actionElement.dataset.action;

    switch (action) {
      case "toggle-sidebar":
        toggleSidebar();
        break;

      case "toggle-profile":
        toggleProfileMenu();
        break;

      case "logout":
        signOut();
        break;

      case "open-search":
        openSearch();
        break;

      case "close-search":
        closeSearch();
        break;

      case "close-modal":
        closeModal(
          actionElement.dataset.modalId ||
          actionElement.closest(".modal")?.id
        );
        break;

      case "open-modal":
        openModal(actionElement.dataset.modalId);
        break;

      case "add-lesson":
        prepareTimetableModal({
          day: actionElement.dataset.day,
          time: actionElement.dataset.time
        });
        break;

      case "set-attendance":
        setAttendance(
          actionElement.dataset.studentId,
          actionElement.dataset.status,
          actionElement.dataset.date
        );
        break;

      case "delete-student":
        deleteStudent(actionElement.dataset.id);
        break;

      case "view-student":
      case "view-teacher":
      case "view-parent":
      case "view-class":
      case "view-subject":
      case "view-room":
      case "view-assignment":
      case "view-exam":
        showEntityDetails(
          action.replace("view-", ""),
          actionElement.dataset.id
        );
        break;

      case "mark-all-read":
        markAllNotificationsRead();
        break;

      case "settings-tab":
        setSettingsTab(actionElement.dataset.tab);
        break;

      case "generate-report":
        generateReport(actionElement.dataset.report || "school");
        break;

      case "choose-plan":
        choosePlan(actionElement.dataset.plan);
        break;

      case "export-students":
        exportStudentsCSV();
        break;

      default:
        console.info(`[EduTime] Unknown action: ${action}`);
    }
  });
}

function bindSearch() {
  document.addEventListener("input", event => {
    if (
      event.target.matches(
        "#global-search-input, .search-overlay input"
      )
    ) {
      performSearch(event.target.value);
    }

    if (
      event.target.matches(
        "#student-search, [data-student-search]"
      )
    ) {
      state.filters.studentSearch = event.target.value;
      renderStudents();
    }

    if (
      event.target.matches(
        "#teacher-search, [data-teacher-search]"
      )
    ) {
      state.filters.teacherSearch = event.target.value;
      renderTeachers();
    }

    if (
      event.target.matches(
        "#class-search, [data-class-search]"
      )
    ) {
      state.filters.classSearch = event.target.value;
      renderClasses();
    }
  });

  document.addEventListener("click", event => {
    const result =
      event.target.closest("[data-search-page]");

    if (!result) return;

    navigateTo(result.dataset.searchPage);
    closeSearch();
  });
}

function bindKeyboardShortcuts() {
  document.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();

    if ((event.ctrlKey || event.metaKey) && key === "k") {
      event.preventDefault();
      openSearch();
    }

    if (event.key === "Escape") {
      closeSearch();
      closeAllModals();
      closeProfileMenu();
      closeSidebar();
    }
  });
}

function bindForms() {
  document.addEventListener("submit", async event => {
    const form = event.target;

    if (!form.matches("form")) return;

    const action =
      form.dataset.formAction ||
      form.id;

    if (!action) return;

    event.preventDefault();

    const formData = new FormData(form);

    switch (action) {
      case "login-form":
      case "login":
        await signIn(
          formData.get("email"),
          formData.get("password")
        );
        break;

      case "signup-form":
      case "signup":
        await signUp({
          name: formData.get("name") || formData.get("full_name"),
          email: formData.get("email"),
          password: formData.get("password"),
          role: formData.get("role")
        });
        break;

      case "forgot-password-form":
        await resetPassword(formData.get("email"));
        break;

      case "create-timetable-form":
        addTimetableLesson({
          day: formData.get("day"),
          time: formData.get("time"),
          end: formData.get("end") || "",
          className: formData.get("className"),
          subject: formData.get("subject"),
          teacher: formData.get("teacher"),
          room: formData.get("room")
        });

        closeModal(form.id.includes("modal")
          ? form.closest(".modal")?.id
          : "create-timetable-modal"
        );

        break;

      case "student-form":
        addStudent({
          name: formData.get("name"),
          roll: formData.get("roll"),
          className: formData.get("className"),
          email: formData.get("email")
        });

        form.reset();
        break;

      case "assignment-form":
        addAssignment({
          title: formData.get("title"),
          subject: formData.get("subject"),
          className: formData.get("className"),
          dueDate: formData.get("dueDate")
        });

        form.reset();
        break;

      case "announcement-form":
        addAnnouncement({
          title: formData.get("title"),
          message: formData.get("message")
        });

        form.reset();
        break;

      case "school-settings-form":
        saveSchoolSettings(formData);
        break;

      default:
        break;
    }
  });
}

function bindRoleSelectors() {
  document.addEventListener("change", event => {
    const select = event.target.closest(
      'select[name="role"], [data-role-selector]'
    );

    if (!select) return;

    state.selectedRole = normalizeRole(select.value);

    enforceRoleSelection();
  });
}

function bindTimetableFilters() {
  document.addEventListener("change", event => {
    if (
      event.target.matches(
        "#timetable-class-filter, [data-timetable-class-filter]"
      )
    ) {
      state.filters.timetableClass = event.target.value;
      renderTimetable();
    }

    if (
      event.target.matches(
        "#attendance-date, [data-attendance-date]"
      )
    ) {
      state.filters.attendanceDate = event.target.value;
      renderAttendance();
    }
  });
}

function bindFileInputs() {
  document.addEventListener("change", event => {
    const input = event.target;

    if (
      input.matches(
        "#student-csv, [data-student-csv]"
      )
    ) {
      importStudentsCSV(input.files?.[0]);
    }
  });
}


/* =========================================================
   ENTITY DETAILS
   ========================================================= */

function findEntity(collection, id) {
  return collection.find(item => item.id === id);
}

function showEntityDetails(type, id) {
  const collections = {
    student: state.students,
    teacher: state.teachers,
    parent: state.parents,
    class: state.classes,
    subject: state.subjects,
    room: state.rooms,
    assignment: state.assignments,
    exam: state.exams
  };

  const entity = findEntity(
    collections[type] || [],
    id
  );

  if (!entity) return;

  const details = Object.entries(entity)
    .filter(([key]) => key !== "id")
    .map(([key, value]) => `
      <div class="role-row">
        <div>
          <strong>${escapeHTML(humanize(key))}</strong>
          <span>${escapeHTML(String(value ?? "—"))}</span>
        </div>
      </div>
    `)
    .join("");

  const modal = document.createElement("div");

  modal.className = "modal";

  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-dialog">
      <div class="modal-header">
        <div>
          <h2>${escapeHTML(entity.name || entity.title || humanize(type))}</h2>
          <p>${escapeHTML(humanize(type))} details</p>
        </div>
        <button class="icon-button" type="button" data-temp-close>×</button>
      </div>

      <div class="modal-body">
        ${details}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => {
    modal.remove();
    document.body.style.overflow = "";
  };

  modal.querySelector("[data-temp-close]")?.addEventListener("click", close);
  modal.querySelector(".modal-overlay")?.addEventListener("click", close);

  document.body.style.overflow = "hidden";
}


/* =========================================================
   RESPONSIVE / OUTSIDE CLICK
   ========================================================= */

function bindOutsideClicks() {
  document.addEventListener("click", event => {
    if (
      state.profileMenuOpen &&
      !event.target.closest(".popover") &&
      !event.target.closest(".topbar-profile")
    ) {
      closeProfileMenu();
    }

    if (
      state.sidebarOpen &&
      window.innerWidth <= 900 &&
      !event.target.closest(".sidebar") &&
      !event.target.closest("[data-action='toggle-sidebar']")
    ) {
      closeSidebar();
    }
  });
}


/* =========================================================
   THEME
   ========================================================= */

function applyTheme() {
  document.documentElement.dataset.theme =
    state.settings.darkMode ? "dark" : "light";
}

function toggleTheme() {
  state.settings.darkMode = !state.settings.darkMode;

  storage.set(
    "edutime_dark_mode",
    state.settings.darkMode
  );

  applyTheme();
}


/* =========================================================
   DARK THEME
   ========================================================= */

function applyDarkThemeCSS() {
  if (!document.getElementById("edutime-dark-theme")) {
    const style = document.createElement("style");

    style.id = "edutime-dark-theme";

    style.textContent = `
      html[data-theme="dark"] {
        --text: #f3f4f6;
        --text-secondary: #aeb7c6;
        --text-muted: #7f8a9b;
        --border: #2a3342;
        --border-light: #242c38;
        --background: #0d1117;
        --surface: #151b24;
        --surface-soft: #10161e;
      }

      html[data-theme="dark"] body {
        background: var(--background);
        color: var(--text);
      }

      html[data-theme="dark"] .card,
      html[data-theme="dark"] .stat-card,
      html[data-theme="dark"] .settings-content,
      html[data-theme="dark"] .settings-menu,
      html[data-theme="dark"] .pricing-card,
      html[data-theme="dark"] .announcement-card,
      html[data-theme="dark"] .modal-dialog,
      html[data-theme="dark"] .popover,
      html[data-theme="dark"] .search-box,
      html[data-theme="dark"] .toast,
      html[data-theme="dark"] .auth-wrapper,
      html[data-theme="dark"] .onboarding-card {
        background: #151b24;
        border-color: #2a3342;
        color: #f3f4f6;
      }

      html[data-theme="dark"] .topbar {
        background: rgba(15, 20, 28, .94);
        border-color: #2a3342;
      }

      html[data-theme="dark"] .form-group input,
      html[data-theme="dark"] .form-group select,
      html[data-theme="dark"] .form-group textarea,
      html[data-theme="dark"] .table-toolbar input,
      html[data-theme="dark"] .table-toolbar select,
      html[data-theme="dark"] .toolbar-group select,
      html[data-theme="dark"] .toolbar-group input {
        background: #10161e;
        border-color: #303a49;
        color: #f3f4f6;
      }

      html[data-theme="dark"] .data-table th,
      html[data-theme="dark"] .timetable-header,
      html[data-theme="dark"] .timetable-time {
        background: #111720;
      }

      html[data-theme="dark"] .data-table td {
        border-color: #242c38;
      }

      html[data-theme="dark"] .btn-secondary,
      html[data-theme="dark"] .btn-google,
      html[data-theme="dark"] .attendance-status,
      html[data-theme="dark"] .pagination button {
        background: #151b24;
        border-color: #303a49;
        color: #e5e7eb;
      }

      html[data-theme="dark"] .search-header input {
        background: transparent;
        color: #fff;
      }

      html[data-theme="dark"] .school-selector {
        background: #171e2b;
      }
    `;

    document.head.appendChild(style);
  }
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

async function initEduTime() {
  seedDemoData();
  loadPersistedDemoState();

  state.settings.darkMode =
    storage.get("edutime_dark_mode", false);

  applyDarkThemeCSS();
  applyTheme();

  bindNavigation();
  bindActionDelegation();
  bindSearch();
  bindKeyboardShortcuts();
  bindForms();
  bindRoleSelectors();
  bindTimetableFilters();
  bindFileInputs();
  bindOutsideClicks();

  renderDashboard();
  renderStudents();
  renderTeachers();
  renderParents();
  renderClasses();
  renderSubjects();
  renderRooms();
  renderTimetable();
  renderAttendance();
  renderAssignments();
  renderExams();
  renderAnnouncements();
  renderNotifications();
  renderAnalytics();
  renderReports();
  renderBilling();
  renderSettings();

  updateUserUI();
  updateNotificationCount();
  applyRoleBasedNavigation();

  /*
    Demo login:
    If an app shell exists and no authenticated Supabase session
    is found, show the app in demo mode. If your HTML starts
    directly on the dashboard this also keeps it functional.
  */

  const auth = findAuthView();
  const app = findAppView();

  if (APP_CONFIG.demoMode && !supabaseClient) {
    if (auth && app) {
      showAuth();
    }
  }

  await initializeSupabase();

  if (state.user) {
    showApp();
  }

  exposePublicAPI();

  console.info(
    `[${APP_CONFIG.name}] v${APP_CONFIG.version} initialized.`
  );
}


/* =========================================================
   PUBLIC API
   ========================================================= */

function exposePublicAPI() {
  window.EduTime = {
    state,

    config: APP_CONFIG,

    auth: {
      signIn,
      signUp,
      signOut,
      resetPassword
    },

    navigation: {
      navigateTo
    },

    timetable: {
      add: addTimetableLesson,
      validate: validateLesson,
      render: renderTimetable
    },

    attendance: {
      set: setAttendance,
      render: renderAttendance
    },

    reports: {
      generate: generateReport
    },

    data: {
      students: state.students,
      teachers: state.teachers,
      classes: state.classes,
      subjects: state.subjects
    },

    supabase: {
      client: () => supabaseClient,
      select: dbSelect,
      insert: dbInsert,
      update: dbUpdate,
      delete: dbDelete
    },

    cloud: {
      call: callGoogleCloud
    },

    ui: {
      toast: showToast,
      openModal,
      closeModal,
      openSearch,
      closeSearch,
      toggleSidebar,
      toggleTheme
    }
  };
}


/* =========================================================
   START
   ========================================================= */

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initEduTime,
    { once: true }
  );
} else {
  initEduTime();
}
