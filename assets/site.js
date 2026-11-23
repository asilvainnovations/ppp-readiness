/* BARMM PPP Readiness — shared site script (all pages).
   - Side-panel "Policies" dropdown
   - Shell controls on static pages (menu, theme, print)
   - Cookie consent & settings dialog (shown after 2 minutes of time on the platform)
   - Contact form submission (Netlify Forms, AJAX with no-JS fallback)
   CSP: no inline scripts — keep JavaScript in files. */
(() => {
  "use strict";
  const CONSENT_KEY = "ppp-consent";
  const CLOCK_KEY = "ppp-consent-clock";
  const THEME_KEY = "barmm-theme";
  const CONSENT_VERSION = 1;
  const DELAY_MS = 2 * 60 * 1000; // show the consent pop-up after 2 minutes on the platform
  const POLICY_URL = "/public/cookie-policy.html";

  const store = (s) => ({
    get(k) { try { return s.getItem(k); } catch { return null; } },
    set(k, v) { try { s.setItem(k, v); } catch { /* storage blocked */ } },
    del(k) { try { s.removeItem(k); } catch { /* storage blocked */ } }
  });
  const local = store(window.localStorage || { getItem() { return null; }, setItem() {}, removeItem() {} });
  let session;
  try { session = store(window.sessionStorage); } catch { session = store({ getItem() { return null; }, setItem() {}, removeItem() {} }); }

  /* ---------- Consent state ---------- */
  function readConsent() {
    try {
      const c = JSON.parse(local.get(CONSENT_KEY) || "null");
      return c && c.v === CONSENT_VERSION ? c : null;
    } catch { return null; }
  }
  function saveConsent(prefs) {
    const c = { v: CONSENT_VERSION, necessary: true, preferences: !!prefs.preferences, analytics: !!prefs.analytics, date: new Date().toISOString() };
    local.set(CONSENT_KEY, JSON.stringify(c));
    if (!c.preferences) local.del(THEME_KEY); // honour the choice immediately
    document.dispatchEvent(new CustomEvent("ppp:consent", { detail: c }));
    return c;
  }
  window.PPPConsent = {
    get: readConsent,
    /* Preferences are user-initiated (e.g. toggling dark mode) and allowed until the user switches them off.
       Analytics is opt-in only; the platform currently loads no analytics. */
    allows(cat) {
      if (cat === "necessary") return true;
      const c = readConsent();
      if (cat === "preferences") return !c || c.preferences;
      return !!(c && c[cat]);
    },
    open: () => openConsent(true)
  };

  /* Apply stored theme early (prevents a flash on static pages). */
  const th = local.get(THEME_KEY);
  if (th === "dark" || th === "light") document.documentElement.dataset.theme = th;

  /* ---------- Consent dialog ---------- */
  let dlg, lastFocus, dismissed = false;
  function buildConsent() {
    if (dlg) return dlg;
    dlg = document.createElement("section");
    dlg.className = "consent";
    dlg.id = "cookieConsent";
    dlg.setAttribute("role", "dialog");
    dlg.setAttribute("aria-modal", "false");
    dlg.setAttribute("aria-labelledby", "ccTitle");
    dlg.setAttribute("aria-describedby", "ccDesc");
    dlg.innerHTML =
      '<h2 id="ccTitle">Cookie consent &amp; settings</h2>' +
      '<p id="ccDesc">This platform does not use advertising or tracking cookies. It stores a few items in your browser so the dashboard works and remembers your choices. Choose what you allow — you can change this at any time from <a href="' + POLICY_URL + '">Cookie Policy &amp; Settings</a>.</p>' +
      '<div class="consent-prefs" id="ccPrefs" hidden>' +
        '<div class="cat"><div><b>Strictly necessary</b><small>Remembers this consent choice, keeps the offline app cache and stores Assessment Register records you save on this device. Always on.</small></div>' +
          '<label class="switch"><input type="checkbox" checked disabled aria-label="Strictly necessary storage (always on)"><i></i></label></div>' +
        '<div class="cat"><div><b>Preferences</b><small>Remembers display settings such as light or dark mode between visits.</small></div>' +
          '<label class="switch"><input type="checkbox" id="ccPref" aria-label="Allow preference storage"><i></i></label></div>' +
        '<div class="cat"><div><b>Analytics</b><small>Anonymous usage statistics to improve the platform. None are loaded today; if introduced, they will run only when this is on.</small></div>' +
          '<label class="switch"><input type="checkbox" id="ccAna" aria-label="Allow analytics"><i></i></label></div>' +
      "</div>" +
      '<div class="consent-actions">' +
        '<button type="button" class="btn" data-cc="necessary">Essential only</button>' +
        '<button type="button" class="btn" data-cc="customise" aria-expanded="false" aria-controls="ccPrefs">Customise</button>' +
        '<button type="button" class="btn primary" data-cc="all">Accept all</button>' +
        '<button type="button" class="btn primary" data-cc="save" hidden>Save settings</button>' +
      "</div>";
    document.body.appendChild(dlg);
    dlg.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cc]");
      if (!b) return;
      const act = b.dataset.cc;
      if (act === "customise") { showPrefs(true); return; }
      let c;
      if (act === "all") c = saveConsent({ preferences: true, analytics: true });
      else if (act === "necessary") c = saveConsent({ preferences: false, analytics: false });
      else c = saveConsent({ preferences: dlg.querySelector("#ccPref").checked, analytics: dlg.querySelector("#ccAna").checked });
      closeConsent();
      toast(c.preferences || c.analytics ? "Cookie settings saved" : "Only essential storage is in use");
    });
    dlg.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); closeConsent(); } });
    return dlg;
  }
  function showPrefs(on) {
    const p = dlg.querySelector("#ccPrefs"), cust = dlg.querySelector('[data-cc="customise"]');
    p.hidden = !on;
    cust.hidden = on;
    cust.setAttribute("aria-expanded", String(on));
    dlg.querySelector('[data-cc="save"]').hidden = !on;
    if (on) dlg.querySelector("#ccPref").focus();
  }
  function openConsent(settings) {
    buildConsent();
    const c = readConsent();
    dlg.querySelector("#ccPref").checked = c ? c.preferences : true;
    dlg.querySelector("#ccAna").checked = c ? c.analytics : false;
    showPrefs(!!settings);
    lastFocus = document.activeElement;
    dlg.classList.add("show");
    if (!settings) dlg.querySelector('[data-cc="all"]').focus({ preventScroll: true });
  }
  function closeConsent() {
    if (!dlg) return;
    dlg.classList.remove("show");
    dismissed = true;
    session.set(CLOCK_KEY, "done"); // do not re-prompt during this visit
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  /* Time-on-platform clock: counts visible time across pages in this browsing session. */
  function startClock() {
    if (readConsent()) return;
    if (session.get(CLOCK_KEY) === "done") return;
    let elapsed = parseInt(session.get(CLOCK_KEY) || "0", 10) || 0;
    if (elapsed >= DELAY_MS) { openConsent(false); return; }
    let last = Date.now();
    const timer = setInterval(() => {
      if (dismissed || readConsent()) { clearInterval(timer); return; }
      const now = Date.now();
      if (document.visibilityState === "visible") elapsed += Math.min(now - last, 2000);
      last = now;
      session.set(CLOCK_KEY, String(elapsed));
      if (elapsed >= DELAY_MS) {
        clearInterval(timer);
        if (!readConsent()) openConsent(false);
      }
    }, 1000);
  }

  function toast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- Side panel ---------- */
  function initNav() {
    document.querySelectorAll(".nav-toggle").forEach((btn) => {
      const menu = document.getElementById(btn.getAttribute("aria-controls"));
      if (!menu) return;
      if (menu.querySelector('[aria-current="page"]')) { menu.hidden = false; btn.setAttribute("aria-expanded", "true"); }
      btn.addEventListener("click", () => {
        const open = btn.getAttribute("aria-expanded") !== "true";
        btn.setAttribute("aria-expanded", String(open));
        menu.hidden = !open;
      });
    });
  }

  /* Static pages (contact & policies) do not load app.js, so wire the shell controls here. */
  function initStaticShell() {
    if (document.body.dataset.shell !== "static") return;
    const side = document.getElementById("sidebar"), menu = document.getElementById("menuBtn");
    if (menu && side) menu.addEventListener("click", () => { const o = side.classList.toggle("open"); menu.setAttribute("aria-expanded", String(o)); });
    const theme = document.getElementById("themeBtn");
    if (theme) theme.addEventListener("click", () => {
      const r = document.documentElement;
      const dark = r.dataset.theme === "dark" || (!r.dataset.theme && matchMedia("(prefers-color-scheme:dark)").matches);
      r.dataset.theme = dark ? "light" : "dark";
      if (window.PPPConsent.allows("preferences")) local.set(THEME_KEY, r.dataset.theme);
    });
    const pr = document.getElementById("printBtn");
    if (pr) pr.addEventListener("click", () => window.print());
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && side && side.classList.contains("open")) { side.classList.remove("open"); menu && menu.setAttribute("aria-expanded", "false"); } });
  }

  /* ---------- Contact form ---------- */
  function initContact() {
    const f = document.getElementById("contactForm");
    if (!f) return;
    const msg = f.querySelector("#c_message"), count = f.querySelector("#c_count"), status = f.querySelector("#c_status"), btn = f.querySelector('button[type="submit"]');
    const max = parseInt(msg.getAttribute("maxlength"), 10) || 1500;
    const upd = () => { count.textContent = msg.value.length + " / " + max; };
    msg.addEventListener("input", upd); upd();
    const topic = new URLSearchParams(location.search).get("topic");
    if (topic) { const sel = f.querySelector("#c_topic"); if ([...sel.options].some((o) => o.value === topic)) sel.value = topic; }
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      status.className = "form-status"; status.textContent = "";
      if (!f.checkValidity()) { f.reportValidity(); return; }
      btn.disabled = true; btn.textContent = "Sending…";
      fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(f)).toString() })
        .then((r) => {
          if (!r.ok) throw new Error("HTTP " + r.status);
          f.reset(); upd();
          status.className = "form-status ok";
          status.textContent = "Thank you — your message was received. The Bureau of Investments aims to reply within three (3) working days.";
          status.focus();
        })
        .catch(() => {
          status.className = "form-status err";
          status.innerHTML = 'Your message could not be sent just now. Please try again, or email <a href="mailto:boi@bangsamoro.gov.ph">boi@bangsamoro.gov.ph</a>.';
          status.focus();
        })
        .finally(() => { btn.disabled = false; btn.textContent = "Send message"; });
    });
  }

  /* Cookie Policy page: show the current choice. */
  function renderStatus() {
    const el = document.getElementById("ccStatus");
    if (!el) return;
    const c = readConsent();
    if (!c) { el.textContent = "You have not made a choice yet. Only strictly necessary storage is in use, plus your theme if you change it."; return; }
    const on = (v) => (v ? "On" : "Off");
    el.textContent = "Saved " + new Date(c.date).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) +
      " — Strictly necessary: Always on · Preferences: " + on(c.preferences) + " · Analytics: " + on(c.analytics) + ".";
  }

  function init() {
    renderStatus();
    document.addEventListener("ppp:consent", renderStatus);
    initNav();
    initStaticShell();
    initContact();
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cookie-settings]");
      if (b) { e.preventDefault(); openConsent(true); }
    });
    if (location.hash === "#cookie-settings") openConsent(true);
    startClock();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
