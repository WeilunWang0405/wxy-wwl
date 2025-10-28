
// Lightweight front-end gate (SHA-256 of password)
const PASS_HASH = "24bab4565f6678683471b7b1f04c805f95f9ad67bdaac2d8786dea17b35daf51"; // ← 修改为你的口令哈希（tools/hash.html 可计算）
const KEY = "gate_ok_v1";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天有效

async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const bytes = Array.from(new Uint8Array(buf));
  return bytes.map(b => b.toString(16).padStart(2, "0")).join("");
}

function isOk() {
  try {
    const raw = localStorage.getItem(KEY);
    if(!raw) return false;
    const obj = JSON.parse(raw);
    if(obj.hash !== PASS_HASH) return false;
    if(Date.now() > obj.expires) return false;
    return true;
  } catch(e) { return false; }
}

function saveOk() {
  const expires = Date.now() + TTL_MS;
  localStorage.setItem(KEY, JSON.stringify({ hash: PASS_HASH, expires }));
}

function logoutAndLock() {
  localStorage.removeItem(KEY);
  location.replace("/lock.html");
}

(function ensureGate(){
  const here = location.pathname;
  if(here.endsWith("/lock.html") || here.endsWith("/tools/hash.html")) return;
  if(!isOk()) {
    const next = encodeURIComponent(location.pathname + location.search + location.hash);
    location.replace("/lock.html?next=" + next);
  }
})();

// Expose for header buttons
window.__gate__ = { saveOk, logoutAndLock, sha256Hex, PASS_HASH, KEY };
