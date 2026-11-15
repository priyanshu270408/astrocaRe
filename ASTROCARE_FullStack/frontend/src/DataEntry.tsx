import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CloudUpload, Database, WifiOff } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";
type Props = { token: string };
type Reading = { astronautId:string; heartRate:number; spo2:number; temperature:number; systolic:number; diastolic:number; sleepHours:number; sleepQuality:number; radiationDaily:number; radiationCumulative:number; source:string; recordedAt:string; clientRecordId:string };
const QUEUE_KEY = "astrocare.offline.readings";
const blank = (): Reading => ({ astronautId:"ASTRO001", heartRate:72, spo2:98, temperature:36.7, systolic:118, diastolic:76, sleepHours:7, sleepQuality:80, radiationDaily:0.3, radiationCumulative:12, source:"engineer-entry", recordedAt:new Date().toISOString(), clientRecordId:crypto.randomUUID() });

export default function DataEntry({ token }: Props) {
  const [form,setForm] = useState<Reading>(blank);
  const [online,setOnline] = useState(navigator.onLine);
  const [queue,setQueue] = useState<Reading[]>(()=>{try{return JSON.parse(localStorage.getItem(QUEUE_KEY)||"[]")}catch{return []}});
  const [message,setMessage] = useState("");
  const [busy,setBusy] = useState(false);
  const [recent,setRecent] = useState<any[]>([]);
  const pendingCount = queue.length;
  const headers = useMemo(()=>({"Content-Type":"application/json",Authorization:`Bearer ${token}`}),[token]);
  useEffect(()=>{const up=()=>setOnline(true),down=()=>setOnline(false);window.addEventListener("online",up);window.addEventListener("offline",down);return()=>{window.removeEventListener("online",up);window.removeEventListener("offline",down)}},[]);
  useEffect(()=>{if(!online||!queue.length)return;let cancelled=false;(async()=>{try{const r=await fetch(`${API}/api/telemetry/sync`,{method:"POST",headers,body:JSON.stringify({readings:queue})});if(!r.ok)throw new Error("Sync failed");const result=await r.json();if(!cancelled){const failedIds=new Set((result.results||[]).filter((x:any)=>!x.success).map((x:any)=>x.clientRecordId));const left=queue.filter(x=>failedIds.has(x.clientRecordId));setQueue(left);localStorage.setItem(QUEUE_KEY,JSON.stringify(left));setMessage(`${result.synced} offline reading(s) synced. ${result.failed} need attention.`)}}catch{setMessage("Connection returned, but sync could not complete. Your readings remain safely queued in this browser.")}})();return()=>{cancelled=true}},[online]);
  function change(key:keyof Reading,value:string){setForm(old=>({...old,[key]:["astronautId","source","recordedAt","clientRecordId"].includes(key)?value:Number(value)}))}
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setMessage("");const reading={...form,recordedAt:new Date(form.recordedAt).toISOString()};
    if(!online){const next=[...queue,reading];setQueue(next);localStorage.setItem(QUEUE_KEY,JSON.stringify(next));setMessage("Saved offline on this device. It will sync when internet returns.");setForm(blank());setBusy(false);return}
    try{const r=await fetch(`${API}/api/telemetry`,{method:"POST",headers,body:JSON.stringify(reading)});const data=await r.json();if(!r.ok)throw new Error(data.message||"Could not save reading");setRecent(v=>[data,...v].slice(0,5));setMessage("Reading saved. Advisory checks completed and any triggered alerts are now available in Alerts.");setForm(blank())}
    catch(err){const next=[...queue,reading];setQueue(next);localStorage.setItem(QUEUE_KEY,JSON.stringify(next));setMessage(`${err instanceof Error?err.message:"Server unavailable"}. Saved locally for later sync.`)}finally{setBusy(false)}}
  const field=(label:string,key:keyof Reading,min:number,max:number,step="1")=><label className="entry-field">{label}<input type="number" required min={min} max={max} step={step} value={String(form[key])} onChange={e=>change(key,e.target.value)}/></label>;
  return <section className="entry-page"><div className="entry-heading"><div><label>MISSION OPERATIONS / DATA INPUT</label><h1>Enter astronaut health data</h1><p>Record a manual reading for an astronaut. ASTROCARE checks configured advisory rules and creates alerts when a reading crosses a threshold.</p></div><span className={online?"connection-pill":"connection-pill offline"}>{online?"● ONLINE":"● OFFLINE MODE"}</span></div>
    <div className="entry-status-grid"><div><Database/><b>{pendingCount}</b><span>Pending offline readings</span></div><div>{online?<CheckCircle2/>:<WifiOff/>}<b>{online?"Connected":"Local only"}</b><span>{online?"API connection available":"Saved on this device"}</span></div><div><AlertTriangle/><b>Rule-based</b><span>Advisories, not diagnosis</span></div></div>
    <form className="entry-form panel" onSubmit={submit}><div className="panel-head"><div><h3>New telemetry record</h3><p>Enter the values from the astronaut's check or monitoring device.</p></div><span className="demo-badge">ENGINEER INPUT</span></div>
      <label className="entry-field">Astronaut ID<input required value={form.astronautId} onChange={e=>change("astronautId",e.target.value.toUpperCase())} placeholder="ASTRO001"/></label>
      <div className="entry-fields"><div className="entry-section-title">Vital signs</div>{field("Heart rate (bpm)","heartRate",20,250)}{field("Oxygen saturation SpO₂ (%)","spo2",50,100,"0.1")}{field("Body temperature (°C)","temperature",25,45,"0.1")}{field("Systolic pressure (mmHg)","systolic",50,250)}{field("Diastolic pressure (mmHg)","diastolic",30,150)}
      <div className="entry-section-title">Wellness & exposure</div>{field("Sleep duration (hours)","sleepHours",0,24,"0.1")}{field("Sleep quality (%)","sleepQuality",0,100)}{field("Daily radiation dose (mSv)","radiationDaily",0,100,"0.01")}{field("Cumulative radiation dose (mSv)","radiationCumulative",0,10000,"0.01")}</div>
      <div className="entry-actions"><button className="primary-btn" disabled={busy}>{busy?"Saving…":online?"Save reading & run checks":"Save offline reading"}</button><button type="button" className="outline-btn" onClick={()=>setForm(blank())}>Reset form</button></div>
      {message&&<div className="entry-message">{message}</div>}
      <small className="entry-note">Values are validated by the API. Offline records are stored in this browser and synchronized after connectivity returns. Avoid clearing browser data until sync completes.</small>
    </form>
    {recent.length>0&&<div className="panel recent-panel"><h3>Recently submitted</h3>{recent.map((r,i)=><div className="recent-row" key={r._id||i}><b>{r.astronautId}</b><span>HR {r.heartRate} bpm</span><span>SpO₂ {r.spo2}%</span><span>{new Date(r.recordedAt).toLocaleString()}</span></div>)}</div>}
    <div className="entry-advice"><CloudUpload/><div><b>How offline mode works</b><p>Sign in once while connected. If the network drops, data entry continues on this same browser and device. Pending records automatically sync when the connection returns. First-time login and sharing between engineers still require the server.</p></div></div>
  </section>;
}
