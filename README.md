# BARMM PPP Readiness — PWA

Static, build-free Progressive Web App for MTIT–BARMM, Bureau of Investments. Styled after the BARMM Labour Market Readiness dashboard.

## What it contains
Overview (wired KPIs and charts with tooltips) · Survey Findings · Area Profiles · Six-Dimension Readiness Framework · Critical Gates · Policy Roadmap 2027–2035 · Validation Pack · local Assessment Register · Data & Sources.

Every KPI card, chart and dimension/phase tile on the Overview links to its detail section; each figure has an ⓘ tooltip and a plain-language “What this tells us” note.

## Deploy to Netlify
1. Push this folder to a Git repo, then **Add new site → Import from Git**. Build command: *(empty)*; publish directory: `.`
   Or drag the folder onto https://app.netlify.com/drop.
2. Replace `https://barmm-ppp-readiness.netlify.app/` in `index.html`, `robots.txt` and `sitemap.xml` with your real domain.
3. Bump `VERSION` in `sw.js` on each release so installed apps update.

## Updating data
Edit the workbook copy at `tools/source-workbook.xlsx`, then `pip install openpyxl && python tools/build_data.py`. The script recalculates indicators from the 98 raw records and fails if they no longer reconcile to the V3 dashboard (adjust the asserts deliberately if data legitimately changes). Narrative content lives in `assets/content.json`.

## Notes and limits
- Chart.js 4.4.4 is vendored (`assets/vendor`) so the app works offline; only Google Fonts are external (fallbacks defined; CSP allows them).
- The Assessment Register stores records in the browser’s localStorage only. For multi-user use, add a managed database, authentication, audit logs and privacy controls.
- The logo is shown in a circular crop via CSS (`border-radius:50%`) from `assets/MTIT-logo.webp`.
- The CSP allows no inline scripts. Keep new JavaScript in files.
- Survey data are descriptive of 98 respondents, not representative of all BARMM LGUs; no LGU maturity score or ranking is produced.
