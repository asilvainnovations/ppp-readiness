/* BARMM PPP Readiness — MTIT / BOI. Vanilla JS; data from assets/survey.json + assets/content.json */
(()=>{
"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const COL={green:"#155b45",dark:"#0b3d2e",gold:"#c6a15b",mint:"#9ab9a8",red:"#b84a4a",grey:"#c9d6ce"};
const TITLES={overview:"Overview",findings:"Survey Findings",areas:"Area Profiles",framework:"Readiness Framework",gates:"Critical Gates",roadmap:"Policy Roadmap",validation:"Validation Pack",register:"Assessment Register",sources:"Data & Sources"};
let S,C,charts={},cur={area:"Basilan",scope:"all",dim:0,phase:0},store=[],deferred=null;
const pc=(c,n)=>n?(100*c/n).toFixed(1)+"%":"—";
const num=v=>v==null?"—":Number(v).toLocaleString("en-PH");
const safe={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};

/* ---------- reusable fragments ---------- */
const tip=(t,f=true)=>`<span class="tip" ${f?'tabindex="0" role="note"':'aria-hidden="true"'} ${f?`aria-label="${esc(t)}"`:`title="${esc(t)}"`}>i<span class="tt">${esc(t)}</span></span>`;
const goBtn=(label,page,focus)=>`<button class="figure-link" type="button" data-go="${page}" ${focus?`data-focus="${focus}"`:""}>${label} <span aria-hidden="true">→</span></button>`;
const table=(head,rows,id)=>`<div class="table-wrap" ${id?`id="${id}"`:""}><table class="data-table"><thead><tr>${head.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const head=(eye,title,sub,extra="")=>`<div class="page-head"><div><div class="eyebrow">${eye}</div><h1 class="page-title">${title}</h1><div class="page-sub">${sub}</div></div>${extra}</div>`;
const fig=(id,title,note,tipText,interp,link,cls="")=>`<article class="card chart-card" id="fig-${id}"><div class="figure-heading"><h2 class="section-title">${title}</h2>${tip(tipText)}</div><p class="section-note">${note}</p><div class="chart-wrap"><canvas id="${id}" role="img" aria-label="${esc(title)}: ${esc(tipText)}"></canvas></div><div class="figure-interpretation"><strong>What this tells us</strong><p>${interp}</p></div>${link}</article>`;
function mk(id,type,data,opt={}){const el=document.getElementById(id);if(!el||!window.Chart)return;if(charts[id])charts[id].destroy();
 const dark=getComputedStyle(document.documentElement).getPropertyValue("--muted").trim();
 charts[id]=new Chart(el,{type,data,options:Object.assign({responsive:true,maintainAspectRatio:false,color:dark,plugins:{legend:{position:"bottom",labels:{boxWidth:10,usePointStyle:true,font:{family:"Roboto Condensed",size:11}}}},
 scales:type==="doughnut"?{}:{x:{grid:{display:false},ticks:{color:dark}},y:{beginAtZero:true,grid:{color:"rgba(120,150,135,.2)"},ticks:{color:dark}}}},opt)})}
const D=(k,b)=>(b||S.all)[k];
const lowReady=d=>d.counts[0].count+d.counts[1].count;

/* ---------- routing ---------- */
function go(page,focus){if(!TITLES[page])page="overview";if(location.hash!=="#"+page)history.pushState(null,"","#"+page);show(page,focus)}
function show(page,focus){if(!TITLES[page])page="overview";
 $$(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+page));$$("#nav button, .nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
 $("#breadcrumb").textContent="WORKSPACE / "+TITLES[page].toUpperCase();document.title=TITLES[page]+" | BARMM PPP Readiness | MTIT";
 $("#sidebar").classList.remove("open");$("#menuBtn").setAttribute("aria-expanded","false");
 if(S&&C)R[page]();
 if(focus){const t=document.getElementById(focus);if(t){t.scrollIntoView({block:"center"});t.classList.add("flash");setTimeout(()=>t.classList.remove("flash"),1700)}}else window.scrollTo(0,0)}

/* ---------- pages ---------- */
const R={};
R.overview=()=>{const a=S.all,h=a.heard,w=a.aware,p=a.part,s=a.self,l=a.lgu;
 const maxMiss=Math.max(...["heard","aware","part","self","lgu"].map(k=>100*a[k].missing/98));
 const kp=[
 ["Survey records","98","Five contractual survey areas","Respondent records in the controlling workbook. The respondent—not the LGU—is the unit of analysis; no LGU key exists.","areas","area-table"],
 ["Current-BARMM subset","91","Excludes 7 Sulu records","Sulu is a comparative survey area and is excluded from current-BARMM aggregates: Basilan 9 + Tawi-Tawi 4 + Lanao 21 + Maguindanao 57.","areas","area-note"],
 ["Heard of PPP",pc(h.counts[0].count,h.n),`${h.counts[0].count} Yes of ${h.n} valid; ${h.missing} missing`,"Prior exposure to the concept—not technical understanding or institutional capability.","findings","f-heard"],
 ["Low PPP awareness",pc(w.counts[0].count,w.n),`${w.counts[0].count} Low of ${w.n} valid; ${w.missing} missing`,"Self-rated awareness. Low is the largest category; High is 3.5% (3 respondents).","findings","f-aware"],
 ["PPP participation",pc(p.counts[0].count,p.n),`${p.counts[0].count} Yes of ${p.n} valid; ${p.missing} missing`,"Reported participation in PPP-related activities (e.g. training, projects).","findings","f-part"],
 ["Self: not / a little ready",pc(lowReady(s),s.n),`${lowReady(s)} of ${s.n} valid; ${s.missing} missing`,"Self-assessed readiness of the respondent. It is not an institutional maturity rating.","findings","f-self"],
 ["LGU: not / a little ready",pc(lowReady(l),l.n),`${lowReady(l)} of ${l.n} valid; ${l.missing} missing`,"Respondent’s perception of their LGU’s readiness. Documentary verification is required.","findings","f-lgu"],
 ["Highest missingness",maxMiss.toFixed(1)+"%","PPP participation question (17 of 98)","Blank answers stay missing and are never recoded as No or zero. Percentages use valid responses only.","sources","dq"]];
 const areas=Object.keys(S.areas);
 $("#page-overview").innerHTML=head("Decision dashboard · Version 3 working draft","BARMM PPP Readiness","A descriptive baseline of PPP awareness, participation and perceived readiness, linked to a six-dimension institutional framework, critical gates and a phased 2027–2035 roadmap.",`<div class="filters"><span class="pill gold">RA 11966 aligned</span><span class="pill">Workbook V3 · Nov 2026</span></div>`)+
 `<div class="grid kpis">${kp.map(k=>`<button class="card kpi" type="button" data-go="${k[4]}" data-focus="${k[5]}"><div class="kpi-label">${k[0]}</div>${tip(k[3],false)}<div class="kpi-value">${k[1]}</div><div class="kpi-note">${k[2]}</div><span class="kpi-go" aria-hidden="true">→</span></button>`).join("")}</div>
 <div class="insight"><div style="font-size:27px">◉</div><div><b>CORE POLICY SIGNAL</b><p>Awareness is broad but shallow: most respondents have heard of PPP, yet only about three in ten report participating and most describe themselves and their LGU as not, or only a little, ready. Readiness work should therefore move from awareness events to evidence-based institutional assessment, disciplined project screening and critical-gate controls.</p></div></div>
 <div class="grid two">
 ${fig("ovArea","PPP awareness by survey area","Share of valid responses (%) · hover bars for counts; click a bar to open the area profile","Heard of PPP (Yes) and Low self-rated awareness for each area. Denominators are small and uneven (Tawi-Tawi n=4); hover for counts and valid n.","Awareness differs by area but samples are small, so differences should not be read as rankings. Maguindanao is combined and Lanao is provisionally Lanao del Sur.",goBtn("Open Area Profiles","areas","area-table"))}
 ${fig("ovReady","Self vs perceived LGU readiness","Share of valid responses (%) · 100% stacked","Distribution of the four-point readiness scale for respondents (n=90) and their LGUs (n=82).","Most respondents sit in the lower two categories for both measures. The scale is self-reported; it cannot certify legal, fiscal or procurement capability.",goBtn("Explore Survey Findings","findings","f-self"))}
 ${fig("ovAware","Self-rated PPP awareness","Share of valid responses (%), n=85","Low, Medium and High self-rated awareness. Column V of the workbook; column Y (activity level) is not awareness.","Low awareness is the largest group and High is rare, supporting tiered orientation before applied training.",goBtn("Explore Survey Findings","findings","f-aware"))}
 ${fig("ovMiss","Valid vs missing responses","Number of records out of 98","Valid and missing responses per indicator. Missing values are retained as missing, not coded as No.","Missingness ranges from 4% to 17%, so each percentage must be shown with its valid n.",goBtn("Open Data Quality","sources","dq"))}
 </div>
 <h2 class="section-title" style="margin-top:24px">Six-dimension institutional framework ${tip("Select a dimension to open its evidence expectations, maturity descriptors and policy response.")}</h2>
 <div class="dim-grid">${C.dimensions.map((d,i)=>`<button class="dim" type="button" data-go="framework" data-dim="${i}" data-focus="dim-detail"><div class="num">${d.n}</div><h3>${d.name}</h3><p>${d.response}</p></button>`).join("")}</div>
 <h2 class="section-title" style="margin-top:24px">Implementation roadmap 2027–2035 ${tip("Five indicative phases for validation; not an approved government commitment. Select a phase for detail.")}</h2>
 <div class="timeline">${C.phases.map((p,i)=>`<button class="step" type="button" data-go="roadmap" data-phase="${i}" data-focus="phase-detail"><b>${p.p.split("—")[0]}</b><small>${p.y}</small><p>${p.p.split("—")[1].trim()}</p></button>`).join("")}</div>
 <div class="notice">The survey is exploratory respondent evidence with no sampling frame. Results are not statistically representative of all BARMM LGUs and no LGU score or ranking is derived.</div>
 <p class="footnote">Sources: Deliverable B workbook V3 (Raw Data, recalculated); Deliverables A and C; Supplementary Validation Pack.</p>`;
 const A=S.areas;
 mk("ovArea","bar",{labels:areas.map(n=>n.replace(" (combined)","")),datasets:[{label:"Heard of PPP – Yes %",data:areas.map(n=>+A[n].heard.counts[0].pct||0),backgroundColor:COL.green,borderRadius:4},{label:"Low awareness %",data:areas.map(n=>+A[n].aware.counts[0].pct||0),backgroundColor:COL.gold,borderRadius:4}]},
  {scales:{y:{min:0,max:100}},onClick:(e,els)=>{if(els.length){cur.area=areas[els[0].index];go("areas","area-table")}},plugins:{legend:{position:"bottom"},tooltip:{callbacks:{label:c=>{const b=A[areas[c.dataIndex]],d=c.datasetIndex?b.aware:b.heard;return `${c.dataset.label}: ${c.parsed.y}% (${d.counts[0].count} of valid n=${d.n})`}}}}});
 mk("ovReady","bar",{labels:["Self (n=90)","LGU (n=82)"],datasets:s.counts.map((c,i)=>({label:c.cat,data:[c.pct,l.counts[i].pct],backgroundColor:[COL.red,COL.gold,COL.mint,COL.green][i]}))},
  {indexAxis:"y",scales:{x:{stacked:true,max:100,grid:{display:false}},y:{stacked:true,grid:{display:false}}},plugins:{legend:{position:"bottom"},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${c.parsed.x}% (${(c.dataIndex?l:s).counts[c.datasetIndex].count} responses)`}}}});
 mk("ovAware","doughnut",{labels:w.counts.map(c=>c.cat),datasets:[{data:w.counts.map(c=>c.count),backgroundColor:[COL.red,COL.gold,COL.green],borderColor:"#fff",borderWidth:2}]},{plugins:{legend:{position:"bottom"},tooltip:{callbacks:{label:c=>`${c.label}: ${c.parsed} of ${w.n} (${w.counts[c.dataIndex].pct}%)`}}}});
 const ks=[["Heard","heard"],["Awareness","aware"],["Participation","part"],["Self-readiness","self"],["LGU readiness","lgu"]];
 mk("ovMiss","bar",{labels:ks.map(k=>k[0]),datasets:[{label:"Valid",data:ks.map(k=>a[k[1]].n),backgroundColor:COL.green},{label:"Missing",data:ks.map(k=>a[k[1]].missing),backgroundColor:COL.red}]},{scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,max:98}}})};

const IND=[["heard","f-heard","Heard of PPP","Prior exposure to the PPP concept; not a test of technical understanding."],["aware","f-aware","PPP awareness rating","Self-rated awareness; interpret alongside missing responses."],["part","f-part","PPP-related participation","Reported participation; 17 records are missing."],["self","f-self","Respondent self-readiness","Self-assessed readiness, not institutional certification."],["lgu","f-lgu","Perceived LGU readiness","Perception of LGU readiness; documentary verification is needed."]];
R.findings=()=>{const b=cur.scope==="all"?S.all:S.current;
 $("#page-findings").innerHTML=head("Respondent-level descriptive evidence","Survey Findings","Distribution of responses for the five core indicators, shown with valid denominators and missing counts.",`<div class="filters"><label class="muted" for="scope">Scope</label><select class="field" id="scope"><option value="all" ${cur.scope==="all"?"selected":""}>All 98 records</option><option value="current" ${cur.scope==="current"?"selected":""}>Current-BARMM subset (91, excl. Sulu)</option></select></div>`)+
 `<div class="grid two">${IND.map(i=>fig("c_"+i[0],i[2],`% of valid responses, n=${b[i[0]].n} · missing ${b[i[0]].missing}`,`${i[3]} Hover bars for counts.`,i[3],"").replace(`id="fig-c_${i[0]}"`,`id="${i[1]}"`)).join("")}</div>
 <h2 class="section-title" style="margin-top:20px">Indicator table</h2>${table(["Indicator","Category","Count","Valid n","Missing","% of valid"],IND.flatMap(i=>b[i[0]].counts.map(c=>[esc(i[2]),esc(c.cat),c.count,b[i[0]].n,b[i[0]].missing,c.pct==null?"—":c.pct+"%"])))}
 <div class="notice">Awareness and self-reported readiness are not institutional maturity ratings. Maturity can only be assessed for a named LGU or agency through the evidence protocol. ${goBtn("See the Readiness Framework","framework")}</div>`;
 $("#scope").onchange=e=>{cur.scope=e.target.value;R.findings()};
 IND.forEach(i=>{const d=b[i[0]];mk("c_"+i[0],"bar",{labels:d.counts.map(c=>c.cat),datasets:[{label:"% of valid",data:d.counts.map(c=>c.pct),backgroundColor:[COL.green,COL.gold,COL.mint,COL.red],borderRadius:4}]},{scales:{y:{min:0,max:100}},plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.parsed.y}% (${d.counts[c.dataIndex].count} of valid n=${d.n})`}}}})})};

R.areas=()=>{const names=Object.keys(S.areas),b=S.areas[cur.area];
 const small=b.records<10;
 $("#page-areas").innerHTML=head("Territorial differentiation","Area Profiles","Survey areas are shown as contracted. Sulu is comparative only; Lanao is provisionally Lanao del Sur; Maguindanao is combined.")+
 `<div class="tabs" role="tablist">${names.map(n=>`<button role="tab" class="${n===cur.area?"on":""}" data-area="${esc(n)}">${esc(n)}</button>`).join("")}</div>
 <div class="grid kpis">${[["Records",b.records,"Respondents in this area"],["Heard of PPP",pc(b.heard.counts[0].count,b.heard.n),`valid n=${b.heard.n}`],["Low awareness",pc(b.aware.counts[0].count,b.aware.n),`valid n=${b.aware.n}`],["PPP participation",pc(b.part.counts[0].count,b.part.n),`valid n=${b.part.n}`]].map(k=>`<div class="card"><div class="kpi-label">${k[0]}</div><div class="kpi-value">${k[1]}</div><div class="kpi-note">${k[2]}</div></div>`).join("")}</div>
 ${small?`<div class="notice">Small sample (${b.records} records; some questions n≤4). Percentages are illustrative and must not be generalised.</div>`:""}
 <div class="grid two">${fig("arReady","Readiness distribution","Counts of valid responses","Self and perceived LGU readiness for this area, by count.","Compare the lower two categories (Not ready, A little ready) with Ready/Very much ready; check valid n first.","")}${fig("arAware","Awareness and participation","Counts of valid responses","Self-rated awareness (Low/Medium/High) and PPP participation (Yes/No) counts for this area.","Counts avoid false precision where samples are small.",goBtn("Back to Overview","overview"))}</div>
 <h2 class="section-title" style="margin-top:20px">Area comparison</h2>
 ${table(["Survey area","Records","Heard Yes","Heard valid n","Heard Yes %","Low awareness","Awareness valid n","Low %"],names.map(n=>{const x=S.areas[n];return [`<b>${esc(n)}</b>`,x.records,x.heard.counts[0].count,x.heard.n,pc(x.heard.counts[0].count,x.heard.n),x.aware.counts[0].count,x.aware.n,pc(x.aware.counts[0].count,x.aware.n)]}),"area-table")}
 <div class="notice" id="area-note">Current-BARMM subset = 91 records (Basilan, Tawi-Tawi, Lanao provisionally Lanao del Sur, and combined Maguindanao); Sulu’s 7 records are excluded from aggregates. Respondent-to-LGU mapping is outstanding (action D-01). ${goBtn("Open the Validation Pack","validation","actions")}</div>`;
 $$("[data-area]").forEach(x=>x.onclick=()=>{cur.area=x.dataset.area;R.areas()});
 mk("arReady","bar",{labels:["Not ready","A little ready","Ready","Very much ready"],datasets:[{label:`Self (n=${b.self.n})`,data:b.self.counts.map(c=>c.count),backgroundColor:COL.green},{label:`LGU (n=${b.lgu.n})`,data:b.lgu.counts.map(c=>c.count),backgroundColor:COL.gold}]},{scales:{y:{beginAtZero:true,ticks:{precision:0}}}});
 mk("arAware","bar",{labels:["Aware: Low","Aware: Medium","Aware: High","Participated: Yes","Participated: No"],datasets:[{label:`Count (awareness n=${b.aware.n}; participation n=${b.part.n})`,data:[...b.aware.counts.map(c=>c.count),...b.part.counts.map(c=>c.count)],backgroundColor:[COL.red,COL.gold,COL.green,COL.green,COL.mint],borderRadius:4}]},{scales:{y:{beginAtZero:true,ticks:{precision:0}}},plugins:{legend:{display:false}}})};

R.framework=()=>{const d=C.dimensions[cur.dim];
 $("#page-framework").innerHTML=head("Institutional readiness","Six-Dimension Readiness Framework","The unit of assessment is a named LGU or implementing agency, rated by documentary evidence. No ratings are assigned in this release.")+
 `<div class="dim-grid">${C.dimensions.map((x,i)=>`<button class="dim ${i===cur.dim?"flash":""}" type="button" data-dimsel="${i}" aria-pressed="${i===cur.dim}"><div class="num">${x.n}</div><h3>${x.name}</h3><p>${x.evidence}</p></button>`).join("")}</div>
 <div class="card" id="dim-detail" style="margin-top:16px"><h2 class="section-title">${d.n}. ${d.name} — maturity descriptors ${tip("Rate only where evidence meets the descriptor. Missing evidence is Not Assessed or Evidence Not Available, never defaulted to Level 1.")}</h2>
 ${table(["Level","Descriptor"],d.levels.map((t,i)=>[`<b>${C.levels[i].l}</b>`,esc(t)]))}
 <p><b>Policy response:</b> ${d.response}</p><p><b>Implementation outputs:</b> ${d.outputs}</p>${goBtn("Record an assessment for this dimension","register")}</div>
 <h2 class="section-title" style="margin-top:20px">Four-level maturity logic and capacity support ${tip("Support is differentiated by maturity level, per Deliverable C.")}</h2>
 ${table(["Maturity level","Descriptor","Typical support package","Expected progression"],C.levels.map(l=>[`<b>${l.l}</b>`,l.d,l.support,l.progress]))}
 <div class="notice">Do not calculate a composite LGU score or league table until evidence thresholds, weighting and validation arrangements are agreed. A high average cannot offset a failed critical gate. ${goBtn("See Critical Gates","gates")}</div>`;
 $$("[data-dimsel]").forEach(b=>b.onclick=()=>{cur.dim=+b.dataset.dimsel;R.framework();document.getElementById("dim-detail").scrollIntoView({block:"nearest"})})};

R.gates=()=>{$("#page-gates").innerHTML=head("Independent project-level tests","Critical Gates","Assess separately for each project. A Fail blocks progression to transaction procurement until resolved.")+
 `<div class="grid three">${C.gates.map((g,i)=>`<div class="card"><div class="kpi-label">Gate ${i+1}</div><h3 class="section-title" style="margin-top:8px">${g.g}</h3><p class="muted">${g.t}</p></div>`).join("")}</div>
 <h2 class="section-title" style="margin-top:20px">Gate status values ${tip("Status is recorded per project and gate, with an evidence reference, reviewer and date.")}</h2>
 <p><span class="pill">Pass</span> <span class="pill gold">Conditional</span> <span class="pill red">Fail</span> <span class="pill">Not Assessed</span></p>
 <div class="notice">Gates are tested independently; a failed gate cannot be offset by strong results elsewhere. ${goBtn("Record a gate assessment","register")}</div>`};

R.roadmap=()=>{const p=C.phases[cur.phase];
 $("#page-roadmap").innerHTML=head("Policy and implementation","Policy &amp; Implementation Roadmap 2027–2035","Indicative programme design for validation. Targets are process milestones, not forecasts of PPP transaction volume.")+
 `<div class="timeline">${C.phases.map((x,i)=>`<button class="step ${i===cur.phase?"flash":""}" type="button" data-ph="${i}" aria-pressed="${i===cur.phase}"><b>${x.p.split("—")[0]}</b><small>${x.y}</small><p>${x.p.split("—")[1].trim()}</p></button>`).join("")}</div>
 <div class="card" id="phase-detail" style="margin-top:16px"><h2 class="section-title">${p.p} (${p.y})</h2><p><b>Priority actions:</b> ${p.a}</p><p><b>Key outputs:</b> ${p.o}</p><p><b>Decision gate:</b> ${p.gate}</p></div>
 <h2 class="section-title" style="margin-top:20px">Dimension policy responses</h2>${table(["Dimension","Policy response","Outputs"],C.dimensions.map((d,i)=>[`<button class="figure-link" style="margin:0" data-go="framework" data-dim="${i}" data-focus="dim-detail">${d.n}. ${d.name}</button>`,d.response,d.outputs]))}
 <h2 class="section-title" style="margin-top:20px">Indicative responsibilities ${tip("Roles are functional and subject to confirmation against current mandates and delegations.")}</h2>${table(["Actor","Indicative role"],C.actors)}
 <h2 class="section-title" style="margin-top:20px">Risks and mitigation</h2>${table(["Risk","Mitigation"],C.risks)}
 <h2 class="section-title" style="margin-top:20px">Minimum monitoring specification</h2>${table(["Indicator","Baseline","Indicative milestone","Frequency"],C.monitoring)}
 <div class="notice">Legal review, stakeholder validation and confirmation of mandates, funding and approvals are required before adoption. Verify current implementing issuances of RA 11966.</div>`;
 $$("[data-ph]").forEach(b=>b.onclick=()=>{cur.phase=+b.dataset.ph;R.roadmap()})};

R.validation=()=>{$("#page-validation").innerHTML=head("Supplementary workplan","Validation Pack","Data clarifications, validation protocol and action log. This pack proposes a process; it does not record a completed validation session.")+
 `<h2 class="section-title">Priority data clarifications</h2>${table(["Issue","Current treatment","Clarification required"],C.clarifications)}
 <h2 class="section-title" style="margin-top:20px">Evidence and action log ${tip("Open and For validation are workflow statuses, not evidence of completion. Owners and due dates are assigned by the client at the validation meeting.")}</h2>
 <div id="actions">${table(["Ref.","Issue / evidence requested","Responsible office","Due date","Status"],C.actions.map(a=>[a[0],a[1],"<span class='muted'>To be named by client</span>","<span class='muted'>To be agreed</span>",`<span class="pill ${a[2]==="Open"?"gold":""}">${a[2]}</span>`]))}</div>
 <h2 class="section-title" style="margin-top:20px">Proposed session agenda</h2>${table(["Session","Focus"],C.agenda)}
 <div class="notice">Unresolved geographic attribution must remain explicitly unresolved until the respondent master list is supplied.</div>`};

const GSTAT=["Pass","Conditional","Fail","Not Assessed"],DSTAT=["Not Assessed","Evidence Not Available","Assessed—Level 1","Assessed—Level 2","Assessed—Level 3","Assessed—Level 4"];
R.register=()=>{const fails=store.filter(r=>r.type==="Critical gate"&&r.status==="Fail").length;
 $("#page-register").innerHTML=head("Local evidence capture","Assessment Register","Record dimension ratings and critical-gate decisions with evidence references. Records are stored only on this device.",`<button class="btn primary" id="addRec">＋ Add record</button>`)+
 `<div class="notice">Entries are user-added local records for the validation process. They are not pre-populated and are not official ratings. No composite score is calculated.</div>
 <div class="grid kpis">${[["Records",store.length],["Dimension ratings",store.filter(r=>r.type==="Dimension rating").length],["Gate decisions",store.filter(r=>r.type==="Critical gate").length],["Failed gates",fails]].map(k=>`<div class="card"><div class="kpi-label">${k[0]}</div><div class="kpi-value">${k[1]}</div></div>`).join("")}</div>
 <div class="table-toolbar"><span class="muted">${store.length} local record(s)</span><span><button class="btn" id="expRec">Export CSV</button> <button class="btn" id="clrRec">Clear all</button></span></div>
 ${store.length?table(["Type","LGU / agency","Project","Item","Status","Confidence","Evidence / rationale","Reviewer",""],store.map(r=>[r.type,esc(r.unit),esc(r.project),esc(r.item),`<span class="pill ${r.status==="Fail"?"red":r.status==="Conditional"?"gold":""}">${esc(r.status)}</span>`,esc(r.conf),esc(r.evidence),esc(r.reviewer),`<button class="btn" data-del="${r.id}" aria-label="Delete record">✕</button>`])):`<div class="card muted">No records yet. Add one when documentary evidence is available.</div>`}`;
 $("#addRec").onclick=openModal;$("#expRec").onclick=()=>csv(store,"BARMM_PPP_Assessment_Register.csv");
 $("#clrRec").onclick=()=>{if(confirm("Delete all local records on this device?")){store=[];persist();R.register()}};
 $$("[data-del]").forEach(b=>b.onclick=()=>{store=store.filter(r=>r.id!==b.dataset.del);persist();R.register()})};

R.sources=()=>{const a=S.all,ks=[["Heard of PPP","heard"],["PPP awareness rating","aware"],["PPP-related participation","part"],["Respondent self-readiness","self"],["Perceived LGU readiness","lgu"]];
 $("#page-sources").innerHTML=head("Data governance","Data &amp; Sources","Coding, denominators, limitations and source documents.")+
 `<h2 class="section-title" id="dq">Data quality: valid responses and missingness ${tip("Percentages in this dashboard use valid responses as the denominator. Blank answers are excluded, not treated as No.")}</h2>
 ${table(["Indicator","Valid n","Missing","Missingness"],ks.map(k=>[k[0],a[k[1]].n,a[k[1]].missing,(100*a[k[1]].missing/98).toFixed(1)+"%"]))}
 <h2 class="section-title" style="margin-top:20px">Data dictionary</h2>${table(["Measure","Raw column","Source field","Coding","Interpretation"],C.dictionary)}
 <h2 class="section-title" style="margin-top:20px">Limitations</h2>
 <div class="card"><ul class="muted" style="line-height:1.7"><li>The respondent-level municipality/LGU/agency key is absent; area findings cannot be attributed to specific LGUs.</li><li>No sampling frame, selection method, field dates or role register was supplied; results are descriptive, not representative.</li><li>“Lanao” is provisionally Lanao del Sur; Maguindanao is combined; Sulu is excluded from current-BARMM aggregates.</li><li>Survey awareness and self-reported readiness are not institutional maturity ratings.</li></ul></div>
 <h2 class="section-title" style="margin-top:20px">Source register</h2>${table(["Source","Use in this dashboard"],C.sources)}
 <p class="footnote">Indicators were recalculated from the 98 raw records (tools/build_data.py) and reconciled to the workbook dashboard and Deliverable A. Data version: ${esc(S.generated)}.</p>`};

/* ---------- register helpers ---------- */
function persist(){safe.set("barmm-ppp-register",JSON.stringify(store))}
function fillItems(){const g=$("#f_type").value==="Critical gate";$("#f_item").innerHTML=(g?C.gates.map(x=>x.g):C.dimensions.map(x=>x.n+". "+x.name)).map(x=>`<option>${esc(x)}</option>`).join("");$("#f_status").innerHTML=(g?GSTAT:DSTAT).map(x=>`<option>${x}</option>`).join("")}
function openModal(){fillItems();$("#modal").classList.add("show");$("#f_unit").focus()}
function closeModal(){$("#modal").classList.remove("show")}
function csv(rows,name){if(!rows.length)return toast("No records to export");const cols=Object.keys(rows[0]),q=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
 const blob=new Blob(["\ufeff"+[cols.map(q).join(","),...rows.map(r=>cols.map(c=>q(r[c])).join(","))].join("\r\n")],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}

/* ---------- init & events ---------- */
document.addEventListener("click",e=>{const el=e.target.closest("[data-go]");if(!el)return;
 if(el.dataset.dim!=null)cur.dim=+el.dataset.dim;if(el.dataset.phase!=null)cur.phase=+el.dataset.phase;go(el.dataset.go,el.dataset.focus)});
$$(".nav button").forEach(b=>b.addEventListener("click",()=>go(b.dataset.page)));
$("#menuBtn").onclick=()=>{const o=$("#sidebar").classList.toggle("open");$("#menuBtn").setAttribute("aria-expanded",o)};
$("#printBtn").onclick=()=>window.print();
$("#themeBtn").onclick=()=>{const r=document.documentElement,d=r.dataset.theme==="dark"||(!r.dataset.theme&&matchMedia("(prefers-color-scheme:dark)").matches);r.dataset.theme=d?"light":"dark";safe.set("barmm-theme",r.dataset.theme);show(location.hash.slice(1)||"overview")};
$("#mClose").onclick=$("#mCancel").onclick=closeModal;$("#f_type").onchange=fillItems;
$("#regForm").onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.id=(crypto.randomUUID?crypto.randomUUID():String(Date.now()));d.date=new Date().toISOString().slice(0,10);store.unshift(d);persist();e.target.reset();closeModal();R.register();toast("Record saved on this device")};
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
window.addEventListener("popstate",()=>show(location.hash.slice(1)||"overview"));
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;$("#installBtn").style.display="inline-block"});
$("#installBtn").onclick=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;$("#installBtn").style.display="none"};
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(console.warn));
(async()=>{const th=safe.get("barmm-theme");if(th)document.documentElement.dataset.theme=th;
 try{store=JSON.parse(safe.get("barmm-ppp-register")||"[]")}catch{store=[]}
 try{[S,C]=await Promise.all(["assets/survey.json","assets/content.json"].map(u=>fetch(u).then(r=>{if(!r.ok)throw Error(u);return r.json()})));$("#dataStatus").textContent="Workbook data loaded"}
 catch(err){console.error(err);$("#dataStatus").textContent="Data load error";$("#content").insertAdjacentHTML("afterbegin",'<div class="notice">Data could not be loaded. Serve this folder over HTTP(S); opening index.html directly can block JSON loading.</div>');return}
 show(location.hash.slice(1)||"overview")})();
})();
