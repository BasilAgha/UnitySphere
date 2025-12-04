// ================= CONFIG =================
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzFvCaHToqUu-QYdyD2KYkQn_Z9qo8RVpwNUE1bxBHGV9T7QHW78an8Bl8FjiWeuFm17Q/exec";
// Simple helpers
const qi = (id) => document.getElementById(id);
const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => [...r.querySelectorAll(s)];

// POST helper
async function apiPost(params) {
  const body = new URLSearchParams(params);
  const res = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    body
  });
  return res.text();
}

// GET helper
async function apiGet(params) {
  const url = new URL(GOOGLE_SCRIPT_URL);
  Object.entries(params).forEach(([k, v]) =>
    url.searchParams.append(k, v)
  );
  const res = await fetch(url.toString());
  return res.json();
}
