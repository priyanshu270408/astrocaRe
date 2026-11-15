import { useMemo, useState } from "react";
import {
  Activity, AlertTriangle, Bell, Bone, Brain, CalendarDays, Check, ChevronRight, CircleUserRound,
  ClipboardList, Clock3, Database, Droplets, Dumbbell, FileText, HeartPulse, LayoutDashboard,
  Lock, Menu, Moon, Radiation, Radio, Settings, Shield, ShieldAlert, Sparkles, Stethoscope,
  Thermometer, Users, Wifi, WifiOff, X, Zap
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from "recharts";
import Particles from "./Particles";
import HealthMonitoring from "./HealthMonitoring";
import AuthGate, { Session } from "./AuthGate";
import DataEntry from "./DataEntry";
import AlertsView from "./AlertsView";

type Reading = { time:string; hr:number; spo2:number; temp:number };
const initialReadings: Reading[] = [
  {time:"59:40",hr:78,spo2:97.5,temp:36.6},{time:"59:41",hr:77,spo2:97.7,temp:36.7},
  {time:"59:42",hr:76,spo2:97.8,temp:36.8},{time:"59:43",hr:74,spo2:97.7,temp:36.8}
];
const sleepData = [{day:"Sun",hours:7.8},{day:"Mon",hours:6.7},{day:"Tue",hours:7.4},{day:"Wed",hours:5.9},{day:"Thu",hours:7.1},{day:"Fri",hours:5.5},{day:"Sat",hours:5.4}];

function Brand(){return <div className="brand"><span className="brand-mark">◉</span><b>ASTROCARE</b></div>}
function Landing({onLaunch}:{onLaunch:()=>void}) {
  return <div className="landing">
    <section className="hero">
      <Particles />
      <nav className="site-nav wrap"><Brand/><div className="nav-links"><a href="#problem">Problem</a><a href="#features">Features</a><a href="#ai">AI monitoring</a><a href="#twin">Health twin</a><a href="#technology">Technology</a></div><button className="outline-btn" onClick={onLaunch}>Open dashboard <ChevronRight size={16}/></button></nav>
      <div className="hero-content wrap">
        <div className="hero-copy"><span className="eyebrow pill">🚀 2026 NASA Space Apps Challenge · Astronaut health</span>
          <h1>Your Health.<br/>Our Mission.<br/><span>Beyond Earth.</span></h1>
          <p>ASTROCARE continuously monitors astronauts’ physical and mental well-being on long-duration missions — spotting unusual patterns early, explaining why they matter, and keeping the crew and flight surgeons in the loop even when the ground link drops.</p>
          <div className="hero-actions"><button className="primary-btn" onClick={onLaunch}>Get Started <ChevronRight size={17}/></button><a className="secondary-btn" href="#features">Explore Features</a></div>
        </div>
        <div className="hero-art">
          <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
          <div className="astronaut-photo"><div className="photo-overlay">MISSION CONTROL <span>HLX-07</span></div></div>
          <div className="float-card heart-float"><small><HeartPulse size={13}/> HEART RATE</small><strong>68 <i>bpm</i></strong><div className="mini-pulse">⌁⌁⌁⌁⌁</div></div>
          <div className="float-card risk-float"><small>RISK CHECK <b className="moderate">● Moderate</b></small><strong>Resting HR rising ~1.1 bpm/day over 7 days</strong><small>Detected trend · review at next medical conference</small></div>
        </div>
      </div>
    </section>
    <section className="about section"><div className="wrap about-grid"><div><label>ABOUT THE PROJECT</label><h2>A medical officer that never sleeps — and always shows its work.</h2><p>Built for the challenge “Create Health Monitoring Software for Astronauts on Space Missions”, ASTROCARE collects health indicators, tracks them over the whole mission, flags emerging risks with plain-language reasons, and helps astronauts and medical teams respond.</p></div><div className="stat-grid"><Stat n="6" t="vital-sign groups monitored"/><Stat n="3" t="transparent risk levels"/><Stat n="2" t="roles: crew & medical"/><Stat n="0" t="assumptions of constant connectivity"/></div></div></section>
    <section id="problem" className="section problem"><div className="wrap"><label>THE PROBLEM</label><h2>The human body was not built for<br/>space.</h2><p className="section-intro">On long-duration missions, health risks build slowly and quietly — and the nearest hospital is hundreds of kilometres below.</p><div className="grid-four">{[
      [Radiation,"Space radiation","Galactic cosmic rays and solar particle events accumulate dose day after day."],
      [Bone,"Bone & muscle loss","Microgravity drives measurable loss of bone density and muscle mass."],
      [HeartPulse,"Cardiovascular change","Fluid shifts alter heart rate, blood pressure and vascular function."],
      [ShieldAlert,"Immune shifts","Long-duration flight is associated with immune system dysregulation."],
      [Moon,"Sleep disruption","16 sunrises a day, noise and workload compress the sleep window."],
      [CircleUserRound,"Stress & isolation","Confinement and distance from home weigh on behavioural health."],
      [Stethoscope,"Limited medical access","No hospital nearby — the crew is the first responder."],
      [Radio,"Communication delay","Links drop and, beyond the Moon, delays stretch to minutes."]
    ].map(([Icon,title,desc]:any)=><InfoCard key={title} Icon={Icon} title={title} desc={desc}/>)}</div></div></section>
    <section className="section solution"><div className="wrap"><label>OUR SOLUTION</label><h2>Collect. Understand. Respond.</h2><p className="section-intro">ASTROCARE closes the loop between raw readings and medical action — on board and on the ground.</p><div className="grid-three">{[
      [Database,"01 · Collect","Wearable-ready ingestion for vitals, sleep, dosimetry and daily check-ins. A built-in simulator generates clearly labelled demo data until hardware is connected."],
      [Activity,"02 · Understand","Each reading is checked against mission-configured thresholds, and multi-day trends are measured statistically — with every finding explained."],
      [Bell,"03 · Respond","Graded alerts suggest a next action, notify the crew, and wait for a medical administrator to acknowledge and resolve them."]
    ].map(([Icon,title,desc]:any)=><div className="solution-card" key={title}><Icon/><h3>{title}</h3><p>{desc}</p></div>)}</div></div></section>
    <section id="features" className="section features"><div className="wrap"><label>CORE FEATURES</label><div className="section-heading"><h2>Everything the crew surgeon needs, in<br/>one console.</h2><button className="text-link" onClick={onLaunch}>Try the live dashboard <ChevronRight size={16}/></button></div><div className="grid-three">{[
      [Activity,"Continuous vitals","Heart rate, SpO₂, blood pressure, temperature, activity and sleep in one live view.",true],
      [Brain,"Explainable risk detection","Threshold and trend rules that show their reasoning and supporting readings.",true],
      [Radiation,"Radiation dosimetry","Daily and cumulative dose tracked against mission-defined budgets.",true],
      [Bell,"Alerts & acknowledgement","Severity-graded alerts with a next action, reviewed by the medical team.",true],
      [CircleUserRound,"Wellness check-ins","A 60-second daily check-in for mood, stress, energy and isolation.",false],
      [Users,"Digital Health Twin","A body-map view of how each system is trending across the mission.",false],
      [WifiOff,"Offline-first","Readings and check-ins are queued on board and synced when the link returns.",false],
      [FileText,"Medical reports","Daily, weekly, monthly or custom PDF reports for the flight surgeon.",false],
      [Users,"Medical admin console","Crew-wide summaries, pending alerts and role-based access to records.",false]
    ].map(([Icon,title,desc,live]:any)=><div className="feature-card" key={title}><div className="feature-top"><Icon/><span className={live?"live-tag":"roadmap-tag"}>{live?"● LIVE IN DEMO":"IN DEVELOPMENT"}</span></div><h3>{title}</h3><p>{desc}</p></div>)}</div></div></section>
    <section id="ai" className="section ai-section"><div className="wrap ai-grid"><div><label>AI HEALTH MONITORING</label><h2>Risk detection you can audit.</h2><p>No black-box diagnoses. ASTROCARE separates what was observed, what trend was detected, and what a model predicts — and leaves the medical assessment to people. Every threshold is configurable by the mission’s flight surgeon.</p></div><div className="risk-demo"><span className="moderate">● Moderate Risk</span><span className="detected">DETECTED TREND</span><span className="demo-label">⚗ DEMO DATA</span><h3>Sleep averaging 5.8 h over 5 nights</h3><label>SUPPORTING READINGS</label><div className="chips"><i>6.4 h</i><i>6.1 h</i><i>5.7 h</i><i>5.5 h</i><i>5.3 h</i></div><label>RECOMMENDED NEXT ACTION</label><p>Protect the sleep window; review lighting, noise and late-shift scheduling.</p><small>◷ Detected 06:12 · Decision support — not a diagnosis</small></div></div></section>
    <section id="twin" className="section twin"><div className="wrap twin-grid"><div className="body-twin"><div className="body-head">Sleep · 5.8 h avg</div><div className="human"><div className="head"/><div className="torso"/><div className="arm left"/><div className="arm right"/><div className="leg left"/><div className="leg right"/></div><span className="body-tag top">Cardio · resting HR ↑</span><span className="body-tag bottom">Bone · scan due</span></div><div><label>DIGITAL HEALTH TWIN</label><h2>A living picture of each astronaut.</h2><p>The twin maps recorded and clearly simulated data onto the body — cardiovascular trends, sleep patterns, radiation history and wellness — so changes over the mission are visible at a glance. It reflects the data, never invented conclusions.</p></div></div></section>
    <section className="section safety"><div className="wrap"><label>MISSION SAFETY</label><h2>Designed for the realities of<br/>spaceflight.</h2><div className="grid-three">{[
      [WifiOff,"Works offline","Readings, alerts and check-ins are stored on board and synced — without duplicates — when the link returns."],
      [Lock,"Private by default","Astronauts see only their own records; medical administrators see only the crews they are authorised for."],
      [Sparkles,"Honest about data","Simulated readings are always labelled DEMO DATA. No claim of connection to real agency systems or hardware."]
    ].map(([Icon,title,desc]:any)=><InfoCard key={title} Icon={Icon} title={title} desc={desc}/>)}</div></div></section>
    <section id="technology" className="section tech"><div className="wrap"><label>TECHNOLOGY STACK</label><h2>Modular, maintainable, wearable-<br/>ready.</h2><div className="tech-grid">{[["INTERFACE","React · Vite · Tailwind CSS · Recharts · Lucide"],["RISK ENGINE","Transparent statistical rules — thresholds, linear trends, baseline deltas"],["DATA","Managed PostgreSQL with per-crew access rules"],["ACCOUNTS","Role-based sign-in for astronauts and medical administrators"],["REALTIME","Streaming readings and browser notifications"],["OFFLINE","IndexedDB queue with de-duplicated sync"]].map(([a,b])=><div><label>⚙ {a}</label><p>{b}</p></div>)}</div></div></section>
    <section className="section team"><div className="wrap team-card"><div><label>ABOUT THE TEAM</label><h2>Built for the 2026 NASA Space Apps Challenge.</h2><p>ASTROCARE brings together software engineering, data science, interface design and healthcare technology to explore how crews could manage their own health far from Earth. It is an independent challenge project and is not affiliated with or endorsed by NASA.</p><button className="primary-btn" onClick={onLaunch}>Launch the demo dashboard <ChevronRight size={16}/></button></div><div className="team-tags">{["Full-stack engineering","AI / ML & statistics","UI / UX design","Database architecture","Healthcare technology","Mission operations"].map(x=><span>{x}</span>)}</div></div></section>
    <footer className="footer wrap"><Brand/><span>Decision-support software · not a substitute for professional medical evaluation · demo data is simulated.</span><span>© 2026 ASTROCARE</span></footer>
  </div>
}
function Stat({n,t}:{n:string;t:string}){return <div className="stat"><strong>{n}</strong><span>{t}</span></div>}
function InfoCard({Icon,title,desc}:any){return <div className="info-card"><Icon/><h3>{title}</h3><p>{desc}</p></div>}

function Dashboard({session,onLogout}:{session:Session;onLogout:()=>void}) {
  const [section,setSection]=useState("Mission Dashboard");
  const [streaming,setStreaming]=useState(true);
  const [alerts,setAlerts]=useState([{title:"Heart Rate",time:"3h ago",desc:"Resting heart rate has risen on 5 consecutive days.",action:"Flag for flight-surgeon review at next medical conference.",status:"Unresolved"},{title:"Sleep & Wellness",time:"10h ago",desc:"Average sleep over 5 nights is below the 6 h mission guideline.",action:"Review work/rest schedule; confirm sleep station lighting settings.",status:"Unresolved"},{title:"Blood Pressure",time:"3d ago",desc:"Single reading above the configured systolic advisory.",action:"Repeat measurement and review trend.",status:"Acknowledged"}]);
  const [readings,setReadings]=useState(initialReadings);
  const [toast,setToast]=useState("");
  const chartData=useMemo(()=>readings,[readings]);
  const nav=[["Mission Dashboard",LayoutDashboard],["Data Entry",Database],["Health Monitoring",HeartPulse],["AI Health Analysis",Brain],["Mental Wellness",CircleUserRound],["Digital Health Twin",Activity],["Radiation Monitoring",Radiation],["Health History",Clock3],["Alerts & Notifications",Bell],["Medical Reports",FileText],["Astronaut Profile",Users],["Administrator",Shield],["Settings",Settings]] as const;
  function generate(){const hr=66+Math.round(Math.random()*35), spo2=95+Math.round(Math.random()*4);setReadings(v=>[...v.slice(-3),{time:new Date().toLocaleTimeString().slice(0,5),hr,spo2,temp:36.3+Math.random()*.7}]);setToast("New demo telemetry reading generated");setTimeout(()=>setToast(""),2400)}
  function updateAlert(i:number,status:string){setAlerts(a=>a.map((x,j)=>i===j?{...x,status}:x));}
  if(section==="Health Monitoring") return <HealthMonitoring/>;
  if(section==="Alerts & Notifications") return <div className="dashboard"><aside className="sidebar"><Brand/><div className="nav-caption">LIVE</div>{nav.map(([name,Icon],i)=><button className={`side-link ${section===name?"active":""} ${i>1?"muted":""}`} onClick={()=>setSection(String(name))}><Icon size={17}/><span>{name}</span></button>)}<div className="mission-box"><label>MISSION</label><b>HLX-07</b><span>Day 105 of 180</span></div></aside><main className="dash-main"><header className="dash-top"><div><Activity size={16}/> <b>HLX-07</b> · {session.user.name}</div><div className="top-actions"><span className="online"><Wifi size={14}/> Engineer workspace</span><button className="outline-btn" onClick={onLogout}>Sign out</button></div></header><div className="dash-content"><AlertsView token={session.token}/></div></main></div>;
  if(section==="Data Entry") return <div className="dashboard"><aside className="sidebar"><Brand/><div className="nav-caption">LIVE</div>{nav.map(([name,Icon],i)=><button className={`side-link ${section===name?"active":""} ${i>1?"muted":""}`} onClick={()=>setSection(String(name))}><Icon size={17}/><span>{name}</span></button>)}<div className="mission-box"><label>MISSION</label><b>HLX-07</b><span>Day 105 of 180</span></div></aside><main className="dash-main"><header className="dash-top"><div><Activity size={16}/> <b>HLX-07</b> · {session.user.name} <span className="demo-badge">{session.user.role.toUpperCase()}</span></div><div className="top-actions"><span className="online"><Wifi size={14}/> Engineer workspace</span><button className="outline-btn" onClick={onLogout}>Sign out</button></div></header><div className="dash-content"><DataEntry token={session.token}/></div></main></div>;
  return <div className="dashboard">
    <aside className="sidebar"><Brand/><div className="nav-caption">LIVE</div>{nav.map(([name,Icon],i)=><button className={`side-link ${section===name?"active":""} ${i>1?"muted":""}`} onClick={()=>setSection(name)}><Icon size={17}/><span>{name}</span>{i>1&&<small>M{i+2}</small>}</button>)}<div className="mission-box"><label>MISSION</label><b>HLX-07</b><span>Day 105 of 180</span></div></aside>
    <main className="dash-main"><header className="dash-top"><div><Activity size={16}/> <b>HLX-07</b> · Mission day <b>105</b> <span className="demo-badge">⚗ DEMO DATA</span></div><div className="top-actions"><span className="online"><Wifi size={14}/> Ground link online</span><button className="outline-btn" onClick={()=>setToast("Browser alerts enabled for this demo")}>♧ Enable alerts</button><Bell size={18}/><span className="session-user">{session.user.name}</span><button className="icon-button" onClick={onLogout} title="Sign out"><CircleUserRound size={22}/></button></div></header>
      <div className="dash-content"><div className="dash-title"><div><label>{section.toUpperCase()}</label><h1>{section==="Mission Dashboard"?"Good afternoon, Dr. Mira":section}</h1><p>Overall status <span className="moderate">● Moderate Risk</span> · updated {new Date().toLocaleTimeString()}</p></div><button className="outline-btn" onClick={()=>setSection("Health Monitoring")}>Full health monitoring <ChevronRight size={16}/></button></div>
      <div className="vital-grid"><Vital Icon={HeartPulse} title="HEART RATE" value={`${readings.at(-1)?.hr ?? 74}`} unit="bpm" sub="Resting baseline 58 bpm" color="pink"/><Vital Icon={Droplets} title="SpO₂" value={`${readings.at(-1)?.spo2 ?? 97.7}`} unit="%" sub="Advisory below 94%" color="cyan"/><Vital Icon={Activity} title="BLOOD PRESSURE" value="118/74" unit="mmHg" sub="Baseline 116/74" color="orange"/><Vital Icon={Thermometer} title="BODY TEMP" value="36.8" unit="°C" sub="Advisory ≥ 37.8 °C" color="yellow"/></div>
      <div className="dash-grid-main"><div className="panel telemetry-panel"><div className="panel-head"><div><h3>Live telemetry</h3><p>Last 4 simulated readings · heart rate and SpO₂</p></div><div className="legend"><span>— Heart rate</span><span>— SpO₂</span></div></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid stroke="#30213f" strokeDasharray="3 3"/><XAxis dataKey="time" stroke="#827294"/><YAxis stroke="#827294"/><Tooltip contentStyle={{background:"#1a1026",border:"1px solid #46305a",borderRadius:10}}/><Line dataKey="hr" stroke="#f16bb6" strokeWidth={2} dot={false}/><Line dataKey="spo2" stroke="#4ce0cb" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div><small>Dashed lines mark the mission-configured advisory thresholds (HR 110 bpm, SpO₂ 94%).</small></div>
      <div className="panel risk-panel"><div className="panel-head"><h3>Risk assessment</h3><span className="moderate">● Moderate Risk</span></div><p>Rule-based checks against configured thresholds and 5–7 day trends. Each finding shows why it fired.</p>{["Resting heart rate rising ~1 bpm/day over 7 days","Sleep averaging 6.2 h over 5 nights (3 below 6 h)","Self-reported stress increasing (3-day avg 3.3/5)","Cumulative dose 57.1 mSv — 38% of 150 mSv"].map(x=><div className="risk-item"><span className="moderate">● Moderate</span><span className="detected">DETECTED TREND</span><p>{x}</p></div>)}</div>
      <div className="panel astronaut-panel"><div className="astronaut-avatar">👩‍🚀</div><label>ASTRONAUT · AC-0417</label><h3>Dr. Mira Okonkwo-Lind</h3><p>Flight Engineer · Medical Officer</p><div className="profile-tags"><span>Callsign LYNX</span><span>Age 39</span><span>Blood O+</span></div><label>MISSION</label><b>HLX-07</b><label>MISSION NAME</label><b>Helix Deep Station — Expedition 7</b><label>MEDICAL CLEARANCE</label><p>Class I · cleared for long-duration flight</p><div className="progress-label">Mission day 105 / 180 <b>58%</b></div><div className="progress"><i/></div></div>
      <div className="panel simulator-panel"><div className="panel-head"><h3>Health data simulator</h3><span className="demo-badge">⚗ DEMO DATA</span></div><p>No wearable is connected. Readings are generated in your browser so the monitoring flow can be demonstrated end to end.</p><div className="sim-controls"><button className="primary-btn" onClick={()=>setStreaming(!streaming)}>{streaming?"Ⅱ Pause":"▶ Resume"} streaming</button><span>Every 3s</span><i className={streaming?"dot on":"dot"}/></div><button className="wide-btn" onClick={generate}>＋ Generate one reading</button><div className="inject-row"><select><option>Elevated heart rate</option><option>Low SpO₂</option><option>High temperature</option></select><button className="outline-btn" onClick={()=>{generate();setToast("Demo event injected")}}><Zap size={15}/> Inject</button></div><small>Last reading {readings.at(-1)?.time}</small></div>
      <div className="panel radiation-panel"><div className="panel-head"><h3>☢ RADIATION DOSE</h3><b>0.61 mSv today</b></div><strong>57.1 <small>/ 150 mSv mission budget</small></strong><div className="progress"><i/></div><div className="chart short"><ResponsiveContainer width="100%" height="100%"><AreaChart data={[40,42,43,45,47,50,52,57].map((v,i)=>({day:i,dose:v}))}><Area dataKey="dose" stroke="#a3eb36" fill="#a3eb36" fillOpacity={.12}/><XAxis dataKey="day" hide/><YAxis hide/></AreaChart></ResponsiveContainer></div></div>
      <div className="panel alerts-panel"><div className="panel-head"><h3>Alerts</h3><span className="toggle">Open　All</span></div>{alerts.map((a,i)=><div className="alert-item"><div><b>{a.title}</b><small> · {a.time}</small><span>{a.status}</span></div><p>{a.desc}</p><small>→ {a.action}</small><div className="alert-actions"><button onClick={()=>updateAlert(i,"Acknowledged")}><Check size={13}/> Acknowledge</button><button onClick={()=>updateAlert(i,"Resolved")}><Check size={13}/> Resolve</button></div></div>)}</div>
      <div className="panel sleep-panel"><div className="panel-head"><div><h3>☾ SLEEP · 7 NIGHTS</h3><p>AVG DURATION</p></div><b>6.6 h avg</b></div><div className="chart short"><ResponsiveContainer width="100%" height="100%"><BarChart data={sleepData}><CartesianGrid stroke="#30213f" vertical={false}/><XAxis dataKey="day" stroke="#827294"/><YAxis stroke="#827294"/><Tooltip contentStyle={{background:"#1a1026",border:"1px solid #46305a"}}/><Bar dataKey="hours" fill="#a98aff" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div><small>Amber bars fall below the 6 h mission guideline.</small></div></div>
      <div className="panel lower-panel"><h3>Mission systems overview</h3><div className="system-chips">{["Cardiovascular","Oxygen","Temperature","Physical","Sleep","Radiation"].map(x=><span>{x}</span>)}</div><div className="lower-grid"><div><h3>Sleep history</h3><p>Average duration 6.6 h · quality 76/100 · 3 short nights</p></div><div><h3>Mission safety</h3><p>Local data storage active · sync queue ready · demo telemetry only</p></div></div></div>
      </div>
    </main>{toast&&<div className="toast">{toast}</div>}
  </div>
}
function Vital({Icon,title,value,unit,sub,color}:any){return <div className={`vital panel ${color}`}><div className="vital-top"><span><Icon size={15}/> {title}</span><b>● IN RANGE</b></div><strong>{value}<i>{unit}</i></strong><small>{sub}</small><div className="sparkline"/></div>}
export default function App(){
  const [dashboard,setDashboard]=useState(false);
  const [session,setSession]=useState<Session|null>(()=>{try{const raw=localStorage.getItem("astrocare.session");return raw?JSON.parse(raw):null}catch{return null}});
  function logout(){localStorage.removeItem("astrocare.session");setSession(null);setDashboard(false)}
  if(session) return <Dashboard session={session} onLogout={logout}/>;
  return dashboard?<AuthGate onAuthenticated={setSession}/>:<Landing onLaunch={()=>setDashboard(true)}/>;
}
