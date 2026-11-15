import { FormEvent, useEffect, useState } from "react";
import { Activity, LockKeyhole, UserPlus, WifiOff } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";
type User = { id: string; name: string; email: string; role: string };
export type Session = { token: string; user: User };

export default function AuthGate({ onAuthenticated }: { onAuthenticated: (session: Session) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cached, setCached] = useState<Session | null>(null);
  useEffect(() => { try { const raw = localStorage.getItem("astrocare.session"); if (raw) setCached(JSON.parse(raw)); } catch { /* ignore corrupt local cache */ } }, []);

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`${API}/api/auth/${mode}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "login" ? { email, password } : { name, email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to authenticate");
      const session: Session = { token: data.token, user: data.user };
      localStorage.setItem("astrocare.session", JSON.stringify(session));
      onAuthenticated(session);
    } catch (err) {
      setError(err instanceof TypeError
        ? "Backend se connection nahi ho pa raha. Backend terminal check karein; dono servers chalu rakhein. Vite proxy /api ko localhost:5000 par bhejta hai."
        : err instanceof Error ? err.message : "Server unavailable. If you have signed in on this device before, you can continue offline.");
    } finally { setBusy(false); }
  }

  return <main className="auth-screen"><div className="auth-stars"/><form className="auth-card" onSubmit={submit}>
    <div className="auth-brand"><span>◉</span><b>ASTROCARE</b></div>
    <div className="auth-kicker"><Activity size={15}/> MISSION CONTROL ACCESS</div>
    <h1>{mode === "login" ? "Welcome back" : "Create engineer account"}</h1>
    <p>Secure workspace for astronaut health monitoring and mission data entry.</p>
    {mode === "register" && <label>Full name<input required minLength={2} value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label>}
    <label>Work email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="engineer@mission.org"/></label>
    <label>Password<input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label>
    {error && <div className="auth-error">{error}</div>}
    <button className="auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in securely" : "Create engineer account"}</button>
    <button type="button" className="auth-switch" onClick={()=>{setMode(mode === "login" ? "register" : "login");setError("")}}>{mode === "login" ? <><UserPlus size={15}/> Create an engineer account</> : "Already registered? Sign in"}</button>
    {cached && <button type="button" className="offline-resume" onClick={()=>onAuthenticated(cached)}><WifiOff size={15}/> Continue with saved session (offline)</button>}
    <small><LockKeyhole size={12}/> New accounts receive the Engineer role. Admin privileges are assigned separately.</small>
  </form></main>;
}
