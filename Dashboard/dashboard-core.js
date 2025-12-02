// =====================
// STORAGE VERSION
// =====================
const STORAGE_VERSION = 2.1;

// =====================
// GOOGLE SCRIPT URL
// =====================
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyayqwjantHHziCn_hETD1zATIHgJqmv7yMLFePprccLmsnoeukAb8S068KlOnG5XOYDg/exec";

// =====================
// UTILITIES
// =====================
const qi = (s) => document.getElementById(s);
const qs = (s, p = document) => p.querySelector(s);
const qsa = (s, p = document) => [...p.querySelectorAll(s)];
const uid = () => Math.random().toString(36).substr(2, 9);

// =====================
// LOCAL DB STORAGE
// =====================
function loadData() {
  try {
    const raw = localStorage.getItem("unitysphere_db");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function saveData(data) {
  localStorage.setItem("unitysphere_db", JSON.stringify(data));
}

// =====================
// INITIAL DB
// =====================
let db = loadData() || {
  version: STORAGE_VERSION,
  users: [],
  centers: [],
  specialists: [],
  children: [],
  modules: [],
  assessments: []
};

// =====================
// REMOTE SAVE
// =====================
async function remoteSave(data) {
  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      contentType: "application/json",
      body: JSON.stringify({ action: "save", payload: data })
    });
    return await res.json();
  } catch (err) {
    console.error("Remote save error:", err);
  }
}

// =====================
// REMOTE LOAD
// =====================
async function remoteLoad() {
  try {
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=load`);
    return await res.json();
  } catch (err) {
    console.error("Remote load error:", err);
    return null;
  }
}

// =====================
// REBUILD USERS TABLE
// =====================
function syncUsersWithEntities() {
  let users = [];

  users.push({
    username: "admin",
    password: "1234",
    role: "main-admin"
  });

  for (const c of db.centers) {
    if (c.login && c.login.username && c.login.password) {
      users.push({
        username: c.login.username,
        password: c.login.password,
        role: "center-admin",
        centerId: c.id
      });
    }
  }

  for (const s of db.specialists) {
    if (s.login && s.login.username && s.login.password) {
      users.push({
        username: s.login.username,
        password: s.login.password,
        role: "specialist",
        specialistId: s.id,
        centerId: s.centerId || null
      });
    }
  }

  db.users = users;
  saveData(db);
}

// Ensure correct DB version
if (!db.version || db.version !== STORAGE_VERSION) {
  db.version = STORAGE_VERSION;
  saveData(db);
}
