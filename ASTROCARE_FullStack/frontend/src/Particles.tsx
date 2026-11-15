import { useEffect, useRef } from "react";

type Particle = { x:number; y:number; z:number; speed:number; length:number; alpha:number };

export default function Particles() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    let width = 0, height = 0, raf = 0;
    let particles: Particle[] = [];
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = el.clientWidth; height = el.clientHeight;
      el.width = width * dpr; el.height = height * dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const count = Math.max(45, Math.floor(width / 11));
      particles = Array.from({length:count}, () => ({
        x: Math.random()*width, y: Math.random()*height,
        z: .35 + Math.random()*.9, speed: .25 + Math.random()*1.25,
        length: 18 + Math.random()*70, alpha: .12 + Math.random()*.5
      }));
    };
    const draw = () => {
      ctx.clearRect(0,0,width,height);
      for (const p of particles) {
        p.y += p.speed * p.z;
        p.x -= p.speed * .24;
        if (p.y > height + p.length || p.x < -30) {
          p.y = -p.length; p.x = Math.random()*width;
        }
        const g = ctx.createLinearGradient(p.x,p.y-p.length,p.x,p.y);
        g.addColorStop(0,"rgba(173,126,255,0)");
        g.addColorStop(1,`rgba(211,174,255,${p.alpha})`);
        ctx.strokeStyle = g; ctx.lineWidth = .7 + p.z*.65;
        ctx.beginPath(); ctx.moveTo(p.x,p.y-p.length); ctx.lineTo(p.x-3,p.y); ctx.stroke();
        ctx.fillStyle = `rgba(255,194,137,${p.alpha*.45})`;
        ctx.fillRect(p.x-1,p.y-2,2,2);
      }
      raf = requestAnimationFrame(draw);
    };
    resize(); draw();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  },[]);
  return <canvas ref={canvas} className="particles" aria-hidden="true" />;
}
