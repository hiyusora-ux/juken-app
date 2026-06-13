import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";

/* ════════════ CYBER THEME ════════════ */
const C = {
  bg: "#070B14", bg2: "#0A0F1E", panel: "#0E1525", panelHi: "#121C31",
  line: "#1E2A44", ink: "#DCE8FF", sub: "#6E80A6", dim: "#43547A",
  cyan: "#2DE2E6", blue: "#3D7BFF", magenta: "#FF2E97", green: "#27F2A8",
  amber: "#FFB020", red: "#FF4D6D", violet: "#9B6CFF",
};
const MONO = "'JetBrains Mono','SF Mono',SFMono-Regular,ui-monospace,'Roboto Mono',monospace";
const DISP = "'Orbitron','Rajdhani',ui-sans-serif,system-ui,sans-serif"; // 見出し/HUD用サイバーフォント
const glow = (c, s = 14) => `0 0 ${s}px ${c}55, 0 0 2px ${c}88`;

const SUBJECTS = [
  { key: "英語", color: "#2DE2E6" }, { key: "数学", color: "#27F2A8" },
  { key: "国語", color: "#FF2E97" }, { key: "理科", color: "#FFB020" },
  { key: "社会", color: "#9B6CFF" }, { key: "その他", color: "#3D7BFF" },
];
const SUBJECT_KEYS = SUBJECTS.map((s) => s.key);
const colorOf = (k) => (SUBJECTS.find((s) => s.key === k) || {}).color || C.blue;
const TEST_TYPES = ["模試", "実力テスト", "定期テスト"];
const isDevType = (t) => t === "模試" || t === "実力テスト";

/* ── 日付 ── */
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth()+1)}-${pad(x.getDate())}`; };
const todayYMD = () => ymd(new Date());
const startOfWeek = (d) => { const x = new Date(d); const day = (x.getDay()+6)%7; x.setHours(0,0,0,0); x.setDate(x.getDate()-day); return x; };
const daysBetween = (a, b) => Math.round((new Date(b).setHours(0,0,0,0) - new Date(a).setHours(0,0,0,0)) / 86400000);
const fmtMin = (m) => { const h = Math.floor(m/60), mm = Math.round(m%60); if (h && mm) return `${h}時間${mm}分`; if (h) return `${h}時間`; return `${mm}分`; };
const fmtHours = (m) => Math.round((m/60)*10)/10;
const round1 = (v) => Math.round(v*10)/10;

/* ── あいぼうモンスター ── */
const CREATURES = {
  flame: { name: "ホムラ", color: "#FF6A3D", accent: "#FFB020" },
  aqua:  { name: "ミズチ", color: "#2D9CFF", accent: "#2DE2E6" },
  leaf:  { name: "リーフィ", color: "#1FCB6E", accent: "#9BF27E" },
  volt:  { name: "デンキュウ", color: "#F4C53B", accent: "#FFE98A" },
  nova:  { name: "ヨゾラ", color: "#9B6CFF", accent: "#C9A6FF" },
};
const stageOf = (lvl) => (lvl >= 10 ? 3 : lvl >= 5 ? 2 : 1);

function CreatureSprite({ species = "flame", level = 1, size = 64, bob = true }) {
  const c = CREATURES[species] || CREATURES.flame;
  const stage = stageOf(level);
  const gid = "cg-" + species + stage;
  return (
    <div style={{ width: size, height: size, animation: bob ? "bob 3s ease-in-out infinite" : "none", lineHeight: 0 }}>
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: "block", filter: `drop-shadow(0 0 9px ${c.accent}88)` }}>
        <defs><radialGradient id={gid} cx="50%" cy="36%" r="68%"><stop offset="0%" stopColor={c.accent} /><stop offset="100%" stopColor={c.color} /></radialGradient></defs>
        {stage>=3 && <circle cx="50" cy="55" r="45" fill="none" stroke={c.accent} strokeOpacity="0.45" strokeWidth="2" strokeDasharray="3 7" style={{ animation: "pulse 2.4s ease-in-out infinite" }} />}
        {stage>=3 && <><path d="M24 50 Q3 37 9 65 Q19 60 28 60 Z" fill={c.color} opacity="0.85" /><path d="M76 50 Q97 37 91 65 Q81 60 72 60 Z" fill={c.color} opacity="0.85" /></>}
        {stage>=2 && <><path d="M34 26 L27 7 L45 22 Z" fill={c.color} /><path d="M66 26 L73 7 L55 22 Z" fill={c.color} /></>}
        <ellipse cx="50" cy="56" rx="30" ry="29" fill={`url(#${gid})`} stroke={c.accent} strokeOpacity="0.5" />
        <ellipse cx="50" cy="64" rx="17" ry="14" fill="#ffffff" opacity="0.16" />
        <circle cx="40" cy="50" r="6.2" fill="#0A1120" /><circle cx="60" cy="50" r="6.2" fill="#0A1120" />
        <circle cx="42" cy="48" r="2" fill="#fff" /><circle cx="62" cy="48" r="2" fill="#fff" />
        {stage>=2 && <><circle cx="31" cy="60" r="3.6" fill={c.accent} opacity="0.6" /><circle cx="69" cy="60" r="3.6" fill={c.accent} opacity="0.6" /></>}
        <path d="M44 64 Q50 70 56 64" fill="none" stroke="#0A1120" strokeWidth="2.2" strokeLinecap="round" />
        {stage>=3 && <path d="M37 22 L44 31 L50 19 L56 31 L63 22 L61 35 L39 35 Z" fill={c.accent} stroke={c.color} strokeWidth="1" />}
      </svg>
    </div>
  );
}

/* ── 永続データ ── */
const STORAGE_KEY = "juken-dashboard-v1";
const DEFAULT_STATE = {
  studentName: "長男", targetLabel: "共通テスト", targetDate: "2028-01-16",
  weeklyGoalHours: 25, mountainSchoolId: "s1",
  schools: [
    { id: "s1", name: "第一志望大学", faculty: "", target: 62 },
    { id: "s2", name: "第二志望大学", faculty: "", target: 57 },
  ],
  studyLogs: [], mockExams: [],
  pomodoro: { workMin: 25, breakMin: 5, longBreakMin: 15, cyclesUntilLong: 4, bgmId: "EsH7A8I4bAY", bgmSync: true },
  profile: { birthdate: "", grade: "高校2年生", gender: "", prefecture: "岡山県", city: "",
    school: "", cram: "", club: "", hobby: "", strong: "", weak: "", note: "", avatar: "", creature: "flame" },
  futureDream: "", goals: [], dailyTasks: [], rewards: [], seenBadges: [],
};
const uid = () => Math.random().toString(36).slice(2, 9);

function migrate(s) {
  const st = { ...DEFAULT_STATE, ...s };
  st.mockExams = (st.mockExams || []).map((m) => ({ type: "模試", ...m }));
  st.schools = (st.schools || DEFAULT_STATE.schools).map((x) => ({ faculty: "", ...x }));
  if (!st.mountainSchoolId && st.schools[0]) st.mountainSchoolId = st.schools[0].id;
  st.pomodoro = { ...DEFAULT_STATE.pomodoro, ...(st.pomodoro || {}) };
  st.profile = { ...DEFAULT_STATE.profile, ...(st.profile || {}) };
  if (typeof st.futureDream !== "string") st.futureDream = "";
  if (!Array.isArray(st.goals)) st.goals = [];
  if (!Array.isArray(st.dailyTasks)) st.dailyTasks = [];
  if (!Array.isArray(st.rewards)) st.rewards = [];
  if (!Array.isArray(st.seenBadges)) st.seenBadges = [];
  return st;
}

function makeSample() {
  const logs = [];
  for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate()-i);
    [...SUBJECT_KEYS].sort(()=>Math.random()-0.5).slice(0,1+Math.floor(Math.random()*3)).forEach((s)=>logs.push({id:uid(),date:ymd(d),subject:s,minutes:30+Math.floor(Math.random()*5)*15,note:""})); }
  const mkDev=(off,base,type,label)=>{const d=new Date();d.setDate(d.getDate()-off);const sc={};SUBJECT_KEYS.slice(0,5).forEach((s,i)=>(sc[s]=base+i-2+Math.floor(Math.random()*4)));return{id:uid(),type,name:`${label} ${ymd(d).slice(0,7)}`,date:ymd(d),scores:sc};};
  const mkT=(off,base)=>{const d=new Date();d.setDate(d.getDate()-off);const sc={};SUBJECT_KEYS.slice(0,5).forEach((s,i)=>(sc[s]=Math.min(100,base+i*2+Math.floor(Math.random()*8))));return{id:uid(),type:"定期テスト",name:`定期テスト ${ymd(d).slice(0,7)}`,date:ymd(d),scores:sc};};
  return { ...DEFAULT_STATE, studyLogs: logs,
    mockExams:[mkDev(150,51,"模試","進研模試"),mkDev(110,53,"実力テスト","校内実力"),mkDev(75,54,"模試","進研模試"),mkDev(40,56,"実力テスト","校内実力"),mkDev(8,58,"模試","全統模試"),mkT(95,68),mkT(20,74)],
    dailyTasks:[{id:uid(),date:todayYMD(),text:"英単語を20個おぼえる",done:true},{id:uid(),date:todayYMD(),text:"数学の問題を5問とく",done:true},{id:uid(),date:todayYMD(),text:"学校の宿題を終わらせる",done:false},{id:uid(),date:todayYMD(),text:"ポモドーロを3回やる",done:false}],
  };
}

/* ── 共通UI ── */
const card = { background: C.panel, borderRadius: 14, border: `1px solid ${C.line}`, boxShadow: `0 0 0 1px ${C.cyan}12, 0 1px 0 rgba(45,226,230,.08) inset, 0 10px 34px rgba(0,0,0,.6), 0 0 26px ${C.cyan}0c` };
const inputStyle = { border: `1px solid ${C.line}`, borderRadius: 9, padding: "9px 11px", fontSize: 14, color: C.ink, background: "#0A1120", outline: "none", width: "100%" };
const btn = (bg, fg = "#04121a") => ({ background: bg, color: fg, border: "none", borderRadius: 9, padding: "9px 14px", fontSize: 13.5, fontWeight: 800, cursor: "pointer", letterSpacing: ".01em" });
const btnGhost = (c) => ({ background: "transparent", color: c, border: `1px solid ${c}55`, borderRadius: 9, padding: "8px 13px", fontSize: 13, fontWeight: 700, cursor: "pointer" });
function Hud({ children, color = C.cyan }) { return <span style={{ fontFamily: DISP, fontSize: 11, fontWeight: 700, letterSpacing: ".18em", color, textTransform: "uppercase", textShadow: `0 0 8px ${color}66` }}>{children}</span>; }
function SectionTitle({ children, hint, color = C.cyan }) {
  return (<div className="flex items-baseline gap-2 mb-3 flex-wrap">
    <span style={{ width: 3, height: 15, background: color, borderRadius: 3, display: "inline-block", boxShadow: glow(color,8) }} />
    <h2 style={{ color: C.ink, fontSize: 15.5, fontWeight: 800 }}>{children}</h2>{hint && <Hud color={C.dim}>{hint}</Hud>}</div>);
}
function StatCard({ label, value, unit, accent = C.cyan, sub }) {
  return (<div style={{ ...card, padding: 16, position: "relative", overflow: "hidden" }} className="flex flex-col gap-1">
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent, opacity: .7, boxShadow: glow(accent,6) }} />
    <Hud color={C.sub}>{label}</Hud>
    <div className="flex items-end gap-1"><span style={{ fontFamily: MONO, color: accent, fontSize: 28, fontWeight: 800, lineHeight: 1, textShadow: glow(accent,10) }}>{value}</span>
      {unit && <span style={{ color: C.sub, fontSize: 12.5, fontWeight: 700, marginBottom: 3 }}>{unit}</span>}</div>
    {sub && <span style={{ color: C.sub, fontSize: 11.5 }}>{sub}</span>}</div>);
}
function MiniStat({ label, value, accent = C.ink }) {
  return (<div style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 11, padding: "8px 12px", background: C.bg2 }}>
    <Hud color={C.sub}>{label}</Hud><div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, color: accent, marginTop: 2, textShadow: glow(accent,6) }}>{value}</div></div>);
}
function Field({ label, children }) { return <label style={{ fontSize: 12, color: C.sub, fontWeight: 700, display: "block" }}>{label}<div style={{ marginTop: 4 }}>{children}</div></label>; }

/* ── 格言 ── */
const QUOTES = [
  { t: "天才とは、1%のひらめきと99%の努力である。", a: "エジソン" },
  { t: "小さなことを積み重ねることが、とんでもないところへ行くただ一つの道。", a: "イチロー" },
  { t: "成功とは、失敗を重ねても情熱を失わずに進み続けること。", a: "チャーチル" },
  { t: "やってみせ、言って聞かせて、させてみせ、ほめてやらねば人は動かじ。", a: "山本五十六" },
  { t: "今日できることを明日に延ばすな。", a: "フランクリン" },
  { t: "千里の道も一歩から始まる。", a: "老子" },
  { t: "明日死ぬかのように生き、永遠に生きるかのように学べ。", a: "ガンジー" },
  { t: "為せば成る、為さねば成らぬ何事も。", a: "上杉鷹山" },
  { t: "夢を見ることができれば、それは実現できる。", a: "ウォルト・ディズニー" },
  { t: "最大の栄光は倒れないことではなく、倒れるたびに起き上がること。", a: "孔子（通説）" },
  { t: "未来を予測する最善の方法は、それを創り出すことだ。", a: "ドラッカー" },
  { t: "成功した者は皆、努力している。", a: "三浦知良" },
  { t: "意志あるところに道は開ける。", a: "リンカーン（通説）" },
  { t: "学びを止めた瞬間、人は老い始める。", a: "ヘンリー・フォード" },
  { t: "壁というのは、できる人にしかやってこない。", a: "イチロー" },
  { t: "継続は力なり。", a: "（ことわざ）" },
  { t: "知識への投資は、常に最高の利息を生む。", a: "フランクリン" },
  { t: "できると思えばできる、できないと思えばできない。", a: "ヘンリー・フォード" },
];
function QuoteCard() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random()*QUOTES.length));
  const [bump, setBump] = useState(0);
  const next = () => { let n=idx; while(n===idx&&QUOTES.length>1) n=Math.floor(Math.random()*QUOTES.length); setIdx(n); setBump((b)=>b+1); };
  const q = QUOTES[idx];
  return (<div onClick={next} role="button" title="タップで次の格言"
    style={{ ...card, padding: 0, overflow: "hidden", marginBottom: 16, cursor: "pointer", borderColor: `${C.violet}55`, boxShadow: `0 0 24px ${C.violet}22, 0 10px 34px rgba(0,0,0,.55)` }}>
    <div style={{ padding: "16px 20px", position: "relative", background: `radial-gradient(120% 140% at 0% 0%, ${C.violet}22, transparent 55%), radial-gradient(120% 140% at 100% 100%, ${C.magenta}1f, transparent 55%)` }}>
      <div style={{ position: "absolute", top: -10, right: 16, fontSize: 70, fontWeight: 900, color: `${C.violet}33`, lineHeight: 1 }}>”</div>
      <Hud color={C.violet}>◇ MOTIVATION ・ タップで切替</Hud>
      <div key={bump} style={{ color: C.ink, fontSize: 16.5, fontWeight: 800, lineHeight: 1.55, marginTop: 6, animation: "fadein .4s ease" }}>{q.t}</div>
      <div style={{ color: C.sub, fontSize: 12.5, fontWeight: 700, marginTop: 8, textAlign: "right", fontFamily: MONO }}>— {q.a}</div>
    </div></div>);
}

/* ── 登山ルート ── */
const TRAIL = [[62,312],[158,280],[114,246],[222,214],[176,178],[300,146],[258,116],[372,92],[438,62]];
const trailLens = (() => { const L=[0]; for(let i=1;i<TRAIL.length;i++) L.push(L[i-1]+Math.hypot(TRAIL[i][0]-TRAIL[i-1][0],TRAIL[i][1]-TRAIL[i-1][1])); return L; })();
const trailTotal = trailLens[trailLens.length-1];
function posAt(t) { const target=Math.max(0,Math.min(1,t))*trailTotal;
  for(let i=1;i<TRAIL.length;i++){ if(target<=trailLens[i]){ const seg=trailLens[i]-trailLens[i-1]; const r=seg===0?0:(target-trailLens[i-1])/seg;
    return [TRAIL[i-1][0]+(TRAIL[i][0]-TRAIL[i-1][0])*r, TRAIL[i-1][1]+(TRAIL[i][1]-TRAIL[i-1][1])*r]; } } return TRAIL[TRAIL.length-1]; }
function ClippedTrail({ progress }) {
  const targetLen=progress*trailTotal; const pts=[TRAIL[0]];
  for(let i=1;i<TRAIL.length;i++){ if(trailLens[i]<=targetLen) pts.push(TRAIL[i]);
    else { const seg=trailLens[i]-trailLens[i-1]; const r=seg===0?0:(targetLen-trailLens[i-1])/seg; if(r>0) pts.push([TRAIL[i-1][0]+(TRAIL[i][0]-TRAIL[i-1][0])*r,TRAIL[i-1][1]+(TRAIL[i][1]-TRAIL[i-1][1])*r]); break; } }
  if(pts.length<2) return null; const d=pts.map((p,i)=>`${i===0?"M":"L"}${p[0]},${p[1]}`).join(" ");
  return <path d={d} fill="none" stroke={C.amber} strokeWidth="4" strokeLinecap="round" style={{ filter:`drop-shadow(0 0 4px ${C.amber})` }} />;
}
function MountainProgress({ start, current, school, pace, schools, schoolId, onSchoolChange, hasData, taskDone, taskTotal }) {
  const target = school ? school.target : null;
  let progress = 0;
  if (hasData && target!=null && start!=null && current!=null) { if(target<=start) progress=current>=target?1:0.95; else progress=Math.max(0,Math.min(1,(current-start)/(target-start))); }
  const gome = Math.min(10, Math.floor(progress*10));
  const [cx, cy] = posAt(progress);
  const summit = TRAIL[TRAIL.length-1];
  const trailPath = TRAIL.map((p,i)=>`${i===0?"M":"L"}${p[0]},${p[1]}`).join(" ");
  const gap = target!=null&&current!=null?round1(target-current):null;
  const taskRatio = taskTotal>0?taskDone/taskTotal:0;
  const ringR=21, ringC=2*Math.PI*ringR;
  const stars = useMemo(()=>Array.from({length:34},()=>({x:Math.random()*600,y:Math.random()*200,r:Math.random()*1.2+0.3,o:Math.random()*0.7+0.2})),[]);
  return (
    <div style={{ ...card, padding: 18, marginBottom: 16, overflow: "hidden" }}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <SectionTitle hint="現在地＝模試・実力テストの平均偏差値／山頂＝合格ライン">▲ ASCENT ROUTE / 目標への登山</SectionTitle>
        <select value={schoolId} onChange={(e)=>onSchoolChange(e.target.value)} style={{ ...inputStyle, width: "auto", padding: "6px 10px", fontSize: 13 }}>
          {schools.map((s)=><option key={s.id} value={s.id} style={{background:C.panel}}>🏔 {s.name}（偏差値{s.target}）</option>)}
        </select>
      </div>
      <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.line}` }}>
        <svg viewBox="0 0 600 360" width="100%" style={{ display: "block" }} role="img" aria-label="登山進捗">
          <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0A1B3A" /><stop offset="55%" stopColor="#0A1024" /><stop offset="100%" stopColor="#070B14" /></linearGradient></defs>
          <rect x="0" y="0" width="600" height="360" fill="url(#sky)" />
          {stars.map((s,i)=><circle key={i} cx={s.x} cy={s.y} r={s.r} fill={C.cyan} opacity={s.o} />)}
          {[0,1,2,3,4,5].map((i)=><line key={"h"+i} x1="0" y1={250+i*22} x2="600" y2={250+i*22} stroke={C.cyan} strokeOpacity="0.06" />)}
          {[0,1,2,3,4,5,6,7,8,9,10,11,12].map((i)=><line key={"v"+i} x1={i*50} y1="250" x2={i*50} y2="360" stroke={C.cyan} strokeOpacity="0.06" />)}
          <polygon points="-20,300 120,170 240,300" fill="#0e1830" />
          <polygon points="320,300 470,150 620,300" fill="#0e1830" />
          <polygon points="20,330 438,52 600,330" fill="#101c34" stroke={C.blue} strokeOpacity="0.35" strokeWidth="1.2" />
          <polygon points="438,52 478,124 452,112 432,132 412,110 396,122" fill={C.cyan} opacity="0.85" style={{filter:`drop-shadow(0 0 6px ${C.cyan})`}} />
          <path d={trailPath} fill="none" stroke={C.cyan} strokeWidth="3" strokeDasharray="6 8" strokeLinecap="round" opacity="0.5" />
          <ClippedTrail progress={progress} />
          {[1,2,3,4,5,6,7,8,9].map((g)=>{ const [mx,my]=posAt(g/10); const done=progress*10>=g;
            return (<g key={g}><circle cx={mx} cy={my} r="4.5" fill={done?C.amber:"#0A1120"} stroke={done?C.amber:C.dim} strokeWidth="1.5" style={done?{filter:`drop-shadow(0 0 4px ${C.amber})`}:{}} />
              {g%2===1 && <text x={mx+(g%4===1?9:-9)} y={my+4} fontSize="10" fontFamily={MONO} fontWeight="700" fill={done?C.amber:C.dim} textAnchor={g%4===1?"start":"end"}>{g}</text>}</g>); })}
          <line x1={summit[0]} y1={summit[1]} x2={summit[0]} y2={summit[1]-32} stroke={C.dim} strokeWidth="2" />
          <polygon points={`${summit[0]},${summit[1]-32} ${summit[0]+28},${summit[1]-25} ${summit[0]},${summit[1]-18}`} fill={C.magenta} style={{filter:`drop-shadow(0 0 5px ${C.magenta})`}} />
          <text x={summit[0]+6} y={summit[1]-37} fontSize="11.5" fontWeight="800" fill={C.ink}>{school?school.name:"志望大学"}</text>
          <text x={summit[0]+34} y={summit[1]-22} fontSize="11" fontFamily={MONO} fontWeight="700" fill={C.magenta}>合格ライン {target ?? "--"}</text>
          <text x={TRAIL[0][0]-4} y={TRAIL[0][1]+24} fontSize="10.5" fontFamily={MONO} fontWeight="700" fill={C.sub}>⛺ START {start!=null?start:"--"}</text>
          {hasData ? (
            <g>
              <circle cx={cx} cy={cy} r={ringR} fill="none" stroke={C.line} strokeWidth="3" />
              <circle cx={cx} cy={cy} r={ringR} fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeDasharray={ringC} strokeDashoffset={ringC*(1-taskRatio)} transform={`rotate(-90 ${cx} ${cy})`} style={{ filter:`drop-shadow(0 0 5px ${C.green})`, transition:"stroke-dashoffset .5s ease" }} />
              <circle cx={cx} cy={cy} r="12" fill="#0A1120" stroke={C.cyan} strokeWidth="2" style={{filter:`drop-shadow(0 0 6px ${C.cyan})`}} />
              <text x={cx} y={cy+5} fontSize="14" textAnchor="middle">🧗</text>
              <rect x={cx-58} y={cy-58} width="116" height="34" rx="8" fill="#0A1120" stroke={C.cyan} strokeOpacity="0.5" />
              <text x={cx} y={cy-44} fontSize="10.5" fontFamily={MONO} fontWeight="800" fill={C.cyan} textAnchor="middle">現在 偏差値 {current}</text>
              <text x={cx} y={cy-31} fontSize="9.5" fontFamily={MONO} fontWeight="700" fill={gome>=10?C.green:C.amber} textAnchor="middle">{gome>=10?"SUMMIT 登頂！":`${gome}合目 / ${Math.round(progress*100)}%`}</text>
            </g>
          ) : (
            <g>
              <circle cx={TRAIL[0][0]} cy={TRAIL[0][1]} r={ringR} fill="none" stroke={C.line} strokeWidth="3" />
              <circle cx={TRAIL[0][0]} cy={TRAIL[0][1]} r={ringR} fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeDasharray={ringC} strokeDashoffset={ringC*(1-taskRatio)} transform={`rotate(-90 ${TRAIL[0][0]} ${TRAIL[0][1]})`} style={{ filter:`drop-shadow(0 0 5px ${C.green})`, transition:"stroke-dashoffset .5s ease" }} />
              <circle cx={TRAIL[0][0]} cy={TRAIL[0][1]} r="12" fill="#0A1120" stroke={C.cyan} strokeWidth="2" />
              <text x={TRAIL[0][0]} y={TRAIL[0][1]+5} fontSize="14" textAnchor="middle">🧗</text>
              <text x="300" y="338" fontSize="11.5" fontFamily={MONO} fontWeight="700" fill={C.sub} textAnchor="middle">テストを記録すると山頂までの現在地が表示されます</text>
            </g>
          )}
          <g><rect x="14" y="14" width="152" height="34" rx="8" fill="#0A1120" stroke={C.green} strokeOpacity="0.5" />
            <text x="24" y="30" fontSize="9.5" fontFamily={MONO} fontWeight="700" fill={C.green}>TODAY MISSION</text>
            <text x="24" y="42" fontSize="12" fontFamily={MONO} fontWeight="800" fill={taskRatio>=1&&taskTotal>0?C.green:C.ink}>{taskDone} / {taskTotal} {taskRatio>=1&&taskTotal>0?"CLEAR ✓":""}</text></g>
        </svg>
      </div>
      <div className="flex gap-2 mt-3">
        <MiniStat label="START" value={start!=null?start:"--"} accent={C.sub} />
        <MiniStat label="現在地" value={current!=null?current:"--"} accent={C.cyan} />
        <MiniStat label="合格ライン" value={target ?? "--"} accent={C.magenta} />
        <MiniStat label="残り" value={gap==null?"--":gap<=0?"登頂":`${gap}`} accent={gap!=null&&gap<=0?C.green:C.amber} />
      </div>
      {pace && (<div style={{ marginTop: 10, borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700, background: pace.onTrack?`${C.green}14`:`${C.amber}14`, color: pace.onTrack?C.green:C.amber, border: `1px solid ${(pace.onTrack?C.green:C.amber)}44` }}>
        {pace.onTrack ? `▲ 良いペース！この登り方なら目標日(${pace.targetDate})で偏差値 ${pace.projected} 到達見込み` : `▲ ペースアップ推奨：このままだと目標日で偏差値 ${pace.projected} 見込み。月あたり +${pace.neededPerMonth} の上昇が必要`}</div>)}
    </div>
  );
}

/* ── 今日のタスク ── */
const TASK_SUGGEST = ["英単語を20個おぼえる","数学を5問とく","教科書を10ページ読む","ポモドーロを3回やる","学校の宿題をやる","昨日の復習をする"];
function DailyTasks({ tasks, addTask, toggleTask, delTask }) {
  const [text, setText] = useState("");
  const today = tasks.filter((t)=>t.date===todayYMD());
  const done = today.filter((t)=>t.done).length;
  const ratio = today.length?done/today.length:0;
  const add = (txt)=>{ const v=(txt??text).trim(); if(!v) return; addTask(v); setText(""); };
  return (<div style={{ ...card, padding: 18, marginBottom: 16 }}>
    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
      <SectionTitle color={C.green} hint="完了で登山リングが満ちる">◉ TODAY'S MISSION / 今日のタスク</SectionTitle>
      <span style={{ fontFamily: MONO, fontWeight: 800, color: ratio>=1&&today.length?C.green:C.ink, textShadow: glow(ratio>=1&&today.length?C.green:C.ink,6) }}>{done}/{today.length}{ratio>=1&&today.length?" ✓":""}</span>
    </div>
    <div style={{ background: C.bg2, height: 8, borderRadius: 6, overflow: "hidden", marginBottom: 12, border:`1px solid ${C.line}` }}><div style={{ width: `${ratio*100}%`, height: "100%", background: C.green, boxShadow: glow(C.green,8), transition: "width .4s ease" }} /></div>
    {today.length===0 && <p style={{ color: C.sub, fontSize: 12.5, marginBottom: 10 }}>今日のミッションを決めよう。小さく具体的にするのがコツ。</p>}
    {today.map((t)=>(<div key={t.id} className="flex items-center gap-2" style={{ marginBottom: 6 }}>
      <input type="checkbox" checked={t.done} onChange={()=>toggleTask(t.id)} style={{ width: 19, height: 19, accentColor: C.green, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 14, color: t.done?C.sub:C.ink, textDecoration: t.done?"line-through":"none" }}>{t.text}</span>
      <button onClick={()=>delTask(t.id)} style={{ ...btnGhost(C.dim), padding: "3px 8px", fontSize: 12, flexShrink: 0 }}>✕</button></div>))}
    <div className="flex gap-2 mt-2"><input value={text} onChange={(e)=>setText(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&add()} placeholder="タスクを追加…" style={inputStyle} />
      <button onClick={()=>add()} style={{ ...btn(C.green), whiteSpace: "nowrap" }}>＋ 追加</button></div>
    <div className="flex gap-1 flex-wrap mt-2">{TASK_SUGGEST.map((s)=><button key={s} onClick={()=>add(s)} style={{ ...btnGhost(C.sub), padding: "4px 9px", fontSize: 11.5 }}>＋ {s}</button>)}</div>
  </div>);
}

/* ── ポモドーロ（独立ページ／BGMギャラリー） ── */
const MODE_INFO = {
  work: { label: "FOCUS / 集中", icon: "🍅", color: C.red, bgmPlay: true },
  break: { label: "BREAK / 小休憩", icon: "☕", color: C.green, bgmPlay: false },
  longBreak: { label: "LONG BREAK", icon: "🛋", color: C.blue, bgmPlay: false },
};
const BGM_VIDEOS = [
  { id: "EsH7A8I4bAY", title: "風の音 ポモドーロ 25分" },
  { id: "lsLqXa-ftcQ", title: "4種の自然音 ポモドーロ" },
  { id: "B3UM8TizqYQ", title: "波の音 ポモドーロ 25分" },
];
function parseYouTubeId(input) { if(!input) return null; const s=input.trim(); if(/^[\w-]{11}$/.test(s)) return s;
  const m=s.match(/[?&]v=([\w-]{11})/)||s.match(/youtu\.be\/([\w-]{11})/)||s.match(/youtube\.com\/(?:embed|shorts|live)\/([\w-]{11})/); return m?m[1]:null; }
function beep(times=3){ try{const Ctx=window.AudioContext||window.webkitAudioContext;const ctx=new Ctx();for(let i=0;i<times;i++){const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type="sine";o.frequency.value=i===times-1?1175:880;const t0=ctx.currentTime+i*0.35;g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(0.2,t0+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t0+0.28);o.start(t0);o.stop(t0+0.3);}}catch(e){} }

function PomodoroPage({ addLog, studyLogs, settings, onSettings }) {
  const [mode, setMode] = useState("work");
  const [status, setStatus] = useState("idle");
  const [remainMs, setRemainMs] = useState(settings.workMin*60000);
  const [cycle, setCycle] = useState(0);
  const [subject, setSubject] = useState("英語");
  const [bgmInput, setBgmInput] = useState("");
  const [bgmError, setBgmError] = useState("");
  const endsAtRef = useRef(null);
  const iframeRef = useRef(null);
  const durationMin = mode==="work"?settings.workMin:mode==="break"?settings.breakMin:settings.longBreakMin;
  const durationMs = Math.max(1,durationMin)*60000;
  const info = MODE_INFO[mode];
  const bgmCmd = (func)=>{ try{const w=iframeRef.current&&iframeRef.current.contentWindow; if(w) w.postMessage(JSON.stringify({event:"command",func,args:[]}),"*");}catch(e){} };
  const syncBgm = (st,md)=>{ if(!settings.bgmSync) return; bgmCmd(st==="running"&&MODE_INFO[md].bgmPlay?"playVideo":"pauseVideo"); };

  useEffect(()=>{ if(status!=="running") return; const id=setInterval(()=>{const left=endsAtRef.current-Date.now(); if(left<=0) complete(); else setRemainMs(left);},250); return ()=>clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[status,mode]);
  useEffect(()=>{ if(status==="idle") setRemainMs(durationMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[settings.workMin,settings.breakMin,settings.longBreakMin,mode]);

  const start=()=>{ endsAtRef.current=Date.now()+remainMs; setStatus("running"); syncBgm("running",mode); };
  const pause=()=>{ setRemainMs(Math.max(0,endsAtRef.current-Date.now())); setStatus("paused"); syncBgm("paused",mode); };
  const reset=()=>{ setStatus("idle"); setRemainMs(durationMs); syncBgm("idle",mode); };
  const switchMode=(m)=>{ setMode(m); setStatus("idle"); const mins=m==="work"?settings.workMin:m==="break"?settings.breakMin:settings.longBreakMin; setRemainMs(Math.max(1,mins)*60000); syncBgm("idle",m); };
  const complete=()=>{ beep(); if(mode==="work"){ addLog({date:todayYMD(),subject,minutes:settings.workMin,note:"🍅ポモドーロ"}); const nc=cycle+1; setCycle(nc); switchMode(nc%Math.max(1,settings.cyclesUntilLong)===0?"longBreak":"break"); } else switchMode("work"); };
  const stopAndLog=()=>{ const elapsed=durationMs-Math.max(0,endsAtRef.current?endsAtRef.current-Date.now():remainMs); const mins=Math.max(1,Math.round((status==="idle"?durationMs-remainMs:elapsed)/60000)); addLog({date:todayYMD(),subject,minutes:mins,note:"🍅ポモドーロ(中断)"}); switchMode("work"); };
  const todayStats = useMemo(()=>{ const t=todayYMD(); const logs=studyLogs.filter((l)=>l.date===t&&(l.note||"").includes("ポモドーロ")); return { count: logs.filter((l)=>!(l.note||"").includes("中断")).length, minutes: logs.reduce((a,l)=>a+l.minutes,0) }; },[studyLogs]);

  const enterFullscreen = () => { const el=iframeRef.current; if(!el) return; const fn=el.requestFullscreen||el.webkitRequestFullscreen||el.webkitEnterFullscreen||el.mozRequestFullScreen||el.msRequestFullscreen; try{ fn&&fn.call(el); }catch(e){} };
  const selectBgm = (id) => { onSettings({ bgmId: id }); setTimeout(enterFullscreen, 350); };
  const applyBgm = ()=>{ const id=parseYouTubeId(bgmInput); if(!id){setBgmError("URLまたは動画IDを認識できませんでした");return;} setBgmError(""); onSettings({bgmId:id}); setBgmInput(""); };

  const R=104, CIRC=2*Math.PI*R; const ratio=Math.max(0,Math.min(1,remainMs/durationMs));
  const mm=Math.floor(remainMs/60000), ss=Math.floor((remainMs%60000)/1000);

  return (
    <div style={{ ...card, padding: 18, marginBottom: 16 }}>
      <SectionTitle color={C.red} hint="集中完了で学習記録に自動追加">🍅 FOCUS TIMER / ポモドーロ</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 flex flex-col items-center">
          <div className="flex gap-2 mb-4 w-full">
            {Object.entries(MODE_INFO).map(([m,mi])=>(<button key={m} onClick={()=>switchMode(m)} style={{ ...(mode===m?btn(mi.color):btnGhost(C.sub)), flex:1, padding:"8px 4px", fontSize:11.5, boxShadow: mode===m?glow(mi.color,8):"none" }}>{mi.icon} {mi.label}</button>))}
          </div>
          <div style={{ position: "relative", width: 244, height: 244 }}>
            <svg viewBox="0 0 244 244" width="244" height="244">
              <circle cx="122" cy="122" r={R} fill="none" stroke={C.line} strokeWidth="12" />
              <circle cx="122" cy="122" r={R} fill="none" stroke={info.color} strokeWidth="12" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC*(1-ratio)} transform="rotate(-90 122 122)" style={{ transition:"stroke-dashoffset .25s linear", filter:`drop-shadow(0 0 8px ${info.color})` }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }} className="flex flex-col items-center justify-center">
              <Hud color={info.color}>{info.icon} {info.label}</Hud>
              <div style={{ fontFamily: MONO, fontSize: 52, fontWeight: 800, lineHeight: 1.1, color: C.ink, textShadow: glow(info.color,12) }}>{pad(mm)}:{pad(ss)}</div>
              {mode==="work" && <span style={{ fontSize: 12, color: C.sub, fontWeight: 700 }}>科目：{subject}</span>}
            </div>
          </div>
          {mode==="work" && (<div className="flex gap-1 flex-wrap justify-center mt-3">{SUBJECT_KEYS.map((s)=>(<button key={s} onClick={()=>setSubject(s)} disabled={status==="running"} style={{ ...(subject===s?btn(colorOf(s)):btnGhost(C.sub)), padding:"5px 12px", fontSize:12, opacity: status==="running"&&subject!==s?0.4:1 }}>{s}</button>))}</div>)}
          <div className="flex gap-2 mt-4 flex-wrap justify-center">
            {status!=="running" ? <button onClick={start} style={{ ...btn(info.color), padding:"12px 34px", fontSize:16, boxShadow: glow(info.color,10) }}>▶ {status==="paused"?"再開":"START"}</button>
              : <button onClick={pause} style={{ ...btn(C.amber), padding:"12px 34px", fontSize:16, boxShadow: glow(C.amber,10) }}>⏸ PAUSE</button>}
            <button onClick={reset} style={{ ...btnGhost(C.sub), padding:"12px 18px" }}>↺ RESET</button>
            {mode==="work" && status!=="idle" && <button onClick={stopAndLog} style={{ ...btnGhost(C.green), padding:"12px 14px" }}>✔ 記録して終了</button>}
          </div>
          <div className="flex gap-2 mt-5 w-full" style={{ borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
            <MiniStat label="今日の🍅" value={todayStats.count} accent={C.red} />
            <MiniStat label="🍅学習時間" value={`${fmtHours(todayStats.minutes)}h`} accent={C.cyan} />
            <MiniStat label="連続🍅" value={cycle===0?"--":"🍅".repeat(Math.min(cycle,6))} accent={C.amber} />
          </div>
        </div>
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between">
              <Hud color={C.cyan}>🎧 STUDY BGM</Hud>
              <button onClick={enterFullscreen} style={{ ...btnGhost(C.cyan), padding: "4px 10px", fontSize: 12 }}>⛶ 全画面</button>
            </div>
            <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.line}`, background: "#000", marginTop: 6 }}>
              <iframe ref={iframeRef} width="100%" height="172" title="勉強BGM" frameBorder="0" allowFullScreen
                src={`https://www.youtube.com/embed/${settings.bgmId}?enablejsapi=1&playsinline=1&rel=0&loop=1&playlist=${settings.bgmId}`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen" style={{ display: "block" }} />
            </div>
            <label className="flex items-center gap-2" style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700, color: C.ink, cursor: "pointer" }}>
              <input type="checkbox" checked={!!settings.bgmSync} onChange={(e)=>onSettings({bgmSync:e.target.checked})} style={{accentColor:C.cyan}} />タイマー連動（再生/一時停止）</label>
            {/* BGMギャラリー */}
            <div style={{ marginTop: 10 }}>
              <Hud color={C.sub}>STUDY BGM MAKER ・ サムネをタップで選択＆全画面</Hud>
              <div className="grid grid-cols-3 gap-2" style={{ marginTop: 6 }}>
                {BGM_VIDEOS.map((v)=>{ const active=settings.bgmId===v.id;
                  return (<button key={v.id} onClick={()=>selectBgm(v.id)} title={v.title}
                    style={{ padding: 0, border: `2px solid ${active?C.cyan:C.line}`, borderRadius: 9, overflow: "hidden", cursor: "pointer", background: "#000", boxShadow: active?glow(C.cyan,8):"none", position: "relative" }}>
                    <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt={v.title} style={{ width: "100%", display: "block", aspectRatio: "16/9", objectFit: "cover", opacity: active?1:0.8 }} />
                    {active && <span style={{ position: "absolute", top: 3, right: 4, fontSize: 10, fontFamily: MONO, fontWeight: 800, color: C.cyan, background: "#0A1120cc", borderRadius: 5, padding: "1px 5px" }}>再生中</span>}
                  </button>); })}
              </div>
              <a href="https://www.youtube.com/@STUDY.BGM_MAKER/videos" target="_blank" rel="noreferrer" style={{ fontFamily: MONO, fontSize: 11, color: C.blue, display: "inline-block", marginTop: 6 }}>＋ チャンネルで他の動画を探す ↗</a>
            </div>
            <div className="flex gap-2" style={{ marginTop: 8 }}>
              <input placeholder="別のYouTube URL…" value={bgmInput} onChange={(e)=>setBgmInput(e.target.value)} style={inputStyle} />
              <button onClick={applyBgm} style={{ ...btn(C.cyan), whiteSpace:"nowrap" }}>変更</button>
            </div>
            {bgmError && <div style={{ color: C.red, fontSize: 12, fontWeight: 700, marginTop: 6 }}>{bgmError}</div>}
            <p style={{ color: C.dim, fontSize: 11, marginTop: 6 }}>※ iPhoneでは初回のみ再生ボタンを一度タップが必要な場合があります。全画面はプレーヤー右下の全画面ボタンも利用できます。</p>
          </div>
          <div>
            <Hud color={C.cyan}>⚙ TIMER CONFIG</Hud>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[["workMin","🍅 集中(分)"],["breakMin","☕ 小休憩(分)"],["longBreakMin","🛋 ロング(分)"],["cyclesUntilLong","ロングまでの🍅"]].map(([k,l])=>(
                <label key={k} style={{ fontSize: 11.5, color: C.sub, fontWeight: 700 }}>{l}<input type="number" min="1" value={settings[k]} onChange={(e)=>onSettings({[k]:Math.max(1,parseInt(e.target.value)||1)})} style={{ ...inputStyle, marginTop: 4 }} /></label>))}
            </div>
          </div>
        </div>
      </div>
      <p style={{ color: C.sub, fontSize: 11.5, marginTop: 10 }}>集中タイムが終わると選択中の科目で学習記録に自動追加され、グラフ・連続日数に反映されます。</p>
    </div>
  );
}

/* ── AI読み取り ── */
function AiImport({ onParsed }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const downscaleImage = (file) => new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const MAX=1600; const sc=Math.min(1,MAX/Math.max(img.width,img.height));
      const cv=document.createElement("canvas"); cv.width=Math.round(img.width*sc); cv.height=Math.round(img.height*sc);
      cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height); URL.revokeObjectURL(url);
      resolve(cv.toDataURL("image/jpeg",0.85).split(",")[1]); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("画像を読み込めません。iPhoneのHEICは設定→カメラ→フォーマット→「互換性優先」にするか、スクショでお試しを。")); };
    img.src = url;
  });
  const handleFile = async (file) => {
    if (!file) return; setError(""); setBusy(true);
    try {
      const isPdf = file.type==="application/pdf";
      let base64, mediaType;
      if (isPdf) {
        if (file.size > 4*1024*1024) throw new Error("PDFは4MB以下にしてください。");
        base64 = await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=()=>rej(new Error("読み込み失敗"));r.readAsDataURL(file);});
        mediaType = "application/pdf";
      } else {
        base64 = await downscaleImage(file); mediaType = "image/jpeg";
      }
      const mediaBlock = isPdf ? {type:"document",source:{type:"base64",media_type:"application/pdf",data:base64}} : {type:"image",source:{type:"base64",media_type:mediaType,data:base64}};
      const prompt = ["これは日本の高校生のテスト結果(模試・実力テスト・定期テスト)です。","以下のJSON形式のみで回答。説明やMarkdownの``` は不要。",'{"type":"模試"or"実力テスト"or"定期テスト","name":"テスト名","date":"YYYY-MM-DD","scores":{"英語":数値,"数学":数値,"国語":数値,"理科":数値,"社会":数値}}',"ルール：模試・実力は偏差値、定期は点数(100点満点)。読めない科目は省略。物理化学生物地学→理科、日本史世界史地理公民→社会、現代文古文漢文→国語に統合(複数は平均)。日付不明はnull、名称不明はnull。"].join("\n");
      const response = await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({max_tokens:1000,messages:[{role:"user",content:[mediaBlock,{type:"text",text:prompt}]}]})});
      const data = await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(data.error||"読み取りサービスに接続できませんでした。");
      const text=(data.content||[]).filter((b)=>b.type==="text").map((b)=>b.text).join("\n");
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      const scores={}; SUBJECT_KEYS.slice(0,5).forEach((s)=>{const v=parsed.scores&&parsed.scores[s]; if(typeof v==="number"&&isFinite(v)) scores[s]=round1(v);});
      if (Object.keys(scores).length===0) throw new Error("点数・偏差値を読み取れませんでした。明るい所で全体が写るように撮影を。");
      onParsed({ type: TEST_TYPES.includes(parsed.type)?parsed.type:"模試", name: typeof parsed.name==="string"?parsed.name:"", date: typeof parsed.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(parsed.date)?parsed.date:todayYMD(), scores });
    } catch(e){ setError(e.message||"読み取りに失敗しました。"); } finally{ setBusy(false); }
  };
  return (<div style={{ border: `1px dashed ${busy?C.cyan:C.line}`, borderRadius: 12, padding: 16, marginBottom: 14, background: C.bg2, textAlign: "center" }}>
    <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 4 }}>📷 写真・PDFから自動読み取り</div>
    <p style={{ color: C.sub, fontSize: 12, marginBottom: 10 }}>成績表を撮影/選択するとAIが点数・偏差値を読み取りフォームに自動入力。保存前に必ず内容を確認してください。</p>
    <div className="flex gap-2 justify-center flex-wrap">
      <label style={{ ...btn(C.cyan), display: "inline-block", boxShadow: glow(C.cyan,8) }}>{busy?"読み取り中…":"📷 カメラ"}<input type="file" accept="image/*" capture="environment" disabled={busy} style={{ display:"none" }} onChange={(e)=>{handleFile(e.target.files&&e.target.files[0]); e.target.value="";}} /></label>
      <label style={{ ...btnGhost(C.cyan), display: "inline-block" }}>{busy?"読み取り中…":"🗂 写真・PDF"}<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={busy} style={{ display:"none" }} onChange={(e)=>{handleFile(e.target.files&&e.target.files[0]); e.target.value="";}} /></label>
    </div>
    {busy && <div style={{ marginTop: 10, fontSize: 12.5, color: C.cyan, fontWeight: 700 }}>🔍 AIが解析中（10〜20秒）…</div>}
    {error && <div style={{ marginTop: 10, fontSize: 12.5, color: C.red, fontWeight: 700, background: `${C.red}14`, borderRadius: 10, padding: "8px 12px" }}>{error}</div>}
  </div>);
}

/* ════════════ メイン ════════════ */
export default function JukenDashboard() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [page, setPage] = useState("home"); // home | pomodoro | tests | profile

  useEffect(()=>{ try{ const raw=localStorage.getItem(STORAGE_KEY); if(raw) setState(migrate(JSON.parse(raw))); }catch(e){} setLoaded(true); },[]);
  useEffect(()=>{ if(!loaded) return; try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){} },[state,loaded]);

  const metrics = useMemo(()=>{
    const logs=state.studyLogs; const wkStart=startOfWeek(new Date());
    const weekMin=logs.filter((l)=>new Date(l.date)>=wkStart).reduce((a,l)=>a+l.minutes,0);
    const totalMin=logs.reduce((a,l)=>a+l.minutes,0);
    const daysWith=new Set(logs.filter((l)=>l.minutes>0).map((l)=>l.date));
    let streak=0; const cur=new Date(); cur.setHours(0,0,0,0); if(!daysWith.has(ymd(cur))) cur.setDate(cur.getDate()-1); while(daysWith.has(ymd(cur))){streak++;cur.setDate(cur.getDate()-1);}
    const remaining=Math.max(0,daysBetween(new Date(),state.targetDate));
    const goalMin=state.weeklyGoalHours*60; const weekPct=goalMin?Math.min(100,Math.round((weekMin/goalMin)*100)):0;
    const all=[...state.mockExams].sort((a,b)=>a.date.localeCompare(b.date));
    const devTests=all.filter((m)=>isDevType(m.type)); const teikiTests=all.filter((m)=>m.type==="定期テスト");
    const avgOf=(m)=>{const v=SUBJECT_KEYS.map((k)=>m.scores[k]).filter((x)=>typeof x==="number"); return v.length?round1(v.reduce((a,x)=>a+x,0)/v.length):null;};
    const devSeries=devTests.map((m)=>({...m,avg:avgOf(m)})).filter((m)=>m.avg!=null);
    const startAvg=devSeries.length?devSeries[0].avg:null; const latest=devSeries.length?devSeries[devSeries.length-1]:null; const latestAvg=latest?latest.avg:null;
    let pace=null; const school=state.schools.find((s)=>s.id===state.mountainSchoolId)||state.schools[0];
    if(devSeries.length>=2&&school){ const x0=new Date(devSeries[0].date).getTime(); const xs=devSeries.map((m)=>(new Date(m.date).getTime()-x0)/86400000),ys=devSeries.map((m)=>m.avg);
      const n=xs.length,mx=xs.reduce((a,v)=>a+v,0)/n,my=ys.reduce((a,v)=>a+v,0)/n; let num=0,den=0; for(let i=0;i<n;i++){num+=(xs[i]-mx)*(ys[i]-my);den+=(xs[i]-mx)**2;}
      const slope=den===0?0:num/den; const d2t=(new Date(state.targetDate).getTime()-x0)/86400000;
      // 目標日が数年先だと線形外挿で偏差値が非現実値(例:130や-20)に発散するため、現実的な範囲にクランプ
      const projected=round1(Math.max(25,Math.min(80,my+slope*(d2t-mx))));
      const remDays=Math.max(1,daysBetween(new Date(),state.targetDate)); const needed=latestAvg!=null?Math.max(0,school.target-latestAvg):0;
      pace={projected,target:school.target,targetDate:state.targetDate,onTrack:projected>=school.target,neededPerMonth:round1((needed/remDays)*30)}; }
    const todayTasks=state.dailyTasks.filter((t)=>t.date===todayYMD()); const taskDone=todayTasks.filter((t)=>t.done).length;
    const pomos=logs.filter((l)=>(l.note||"").includes("ポモドーロ")&&!(l.note||"").includes("中断")).length;
    const xp=Math.round(totalMin+pomos*10+streak*25); const level=Math.floor(Math.sqrt(xp/40))+1;
    const xpInto=xp-40*(level-1)*(level-1); const xpNeed=40*((level)*(level)-(level-1)*(level-1));
    return { weekMin, totalMin, streak, remaining, weekPct, goalMin, latestAvg, latest, startAvg, devSeries, devTests, teikiTests, all, school, pace, todayTasks, taskDone, taskTotal: todayTasks.length, level, xpInto, xpNeed };
  },[state]);

  const last14 = useMemo(()=>{ const days=[]; for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const key=ymd(d);const row={label:`${d.getMonth()+1}/${d.getDate()}`,key};SUBJECT_KEYS.forEach((s)=>(row[s]=0));days.push(row);}
    const map=Object.fromEntries(days.map((r)=>[r.key,r])); state.studyLogs.forEach((l)=>{if(map[l.date])map[l.date][l.subject]=(map[l.date][l.subject]||0)+fmtHours(l.minutes);}); return days; },[state.studyLogs]);
  const bySubject = useMemo(()=>{ const m=Object.fromEntries(SUBJECT_KEYS.map((s)=>[s,0])); state.studyLogs.forEach((l)=>(m[l.subject]=(m[l.subject]||0)+l.minutes));
    return SUBJECT_KEYS.map((s)=>({name:s,hours:fmtHours(m[s]),color:colorOf(s)})).filter((r)=>r.hours>0).sort((a,b)=>b.hours-a.hours); },[state.studyLogs]);
  const hensachi = useMemo(()=>metrics.devTests.map((m)=>{const row={name:`${m.name||m.date}${m.type==="実力テスト"?"(実力)":""}`};SUBJECT_KEYS.slice(0,5).forEach((s)=>{if(typeof m.scores[s]==="number")row[s]=m.scores[s];});const v=SUBJECT_KEYS.map((k)=>m.scores[k]).filter((x)=>typeof x==="number");if(v.length)row["平均"]=round1(v.reduce((a,x)=>a+x,0)/v.length);return row;}),[metrics.devTests]);
  const teikiChart = useMemo(()=>metrics.teikiTests.map((m)=>{const row={name:m.name||m.date};SUBJECT_KEYS.slice(0,5).forEach((s)=>{if(typeof m.scores[s]==="number")row[s]=m.scores[s];});const v=SUBJECT_KEYS.map((k)=>m.scores[k]).filter((x)=>typeof x==="number");if(v.length)row["平均"]=round1(v.reduce((a,x)=>a+x,0)/v.length);return row;}),[metrics.teikiTests]);

  const isEmpty = state.studyLogs.length===0 && state.mockExams.length===0;
  const addLog=(log)=>setState((s)=>({...s,studyLogs:[...s.studyLogs,{...log,id:uid()}]}));
  const delLog=(id)=>setState((s)=>({...s,studyLogs:s.studyLogs.filter((l)=>l.id!==id)}));
  const addMock=(m)=>setState((s)=>({...s,mockExams:[...s.mockExams,{...m,id:uid()}]}));
  const delMock=(id)=>setState((s)=>({...s,mockExams:s.mockExams.filter((m)=>m.id!==id)}));
  const addTask=(text)=>setState((s)=>({...s,dailyTasks:[...s.dailyTasks,{id:uid(),date:todayYMD(),text,done:false}]}));
  const toggleTask=(id)=>setState((s)=>({...s,dailyTasks:s.dailyTasks.map((t)=>t.id===id?{...t,done:!t.done}:t)}));
  const delTask=(id)=>setState((s)=>({...s,dailyTasks:s.dailyTasks.filter((t)=>t.id!==id)}));
  const addReward=(r)=>setState((s)=>({...s,rewards:[...s.rewards,{...r,id:uid(),claimed:false}]}));
  const claimReward=(id)=>setState((s)=>({...s,rewards:s.rewards.map((r)=>r.id===id?{...r,claimed:true}:r)}));
  const delReward=(id)=>setState((s)=>({...s,rewards:s.rewards.filter((r)=>r.id!==id)}));

  const badges = useMemo(()=>getBadges(state, metrics), [state, metrics]);
  const earnedBadges = badges.filter((b)=>b.earned).length;
  const [toastBadge, setToastBadge] = useState(null);
  const badgeReady = useRef(false);
  useEffect(() => {
    if (!loaded) return;
    const earnedIds = badges.filter((b)=>b.earned).map((b)=>b.id);
    if (!badgeReady.current) { badgeReady.current = true; setState((s)=>({ ...s, seenBadges: Array.from(new Set([...(s.seenBadges||[]), ...earnedIds])) })); return; }
    const fresh = earnedIds.filter((id)=>!(state.seenBadges||[]).includes(id));
    if (fresh.length) { const b = badges.find((x)=>x.id===fresh[0]); setToastBadge(b); setState((s)=>({ ...s, seenBadges: Array.from(new Set([...(s.seenBadges||[]), ...earnedIds])) })); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badges, loaded]);

  const tabStyle=(active,color=C.cyan)=>({ ...(active?btn(color):btnGhost(C.sub)), padding:"8px 16px", boxShadow: active?glow(color,8):"none" });

  return (
    <div className="app-root" style={{ background: C.bg, minHeight: "100%", color: C.ink, position: "relative",
      backgroundImage: `radial-gradient(circle at 15% -5%, ${C.blue}24, transparent 42%), radial-gradient(circle at 95% 0%, ${C.magenta}1c, transparent 45%), linear-gradient(${C.cyan}10 1px, transparent 1px), linear-gradient(90deg, ${C.cyan}10 1px, transparent 1px)`,
      backgroundSize: "auto, auto, 40px 40px, 40px 40px" }}>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
@keyframes fadein{from{opacity:.15;transform:translateY(4px)}to{opacity:1;transform:none}}
@keyframes pulse{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes scan{0%{background-position:0 -100vh}100%{background-position:0 100vh}}
@keyframes flicker{0%,100%{opacity:.5}50%{opacity:.32}}
.app-root h1,.app-root h2,.app-root h3{font-family:${DISP};letter-spacing:.02em}
.app-root::before{content:"";position:fixed;inset:0;z-index:60;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(45,226,230,.05) 0 1px,transparent 1px 3px);mix-blend-mode:screen;animation:scan 16s linear infinite,flicker 4s ease-in-out infinite}
.app-root::after{content:"";position:fixed;inset:0;z-index:61;pointer-events:none;background:radial-gradient(125% 90% at 50% -5%,transparent 52%,rgba(0,0,0,.6) 100%)}
.app-root>*{position:relative;z-index:1}
`}</style>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "18px 16px 56px" }}>
        <header className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <div><Hud color={C.cyan}>● JUKEN // MISSION CONTROL</Hud>
            <h1 style={{ fontSize: 23, fontWeight: 900, letterSpacing: "-.01em", textShadow: glow(C.cyan,8) }}>{state.studentName} の受験ダッシュボード</h1></div>
          <button onClick={()=>setShowSettings((v)=>!v)} style={btnGhost(C.sub)}>⚙ 設定</button>
        </header>

        {/* レベルHUD＋あいぼう */}
        <div style={{ ...card, padding: "10px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CreatureSprite species={state.profile.creature} level={metrics.level} size={46} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 900, color: C.cyan, textShadow: glow(C.cyan,10), lineHeight: 1 }}>LV.{metrics.level}</span>
              <Hud color={C.dim}>{(CREATURES[state.profile.creature]||CREATURES.flame).name}</Hud>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <div style={{ background: C.bg2, height: 8, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.line}` }}>
              <div style={{ width: `${Math.min(100,(metrics.xpInto/metrics.xpNeed)*100)}%`, height: "100%", background: `linear-gradient(90deg, ${C.cyan}, ${C.violet})`, boxShadow: glow(C.cyan,6), transition: "width .5s ease" }} /></div>
            <div style={{ marginTop: 3 }}><Hud color={C.dim}>XP {metrics.xpInto}/{metrics.xpNeed} ・ 次のLvまで</Hud></div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: C.amber }}>🔥 {metrics.streak}日</span>
            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: C.green }}>◉ {metrics.taskDone}/{metrics.taskTotal}</span>
          </div>
        </div>

        {/* タブ：ホーム・タイマー・テスト結果・プロフィール */}
        <nav className="flex gap-2 mb-5 flex-wrap">
          <button style={tabStyle(page==="home",C.cyan)} onClick={()=>setPage("home")}>🏠 ホーム</button>
          <button style={tabStyle(page==="pomodoro",C.red)} onClick={()=>setPage("pomodoro")}>🍅 タイマー</button>
          <button style={tabStyle(page==="tests",C.magenta)} onClick={()=>setPage("tests")}>📝 テスト結果{metrics.all.length>0?`（${metrics.all.length}）`:""}</button>
          <button style={tabStyle(page==="profile",C.violet)} onClick={()=>setPage("profile")}>👤 プロフィール</button>
          <button style={tabStyle(page==="parent",C.blue)} onClick={()=>setPage("parent")}>👨‍👩‍👧 保護者</button>
        </nav>

        {showSettings && <SettingsPanel state={state} setState={setState} onClose={()=>setShowSettings(false)} />}

        {isEmpty && (<div style={{ ...card, padding: 22, marginBottom: 16, textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>まだ記録がありません 📒</p>
          <p style={{ color: C.sub, fontSize: 13, marginBottom: 14 }}>まずは動きを見たい場合はサンプルでお試しを。</p>
          <button onClick={()=>setState(makeSample())} style={{ ...btn(C.cyan), boxShadow: glow(C.cyan,8) }}>サンプルデータで試す</button></div>)}

        {page==="home" ? (
          <HomePage state={state} metrics={metrics} last14={last14} bySubject={bySubject} addLog={addLog} delLog={delLog}
            onSchoolChange={(id)=>setState((s)=>({...s,mountainSchoolId:id}))} addTask={addTask} toggleTask={toggleTask} delTask={delTask}
            badges={badges} earnedBadges={earnedBadges} addReward={addReward} claimReward={claimReward} delReward={delReward} />
        ) : page==="pomodoro" ? (
          <PomodoroPage addLog={addLog} studyLogs={state.studyLogs} settings={state.pomodoro} onSettings={(patch)=>setState((s)=>({...s,pomodoro:{...s.pomodoro,...patch}}))} />
        ) : page==="tests" ? (
          <TestsPage metrics={metrics} hensachi={hensachi} teikiChart={teikiChart} addMock={addMock} delMock={delMock} />
        ) : page==="parent" ? (
          <ParentView state={state} metrics={metrics} />
        ) : (
          <ProfilePage state={state} setState={setState} metrics={metrics} />
        )}

        <Toast badge={toastBadge} onClose={()=>setToastBadge(null)} />

        <p style={{ color: C.dim, fontSize: 11, textAlign: "center", marginTop: 8, fontFamily: MONO }}>DATA STORED LOCALLY ・ 入力データは端末内に自動保存されます</p>
      </div>
    </div>
  );
}

/* ── ホーム（タイマーは独立タブへ） ── */
function HomePage({ state, metrics, last14, bySubject, addLog, delLog, onSchoolChange, addTask, toggleTask, delTask, badges, earnedBadges, addReward, claimReward, delReward }) {
  return (<>
    <QuoteCard />
    <div style={{ ...card, padding: 0, overflow: "hidden", marginBottom: 16, position: "relative" }}>
      <div style={{ padding: "20px 22px", position: "relative", background: `radial-gradient(120% 160% at 0% 0%, ${C.blue}22, transparent 55%)` }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div><Hud color={C.sub}>{state.targetLabel} ・ {state.targetDate}</Hud>
            <div className="flex items-end gap-2 mt-1"><span style={{ color: C.sub, fontSize: 16, fontWeight: 800, marginBottom: 8 }}>T-minus</span>
              <span style={{ fontFamily: MONO, fontSize: 60, fontWeight: 900, lineHeight: 0.9, color: C.cyan, textShadow: glow(C.cyan,16) }}>{metrics.remaining}</span>
              <span style={{ color: C.ink, fontSize: 20, fontWeight: 800, marginBottom: 6 }}>日</span></div></div>
          <div style={{ minWidth: 240, flex: 1, maxWidth: 360 }}>
            <div className="flex justify-between items-baseline mb-1"><Hud color={C.sub}>今週の学習</Hud>
              <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: C.ink }}>{fmtHours(metrics.weekMin)}h / {state.weeklyGoalHours}h</span></div>
            <div style={{ background: C.bg2, height: 11, borderRadius: 7, overflow: "hidden", border: `1px solid ${C.line}` }}>
              <div style={{ width: `${metrics.weekPct}%`, height: "100%", background: metrics.weekPct>=100?C.green:metrics.weekPct>=60?C.cyan:C.amber, boxShadow: glow(metrics.weekPct>=100?C.green:metrics.weekPct>=60?C.cyan:C.amber,8), transition: "width .4s ease" }} /></div>
            <div style={{ marginTop: 6, fontSize: 12, color: C.sub }}>{metrics.weekPct>=100?"🎉 今週の目標達成！":`目標まであと ${Math.max(0,fmtHours(metrics.goalMin-metrics.weekMin))}h`}</div></div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      <StatCard label="連続学習日数" value={metrics.streak} unit="日 🔥" accent={C.amber} sub={metrics.streak>=3?"継続は力なり":"まず3日連続！"} />
      <StatCard label="今週の学習" value={fmtHours(metrics.weekMin)} unit="h" accent={C.cyan} sub={`達成率 ${metrics.weekPct}%`} />
      <StatCard label="累計学習" value={fmtHours(metrics.totalMin)} unit="h" accent={C.blue} sub={`記録 ${state.studyLogs.length}件`} />
      <StatCard label="最新偏差値" value={metrics.latestAvg ?? "--"} accent={C.green} sub={metrics.latest?metrics.latest.name:"テスト結果で記録"} />
    </div>
    <MountainProgress start={metrics.startAvg} current={metrics.latestAvg} school={metrics.school} pace={metrics.pace}
      schools={state.schools} schoolId={state.mountainSchoolId} onSchoolChange={onSchoolChange}
      hasData={metrics.devSeries.length>0} taskDone={metrics.taskDone} taskTotal={metrics.taskTotal} />
    <DailyTasks tasks={state.dailyTasks} addTask={addTask} toggleTask={toggleTask} delTask={delTask} />
    <BadgeShelf badges={badges} />
    <RewardsPanel rewards={state.rewards} m={metrics} earnedBadges={earnedBadges} addReward={addReward} claimReward={claimReward} delReward={delReward} />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
      <div style={{ ...card, padding: 18 }} className="lg:col-span-2">
        <SectionTitle hint="直近14日・科目別">学習時間の推移</SectionTitle>
        <div style={{ height: 240 }}><ResponsiveContainer width="100%" height="100%">
          <BarChart data={last14} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.sub }} interval={1} /><YAxis tick={{ fontSize: 11, fill: C.sub }} unit="h" />
            <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${C.line}`, background: C.panel, color: C.ink, fontSize: 12 }} formatter={(v,n)=>[`${v}h`,n]} />
            {SUBJECT_KEYS.map((s,i)=><Bar key={s} dataKey={s} stackId="a" fill={colorOf(s)} radius={i===SUBJECT_KEYS.length-1?[4,4,0,0]:[0,0,0,0]} />)}
          </BarChart></ResponsiveContainer></div>
      </div>
      <div style={{ ...card, padding: 18 }}>
        <SectionTitle hint="全期間">科目別の内訳</SectionTitle>
        {bySubject.length===0 ? <p style={{ color: C.sub, fontSize: 13, padding: "24px 0", textAlign: "center" }}>記録するとここに表示</p> : (
          <div style={{ height: 240 }}><ResponsiveContainer width="100%" height="100%">
            <BarChart data={bySubject} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <XAxis type="number" hide /><YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: C.ink, fontWeight: 700 }} width={44} />
              <Tooltip formatter={(v)=>[`${v}h`,"学習時間"]} contentStyle={{ borderRadius: 10, background: C.panel, border: `1px solid ${C.line}`, color: C.ink, fontSize: 12 }} />
              <Bar dataKey="hours" radius={[0,6,6,0]}>{bySubject.map((r)=><Cell key={r.name} fill={r.color} />)}</Bar>
            </BarChart></ResponsiveContainer></div>)}
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5"><StudyForm onAdd={addLog} logs={state.studyLogs} onDelete={delLog} /></div>
  </>);
}

/* ── テスト結果 ── */
function TestsPage({ metrics, hensachi, teikiChart, addMock, delMock }) {
  const [draft, setDraft] = useState(null);
  return (<>
    <div style={{ ...card, padding: 18, marginBottom: 16 }}>
      <SectionTitle color={C.magenta} hint="模試・実力・定期">テスト結果を記録</SectionTitle>
      <AiImport onParsed={(d)=>setDraft({...d,_stamp:Date.now()})} />
      <TestForm onAdd={(m)=>{addMock(m);setDraft(null);}} draft={draft} />
    </div>
    <div style={{ ...card, padding: 18, marginBottom: 16 }}>
      <SectionTitle color={C.cyan} hint="模試・実力／科目別＋平均(太線)">偏差値の推移</SectionTitle>
      {hensachi.length===0 ? <p style={{ color: C.sub, fontSize: 13, padding: "24px 0", textAlign: "center" }}>模試・実力テストを記録すると表示</p> : (
        <div style={{ height: 280 }}><ResponsiveContainer width="100%" height="100%">
          <LineChart data={hensachi} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.line} /><XAxis dataKey="name" tick={{ fontSize: 10.5, fill: C.sub }} /><YAxis domain={[40,75]} tick={{ fontSize: 11, fill: C.sub }} />
            <Tooltip contentStyle={{ borderRadius: 10, background: C.panel, border: `1px solid ${C.line}`, color: C.ink, fontSize: 12 }} /><Legend wrapperStyle={{ fontSize: 12, color: C.sub }} />
            {SUBJECT_KEYS.slice(0,5).map((s)=><Line key={s} type="monotone" dataKey={s} stroke={colorOf(s)} strokeWidth={1.5} dot={{ r: 2 }} connectNulls />)}
            <Line type="monotone" dataKey="平均" stroke={C.ink} strokeWidth={3} dot={{ r: 3 }} connectNulls />
          </LineChart></ResponsiveContainer></div>)}
    </div>
    <div style={{ ...card, padding: 18, marginBottom: 16 }}>
      <SectionTitle color={C.amber} hint="点数(100点満点)／科目別＋平均(太線)">定期テストの推移</SectionTitle>
      {teikiChart.length===0 ? <p style={{ color: C.sub, fontSize: 13, padding: "24px 0", textAlign: "center" }}>定期テストを記録すると表示</p> : (
        <div style={{ height: 260 }}><ResponsiveContainer width="100%" height="100%">
          <LineChart data={teikiChart} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.line} /><XAxis dataKey="name" tick={{ fontSize: 10.5, fill: C.sub }} /><YAxis domain={[0,100]} tick={{ fontSize: 11, fill: C.sub }} unit="点" />
            <Tooltip contentStyle={{ borderRadius: 10, background: C.panel, border: `1px solid ${C.line}`, color: C.ink, fontSize: 12 }} /><Legend wrapperStyle={{ fontSize: 12, color: C.sub }} />
            {SUBJECT_KEYS.slice(0,5).map((s)=><Line key={s} type="monotone" dataKey={s} stroke={colorOf(s)} strokeWidth={1.5} dot={{ r: 2 }} connectNulls />)}
            <Line type="monotone" dataKey="平均" stroke={C.ink} strokeWidth={3} dot={{ r: 3 }} connectNulls />
          </LineChart></ResponsiveContainer></div>)}
    </div>
    <div style={{ ...card, padding: 18, marginBottom: 16 }}>
      <SectionTitle hint="新しい順">記録したテスト一覧</SectionTitle>
      {metrics.all.length===0 ? <p style={{ color: C.sub, fontSize: 13, padding: "16px 0", textAlign: "center" }}>まだ記録がありません</p> : [...metrics.all].reverse().map((m)=><TestRow key={m.id} m={m} onDelete={delMock} />)}
    </div>
  </>);
}
function TestRow({ m, onDelete }) {
  const isTeiki=m.type==="定期テスト"; const v=SUBJECT_KEYS.map((k)=>m.scores[k]).filter((x)=>typeof x==="number"); const avg=v.length?round1(v.reduce((a,x)=>a+x,0)/v.length):"--";
  const b={模試:{bg:`${C.cyan}1f`,fg:C.cyan},実力テスト:{bg:`${C.green}1f`,fg:C.green},定期テスト:{bg:`${C.amber}1f`,fg:C.amber}}[m.type]||{bg:C.bg2,fg:C.sub};
  return (<div style={{ borderTop: `1px solid ${C.line}`, padding: "10px 0" }}>
    <div className="flex items-center justify-between flex-wrap gap-2">
      <span style={{ fontSize: 13.5 }}><span style={{ color: C.sub, marginRight: 8, fontFamily: MONO }}>{m.date}</span>
        <span style={{ background: b.bg, color: b.fg, borderRadius: 6, padding: "1px 7px", fontSize: 11, fontWeight: 700, marginRight: 8 }}>{m.type}</span>
        <b style={{ color: C.ink }}>{m.name}</b> <span style={{ color: C.green, fontWeight: 700, fontFamily: MONO }}>平均 {avg}{isTeiki?"点":""}</span></span>
      <button onClick={()=>onDelete(m.id)} style={{ ...btnGhost(C.dim), padding: "2px 8px", fontSize: 12 }}>削除</button></div>
    <div className="flex gap-2 flex-wrap" style={{ marginTop: 4 }}>{SUBJECT_KEYS.slice(0,5).map((s)=>typeof m.scores[s]==="number"?(<span key={s} style={{ fontSize: 12, color: C.sub, fontFamily: MONO }}><span style={{ color: colorOf(s), fontWeight: 800 }}>{s}</span> {m.scores[s]}{isTeiki?"点":""}</span>):null)}</div>
  </div>);
}

/* ── 学習記録フォーム ── */
function StudyForm({ onAdd, logs, onDelete }) {
  const [date,setDate]=useState(todayYMD()); const [subject,setSubject]=useState("英語"); const [hours,setHours]=useState(""); const [note,setNote]=useState("");
  const submit=()=>{const h=parseFloat(hours); if(!h||h<=0) return; onAdd({date,subject,minutes:Math.round(h*60),note:note.trim()}); setHours(""); setNote("");};
  const recent=[...logs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
  return (<div style={{ ...card, padding: 18 }}>
    <SectionTitle hint="手入力">学習を記録</SectionTitle>
    <div className="grid grid-cols-2 gap-2 mb-2"><input type="date" value={date} onChange={(e)=>setDate(e.target.value)} style={inputStyle} />
      <select value={subject} onChange={(e)=>setSubject(e.target.value)} style={inputStyle}>{SUBJECT_KEYS.map((s)=><option key={s} style={{background:C.panel}}>{s}</option>)}</select></div>
    <div className="grid grid-cols-2 gap-2 mb-2"><input type="number" step="0.5" min="0" placeholder="学習時間（例 1.5）" value={hours} onChange={(e)=>setHours(e.target.value)} style={inputStyle} />
      <input placeholder="メモ（任意）" value={note} onChange={(e)=>setNote(e.target.value)} style={inputStyle} /></div>
    <button onClick={submit} style={{ ...btn(C.cyan), width: "100%" }}>＋ 記録する</button>
    {recent.length>0 && (<div style={{ marginTop: 14 }}><Hud color={C.sub}>最近の記録</Hud>
      {recent.map((l)=>(<div key={l.id} className="flex items-center justify-between" style={{ padding: "6px 0", borderTop: `1px solid ${C.line}`, fontSize: 13, marginTop: 4 }}>
        <span><span style={{ color: C.sub, marginRight: 8, fontFamily: MONO }}>{l.date.slice(5)}</span>
          <span style={{ background: `${colorOf(l.subject)}22`, color: colorOf(l.subject), borderRadius: 6, padding: "1px 7px", fontSize: 11, fontWeight: 700, marginRight: 8 }}>{l.subject}</span>
          {fmtMin(l.minutes)}{l.note && <span style={{ color: C.sub }}> ・{l.note}</span>}</span>
        <button onClick={()=>onDelete(l.id)} style={{ ...btnGhost(C.dim), padding: "2px 7px", fontSize: 12 }}>削除</button></div>))}</div>)}
  </div>);
}

/* ── テスト記録フォーム ── */
function TestForm({ onAdd, draft }) {
  const [type,setType]=useState("模試"); const [name,setName]=useState(""); const [date,setDate]=useState(todayYMD()); const [scores,setScores]=useState({}); const [fromAi,setFromAi]=useState(false);
  const isTeiki=type==="定期テスト";
  useEffect(()=>{ if(!draft) return; setType(draft.type); setName(draft.name||""); setDate(draft.date); const sc={}; Object.entries(draft.scores).forEach(([k,v])=>(sc[k]=String(v))); setScores(sc); setFromAi(true); },[draft]);
  const submit=()=>{const clean={};SUBJECT_KEYS.slice(0,5).forEach((s)=>{const v=parseFloat(scores[s]);if(!isNaN(v))clean[s]=v;});if(Object.keys(clean).length===0)return;onAdd({type,name:name.trim()||`${type} ${date}`,date,scores:clean});setName("");setScores({});setFromAi(false);};
  return (<div>
    {fromAi && <div style={{ background: `${C.green}14`, border: `1px solid ${C.green}44`, color: C.green, borderRadius: 10, padding: "8px 12px", fontSize: 12.5, fontWeight: 700, marginBottom: 10 }}>✅ AIが読み取りました。確認して「記録する」を押してください。</div>}
    <div className="flex gap-2 mb-2">{TEST_TYPES.map((t)=><button key={t} onClick={()=>setType(t)} style={{ ...(type===t?btn(C.magenta):btnGhost(C.sub)), flex:1, padding:"8px 4px", fontSize:12.5 }}>{t}</button>)}</div>
    <div className="grid grid-cols-2 gap-2 mb-2"><input placeholder={`名称（例 ${isTeiki?"1学期中間":type==="模試"?"進研模試":"校内実力"}）`} value={name} onChange={(e)=>setName(e.target.value)} style={inputStyle} />
      <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} style={inputStyle} /></div>
    <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 700, marginBottom: 4 }}>{isTeiki?"各科目の点数(100点満点)":"各科目の偏差値"}</div>
    <div className="grid grid-cols-5 gap-2 mb-2">{SUBJECT_KEYS.slice(0,5).map((s)=>(<div key={s}><div style={{ fontSize: 11, color: C.sub, fontWeight: 700, textAlign: "center", marginBottom: 2 }}>{s}</div>
      <input type="number" value={scores[s]??""} onChange={(e)=>setScores((p)=>({...p,[s]:e.target.value}))} style={{ ...inputStyle, padding: "8px 4px", textAlign: "center" }} /></div>))}</div>
    <button onClick={submit} style={{ ...btn(C.green), width: "100%" }}>＋ {type}を記録する</button>
  </div>);
}

/* ── プロフィール ── */
const GRADES = ["中学1年生","中学2年生","中学3年生","高校1年生","高校2年生","高校3年生","既卒・浪人"];
const EMOJI_AVATARS = ["🧑‍🎓","👨‍🎓","👩‍🎓","🦊","🐱","🐶","🐼","🦉","🚀","🔥","⭐","🏔"];
const GOAL_TERMS = [
  { key: "短期", label: "短期（今学期）", color: C.amber },
  { key: "中期", label: "中期（今年）", color: C.cyan },
  { key: "長期", label: "長期（受験まで）", color: C.violet },
];
function ageFrom(bd){ if(!bd||!/^\d{4}-\d{2}-\d{2}$/.test(bd)) return null; const b=new Date(bd); if(isNaN(b)) return null; const n=new Date(); let a=n.getFullYear()-b.getFullYear(); const m=n.getMonth()-b.getMonth(); if(m<0||(m===0&&n.getDate()<b.getDate()))a--; return a>=0&&a<130?a:null; }
function Avatar({ name, avatar, size=64 }) {
  const isImg=typeof avatar==="string"&&avatar.startsWith("data:"); const isEmoji=typeof avatar==="string"&&avatar&&!isImg;
  return (<div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: `linear-gradient(135deg, ${C.cyan}, ${C.violet})`, boxShadow: glow(C.cyan,8), display: "flex", alignItems: "center", justifyContent: "center", fontSize: size*0.5, color: "#04121a", fontWeight: 900 }}>
    {isImg ? <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : isEmoji ? <span>{avatar}</span> : (name||"?").slice(0,1)}</div>);
}

function UniversityRow({ u, isPrimary, onChange, onDelete, onSetPrimary }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const lookup = async () => {
    if (!u.name.trim()) { setMsg("大学名を入力してください"); return; }
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1024,
          messages: [{ role: "user", content: `日本の大学「${u.name}」${u.faculty?`の「${u.faculty}」`:""}について、最新の合格目安となる偏差値を調べてください。予備校により異なるため代表的な中央値で構いません。JSONのみで返答（説明やバッククォートは不要）: {"hensachi": 数値, "note": "学部や予備校により幅がある旨を20字程度で"}` }],
          tools: [{ type: "web_search_20250305", name: "web_search" }] }) });
      const data = await res.json();
      if (!res.ok) throw new Error("調査に失敗しました");
      const text = (data.content||[]).filter((b)=>b.type==="text").map((b)=>b.text).join("\n");
      const mt = text.match(/\{[\s\S]*?\}/);
      if (!mt) throw new Error("偏差値を特定できませんでした");
      const parsed = JSON.parse(mt[0]);
      if (typeof parsed.hensachi !== "number" || !isFinite(parsed.hensachi)) throw new Error("偏差値を特定できませんでした");
      const h = Math.round(parsed.hensachi);
      onChange({ target: h });
      setMsg(`✓ 合格ライン偏差値 ${h} を入力${parsed.note?`（${parsed.note}）`:""}`);
    } catch (e) { setMsg("⚠ " + (e.message||"調査に失敗しました")); } finally { setBusy(false); }
  };
  return (
    <div style={{ border: `1px solid ${isPrimary?`${C.magenta}66`:C.line}`, borderRadius: 11, padding: 12, marginBottom: 8, background: isPrimary?`${C.magenta}0d`:C.bg2 }}>
      <div className="grid grid-cols-12 gap-2 items-center">
        <input value={u.name} onChange={(e)=>onChange({name:e.target.value})} placeholder="志望大学名" style={{ ...inputStyle, gridColumn: "span 6 / span 6" }} />
        <input value={u.faculty||""} onChange={(e)=>onChange({faculty:e.target.value})} placeholder="学部（任意）" style={{ ...inputStyle, gridColumn: "span 4 / span 4" }} />
        <div style={{ gridColumn: "span 2 / span 2", display: "flex", alignItems: "center", gap: 4 }}>
          <input type="number" value={u.target} onChange={(e)=>onChange({target:parseFloat(e.target.value)||0})} style={{ ...inputStyle, textAlign: "center", padding: "9px 4px" }} title="合格ライン偏差値" />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap items-center" style={{ marginTop: 8 }}>
        <button onClick={lookup} disabled={busy} style={{ ...btn(C.blue, "#fff"), padding: "6px 12px", fontSize: 12.5, opacity: busy?0.6:1 }}>{busy?"🔎 調査中…":"🔎 偏差値を自動取得"}</button>
        {!isPrimary && <button onClick={onSetPrimary} style={{ ...btnGhost(C.magenta), padding: "6px 12px", fontSize: 12 }}>★ 第一志望にする</button>}
        {isPrimary && <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 800, color: C.magenta }}>★ 第一志望（登山の山頂）</span>}
        <button onClick={onDelete} style={{ ...btnGhost(C.red), padding: "6px 10px", fontSize: 12, marginLeft: "auto" }}>削除</button>
      </div>
      {msg && <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 6, color: msg.startsWith("⚠")?C.amber:C.green }}>{msg}</div>}
    </div>
  );
}

function ProfilePage({ state, setState, metrics }) {
  const p = state.profile;
  const setP = (patch)=>setState((s)=>({...s,profile:{...s.profile,...patch}}));
  const age = ageFrom(p.birthdate);
  const fileRef = useRef(null);
  const onPickImage = (file) => { if(!file) return; const img=new Image(); const url=URL.createObjectURL(file);
    img.onload=()=>{const MAX=256;const sc=Math.min(1,MAX/Math.max(img.width,img.height));const cv=document.createElement("canvas");cv.width=Math.round(img.width*sc);cv.height=Math.round(img.height*sc);cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);URL.revokeObjectURL(url);setP({avatar:cv.toDataURL("image/jpeg",0.85)});};
    img.onerror=()=>{URL.revokeObjectURL(url);alert("画像を読み込めませんでした。別の画像（JPEG/PNG）でお試しください。");}; img.src=url; };

  // 志望大学
  const upUni=(id,patch)=>setState((s)=>({...s,schools:s.schools.map((x)=>x.id===id?{...x,...patch}:x)}));
  const addUni=()=>setState((s)=>({...s,schools:[...s.schools,{id:uid(),name:"",faculty:"",target:55}]}));
  const delUni=(id)=>setState((s)=>{const schools=s.schools.filter((x)=>x.id!==id);const mid=s.mountainSchoolId===id?(schools[0]?schools[0].id:null):s.mountainSchoolId;return {...s,schools,mountainSchoolId:mid};});
  const setPrimary=(id)=>setState((s)=>({...s,mountainSchoolId:id}));
  const primary = state.schools.find((x)=>x.id===state.mountainSchoolId)||state.schools[0];
  const longTarget = primary ? Math.round(primary.target*1.2) : null;

  // 目標
  const addGoal=(term)=>setState((s)=>({...s,goals:[...s.goals,{id:uid(),term,text:"",done:false}]}));
  const upGoal=(id,patch)=>setState((s)=>({...s,goals:s.goals.map((g)=>g.id===id?{...g,...patch}:g)}));
  const delGoal=(id)=>setState((s)=>({...s,goals:s.goals.filter((g)=>g.id!==id)}));

  const stage = stageOf(metrics.level);
  const nextEvo = metrics.level<5?"Lv5で進化":metrics.level<10?"Lv10で進化":"最終進化に到達！";

  return (<>
    {/* あいぼうモンスター */}
    <div style={{ ...card, padding: 18, marginBottom: 16 }}>
      <SectionTitle color={C.cyan} hint="レベルアップで進化する">⚡ あいぼうモンスター</SectionTitle>
      <div className="flex items-center gap-4 flex-wrap">
        <div style={{ background: C.bg2, borderRadius: 14, padding: 10, border: `1px solid ${C.line}` }}><CreatureSprite species={p.creature} level={metrics.level} size={104} /></div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{(CREATURES[p.creature]||CREATURES.flame).name} <span style={{ fontFamily: MONO, color: C.cyan }}>Lv.{metrics.level}</span></div>
          <div style={{ color: C.sub, fontSize: 12.5, fontFamily: MONO, marginTop: 2 }}>進化段階 {stage}/3 ・ {nextEvo}</div>
          <div style={{ background: C.bg2, height: 7, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.line}`, marginTop: 8, maxWidth: 240 }}>
            <div style={{ width: `${Math.min(100,(metrics.xpInto/metrics.xpNeed)*100)}%`, height: "100%", background: `linear-gradient(90deg,${C.cyan},${C.violet})`, boxShadow: glow(C.cyan,5) }} /></div>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap" style={{ marginTop: 12 }}>
        {Object.entries(CREATURES).map(([key,c])=>(
          <button key={key} onClick={()=>setP({creature:key})} title={c.name}
            style={{ padding: 6, borderRadius: 11, cursor: "pointer", background: p.creature===key?`${c.accent}22`:C.bg2, border: `2px solid ${p.creature===key?c.accent:C.line}`, boxShadow: p.creature===key?glow(c.accent,8):"none" }}>
            <CreatureSprite species={key} level={metrics.level} size={44} bob={false} />
          </button>))}
      </div>
      <p style={{ color: C.sub, fontSize: 11.5, marginTop: 8 }}>学習・ポモドーロ・連続日数でXPが貯まり、Lv5・Lv10で姿が進化します。今日のタスクを1つこなすだけでもXPが入ります。</p>
    </div>

    {/* 基本情報 */}
    <div style={{ ...card, padding: 18, marginBottom: 16 }}>
      <SectionTitle color={C.violet} hint="端末内にのみ保存・外部送信なし">基本情報</SectionTitle>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <Avatar name={state.studentName} avatar={p.avatar} size={72} />
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 20, fontWeight: 900 }}>{state.studentName||"（名前未設定）"}</div>
          <div style={{ color: C.sub, fontSize: 13, fontWeight: 700, fontFamily: MONO }}>LV.{metrics.level} ・ {p.grade}{age!=null?` ・ ${age}歳`:""}{p.prefecture?` ・ ${p.prefecture}${p.city}`:""}</div>
        </div>
      </div>
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 11, padding: 12, marginBottom: 14, background: C.bg2 }}>
        <Hud color={C.violet}>アイコンをカスタマイズ</Hud>
        <div className="flex gap-2 flex-wrap items-center" style={{ marginTop: 8 }}>
          <button onClick={()=>fileRef.current&&fileRef.current.click()} style={btn(C.violet,"#0b0418")}>📷 写真を選ぶ</button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e)=>{onPickImage(e.target.files&&e.target.files[0]); e.target.value="";}} />
          {p.avatar && <button onClick={()=>setP({avatar:""})} style={btnGhost(C.dim)}>イニシャルに戻す</button>}
        </div>
        <div className="flex gap-1 flex-wrap" style={{ marginTop: 10 }}>{EMOJI_AVATARS.map((e)=>(<button key={e} onClick={()=>setP({avatar:e})} style={{ width: 38, height: 38, borderRadius: 9, fontSize: 20, cursor: "pointer", background: p.avatar===e?`${C.violet}33`:C.panel, border: `1px solid ${p.avatar===e?C.violet:C.line}` }}>{e}</button>))}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="名前"><input value={state.studentName} onChange={(e)=>setState((s)=>({...s,studentName:e.target.value}))} style={inputStyle} /></Field>
        <Field label="生年月日（年齢を自動計算）"><input type="date" value={p.birthdate} onChange={(e)=>setP({birthdate:e.target.value})} style={inputStyle} /></Field>
        <Field label="学年"><select value={p.grade} onChange={(e)=>setP({grade:e.target.value})} style={inputStyle}>{GRADES.map((g)=><option key={g} style={{background:C.panel}}>{g}</option>)}</select></Field>
        <Field label="性別（任意）"><select value={p.gender} onChange={(e)=>setP({gender:e.target.value})} style={inputStyle}><option value="" style={{background:C.panel}}>未設定</option><option style={{background:C.panel}}>男性</option><option style={{background:C.panel}}>女性</option><option style={{background:C.panel}}>その他・回答しない</option></select></Field>
        <Field label="都道府県"><input value={p.prefecture} onChange={(e)=>setP({prefecture:e.target.value})} style={inputStyle} placeholder="岡山県" /></Field>
        <Field label="市区町村・住所（任意）"><input value={p.city} onChange={(e)=>setP({city:e.target.value})} style={inputStyle} placeholder="浅口市…" /></Field>
        <Field label="在籍校"><input value={p.school} onChange={(e)=>setP({school:e.target.value})} style={inputStyle} placeholder="○○高等学校" /></Field>
        <Field label="塾・予備校（任意）"><input value={p.cram} onChange={(e)=>setP({cram:e.target.value})} style={inputStyle} /></Field>
        <Field label="部活動（任意）"><input value={p.club} onChange={(e)=>setP({club:e.target.value})} style={inputStyle} /></Field>
        <Field label="趣味・好きなこと（任意）"><input value={p.hobby} onChange={(e)=>setP({hobby:e.target.value})} style={inputStyle} /></Field>
        <Field label="得意科目"><input value={p.strong} onChange={(e)=>setP({strong:e.target.value})} style={inputStyle} placeholder="数学・物理…" /></Field>
        <Field label="苦手科目"><input value={p.weak} onChange={(e)=>setP({weak:e.target.value})} style={inputStyle} placeholder="英語…" /></Field>
      </div>
      <div style={{ marginTop: 12 }}><Field label="メモ（自由記入）"><textarea value={p.note} onChange={(e)=>setP({note:e.target.value})} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="先生からのアドバイス、家庭での約束ごとなど" /></Field></div>
      <p style={{ color: C.dim, fontSize: 11.5, marginTop: 10, fontFamily: MONO }}>🔒 LOCAL ONLY ・ ここに入力した情報は端末の中だけに保存され、外部に送信されません。</p>
    </div>

    {/* 志望大学 */}
    <div style={{ ...card, padding: 18, marginBottom: 16 }}>
      <SectionTitle color={C.magenta} hint="大学名から偏差値を自動取得・登山の山頂に連動">🎓 志望大学</SectionTitle>
      {state.schools.map((u)=>(<UniversityRow key={u.id} u={u} isPrimary={u.id===state.mountainSchoolId} onChange={(patch)=>upUni(u.id,patch)} onDelete={()=>delUni(u.id)} onSetPrimary={()=>setPrimary(u.id)} />))}
      <button onClick={addUni} style={{ ...btnGhost(C.magenta), marginTop: 2 }}>＋ 志望大学を追加</button>
      <p style={{ color: C.dim, fontSize: 11.5, marginTop: 8 }}>※ 自動取得は予備校・学部により幅があるため目安です。最終的な数値は確認のうえ調整してください。</p>
    </div>

    {/* 将来の夢 */}
    <div style={{ ...card, padding: 18, marginBottom: 16 }}>
      <SectionTitle color={C.amber} hint="なりたい姿・志望理由">🌟 将来の夢・目標</SectionTitle>
      <textarea value={state.futureDream} onChange={(e)=>setState((s)=>({...s,futureDream:e.target.value}))} rows={4} style={{ ...inputStyle, resize: "vertical", fontSize: 15, lineHeight: 1.6 }} placeholder="例）将来は医師になって地域医療に貢献したい。そのために○○大学医学部を目指す。" />
      <p style={{ color: C.sub, fontSize: 11.5, marginTop: 8 }}>くじけそうな時に立ち返れる「なぜ頑張るのか」を言葉にしておくと、登山の支えになります。</p>
    </div>

    <InterestFinder profile={p} onAdoptDream={(txt)=>setState((s)=>({...s, futureDream: s.futureDream ? s.futureDream + "\n" + txt : txt }))} />

    {/* 目標リスト */}
    <div style={{ ...card, padding: 18, marginBottom: 16 }}>
      <SectionTitle color={C.cyan} hint="志望大学と連動・短期/中期/長期">🎯 目標リスト</SectionTitle>
      {GOAL_TERMS.map((term)=>{ const items=state.goals.filter((g)=>g.term===term.key); const dc=items.filter((g)=>g.done).length;
        return (<div key={term.key} style={{ marginBottom: 16 }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: term.color, display: "inline-block", boxShadow: glow(term.color,6) }} />
              <span style={{ fontWeight: 800, fontSize: 14 }}>{term.label}</span>
              {items.length>0 && <span style={{ color: C.sub, fontSize: 12, fontWeight: 700, fontFamily: MONO }}>{dc}/{items.length}</span>}</span>
            <button onClick={()=>addGoal(term.key)} style={{ ...btnGhost(term.color), padding: "5px 12px", fontSize: 12.5 }}>＋ 追加</button>
          </div>
          {/* 長期：志望大学に連動した自動目標（合格ライン×1.2） */}
          {term.key==="長期" && primary && primary.name && (
            <div style={{ border: `1px solid ${C.violet}55`, background: `${C.violet}0d`, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>🏔 {primary.name} に余裕をもって合格する</div>
              <div style={{ fontSize: 12.5, color: C.sub, marginTop: 3, fontFamily: MONO }}>
                合格ライン 偏差値 {primary.target} → 長期目標 <span style={{ color: C.violet, fontWeight: 800 }}>偏差値 {longTarget}</span>（合格ラインの1.2倍）
              </div>
              <div style={{ fontSize: 11.5, color: C.dim, marginTop: 4 }}>※ 安全圏をめざすストレッチ目標。志望大学の偏差値を変えると自動で更新されます。</div>
            </div>
          )}
          {items.length===0 ? <p style={{ color: C.sub, fontSize: 12.5, paddingLeft: 18 }}>「＋ 追加」で自分の目標も書き込めます。</p>
            : items.map((g)=>(<div key={g.id} className="flex items-center gap-2" style={{ marginBottom: 6 }}>
              <input type="checkbox" checked={g.done} onChange={(e)=>upGoal(g.id,{done:e.target.checked})} style={{ width: 18, height: 18, accentColor: term.color, flexShrink: 0 }} />
              <input value={g.text} onChange={(e)=>upGoal(g.id,{text:e.target.value})} placeholder="目標を入力（例：英単語を毎日50個）" style={{ ...inputStyle, textDecoration: g.done?"line-through":"none", color: g.done?C.sub:C.ink }} />
              <button onClick={()=>delGoal(g.id)} style={{ ...btnGhost(C.dim), padding: "4px 8px", fontSize: 12, flexShrink: 0 }}>✕</button></div>))}
        </div>); })}
    </div>
  </>);
}

/* ── 設定（カウントダウン等。志望大学はプロフィールで管理） ── */
function SettingsPanel({ state, setState, onClose }) {
  const up=(patch)=>setState((s)=>({...s,...patch}));
  return (<div style={{ ...card, padding: 18, marginBottom: 20, borderColor: `${C.cyan}55`, boxShadow: `0 0 22px ${C.cyan}22` }}>
    <SectionTitle hint="目標日・週間目標">設定</SectionTitle>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
      <Field label="生徒の名前"><input value={state.studentName} onChange={(e)=>up({studentName:e.target.value})} style={inputStyle} /></Field>
      <Field label="目標イベント名"><input value={state.targetLabel} onChange={(e)=>up({targetLabel:e.target.value})} style={inputStyle} /></Field>
      <Field label="目標日（カウントダウン・ペース診断）"><input type="date" value={state.targetDate} onChange={(e)=>up({targetDate:e.target.value})} style={inputStyle} /></Field>
      <Field label="週間目標（時間）"><input type="number" value={state.weeklyGoalHours} onChange={(e)=>up({weeklyGoalHours:parseFloat(e.target.value)||0})} style={inputStyle} /></Field>
    </div>
    <p style={{ color: C.sub, fontSize: 11.5 }}>志望大学の登録・偏差値の自動取得は「👤 プロフィール」タブで行えます。</p>
    <div className="flex justify-between items-center" style={{ marginTop: 18, borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
      <button onClick={()=>{ if(window.confirm("全データを消去して最初からにします。よろしいですか？")) setState(DEFAULT_STATE); }} style={btnGhost(C.red)}>全データをリセット</button>
      <button onClick={onClose} style={btn(C.cyan)}>設定を閉じる</button>
    </div>
  </div>);
}

/* ════════════ 実績バッジ ════════════ */
function getBadges(state, m) {
  const total = m.totalMin;
  const pomos = state.studyLogs.filter((l)=>(l.note||"").includes("ポモドーロ")&&!(l.note||"").includes("中断")).length;
  const goalDone = state.goals.some((g)=>g.done && g.text.trim());
  const missionClear = m.taskTotal>0 && m.taskDone===m.taskTotal;
  const hensachiUp = m.startAvg!=null && m.latestAvg!=null && m.latestAvg>m.startAvg;
  return [
    { id:"first_log", icon:"👣", name:"はじめの一歩", desc:"学習を初めて記録", color:C.green, earned: state.studyLogs.length>=1 },
    { id:"streak3", icon:"🔥", name:"継続の芽", desc:"3日連続で学習", color:C.amber, earned: m.streak>=3 },
    { id:"streak7", icon:"📅", name:"一週間皆勤", desc:"7日連続で学習", color:C.amber, earned: m.streak>=7 },
    { id:"streak30", icon:"🏅", name:"鉄の意志", desc:"30日連続で学習", color:C.red, earned: m.streak>=30 },
    { id:"total10", icon:"⏱", name:"10時間達成", desc:"累計10時間学習", color:C.cyan, earned: total>=600 },
    { id:"total50", icon:"💪", name:"50時間達成", desc:"累計50時間学習", color:C.cyan, earned: total>=3000 },
    { id:"total100", icon:"🚀", name:"100時間突破", desc:"累計100時間学習", color:C.blue, earned: total>=6000 },
    { id:"pomo10", icon:"🍅", name:"集中の達人", desc:"ポモドーロ10回", color:C.red, earned: pomos>=10 },
    { id:"pomo50", icon:"🎯", name:"集中マスター", desc:"ポモドーロ50回", color:C.red, earned: pomos>=50 },
    { id:"first_mock", icon:"📝", name:"はじめての模試", desc:"模試・実力を記録", color:C.magenta, earned: m.devSeries.length>=1 },
    { id:"hensachi_up", icon:"📈", name:"成長の証", desc:"偏差値が上がった", color:C.green, earned: hensachiUp },
    { id:"level5", icon:"⭐", name:"進化！Lv5", desc:"あいぼうが進化", color:C.violet, earned: m.level>=5 },
    { id:"level10", icon:"👑", name:"最終進化！Lv10", desc:"あいぼうが最終進化", color:C.violet, earned: m.level>=10 },
    { id:"mission", icon:"✅", name:"ミッションクリア", desc:"今日のタスク全達成", color:C.green, earned: missionClear },
    { id:"goal", icon:"🎖", name:"目標達成", desc:"目標を1つ達成", color:C.amber, earned: goalDone },
  ];
}

function BadgeShelf({ badges }) {
  const earned = badges.filter((b)=>b.earned).length;
  return (
    <div style={{ ...card, padding: 18, marginBottom: 16 }}>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <SectionTitle color={C.amber} hint="条件を満たすと自動で点灯">🏅 ACHIEVEMENTS / 実績バッジ</SectionTitle>
        <span style={{ fontFamily: MONO, fontWeight: 800, color: C.amber, textShadow: glow(C.amber,6) }}>{earned} / {badges.length}</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2" style={{ marginTop: 4 }}>
        {badges.map((b)=>(
          <div key={b.id} title={`${b.name}：${b.desc}`}
            style={{ textAlign: "center", borderRadius: 12, padding: "12px 6px",
              background: b.earned?`${b.color}14`:C.bg2, border: `1px solid ${b.earned?b.color+"66":C.line}`,
              boxShadow: b.earned?glow(b.color,8):"none", opacity: b.earned?1:0.5 }}>
            <div style={{ fontSize: 26, filter: b.earned?"none":"grayscale(1)" }}>{b.earned?b.icon:"🔒"}</div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: b.earned?C.ink:C.dim, marginTop: 4, lineHeight: 1.2 }}>{b.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════ ごほうび ════════════ */
const REWARD_TYPES = [
  { key: "level",  label: "レベル", unit: "Lv" },
  { key: "streak", label: "連続日数", unit: "日連続" },
  { key: "badges", label: "バッジ数", unit: "個" },
  { key: "manual", label: "いつでも", unit: "" },
];
function rewardProgress(r, m, earnedBadges) {
  if (r.type === "level")  return { cur: m.level, need: r.threshold, ok: m.level >= r.threshold };
  if (r.type === "streak") return { cur: m.streak, need: r.threshold, ok: m.streak >= r.threshold };
  if (r.type === "badges") return { cur: earnedBadges, need: r.threshold, ok: earnedBadges >= r.threshold };
  return { cur: 1, need: 1, ok: true };
}
function rewardCond(r) {
  const t = REWARD_TYPES.find((x)=>x.key===r.type);
  if (r.type === "manual") return "いつでも受け取りOK";
  return `${t.label} ${r.threshold}${t.unit} で解放`;
}
function RewardsPanel({ rewards, m, earnedBadges, addReward, claimReward, delReward }) {
  const [text, setText] = useState("");
  const [type, setType] = useState("level");
  const [threshold, setThreshold] = useState(5);
  const add = () => { if (!text.trim()) return; addReward({ text: text.trim(), type, threshold: Math.max(1, parseInt(threshold)||1) }); setText(""); };
  return (
    <div style={{ ...card, padding: 18, marginBottom: 16 }}>
      <SectionTitle color={C.green} hint="親子で決めて、達成したら受け取ろう">🎁 REWARDS / ごほうび</SectionTitle>
      {rewards.length === 0 && <p style={{ color: C.sub, fontSize: 12.5, marginBottom: 10 }}>「Lv5でゲーム30分」「7日連続でアイス」など、がんばった先のごほうびを決めよう。</p>}
      {rewards.map((r)=>{ const pr = rewardProgress(r, m, earnedBadges);
        return (
          <div key={r.id} className="flex items-center gap-2" style={{ borderTop: `1px solid ${C.line}`, padding: "10px 0" }}>
            <div style={{ fontSize: 22 }}>{r.claimed?"🎉":pr.ok?"🎁":"🔒"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: r.claimed?C.sub:C.ink, textDecoration: r.claimed?"line-through":"none" }}>{r.text}</div>
              <div style={{ fontSize: 11.5, color: C.sub, fontFamily: MONO }}>
                {rewardCond(r)}{r.type!=="manual" && !r.claimed && !pr.ok ? ` ・ あと ${Math.max(0, pr.need-pr.cur)}` : ""}
              </div>
            </div>
            {r.claimed ? <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 800, color: C.green }}>受取済 ✓</span>
              : pr.ok ? <button onClick={()=>claimReward(r.id)} style={{ ...btn(C.green), padding: "6px 12px", fontSize: 12.5, boxShadow: glow(C.green,8) }}>受け取る！</button>
              : <span style={{ fontFamily: MONO, fontSize: 12, color: C.dim }}>{pr.cur}/{pr.need}</span>}
            <button onClick={()=>delReward(r.id)} style={{ ...btnGhost(C.dim), padding: "3px 8px", fontSize: 12 }}>✕</button>
          </div>
        ); })}
      <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 6, paddingTop: 12 }}>
        <Hud color={C.sub}>ごほうびを追加</Hud>
        <input value={text} onChange={(e)=>setText(e.target.value)} placeholder="ごほうびの内容（例：好きなゲーム30分）" style={{ ...inputStyle, marginTop: 6 }} />
        <div className="flex gap-2 mt-2 items-center flex-wrap">
          <select value={type} onChange={(e)=>setType(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
            {REWARD_TYPES.map((t)=><option key={t.key} value={t.key} style={{background:C.panel}}>{t.label}</option>)}
          </select>
          {type!=="manual" && <input type="number" min="1" value={threshold} onChange={(e)=>setThreshold(e.target.value)} style={{ ...inputStyle, width: 80, textAlign: "center" }} />}
          {type!=="manual" && <span style={{ color: C.sub, fontSize: 12.5 }}>{REWARD_TYPES.find((t)=>t.key===type).unit} で解放</span>}
          <button onClick={add} style={{ ...btn(C.green), marginLeft: "auto" }}>＋ 追加</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════ 興味さがし（AI進路提案） ════════════ */
function InterestFinder({ profile, onAdoptDream }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  useEffect(() => { const seed = [profile.strong, profile.hobby].filter(Boolean).join("、"); if (seed) setText(seed); }, [profile.strong, profile.hobby]);
  const run = async () => {
    if (!text.trim()) { setError("好きなこと・興味のあることを入力してください"); return; }
    setBusy(true); setError(""); setResults([]);
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1500,
          messages: [{ role: "user", content: `日本の高校生が「${text}」に興味・関心があります。将来の進路を考えるヒントとして、向いていそうな分野・職業を3つ提案してください。各提案に、関連する大学の学部例を添えてください。JSONのみで返答（説明やバッククォートは不要）: {"suggestions":[{"field":"分野/職業名","reason":"なぜ向いていそうか40字程度","faculties":["学部例1","学部例2"]}]}` }] }) });
      const data = await res.json();
      if (!res.ok) throw new Error("提案の取得に失敗しました");
      const txt = (data.content||[]).filter((b)=>b.type==="text").map((b)=>b.text).join("\n");
      const mt = txt.match(/\{[\s\S]*\}/);
      if (!mt) throw new Error("うまく提案できませんでした。言葉を変えて試してください。");
      const parsed = JSON.parse(mt[0]);
      if (!Array.isArray(parsed.suggestions) || parsed.suggestions.length===0) throw new Error("うまく提案できませんでした。");
      setResults(parsed.suggestions);
    } catch (e) { setError(e.message || "提案の取得に失敗しました"); } finally { setBusy(false); }
  };
  return (
    <div style={{ ...card, padding: 18, marginBottom: 16 }}>
      <SectionTitle color={C.blue} hint="夢がまだ決まっていなくてOK">🧭 興味から進路をさがす</SectionTitle>
      <p style={{ color: C.sub, fontSize: 12.5, marginBottom: 8 }}>好きな科目や趣味から、向いていそうな分野・職業と関連学部をAIが提案します。「将来の夢」が思いつかないときの入口に。</p>
      <textarea value={text} onChange={(e)=>setText(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="例：ゲーム、生き物、人と話すこと、数学、絵をかくこと" />
      <button onClick={run} disabled={busy} style={{ ...btn(C.blue,"#fff"), marginTop: 8, opacity: busy?0.6:1, boxShadow: busy?"none":glow(C.blue,8) }}>{busy?"🔎 さがし中…":"🧭 進路を提案してもらう"}</button>
      {error && <div style={{ color: C.amber, fontSize: 12.5, fontWeight: 700, marginTop: 8 }}>⚠ {error}</div>}
      <div style={{ marginTop: results.length?12:0 }}>
        {results.map((r, i)=>(
          <div key={i} style={{ border: `1px solid ${C.line}`, borderRadius: 11, padding: 12, marginBottom: 8, background: C.bg2 }}>
            <div className="flex items-center justify-between gap-2">
              <div style={{ fontSize: 14.5, fontWeight: 800, color: C.blue }}>◆ {r.field}</div>
              <button onClick={()=>onAdoptDream(`${r.field}に興味がある（${(r.faculties||[]).join("・")}）`)} style={{ ...btnGhost(C.amber), padding: "4px 10px", fontSize: 12 }}>★ 夢にメモ</button>
            </div>
            <div style={{ fontSize: 12.5, color: C.sub, marginTop: 4 }}>{r.reason}</div>
            {Array.isArray(r.faculties) && r.faculties.length>0 && (
              <div className="flex gap-1 flex-wrap" style={{ marginTop: 6 }}>{r.faculties.map((f,j)=><span key={j} style={{ fontSize: 11.5, fontFamily: MONO, color: C.cyan, background: `${C.cyan}14`, border: `1px solid ${C.cyan}44`, borderRadius: 6, padding: "2px 8px" }}>{f}</span>)}</div>
            )}
          </div>
        ))}
      </div>
      <p style={{ color: C.dim, fontSize: 11, marginTop: 6 }}>※ AIによる一般的な提案です。進路は先生やご家族とも相談して決めてください。</p>
    </div>
  );
}

/* ════════════ 保護者ビュー ════════════ */
function ParentView({ state, metrics }) {
  const wkStart = startOfWeek(new Date());
  const weekLogs = state.studyLogs.filter((l)=>new Date(l.date)>=wkStart);
  const weekMin = weekLogs.reduce((a,l)=>a+l.minutes,0);
  const daysStudied = new Set(weekLogs.filter((l)=>l.minutes>0).map((l)=>l.date)).size;
  const weekPomos = weekLogs.filter((l)=>(l.note||"").includes("ポモドーロ")&&!(l.note||"").includes("中断")).length;
  const weekTasks = state.dailyTasks.filter((t)=>new Date(t.date)>=wkStart);
  const weekTaskRatio = weekTasks.length ? Math.round(weekTasks.filter((t)=>t.done).length/weekTasks.length*100) : 0;
  const last2 = metrics.devSeries.slice(-2);
  const delta = last2.length===2 ? round1(last2[1].avg-last2[0].avg) : null;
  const badges = getBadges(state, metrics);
  const earned = badges.filter((b)=>b.earned).length;
  const weekPct = metrics.weekPct;
  const comment = weekPct>=100
    ? "今週の目標を達成しています。よく頑張っているので、結果が出たらたくさん認めてあげてください。"
    : metrics.streak>=3
    ? "学習習慣が続いています。時間の長さより「毎日机に向かえた」ことを一緒に喜ぶのが効果的です。"
    : weekMin>0
    ? "学習の記録はあります。うまくいかない日も責めず、小さな再開を後押しする声かけが続きやすさにつながります。"
    : "今週はまだ記録が少なめです。まずは『5分だけ』など、ハードルを下げた声かけから始めてみましょう。";

  return (
    <>
      <div style={{ ...card, padding: 18, marginBottom: 16, borderColor: `${C.blue}44` }}>
        <SectionTitle color={C.blue} hint="今週の様子をひと目で">👨‍👩‍👧 保護者ビュー ・ 週次サマリー</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="今週の学習" value={fmtHours(weekMin)} unit={`h / ${state.weeklyGoalHours}h`} accent={C.cyan} sub={`達成率 ${weekPct}%`} />
          <StatCard label="今週の学習日数" value={daysStudied} unit="日 / 7日" accent={C.green} sub={`連続 ${metrics.streak}日`} />
          <StatCard label="今週のポモドーロ" value={weekPomos} unit="回" accent={C.red} sub="集中セッション" />
          <StatCard label="タスク達成率" value={weekTaskRatio} unit="%" accent={C.amber} sub="今週の予定" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div style={{ ...card, padding: 18 }}>
          <SectionTitle hint="直近の伸び">学力の状況</SectionTitle>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 34, fontWeight: 900, color: C.cyan, textShadow: glow(C.cyan,10) }}>{metrics.latestAvg ?? "--"}</span>
            <span style={{ color: C.sub, fontSize: 13 }}>最新の平均偏差値</span>
            {delta!=null && <span style={{ fontFamily: MONO, fontWeight: 800, color: delta>=0?C.green:C.red }}>{delta>=0?"▲ +":"▼ "}{delta}</span>}
          </div>
          <div style={{ color: C.sub, fontSize: 12.5, marginTop: 8 }}>
            第一志望：<b style={{ color: C.ink }}>{metrics.school?metrics.school.name:"未設定"}</b>（合格ライン 偏差値 {metrics.school?metrics.school.target:"--"}）
          </div>
          {metrics.pace && (
            <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700, color: metrics.pace.onTrack?C.green:C.amber }}>
              {metrics.pace.onTrack ? `現状ペースで目標日に偏差値 ${metrics.pace.projected} 到達見込み` : `現状ペースでは目標日に偏差値 ${metrics.pace.projected} 見込み（要ペースアップ）`}
            </div>
          )}
        </div>
        <div style={{ ...card, padding: 18 }}>
          <SectionTitle color={C.amber} hint={`${earned}/${badges.length} 獲得`}>獲得した実績</SectionTitle>
          <div className="flex gap-2 flex-wrap">
            {badges.filter((b)=>b.earned).length===0 ? <p style={{ color: C.sub, fontSize: 13 }}>まだありません。</p>
              : badges.filter((b)=>b.earned).map((b)=>(<span key={b.id} style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, background: `${b.color}18`, border: `1px solid ${b.color}55`, borderRadius: 8, padding: "4px 9px" }}>{b.icon} {b.name}</span>))}
          </div>
        </div>
      </div>

      <div style={{ ...card, padding: 18, marginBottom: 16, background: `${C.blue}0c` }}>
        <SectionTitle color={C.blue} hint="声かけのヒント">ひとことアドバイス</SectionTitle>
        <p style={{ color: C.ink, fontSize: 14, lineHeight: 1.7 }}>{comment}</p>
        <p style={{ color: C.dim, fontSize: 11, marginTop: 8, fontFamily: MONO }}>※ 自動生成の一般的なヒントです。お子さんの状況に合わせてご活用ください。</p>
      </div>
    </>
  );
}

/* ════════════ トースト ════════════ */
function Toast({ badge, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [badge, onClose]);
  if (!badge) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)", zIndex: 50, cursor: "pointer",
      background: C.panelHi, border: `1px solid ${badge.color}`, borderRadius: 12, padding: "12px 18px", boxShadow: glow(badge.color,16), animation: "fadein .4s ease", maxWidth: "90%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 26 }}>{badge.icon}</span>
        <div><Hud color={badge.color}>実績を獲得！</Hud><div style={{ fontSize: 14.5, fontWeight: 800, color: C.ink }}>{badge.name}</div>
          <div style={{ fontSize: 11.5, color: C.sub }}>{badge.desc}</div></div>
      </div>
    </div>
  );
}
