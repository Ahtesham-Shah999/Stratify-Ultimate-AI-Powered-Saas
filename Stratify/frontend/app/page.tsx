"use client";
import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { useRouter } from "next/navigation";

const BRAND = "#E8112D";
const GOLD = "#C9A84C";

// --- Utility Functions --- //
function generateCandles(count: number) {
  const candles = [];
  let price = 160;
  for (let i = 0; i < count; i++) {
    const open = price + (Math.random() - 0.5) * 3;
    const change = (Math.random() - 0.5) * 6;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;
    candles.push({ open, close, high, low });
    price = close;
  }
  return candles;
}

const generatePath = (count: number) => {
  const points = [];
  let price = 160;
  for (let i = 0; i < count; i++) {
    const open = price + (Math.random() - 0.5) * 3;
    const change = (Math.random() - 0.44) * 14;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;
    points.push({ open, close, high, low });
    price = close;
  }
  return points;
}

function useIntersection<T extends HTMLElement>(ref: React.RefObject<T>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]); // Added ref to dependency array for correctness
  return visible;
}

function AnimatedCounter({ end, suffix = "", duration = 2000 }: { end: number, suffix?: string, duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useIntersection(ref);
  useEffect(() => {
    if (!visible) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(ease * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, end, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

const tickers = [
  { s: "AAPL", p: "189.43", c: "+2.14%", up: true },
  { s: "TSLA", p: "248.91", c: "+4.32%", up: true },
  { s: "NVDA", p: "876.23", c: "+1.87%", up: true },
  { s: "SPY",  p: "519.40", c: "+0.43%", up: true },
  { s: "BTC",  p: "67,421", c: "+3.21%", up: true },
  { s: "MSFT", p: "412.67", c: "-0.82%", up: false },
  { s: "AMZN", p: "183.29", c: "+1.56%", up: true },
  { s: "GOOGL",p: "177.84", c: "+0.91%", up: true },
  { s: "META", p: "521.13", c: "+2.43%", up: true },
  { s: "ETH",  p: "3,284",  c: "-1.12%", up: false },
  { s: "NFLX", p: "641.20", c: "+3.78%", up: true },
  { s: "JPM",  p: "198.44", c: "-0.55%", up: false },
];

const features = [
  { icon: "📈", title: "Advanced Backtesting", desc: "Test strategies against decades of tick-level data. Walk-forward analysis, Monte Carlo simulation, and full drawdown metrics — all in seconds.", tag: "Performance" },
  { icon: "🤖", title: "AI Strategy Builder", desc: "Describe your thesis in plain English. Our models translate your intent into executable logic, backtested and risk-adjusted automatically.", tag: "Intelligence" },
  { icon: "🌐", title: "Community Feed", desc: "Share alpha, discover top strategies, and collaborate with thousands of quantitative traders building the future of markets.", tag: "Community" },
  { icon: "⚡", title: "Live Execution", desc: "Connect your brokerage and go live with one click. Ultra-low latency order routing with real-time P&L monitoring.", tag: "Execution" },
  { icon: "🔒", title: "Risk Manager", desc: "Dynamic position sizing, automated stop-loss, and portfolio-level exposure controls keep your capital protected 24/7.", tag: "Protection" },
  { icon: "📊", title: "Market Scanner", desc: "Scan thousands of instruments in real-time using custom screens built from 200+ technical and fundamental indicators.", tag: "Discovery" },
];

const team = [
  { name: "Marcus Chen", role: "CEO & Co-Founder", img: "MC", desc: "Former Head of Quant at Goldman Sachs. 15 years building systematic trading infrastructure at scale." },
  { name: "Priya Nair", role: "CTO & Co-Founder", img: "PN", desc: "Ex-Google Brain engineer. Led the ML architecture powering algorithmic strategies across $2B in AUM." },
  { name: "James Holden", role: "Head of Product", img: "JH", desc: "Built trading tools at Citadel and Jane Street. Obsessed with making institutional-grade tools accessible to all." },
];

const stats = [
  { label: "Strategies Backtested", val: 2847391, suffix: "" },
  { label: "Active Traders", val: 124000, suffix: "+" },
  { label: "Capital Protected", val: 4200000000, suffix: "+" },
  { label: "Avg. Return Improvement", val: 34, suffix: "%" },
];

export default function StratifyLanding() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sticky, setSticky] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("userData");
      setIsAuthenticated(!!userData);
    }
  }, []);

  const heroRef = useRef<HTMLElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const featRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);
  
  const aboutVis = useIntersection(aboutRef);
  const featVis = useIntersection(featRef);
  const statsVis = useIntersection(statsRef);
  const ctaVis = useIntersection(ctaRef);

  useEffect(() => {
    const h = () => setSticky(window.scrollY > 60);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  // Three.js Setup
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080808, 0.018);
    scene.background = new THREE.Color(0x080808);

    const w = el.clientWidth, h = el.clientHeight;
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 500);
    camera.position.set(2, 6, 22);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas: el, antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Lights
    scene.add(new THREE.AmbientLight(0x111122, 1.5));
    const redPt = new THREE.PointLight(0xe8112d, 6, 40);
    redPt.position.set(-12, 12, 8); scene.add(redPt);
    const goldPt = new THREE.PointLight(0xc9a84c, 3, 35);
    goldPt.position.set(14, 4, 6); scene.add(goldPt);
    const blueAcc = new THREE.PointLight(0x2244ff, 2, 30);
    blueAcc.position.set(0, -5, 15); scene.add(blueAcc);

    // Floor grid
    const gridGeo = new THREE.PlaneGeometry(100, 100, 40, 40);
    const gridMat = new THREE.MeshBasicMaterial({ color: 0x111111, wireframe: true, transparent: true, opacity: 0.3 });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = -6;
    scene.add(grid);

    // Candlesticks
    const candles = generateCandles(28);
    const allP = candles.flatMap(c => [c.open, c.close, c.high, c.low]);
    const minP = Math.min(...allP), maxP = Math.max(...allP);
    const norm = (p: number) => ((p - minP) / (maxP - minP)) * 9 - 4.5;

    const group = new THREE.Group();
    const spacing = 1.7;
    const totalW = candles.length * spacing;

    candles.forEach((c, i) => {
      const isGreen = c.close >= c.open;
      const col = isGreen ? 0x00e676 : 0xe8112d;

      const bodyH = Math.max(Math.abs(norm(c.close) - norm(c.open)), 0.12);
      const bodyY = (norm(c.open) + norm(c.close)) / 2;

      const bGeo = new THREE.BoxGeometry(0.85, bodyH, 0.5);
      const bMat = new THREE.MeshPhongMaterial({ color: col, emissive: col, emissiveIntensity: isGreen ? 0.25 : 0.4, shininess: 120, specular: 0x444444 });
      const body = new THREE.Mesh(bGeo, bMat);
      body.position.set(i * spacing - totalW / 2, bodyY, 0);
      body.castShadow = true;
      group.add(body);

      const wickH = Math.max(norm(c.high) - norm(c.low), 0.1);
      const wGeo = new THREE.CylinderGeometry(0.04, 0.04, wickH, 6);
      const wMat = new THREE.MeshPhongMaterial({ color: col, emissive: col, emissiveIntensity: 0.3 });
      const wick = new THREE.Mesh(wGeo, wMat);
      wick.position.set(i * spacing - totalW / 2, (norm(c.high) + norm(c.low)) / 2, 0);
      group.add(wick);
    });

    // Second row in background
    const candles2 = generateCandles(28);
    const all2 = candles2.flatMap(c => [c.open, c.close, c.high, c.low]);
    const min2 = Math.min(...all2), max2 = Math.max(...all2);
    const norm2 = (p: number) => ((p - min2) / (max2 - min2)) * 7 - 4;
    const group2 = new THREE.Group();
    candles2.forEach((c, i) => {
      const col = c.close >= c.open ? 0x00e676 : 0xe8112d;
      const bodyH = Math.max(Math.abs(norm2(c.close) - norm2(c.open)), 0.1);
      const bodyY = (norm2(c.open) + norm2(c.close)) / 2;
      const bGeo = new THREE.BoxGeometry(0.7, bodyH, 0.4);
      const bMat = new THREE.MeshPhongMaterial({ color: col, emissive: col, emissiveIntensity: 0.15, transparent: true, opacity: 0.45, shininess: 80 });
      const body = new THREE.Mesh(bGeo, bMat);
      body.position.set(i * spacing - totalW / 2, bodyY, -6);
      group2.add(body);
    });

    scene.add(group);
    scene.add(group2);

    // Particles
    const pCount = 350;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3]     = (Math.random() - 0.5) * 80;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0xe8112d, size: 0.07, transparent: true, opacity: 0.5 });
    const pts = new THREE.Points(pGeo, pMat);
    scene.add(pts);

    // Glowing orb
    const orbGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const orbMat = new THREE.MeshPhongMaterial({ color: 0xe8112d, emissive: 0xe8112d, emissiveIntensity: 0.8, transparent: true, opacity: 0.15, wireframe: false });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(-16, 4, -5);
    scene.add(orb);

    const orb2Geo = new THREE.SphereGeometry(1.0, 32, 32);
    const orb2Mat = new THREE.MeshPhongMaterial({ color: 0xc9a84c, emissive: 0xc9a84c, emissiveIntensity: 0.6, transparent: true, opacity: 0.12 });
    const orb2 = new THREE.Mesh(orb2Geo, orb2Mat);
    orb2.position.set(18, -2, -8);
    scene.add(orb2);

    let t = 0, animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.015;

      camera.position.x = Math.sin(t * 0.25) * 6 + 2;
      camera.position.y = 6 + Math.sin(t * 0.12) * 2;
      camera.position.z = 22 + Math.cos(t * 0.18) * 2;
      camera.lookAt(0, 0, 0);

      group.children.forEach((m, i) => { m.position.y += Math.sin(t * 1.5 + i * 0.4) * 0.004; });
      group2.children.forEach((m, i) => { m.position.y += Math.sin(t * 1.2 + i * 0.3) * 0.003; });

      pts.rotation.y = t * 0.04;
      pts.rotation.x = Math.sin(t * 0.05) * 0.1;

      redPt.position.x = Math.sin(t * 0.8) * 16;
      redPt.position.z = Math.cos(t * 0.6) * 12;
      goldPt.position.x = Math.cos(t * 0.7) * 18;
      goldPt.position.z = Math.sin(t * 0.5) * 10;

      orb.rotation.y = t * 0.3;
      orb.scale.setScalar(1 + Math.sin(t * 1.5) * 0.1);
      orb2.rotation.y = -t * 0.4;
      orb2.scale.setScalar(1 + Math.cos(t * 1.8) * 0.12);

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!el) return;
      const nw = el.clientWidth, nh = el.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#080808", color: "#fff", overflowX: "hidden", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

        *{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-track{background:#080808;}
        ::-webkit-scrollbar-thumb{background:#E8112D;border-radius:2px;}

        @keyframes ticker{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
        .ticker{animation:ticker 45s linear infinite;}
        .ticker:hover{animation-play-state:paused;}

        @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-16px);}}
        @keyframes float2{0%,100%{transform:translateY(0) rotate(0deg);}50%{transform:translateY(-12px) rotate(3deg);}}
        .float{animation:float 7s ease-in-out infinite;}
        .float2{animation:float2 9s ease-in-out 1.5s infinite;}
        .float3{animation:float 5s ease-in-out 3s infinite;}

        @keyframes pulse-ring{0%{transform:scale(1);opacity:0.6;}100%{transform:scale(1.6);opacity:0;}}
        .pulse::before{content:'';position:absolute;inset:-4px;border-radius:50%;border:2px solid #E8112D;animation:pulse-ring 2s ease-out infinite;}

        @keyframes shimmer{0%{background-position:-400% center;}100%{background-position:400% center;}}
        .shimmer-text{background:linear-gradient(90deg,#fff 0%,#E8112D 30%,#C9A84C 60%,#fff 100%);background-size:300% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}

        @keyframes fadeUp{from{opacity:0;transform:translateY(50px);}to{opacity:1;transform:translateY(0);}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes slideRight{from{opacity:0;transform:translateX(-40px);}to{opacity:1;transform:translateX(0);}}

        .section-hidden{opacity:0;transform:translateY(40px);transition:opacity 0.9s ease,transform 0.9s ease;}
        .section-visible{opacity:1!important;transform:translateY(0)!important;}

        .card-hover{transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.35s ease,border-color 0.35s ease;}
        .card-hover:hover{transform:translateY(-10px) scale(1.02);box-shadow:0 30px 80px rgba(232,17,45,0.18);border-color:rgba(232,17,45,0.4)!important;}

        .btn-primary{background:linear-gradient(135deg,#E8112D,#b00020);color:#fff;font-weight:700;padding:16px 36px;border-radius:14px;border:none;cursor:pointer;font-size:1rem;font-family:inherit;position:relative;overflow:hidden;transition:all 0.3s ease;box-shadow:0 0 40px rgba(232,17,45,0.35);}
        .btn-primary::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.1),transparent);opacity:0;transition:opacity 0.3s;}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 50px rgba(232,17,45,0.5);}
        .btn-primary:hover::after{opacity:1;}
        .btn-primary:active{transform:scale(0.97);}

        .btn-ghost{background:transparent;color:#fff;font-weight:600;padding:16px 36px;border-radius:14px;border:1px solid rgba(255,255,255,0.15);cursor:pointer;font-size:1rem;font-family:inherit;transition:all 0.3s ease;backdrop-filter:blur(10px);}
        .btn-ghost:hover{border-color:rgba(232,17,45,0.6);background:rgba(232,17,45,0.06);transform:translateY(-2px);}

        .nav-link{color:rgba(255,255,255,0.7);text-decoration:none;font-weight:500;font-size:0.9rem;transition:color 0.2s;padding:6px 12px;border-radius:8px;}
        .nav-link:hover{color:#fff;background:rgba(255,255,255,0.06);}

        .glass{background:rgba(255,255,255,0.03);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.07);}

        .gradient-border{position:relative;}
        .gradient-border::before{content:'';position:absolute;inset:-1px;border-radius:inherit;background:linear-gradient(135deg,rgba(232,17,45,0.5),rgba(201,168,76,0.3),rgba(232,17,45,0.1));z-index:-1;}

        @keyframes glow-pulse{0%,100%{opacity:0.4;}50%{opacity:1;}}
        .glow-dot{animation:glow-pulse 2s ease-in-out infinite;}

        .team-card:hover .team-avatar{transform:scale(1.08);box-shadow:0 0 30px rgba(232,17,45,0.4);}
        .team-avatar{transition:transform 0.3s ease,box-shadow 0.3s ease;}

        @keyframes orbit{from{transform:rotate(0deg) translateX(30px) rotate(0deg);}to{transform:rotate(360deg) translateX(30px) rotate(-360deg);}}
        .orbit{animation:orbit 12s linear infinite;}
        .orbit2{animation:orbit 8s linear infinite reverse;}

        @keyframes lineGrow{from{width:0;}to{width:100%;}}
        .line-grow{animation:lineGrow 1.5s ease forwards;}
      `}</style>

      {/* Ticker Tape */}
      <div style={{ background: "#0d0d0d", borderBottom: "1px solid rgba(255,255,255,0.04)", overflow: "hidden", padding: "10px 0", position: "relative", zIndex: 100 }}>
        <div className="ticker" style={{ display: "flex", gap: "48px", whiteSpace: "nowrap", width: "max-content" }}>
          {[...tickers, ...tickers, ...tickers, ...tickers].map((t, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.05em" }}>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>{t.s}</span>
              <span style={{ color: "#fff" }}>${t.p}</span>
              <span style={{ color: t.up ? "#00e676" : "#E8112D", fontSize: "0.72rem" }}>{t.c}</span>
              <span style={{ color: "rgba(255,255,255,0.1)", fontSize: "0.7rem" }}>|</span>
            </span>
          ))}
        </div>
      </div>

      {/* HEADER */}
      <header style={{
        position: "sticky", top: 0, zIndex: 99,
        background: sticky ? "rgba(8,8,8,0.92)" : "transparent",
        backdropFilter: sticky ? "blur(24px)" : "none",
        borderBottom: sticky ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        transition: "all 0.4s ease",
        padding: "0 max(24px, calc(50vw - 680px))",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "68px" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", background: "linear-gradient(135deg,#E8112D,#8B0000)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", boxShadow: "0 0 20px rgba(232,17,45,0.4)" }}>📈</div>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.7rem", letterSpacing: "0.05em", color: "#fff" }}>STRATIFY</span>
          </div>

          {/* Nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {["Platform", "About", "Community", "Pricing", "Blog"].map(n => (
              <a key={n} href={`#${n.toLowerCase()}`} className="nav-link">{n}</a>
            ))}
          </nav>

          {/* Auth */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {isAuthenticated ? (
              <button 
                onClick={() => router.push("/Dashboard")}
                className="btn-primary" 
                style={{ padding: "10px 24px", borderRadius: "10px", fontSize: "0.9rem" }}
              >
                Go to Dashboard →
              </button>
            ) : (
              <>
                <button 
                  onClick={() => router.push("/login")}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem", padding: "8px 16px", borderRadius: "10px", transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color="#fff"} 
                  onMouseLeave={e => e.currentTarget.style.color="rgba(255,255,255,0.7)"}
                >
                  Log in
                </button>
                <button 
                  onClick={() => router.push("/login")}
                  className="btn-primary" 
                  style={{ padding: "10px 24px", borderRadius: "10px", fontSize: "0.9rem" }}
                >
                  Start Free →
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section ref={heroRef} style={{ position: "relative", height: "92vh", minHeight: "620px", overflow: "hidden" }}>
        {/* Three.js Canvas */}
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.9 }} />

        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,8,8,0.15) 0%, rgba(8,8,8,0.3) 50%, rgba(8,8,8,0.95) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 60% 50%, transparent 30%, rgba(8,8,8,0.6) 80%)" }} />

        {/* Left radial glow */}
        <div style={{ position: "absolute", top: "20%", left: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(232,17,45,0.12) 0%, transparent 65%)", borderRadius: "50%", pointerEvents: "none" }} className="float" />

        {/* Hero Content */}
        <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 max(32px, calc(50vw - 680px))", maxWidth: "1440px" }}>
          <div style={{ maxWidth: "680px" }}>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(232,17,45,0.1)", border: "1px solid rgba(232,17,45,0.3)", borderRadius: "100px", padding: "6px 14px", marginBottom: "28px", animation: "fadeIn 0.6s ease forwards" }}>
              <span className="glow-dot" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#E8112D", display: "inline-block" }} />
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Live Markets — Trading Intelligence Platform</span>
            </div>

            {/* Headline */}
            <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(3.5rem, 7vw, 7rem)", lineHeight: 0.95, letterSpacing: "0.02em", marginBottom: "24px", animation: "fadeUp 0.8s ease 0.2s both" }}>
              <span style={{ display: "block", color: "#fff" }}>TRADE WITH THE</span>
              <span className="shimmer-text" style={{ display: "block" }}>PRECISION OF AI</span>
              <span style={{ display: "block", color: "#fff" }}>& INTUITION</span>
            </h1>

            {/* Subtext */}
            <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: "500px", marginBottom: "40px", animation: "fadeUp 0.8s ease 0.4s both", fontWeight: 300 }}>
              Build, backtest, and deploy institutional-grade strategies in minutes. Stratify brings hedge fund technology directly to every trader.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", animation: "fadeUp 0.8s ease 0.6s both" }}>
              <button 
                onClick={() => router.push(isAuthenticated ? "/Dashboard" : "/login")}
                className="btn-primary" 
                style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}
              >
                {isAuthenticated ? "Go to Dashboard" : "Start Trading Free"} <span style={{ fontSize: "1.1rem" }}>→</span>
              </button>
              <button className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "1rem" }}>
                <span style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>▶</span>
                Watch Demo
              </button>
            </div>

            {/* Social proof */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginTop: "48px", animation: "fadeUp 0.8s ease 0.8s both" }}>
              <div style={{ display: "flex" }}>
                {["A","B","C","D","E"].map((l, i) => (
                  <div key={l} style={{ width: "34px", height: "34px", borderRadius: "50%", background: `hsl(${i * 40},60%,40%)`, border: "2px solid #080808", marginLeft: i > 0 ? "-10px" : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700 }}>{l}</div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>Trusted by 124,000+ traders</div>
                <div style={{ display: "flex", gap: "2px", marginTop: "2px" }}>
                  {[...Array(5)].map((_, i) => <span key={i} style={{ color: GOLD, fontSize: "0.75rem" }}>★</span>)}
                  <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginLeft: "4px" }}>4.9/5 rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating stat cards */}
        <div className="float2" style={{ position: "absolute", right: "6%", top: "22%", zIndex: 10, animation: "fadeUp 1s ease 1s both, float2 9s ease-in-out 2s infinite" }}>
          <div className="glass" style={{ borderRadius: "16px", padding: "18px 22px", minWidth: "180px", border: "1px solid rgba(0,230,118,0.2)" }}>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Portfolio Return</div>
            <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#00e676", letterSpacing: "-0.02em" }}>+34.2%</div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>Last 12 months</div>
          </div>
        </div>

        <div className="float3" style={{ position: "absolute", right: "12%", bottom: "18%", zIndex: 10 }}>
          <div className="glass" style={{ borderRadius: "16px", padding: "16px 20px", minWidth: "200px", border: "1px solid rgba(232,17,45,0.2)" }}>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.07em" }}>AI Backtested</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>2.8M+</span>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>strategies</span>
            </div>
            <div style={{ marginTop: "10px", height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
              <div style={{ height: "100%", width: "78%", background: "linear-gradient(90deg,#E8112D,#C9A84C)", borderRadius: "2px" }} />
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div ref={statsRef} className={`section-hidden ${statsVis ? "section-visible" : ""}`} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)", padding: "0 max(24px, calc(50vw - 680px))" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0" }}>
          {stats.map((s, i) => (
            <div key={i} style={{ padding: "40px 32px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none", textAlign: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "2.8rem", letterSpacing: "0.02em", color: "#fff", lineHeight: 1 }}>
                {statsVis && <AnimatedCounter end={s.val} suffix={s.suffix} />}
              </div>
              <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="platform" ref={featRef} className={`section-hidden ${featVis ? "section-visible" : ""}`} style={{ padding: "120px max(32px, calc(50vw - 680px))" }}>
        <div style={{ textAlign: "center", marginBottom: "80px" }}>
          <div style={{ display: "inline-block", background: "rgba(232,17,45,0.08)", border: "1px solid rgba(232,17,45,0.2)", borderRadius: "100px", padding: "6px 16px", marginBottom: "20px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#E8112D", textTransform: "uppercase", letterSpacing: "0.1em" }}>Platform Features</span>
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.5rem, 5vw, 4.5rem)", letterSpacing: "0.03em", marginBottom: "16px", lineHeight: 1 }}>
            EVERY TOOL YOU NEED<br />
            <span style={{ color: "#E8112D" }}>TO DOMINATE MARKETS</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", maxWidth: "500px", margin: "0 auto", lineHeight: 1.7, fontSize: "1.05rem" }}>
            From idea to execution — Stratify handles the complexity so you can focus on alpha generation.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          {features.map((f, i) => (
            <div key={i} className="card-hover glass" style={{ borderRadius: "20px", padding: "36px 32px", border: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden", animationDelay: `${i * 0.1}s` }}>
              {/* Background accent */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: i % 2 === 0 ? "linear-gradient(90deg,#E8112D,transparent)" : "linear-gradient(90deg,#C9A84C,transparent)", opacity: 0.6 }} />

              <div style={{ display: "inline-flex", background: "rgba(232,17,45,0.08)", border: "1px solid rgba(232,17,45,0.15)", borderRadius: "14px", padding: "12px", fontSize: "1.6rem", marginBottom: "20px" }}>{f.icon}</div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <h3 style={{ fontWeight: 700, fontSize: "1.1rem" }}>{f.title}</h3>
                <span style={{ fontSize: "0.65rem", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", color: GOLD, padding: "3px 10px", borderRadius: "100px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{f.tag}</span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.7, fontSize: "0.9rem" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" ref={aboutRef} className={`section-hidden ${aboutVis ? "section-visible" : ""}`} style={{ padding: "120px max(32px, calc(50vw - 680px))", position: "relative", overflow: "hidden" }}>
        {/* Background glow */}
        <div style={{ position: "absolute", top: "30%", right: "-10%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 65%)", borderRadius: "50%", pointerEvents: "none" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center", marginBottom: "100px" }}>
          {/* Left: Story */}
          <div>
            <div style={{ display: "inline-block", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "100px", padding: "6px 16px", marginBottom: "24px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em" }}>Our Story</span>
            </div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.2rem, 4vw, 3.8rem)", letterSpacing: "0.02em", marginBottom: "24px", lineHeight: 1.05 }}>
              BUILT BY TRADERS,<br />
              <span style={{ color: GOLD }}>FOR TRADERS</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.8, marginBottom: "20px", fontSize: "1rem" }}>
              Stratify was born out of frustration. After years at Goldman Sachs and Google Brain, our founders realized that the most powerful trading infrastructure was locked behind institutional walls — accessible only to the richest 0.1%.
            </p>
            <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.8, marginBottom: "36px", fontSize: "1rem" }}>
              We built Stratify to democratize quantitative finance. Every tool you need — from millisecond-level backtesting to AI-powered strategy generation — designed for individual traders who refuse to be outgunned.
            </p>
            <div style={{ display: "flex", gap: "40px" }}>
              {[{ n: "2019", l: "Founded" }, { n: "$4.2B+", l: "Capital Protected" }, { n: "47+", l: "Countries" }].map((s, i) => (
                <div key={i}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "2rem", color: "#E8112D", letterSpacing: "0.03em" }}>{s.n}</div>
                  <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Values */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { icon: "🎯", title: "Mission-Driven", desc: "We exist to level the playing field between institutional and retail traders — permanently." },
              { icon: "🔬", title: "Science-First", desc: "Every feature is rooted in peer-reviewed research and validated with live market data." },
              { icon: "🤝", title: "Community-Powered", desc: "Our strongest alpha comes from 124,000+ traders collaborating and sharing openly." },
              { icon: "🛡️", title: "Security First", desc: "Bank-grade encryption, SOC2 Type II certified, with multi-layer redundancy across 3 continents." },
            ].map((v, i) => (
              <div key={i} className="glass card-hover" style={{ borderRadius: "16px", padding: "22px 24px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "18px", alignItems: "flex-start" }}>
                <div style={{ fontSize: "1.5rem", lineHeight: 1, flexShrink: 0, marginTop: "2px" }}>{v.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: "4px", fontSize: "0.95rem" }}>{v.title}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", lineHeight: 1.6 }}>{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "2.5rem", letterSpacing: "0.03em", marginBottom: "12px" }}>LEADERSHIP TEAM</h3>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.95rem" }}>World-class talent from the most demanding trading environments on Earth</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          {team.map((m, i) => (
            <div key={i} className="team-card glass card-hover" style={{ borderRadius: "20px", padding: "36px 28px", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "60%", height: "1px", background: "linear-gradient(90deg,transparent,#E8112D,transparent)" }} />
              <div className="team-avatar" style={{ width: "80px", height: "80px", borderRadius: "50%", background: `linear-gradient(135deg, #E8112D, #4a0010)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.8rem", letterSpacing: "0.05em", margin: "0 auto 20px", border: "2px solid rgba(232,17,45,0.3)" }}>{m.img}</div>
              <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "4px" }}>{m.name}</div>
              <div style={{ fontSize: "0.78rem", color: "#E8112D", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>{m.role}</div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", lineHeight: 1.65 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section ref={ctaRef} className={`section-hidden ${ctaVis ? "section-visible" : ""}`} style={{ padding: "80px max(32px, calc(50vw - 680px))", marginBottom: "0" }}>
        <div className="gradient-border" style={{ borderRadius: "28px", padding: "80px 60px", textAlign: "center", position: "relative", overflow: "hidden", background: "rgba(10,10,10,0.8)" }}>
          {/* BG Glow */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "600px", height: "300px", background: "radial-gradient(ellipse, rgba(232,17,45,0.12) 0%, transparent 65%)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-block", background: "rgba(232,17,45,0.1)", border: "1px solid rgba(232,17,45,0.3)", borderRadius: "100px", padding: "6px 16px", marginBottom: "24px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#E8112D", textTransform: "uppercase", letterSpacing: "0.1em" }}>Get Started Today</span>
            </div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.5rem, 5vw, 5rem)", letterSpacing: "0.02em", marginBottom: "20px", lineHeight: 1 }}>
              READY TO TRADE<br />
              <span className="shimmer-text">LIKE AN INSTITUTION?</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "1.05rem", maxWidth: "480px", margin: "0 auto 44px", lineHeight: 1.7 }}>
              Join 124,000 traders already using Stratify to outperform the market. Start free. No credit card required.
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <button 
                onClick={() => router.push(isAuthenticated ? "/Dashboard" : "/login")}
                className="btn-primary" 
                style={{ fontSize: "1.05rem", padding: "18px 44px" }}
              >
                {isAuthenticated ? "Go to Dashboard →" : "Create Free Account →"}
              </button>
              <button className="btn-ghost" style={{ fontSize: "1.05rem", padding: "18px 44px" }}>Book a Demo</button>
            </div>
            <p style={{ marginTop: "24px", fontSize: "0.78rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.04em" }}>NO CREDIT CARD · UNLIMITED BACKTESTS · CANCEL ANYTIME</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "80px max(32px, calc(50vw - 680px)) 48px", marginTop: "80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "60px", marginBottom: "64px" }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div style={{ width: "38px", height: "38px", background: "linear-gradient(135deg,#E8112D,#8B0000)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>📈</div>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.7rem", letterSpacing: "0.05em" }}>STRATIFY</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.88rem", lineHeight: 1.75, maxWidth: "260px", marginBottom: "24px" }}>
              The professional-grade trading intelligence platform trusted by 124,000+ traders across 47 countries.
            </p>
            {/* Socials */}
            <div style={{ display: "flex", gap: "12px" }}>
              {["𝕏", "in", "▶", "💬"].map((s, i) => (
                <div key={i} className="glass" style={{ width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", cursor: "pointer", border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(232,17,45,0.4)"; e.currentTarget.style.background="rgba(232,17,45,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.08)"; e.currentTarget.style.background="transparent"; }}>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            { title: "Platform", links: ["Backtesting", "AI Builder", "Live Trading", "Scanner", "Risk Manager", "API Docs"] },
            { title: "Company", links: ["About Us", "Careers", "Press", "Partners", "Blog", "Contact"] },
            { title: "Community", links: ["Strategy Feed", "Leaderboard", "Discord", "Twitter", "Newsletter", "Events"] },
            { title: "Legal", links: ["Privacy Policy", "Terms of Use", "Cookie Policy", "Security", "Compliance", "GDPR"] },
          ].map((col, i) => (
            <div key={i}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "20px" }}>{col.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {col.links.map(l => (
                  <a key={l} href="#" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none", fontSize: "0.88rem", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color="#fff"} onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color="rgba(255,255,255,0.35)"}>
                    {l}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.2)" }}>
            © 2026 Stratify Technologies Inc. All rights reserved.
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span className="glow-dot" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#00e676", display: "inline-block" }} />
            <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)" }}>All systems operational</span>
          </div>
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.2)" }}>
            Made with precision & obsession 🔴
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Subcomponents --- //

const BuildStepsSection = () => {
  const containerRef = useRef<HTMLElement>(null);
  const isVis = useIntersection(containerRef);

  return (
    <section ref={containerRef} style={{ padding: "120px 5%", background: "#0b0b0b", position: "relative" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", opacity: isVis ? 1 : 0, transform: isVis ? "translateY(0)" : "translateY(40px)", transition: "all 0.8s ease" }}>
        
        <div style={{ textAlign: "center", marginBottom: "80px" }}>
          <div style={{ color: "#E8112D", fontWeight: 700, letterSpacing: "2px", fontSize: "0.85rem", marginBottom: "16px", textTransform: "uppercase" }}>How it works</div>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.02em" }}>Ideas to Alpha in <span style={{ color: "#E8112D" }}>Minutes</span></h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px", position: "relative" }}>
          {/* Connector Line */}
          <div className={isVis ? "line-grow" : ""} style={{ position: "absolute", top: "24px", left: "10%", right: "10%", height: "2px", background: "linear-gradient(90deg, transparent, rgba(232,17,45,0.3), transparent)", zIndex: 0, width: 0 }} />

          {[
            { step: "01", title: "Define", desc: "Use natural language or our drag-and-drop builder to construct your thesis without writing a single line of code." },
            { step: "02", title: "Test", desc: "Run your logic against 20 years of historical data. Analyze drawdowns, win rates, and Monte Carlo risk scenarios." },
            { step: "03", title: "Deploy", desc: "Connect to your broker via secure API. stratify executes your edge 24/7 with zero emotional interference." }
          ].map((s, i) => (
            <div key={i} className="card-hover" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "40px", position: "relative", zIndex: 1, backdropFilter: "blur(10px)" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#E8112D", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, marginBottom: "24px", boxShadow: "0 0 30px rgba(232,17,45,0.4)" }}>
                {s.step}
              </div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "16px" }}>{s.title}</h3>
              <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};