import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  FileText, Globe, Edit2, Plus, File, Book,
  Bookmark, Rocket, ArrowRight,
  Terminal, Smartphone, Mail, Tag, AlertCircle, Edit, Folder,
  List, Camera, Highlighter, ExternalLink, ChevronDown
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════════════ */
const C = {
  bg: '#000', text: '#F2F0EC', dim: 'rgba(255,255,255,0.5)',
  opinion: '#8E9E5A', bookmark: '#C4A84E', annotation: '#C47A5A',
  template: '#7E6A8C', lookup: '#BF5A6A', visual: '#5A9E8C',
  glass: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)',
};
const NODE_COLORS = [C.opinion, C.template, C.annotation, C.bookmark, C.lookup, C.visual];

/* ═══════════════════════════════════════════════════
   3D GRAPH ENGINE
   Procedural node generation + perspective projection
   ═══════════════════════════════════════════════════ */
function createGraph(count) {
  const nodes = [];
  const edges = [];
  for (let i = 0; i < count; i++) {
    nodes.push({
      x: (Math.random() - 0.5) * 600,
      y: (Math.random() - 0.5) * 600,
      z: (Math.random() - 0.5) * 600,
      r: 2 + Math.random() * 3,
      color: NODE_COLORS[i % 6],
    });
  }
  // Connect each node to 1-3 nearby neighbors
  for (let i = 0; i < count; i++) {
    const links = 1 + Math.floor(Math.random() * 2);
    for (let l = 0; l < links; l++) {
      const j = (i + 1 + Math.floor(Math.random() * 8)) % count;
      if (j !== i) edges.push([i, j]);
    }
  }
  return { nodes, edges };
}

function project(x, y, z, cx, cy, cz, rx, ry, w, h) {
  // Translate by camera
  let dx = x - cx, dy = y - cy, dz = z - cz;
  // Rotate Y
  const cosY = Math.cos(ry), sinY = Math.sin(ry);
  const tx = dx * cosY - dz * sinY;
  const tz = dx * sinY + dz * cosY;
  dx = tx; dz = tz;
  // Rotate X
  const cosX = Math.cos(rx), sinX = Math.sin(rx);
  const ty = dy * cosX - dz * sinX;
  const tz2 = dy * sinX + dz * cosX;
  dy = ty; dz = tz2;
  // Perspective
  const fov = 500;
  const scale = fov / (fov + dz);
  if (scale <= 0 || dz < -fov * 0.95) return null;
  return {
    sx: w / 2 + dx * scale,
    sy: h / 2 + dy * scale,
    scale,
    depth: dz,
  };
}

/* ═══════════════════════════════════════════════════
   PANEL DEFINITIONS
   Each panel teaches a concept from the old tutorial.
   Copy is written to avoid AI writing tropes:
   no em dashes, no "delve/pivotal/robust/showcase",
   no rule-of-three, no "serves as" circumlocutions.
   ═══════════════════════════════════════════════════ */
const PANELS = [
  { id: 'hero', cue: [0, 0.06, 0.09, 0.13] },
  { id: 'plus', cue: [0.14, 0.18, 0.21, 0.25] },
  { id: 'resource', cue: [0.26, 0.30, 0.33, 0.37] },
  { id: 'opinion', cue: [0.38, 0.42, 0.45, 0.49] },
  { id: 'topic', cue: [0.50, 0.54, 0.57, 0.61] },
  { id: 'reader', cue: [0.62, 0.66, 0.69, 0.73] },
  { id: 'entries', cue: [0.74, 0.78, 0.81, 0.85] },
  { id: 'explore', cue: [0.86, 0.90, 0.94, 1.0] },
];

/* ─── Shared Panel Card ─── */
const Card = ({ children, style }) => (
  <div style={{
    background: C.glass, border: `1px solid ${C.border}`,
    borderRadius: 16, padding: 20, backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)', ...style,
  }}>
    {children}
  </div>
);

const Label = ({ children, color }) => (
  <div style={{
    fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
    textTransform: 'uppercase', color: color || C.dim,
    marginBottom: 10, fontFamily: 'monospace',
  }}>
    {children}
  </div>
);

const Pill = ({ children, bg, color }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '4px 12px', borderRadius: 999, fontSize: 13,
    background: bg || 'rgba(90,158,140,0.15)',
    color: color || C.visual, border: `1px solid ${C.border}`,
  }}>
    {children}
  </span>
);

/* ─── Individual Panel Content ─── */
function HeroPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
      <img
        src="https://raw.githubusercontent.com/saad-ibra/gray-matter/main/core/designsystem/src/main/res/drawable/app_logo_full.png"
        alt="Relatrix" style={{ width: 64, height: 64, borderRadius: 14 }}
      />
      <Label color={C.opinion}>Relatrix</Label>
      <h1 style={{ fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 700, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.1, maxWidth: 440 }}>
        Your personal knowledge base
      </h1>
      <p style={{ color: C.dim, fontSize: 'clamp(14px, 3vw, 16px)', maxWidth: 380, lineHeight: 1.6, margin: 0 }}>
        Capture thoughts, annotate documents, and connect your ideas into a living, spatial graph.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
        <a href="https://github.com/saad-ibra/gray-matter" target="_blank" rel="noreferrer"
          style={{ padding: '10px 20px', borderRadius: 6, background: C.opinion, color: '#000', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Terminal size={14} /> View Source
        </a>
        <a href="https://f-droid.org/packages/com.saadibra.graymatter" target="_blank" rel="noreferrer"
          style={{ padding: '10px 20px', borderRadius: 6, background: 'transparent', border: `1px solid ${C.border}`, color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Smartphone size={14} /> Get on F-Droid
        </a>
      </div>
    </div>
  );
}

function PlusPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: C.glass, border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Plus size={36} color="#fff" strokeWidth={1.5} />
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>This is how everything starts</h2>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.6, maxWidth: 320, margin: 0 }}>
        Tap the + button inside the app to create your first piece of knowledge.
      </p>
    </div>
  );
}

function ResourcePanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
      <Label>Step 1</Label>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Add a resource</h2>
      <p style={{ color: C.dim, fontSize: 14, margin: 0 }}>Pick what you want to capture.</p>
      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 360, marginTop: 4 }}>
        {[
          { id: 'File', icon: File, sub: 'PDF, doc, image' },
          { id: 'Link', icon: Globe, sub: 'URL or webpage' },
          { id: 'Note', icon: Edit2, sub: 'Write from scratch' },
        ].map((r, i) => (
          <Card key={r.id} style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, border: i === 1 ? `1px solid ${C.opinion}` : `1px solid ${C.border}` }}>
            <r.icon size={20} color={i === 1 ? '#fff' : C.dim} strokeWidth={1.5} />
            <span style={{ fontSize: 13, fontWeight: 600, color: i === 1 ? '#fff' : C.dim }}>{r.id}</span>
            <span style={{ fontSize: 10, color: C.dim }}>{r.sub}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}

function OpinionPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
      <Label color={C.opinion}>Step 2</Label>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Capture your opinion</h2>
      <p style={{ color: C.dim, fontSize: 14, margin: 0, maxWidth: 340 }}>
        Every resource gets your take on it. Write what you think, then rate how sure you are.
      </p>
      <Card style={{ width: '100%', maxWidth: 360, textAlign: 'left', marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(142,158,90,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Edit size={13} color={C.opinion} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.opinion, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace' }}>Opinion</span>
        </div>
        <div style={{ fontSize: 15, marginBottom: 12, lineHeight: 1.4, color: C.text }}>"This changes how I think about knowledge management."</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ width: '78%', height: '100%', background: C.opinion, borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 11, color: C.dim, fontFamily: 'monospace' }}>78%</span>
        </div>
      </Card>
    </div>
  );
}

function TopicPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
      <Label>Step 3</Label>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Organize into topics</h2>
      <p style={{ color: C.dim, fontSize: 14, margin: 0 }}>Topics are folders for your resources.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 360, marginTop: 4 }}>
        {['Philosophy', 'Science', 'My Notes'].map((name, i) => (
          <Card key={name} style={{
            padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
            border: i === 1 ? `1px solid ${C.bookmark}` : `1px solid ${C.border}`,
          }}>
            <Folder size={18} color="#EAB308" strokeWidth={1.5} />
            <span style={{ fontSize: 14, fontWeight: 600, color: i === 1 ? '#fff' : C.dim }}>{name}</span>
            {i === 1 && <span style={{ fontSize: 11, color: C.dim, marginLeft: 'auto' }}>3 resources</span>}
          </Card>
        ))}
      </div>
    </div>
  );
}

function ReaderPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
      <Label>Built-in reader</Label>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Read and annotate inline</h2>
      <p style={{ color: C.dim, fontSize: 14, margin: 0 }}>A PDF reader with six types of entries baked in.</p>
      <Card style={{ width: '100%', maxWidth: 360, padding: 0, overflow: 'hidden', marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#28c840' }} />
          </div>
          <div style={{ flex: 1, fontSize: 10, color: C.dim, textAlign: 'center', fontFamily: 'monospace' }}>research_paper.pdf</div>
        </div>
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1, padding: '12px 12px 16px' }}>
            <div style={{ width: '75%', height: 7, background: 'rgba(255,255,255,0.18)', borderRadius: 2, marginBottom: 10 }} />
            {[100, 92, 88, 70].map((w, i) => (
              <div key={i} style={{ width: `${w}%`, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 1, marginBottom: 5 }} />
            ))}
            <div style={{ position: 'relative', marginBottom: 5 }}>
              <div style={{ width: '68%', height: 4, background: `${C.annotation}40`, borderRadius: 1 }} />
              <div style={{ position: 'absolute', left: '72%', top: -8, padding: '2px 5px', borderRadius: 3, background: C.annotation, fontSize: 7, color: '#000', fontWeight: 600 }}>Annotation</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Bookmark size={8} color={C.bookmark} fill={C.bookmark} />
              <div style={{ width: '80%', height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 1 }} />
            </div>
          </div>
          <div style={{ width: 36, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: 6 }}>
            {[
              { icon: Edit2, c: C.opinion }, { icon: Highlighter, c: C.annotation },
              { icon: Bookmark, c: C.bookmark }, { icon: Camera, c: C.visual },
            ].map((t, i) => (
              <div key={i} style={{ width: 20, height: 20, borderRadius: 4, background: C.glass, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <t.icon size={10} color={t.c} />
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function EntriesPanel() {
  const types = [
    { name: 'Opinions', icon: Edit2, color: C.opinion, desc: 'Your thoughts and reactions' },
    { name: 'Annotations', icon: Highlighter, color: C.annotation, desc: 'Highlighted passages' },
    { name: 'Bookmarks', icon: Bookmark, color: C.bookmark, desc: 'Save your place' },
    { name: 'Templates', icon: List, color: C.template, desc: 'Structured forms' },
    { name: 'Lookups', icon: Book, color: C.lookup, desc: 'Define terms' },
    { name: 'Vision', icon: Camera, color: C.visual, desc: 'Capture from camera' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
      <Label>6 entry types</Label>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Six ways to capture knowledge</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%', maxWidth: 360, marginTop: 4 }}>
        {types.map(t => {
          const I = t.icon;
          return (
            <Card key={t.name} style={{ padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <I size={18} color={t.color} strokeWidth={1.5} />
              <span style={{ fontSize: 10, fontWeight: 600, color: t.color }}>{t.name}</span>
            </Card>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
        <Pill bg="rgba(142,158,90,0.12)" color={C.opinion}><Tag size={10} /> important</Pill>
        <Pill bg="rgba(126,106,140,0.12)" color={C.template}><Tag size={10} /> review</Pill>
        <Pill bg="rgba(196,168,78,0.12)" color={C.bookmark}><Tag size={10} /> revision</Pill>
      </div>
    </div>
  );
}

function ExplorePanel() {
  const links = [
    { href: 'https://github.com/saad-ibra/gray-matter', icon: Terminal, label: 'GitHub' },
    { href: 'https://f-droid.org/packages/com.saadibra.graymatter', icon: Smartphone, label: 'F-Droid' },
    { href: 'https://github.com/saad-ibra/gray-matter/releases', icon: Tag, label: 'Releases' },
    { href: 'https://github.com/saad-ibra/gray-matter/issues', icon: AlertCircle, label: 'Issues' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
      <Rocket size={40} color={C.opinion} strokeWidth={1.5} />
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Start building</h2>
      <p style={{ color: C.dim, fontSize: 14, margin: 0, lineHeight: 1.6 }}>Open source. Privacy-first. Available on F-Droid.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', maxWidth: 360, marginTop: 4 }}>
        {links.map(l => {
          const I = l.icon;
          return (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer"
              style={{
                padding: '12px 14px', background: C.glass, border: `1px solid ${C.border}`,
                borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
                color: '#fff', textDecoration: 'none', fontSize: 13,
              }}>
              <I size={15} /> {l.label} <ExternalLink size={10} style={{ marginLeft: 'auto', opacity: 0.3 }} />
            </a>
          );
        })}
      </div>
      <a href="https://saadibra.mooo.com/contact/"
        style={{
          padding: '12px 14px', background: C.glass, border: `1px solid ${C.border}`,
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          color: '#fff', textDecoration: 'none', fontSize: 13, width: '100%', maxWidth: 360,
        }}>
        <Mail size={15} /> Contact the developer
      </a>
    </div>
  );
}

const PANEL_COMPONENTS = [HeroPanel, PlusPanel, ResourcePanel, OpinionPanel, TopicPanel, ReaderPanel, EntriesPanel, ExplorePanel];

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function RelatrixApp() {
  const canvasRef = useRef(null);
  const meterRef = useRef(null);
  const panelRefs = useRef([]);
  const graphRef = useRef(null);
  const stateRef = useRef({ seekTo: 0, seekAt: 0, progress: 0 });
  const rafRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile + reduced motion
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Build graph once
  useEffect(() => {
    const count = window.innerWidth < 768 ? 40 : 70;
    graphRef.current = createGraph(count);
  }, []);

  // Smoothstep helper
  const ramp = useCallback((t, a, b) => {
    if (t <= a) return 0;
    if (t >= b) return 1;
    const x = (t - a) / (b - a);
    return x * x * (3 - 2 * x);
  }, []);

  // Paint panels
  const paint = useCallback((progress) => {
    for (let i = 0; i < PANELS.length; i++) {
      const el = panelRefs.current[i];
      if (!el) continue;
      const [fis, fie, fos, foe] = PANELS[i].cue;
      const enter = ramp(progress, fis, fie);
      const leave = 1 - ramp(progress, fos, foe);
      const opacity = Math.min(enter, leave);
      const drift = (1 - opacity) * 18;
      el.style.opacity = opacity;
      el.style.transform = `translateY(${drift}px)`;
      el.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
    }
  }, [ramp]);

  // Draw 3D graph
  const drawGraph = useCallback((seekAt, canvas) => {
    if (!canvas || !graphRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR for perf
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }
    ctx.clearRect(0, 0, w, h);

    const { nodes, edges } = graphRef.current;

    // Camera travels along Z, slight orbit
    const cz = -400 + seekAt * 800;
    const cx = Math.sin(seekAt * 1.5) * 80;
    const cy = Math.cos(seekAt * 1.2) * 60;
    const rx = Math.sin(seekAt * 0.8) * 0.15;
    const ry = seekAt * 1.2;

    // Project all nodes
    const projected = nodes.map(n => project(n.x, n.y, n.z, cx, cy, cz, rx, ry, w, h));

    // Draw edges
    for (const [a, b] of edges) {
      const pa = projected[a], pb = projected[b];
      if (!pa || !pb) continue;
      const alpha = Math.min(pa.scale, pb.scale) * 0.12;
      if (alpha < 0.01) continue;
      ctx.beginPath();
      ctx.moveTo(pa.sx, pa.sy);
      ctx.lineTo(pb.sx, pb.sy);
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw nodes sorted by depth (back to front)
    const sorted = projected.map((p, i) => ({ p, i })).filter(o => o.p).sort((a, b) => b.p.depth - a.p.depth);
    for (const { p, i } of sorted) {
      const n = nodes[i];
      const r = n.r * p.scale;
      if (r < 0.3) continue;
      const alpha = Math.min(p.scale * 0.8, 1);

      // Glow
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, r * 3, 0, Math.PI * 2);
      ctx.fillStyle = n.color.replace(')', `,${alpha * 0.08})`).replace('rgb', 'rgba');
      ctx.fill();

      // Dot
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
      ctx.fillStyle = n.color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
      // For hex colors, convert
      const hexToRgba = (hex, a) => {
        const rr = parseInt(hex.slice(1, 3), 16);
        const gg = parseInt(hex.slice(3, 5), 16);
        const bb = parseInt(hex.slice(5, 7), 16);
        return `rgba(${rr},${gg},${bb},${a})`;
      };
      ctx.fillStyle = hexToRgba(n.color, alpha);
      ctx.fill();

      // Also draw glow properly
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, r * 3, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(n.color, alpha * 0.06);
      ctx.fill();
    }
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const readScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const raw = max > 0 ? window.pageYOffset / max : 0;
      stateRef.current.progress = Math.max(0, Math.min(1, raw));
      stateRef.current.seekTo = stateRef.current.progress;
    };

    const frame = () => {
      readScroll();
      const s = stateRef.current;

      // Update meter
      if (meterRef.current) {
        meterRef.current.style.transform = `scaleX(${s.progress})`;
      }

      // Ease camera
      const gap = s.seekTo - s.seekAt;
      if (Math.abs(gap) > 0.0008) {
        s.seekAt += gap * 0.115;
      }

      // Draw graph (skip on reduced motion)
      if (!reducedMotion) {
        drawGraph(s.seekAt, canvas);
      }

      // Paint panels
      paint(s.progress);

      rafRef.current = requestAnimationFrame(frame);
    };

    window.addEventListener('scroll', readScroll, { passive: true });
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('scroll', readScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [drawGraph, paint]);

  // Handle resize for canvas
  useEffect(() => {
    const onResize = () => {
      // Graph node count changes on resize across breakpoint
      const count = window.innerWidth < 768 ? 40 : 70;
      if (graphRef.current && graphRef.current.nodes.length !== count) {
        graphRef.current = createGraph(count);
      }
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: auto; }
        .rltx-track { height: 560vh; position: relative; }
        .rltx-stage { position: fixed; inset: 0; z-index: 0; overflow: hidden; background: #000; }
        .rltx-stage canvas { width: 100%; height: 100%; display: block; }
        .rltx-veil {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%);
        }
        .rltx-grain {
          position: absolute; inset: 0; pointer-events: none; opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 128px 128px;
        }
        .rltx-chrome {
          position: fixed; top: 0; left: 0; right: 0; z-index: 40;
          display: flex; justify-content: center;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        }
        .rltx-meter {
          position: fixed; top: 0; left: 0; z-index: 50;
          height: 2px; width: 100%;
          transform: scaleX(0); transform-origin: 0 50%;
          background: ${C.opinion};
          will-change: transform;
        }
        .rltx-panels {
          position: fixed; inset: 0; z-index: 20;
          pointer-events: none;
          display: flex; align-items: center; justify-content: center;
        }
        .rltx-panel {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          padding: 80px 20px 40px;
          opacity: 0; will-change: opacity, transform;
          pointer-events: none;
        }
        .rltx-panel-inner {
          width: 100%; max-width: 480px;
        }
        @media (max-width: 480px) {
          .rltx-panel { padding: 70px 16px 24px; }
        }
      `}</style>

      {/* Scroll track (only element with height) */}
      <div className="rltx-track">

        {/* Fixed 3D graph background */}
        <div className="rltx-stage">
          <canvas ref={canvasRef} id="graph-canvas" />
          <div className="rltx-veil" />
          <div className="rltx-grain" />
        </div>

        {/* Scroll meter */}
        <i className="rltx-meter" ref={meterRef} />

        {/* Chrome header */}
        <header className="rltx-chrome">
          <div style={{ width: '100%', maxWidth: 560, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img
                src="https://raw.githubusercontent.com/saad-ibra/gray-matter/main/core/designsystem/src/main/res/drawable/app_logo_full.png"
                alt="Relatrix" style={{ width: 22, height: 22, borderRadius: 5 }}
              />
              <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>Relatrix</span>
            </div>
            <a href="https://github.com/saad-ibra/gray-matter" target="_blank" rel="noreferrer"
              style={{ color: C.dim, textDecoration: 'none', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Terminal size={13} /> GitHub
            </a>
          </div>
        </header>

        {/* Panel layer */}
        <main className="rltx-panels">
          {PANELS.map((p, i) => {
            const PanelContent = PANEL_COMPONENTS[i];
            return (
              <section
                key={p.id}
                className="rltx-panel"
                ref={el => panelRefs.current[i] = el}
              >
                <div className="rltx-panel-inner">
                  <PanelContent />
                </div>
              </section>
            );
          })}
        </main>

      </div>

      {/* Footer (after the scroll track, at the very bottom) */}
      <footer style={{
        borderTop: `1px solid rgba(255,255,255,0.08)`, padding: '24px 20px',
        display: 'flex', justifyContent: 'center', background: '#000', position: 'relative', zIndex: 30,
      }}>
        <div style={{
          width: '100%', maxWidth: 560,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 12, color: C.dim,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img
              src="https://raw.githubusercontent.com/saad-ibra/gray-matter/main/core/designsystem/src/main/res/drawable/app_logo_full.png"
              alt="" style={{ width: 13, height: 13, borderRadius: 3, opacity: 0.5 }}
            />
            Relatrix · by Saad Ibra
          </div>
          <a href="/" style={{ color: C.dim, textDecoration: 'none' }}>saadibra.mooo.com</a>
        </div>
      </footer>
    </div>
  );
}
