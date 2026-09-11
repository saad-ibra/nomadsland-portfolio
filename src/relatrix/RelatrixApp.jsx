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
   3D GRAPH ENGINE (Clusters + Points + Links)
   ═══════════════════════════════════════════════════ */
const FOCAL = 900;
const CAM_BASE = 1300;
const ZSPAN = 2200;
const TRAVEL = ZSPAN * 1.6;

function buildEdgesFromFaces(faces) {
  const seen = {};
  const edges = [];
  for (let f = 0; f < faces.length; f++) {
    const face = faces[f];
    for (let i = 0; i < face.length; i++) {
      const a = face[i], b = face[(i + 1) % face.length];
      const key = Math.min(a, b) + '_' + Math.max(a, b);
      if (!seen[key]) {
        seen[key] = true;
        edges.push([Math.min(a, b), Math.max(a, b)]);
      }
    }
  }
  return edges;
}

const PHI = (1 + Math.sqrt(5)) / 2;
const ICO_VERTS = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]
];
const ICO_FACES = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
];
const ICO_EDGES = buildEdgesFromFaces(ICO_FACES);

const TET_VERTS = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
const TET_FACES = [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]];
const TET_EDGES = buildEdgesFromFaces(TET_FACES);

function rotateY(v, angle) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  return [v[0] * cos - v[2] * sin, v[1], v[0] * sin + v[2] * cos];
}

function projectCluster(x, y, z, rotX, rotY, cx0, cy0) {
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const x1 = x * cosY - z * sinY;
  const z1 = x * sinY + z * cosY;
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const y1 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;
  let depth = z2 + CAM_BASE;
  if (depth < 150) depth = 150;
  const scale = FOCAL / (FOCAL + depth);
  const op = Math.max(0.04, Math.min(1, scale * 1.6 - 0.25));
  return { x: cx0 + x1 * scale, y: cy0 + y1 * scale, scale, depth, op };
}

function createGraph(isMobile) {
  const rand = (min, max) => min + Math.random() * (max - min);

  const clusters = [];
  const numClusters = isMobile ? 5 : 9;
  for (let i = 0; i < numClusters; i++) {
    const isIco = i % 2 === 0;
    clusters.push({
      verts: isIco ? ICO_VERTS : TET_VERTS,
      edges: isIco ? ICO_EDGES : TET_EDGES,
      isIco,
      cx: rand(-950, 950),
      cy: rand(-520, 520),
      cz0: rand(0, ZSPAN),
      scale: isIco ? rand(60, 110) : rand(45, 90),
      spinSpeed: rand(0.05, 0.16) * (Math.random() < 0.5 ? -1 : 1),
      phase: rand(0, Math.PI * 2)
    });
  }

  const points = [];
  const numPoints = isMobile ? 15 : 26;
  for (let i = 0; i < numPoints; i++) {
    points.push({
      x: rand(-1050, 1050),
      y: rand(-620, 620),
      z0: rand(0, ZSPAN),
      r: rand(2, 4.5),
      color: NODE_COLORS[i % 6], // Cycle through Relatrix colors
      _sx: 0, _sy: 0, _scale: 0, _depth: 0, _op: 0
    });
  }

  const links = [];
  const seen = {};
  for (let i = 0; i < points.length; i++) {
    const dists = [];
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const dz = points[i].z0 - points[j].z0;
      dists.push({ j, d: dx * dx + dy * dy + dz * dz });
    }
    dists.sort((a, b) => a.d - b.d);
    for (let k = 0; k < 2 && k < dists.length; k++) {
      const a = Math.min(i, dists[k].j), b = Math.max(i, dists[k].j);
      const key = a + '_' + b;
      if (!seen[key]) {
        seen[key] = true;
        links.push([a, b]);
      }
    }
  }

  return { clusters, points, links };
}

/* ═══════════════════════════════════════════════════
   PANEL DEFINITIONS (Scroll-driven content)
   ═══════════════════════════════════════════════════ */
// Adjusted cues to fit 7 panels now since Explore is moved back to the bottom
const PANELS = [
  { id: 'hero', cue: [0.00, 0.04, 0.07, 0.10] },
  { id: 'plus', cue: [0.10, 0.13, 0.16, 0.19] },
  { id: 'resource', cue: [0.19, 0.22, 0.25, 0.28] },
  { id: 'opinion', cue: [0.28, 0.31, 0.34, 0.37] },
  { id: 'topic', cue: [0.37, 0.40, 0.43, 0.46] },
  { id: 'reader', cue: [0.46, 0.49, 0.52, 0.55] },
  { id: 'entries', cue: [0.55, 0.58, 0.61, 0.64] },
  { id: 'tags_and_links', cue: [0.64, 0.67, 0.70, 0.73] },
  { id: 'diagram', cue: [0.73, 0.76, 0.94, 0.97] } // Fades out right before footer
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
      <div style={{  }}>
        <img
          src="https://raw.githubusercontent.com/saad-ibra/gray-matter/main/core/designsystem/src/main/res/drawable/app_logo_full.png"
          alt="Relatrix Logo" 
          style={{ 
            width: 86, height: 86, borderRadius: 20, 
            boxShadow: `0 0 40px rgba(142,158,90,0.4), 0 0 80px rgba(142,158,90,0.15)`,
            border: '1px solid rgba(255,255,255,0.15)',
            
          }}
        />
      </div>
      <h1 style={{ 
        fontSize: 'clamp(44px, 12vw, 84px)', fontWeight: 800, margin: '12px 0 0 0', 
        letterSpacing: '-0.04em', lineHeight: 1.1, color: '#fff',
        
      }}>
        Relatrix
      </h1>
      <h2 style={{ 
        fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 500, margin: '0 0 8px 0', 
        letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.8)' 
      }}>
        Your personal knowledge base.
      </h2>
      <p style={{ color: C.dim, fontSize: 'clamp(14px, 3vw, 16px)', maxWidth: 420, lineHeight: 1.6, margin: 0 }}>
        Capture thoughts, annotate documents, and connect your ideas into a living, spatial graph.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 }}>
        <a href="https://github.com/saad-ibra/gray-matter" target="_blank" rel="noreferrer"
          style={{ padding: '12px 24px', borderRadius: 8, background: C.opinion, color: '#000', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'transform 0.2s', boxShadow: `0 4px 15px rgba(142,158,90,0.3)` }}>
          <Terminal size={15} /> View Source
        </a>
        <a href="https://f-droid.org/packages/com.saadibra.graymatter" target="_blank" rel="noreferrer"
          style={{ padding: '12px 24px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.2s', backdropFilter: 'blur(10px)' }}>
          <Smartphone size={15} /> Get on F-Droid
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
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Six types of cards to capture knowledge</h2>
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



function TagsAndLinksPanel() {
  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <Label>Connect & Organize</Label>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Tags and Links</h2>
      <p style={{ color: C.dim, fontSize: 14, margin: 0, maxWidth: 320, lineHeight: 1.5 }}>
        Establish relationships between nodes with links, or group them flexibly using tags.
      </p>
      <Card style={{ marginTop: 4, width: '100%', maxWidth: 340, padding: '28px 20px 20px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 220, margin: '0 auto 24px' }}>
          <div style={{ position: 'absolute', left: 40, right: 40, top: 22, height: 2, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.6) 0, rgba(255,255,255,0.6) 6px, transparent 6px, transparent 12px)', backgroundSize: '12px 2px', animation: 'march 0.5s linear infinite', zIndex: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#111', border: `1px solid ${C.opinion}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px rgba(142,158,90,0.15)` }}>
              <Book color={C.opinion} size={18} strokeWidth={1.5} />
            </div>
            <span style={{ fontSize: 10, color: C.opinion, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resource</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#111', border: `1px solid ${C.template}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px rgba(126,106,140,0.15)` }}>
              <FileText color={C.template} size={18} strokeWidth={1.5} />
            </div>
            <span style={{ fontSize: 10, color: C.template, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entry</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
          <Pill bg="rgba(255,255,255,0.06)" color="#fff"><Tag size={12}/> important</Pill>
          <Pill bg="rgba(255,255,255,0.06)" color="#fff"><Tag size={12}/> review</Pill>
          <Pill bg="rgba(255,255,255,0.06)" color="#fff"><Tag size={12}/> research</Pill>
        </div>
      </Card>
    </div>
  );
}

function DiagramPanel() {
  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <Label>Hierarchy</Label>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>The Architecture of Knowledge</h2>
      <Card style={{ marginTop: 8, width: '100%', maxWidth: 380, padding: '36px 20px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        
        {/* Background grid lines for techy feel */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none', borderRadius: 16 }} />

        {/* Topic Node */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 2 }}>
          <div style={{ position: 'relative', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',  }}>
            <svg width="56" height="56" viewBox="0 0 48 48" style={{ position: 'absolute', inset: 0, filter: 'drop-shadow(0 0 12px rgba(234,179,8,0.5))' }}>
              <polygon points="24,2 44,13 44,35 24,46 4,35 4,13" fill="rgba(234,179,8,0.1)" stroke="#EAB308" strokeWidth="2.5" />
            </svg>
            <Folder size={20} color="#EAB308" style={{ zIndex: 1 }} />
          </div>
          <span style={{ fontSize: 11, color: '#EAB308', fontWeight: 700, letterSpacing: '0.1em' }}>TOPIC</span>
        </div>
        
        {/* Animated Connection Line */}
        <div style={{ width: 2, height: 28, background: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.4) 0, rgba(255,255,255,0.4) 4px, transparent 4px, transparent 8px)', margin: '4px 0', animation: 'march-down 0.5s linear infinite', backgroundSize: '2px 8px' }} />
        
        {/* Resource Node */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 2 }}>
          <div style={{ position: 'relative', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="60" height="60" viewBox="0 0 48 48" style={{ position: 'absolute', inset: 0, filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.3))' }}>
              <polygon points="24,4 46,44 2,44" fill="rgba(255,255,255,0.05)" stroke="#fff" strokeWidth="2.5" />
            </svg>
            <Globe size={18} color="#fff" style={{ zIndex: 1, marginTop: 8 }} />
          </div>
          <span style={{ fontSize: 11, color: '#fff', fontWeight: 700, letterSpacing: '0.1em' }}>RESOURCE</span>
        </div>
        
        {/* Static Connection Line */}
        <div style={{ width: 2, height: 20, background: 'rgba(255,255,255,0.2)', marginTop: 8 }} />
        
        {/* Horizontal Branching Line */}
        <div style={{ width: 300, height: 16, borderTop: `2px solid rgba(255,255,255,0.2)`, borderLeft: `2px solid rgba(255,255,255,0.2)`, borderRight: `2px solid rgba(255,255,255,0.2)`, borderTopLeftRadius: 8, borderTopRightRadius: 8 }} />
        
        {/* 6 colored entries */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: 316, marginTop: -2, zIndex: 2 }}>
          {[
            { c: C.opinion, icon: Edit2 }, { c: C.template, icon: List }, 
            { c: C.annotation, icon: Highlighter }, { c: C.bookmark, icon: Bookmark }, 
            { c: C.lookup, icon: Book }, { c: C.visual, icon: Camera }
          ].map((t, i) => (
            <div key={i} style={{ width: 34, height: 34, borderRadius: 8, background: '#0a0a0a', border: `1.5px solid ${t.c}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 15px ${t.c}50`, position: 'relative', overflow: 'hidden' }}>
               <div style={{ position: 'absolute', inset: 0, background: t.c, opacity: 0.15 }} />
               <t.icon size={14} color={t.c} style={{ zIndex: 1 }} />
            </div>
          ))}
        </div>
        
      </Card>
    </div>
  );
}

const PANEL_COMPONENTS = [HeroPanel, PlusPanel, ResourcePanel, OpinionPanel, TopicPanel, ReaderPanel, EntriesPanel, TagsAndLinksPanel, DiagramPanel];

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
    graphRef.current = createGraph(window.innerWidth < 768);
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

  // Draw 3D graph (Clusters + Points)
  const drawGraph = useCallback((seekAt, canvas, time, reducedMotion) => {
    if (!canvas || !graphRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR for perf
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.scale(dpr, dpr);
    }
    ctx.clearRect(0, 0, w, h);

    const { clusters, points, links } = graphRef.current;
    const mod = (n, m) => ((n % m) + m) % m;

    const t = reducedMotion ? 0 : time * 0.00015;
    const rotY = seekAt * Math.PI * 1.4 + t * 0.03;
    const rotX = Math.sin(seekAt * Math.PI * 0.8) * 0.35 + t * 0.02;
    const cx0 = w / 2, cy0 = h / 2;

    const drawables = [];

    // Points
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const zc = mod(p.z0 - seekAt * TRAVEL, ZSPAN) - ZSPAN / 2;
      const proj = projectCluster(p.x, p.y, zc, rotX, rotY, cx0, cy0);
      p._sx = proj.x; p._sy = proj.y; p._scale = proj.scale; p._depth = proj.depth; p._op = proj.op;
      drawables.push({ type: 'point', ref: p, depth: proj.depth });
    }

    // Links between points
    for (let i = 0; i < links.length; i++) {
      const a = points[links[i][0]], b = points[links[i][1]];
      drawables.push({ type: 'link', a, b, depth: (a._depth + b._depth) / 2 });
    }

    // Clusters (Wireframes)
    for (let ci = 0; ci < clusters.length; ci++) {
      const cl = clusters[ci];
      const czc = mod(cl.cz0 - seekAt * TRAVEL, ZSPAN) - ZSPAN / 2;
      const spin = cl.phase + t * cl.spinSpeed * 14;
      const projVerts = [];
      for (let vi = 0; vi < cl.verts.length; vi++) {
        const v = cl.verts[vi];
        const spun = rotateY([v[0] * cl.scale, v[1] * cl.scale, v[2] * cl.scale], spin);
        const wx = spun[0] + cl.cx, wy = spun[1] + cl.cy, wz = spun[2] + czc;
        projVerts.push(projectCluster(wx, wy, wz, rotX, rotY, cx0, cy0));
      }
      for (let ei = 0; ei < cl.edges.length; ei++) {
        const e = cl.edges[ei];
        const pa = projVerts[e[0]], pb = projVerts[e[1]];
        drawables.push({ type: 'edge', a: pa, b: pb, depth: (pa.depth + pb.depth) / 2, accent: !cl.isIco });
      }
    }

    drawables.sort((x, y) => y.depth - x.depth);

    const hexToRgba = (hex, a) => {
      const rr = parseInt(hex.slice(1, 3), 16);
      const gg = parseInt(hex.slice(3, 5), 16);
      const bb = parseInt(hex.slice(5, 7), 16);
      return `rgba(${rr},${gg},${bb},${a})`;
    };

    for (let i = 0; i < drawables.length; i++) {
      const d = drawables[i];
      if (d.type === 'link') {
        const lop = Math.min(d.a._op, d.b._op) * 0.14;
        if (lop > 0.01) {
          ctx.strokeStyle = `rgba(255,255,255,${lop})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(d.a._sx, d.a._sy); ctx.lineTo(d.b._sx, d.b._sy); ctx.stroke();
        }
      } else if (d.type === 'edge') {
        const eop = Math.min(d.a.op, d.b.op);
        if (eop > 0.01) {
          ctx.strokeStyle = d.accent
            ? `rgba(140,165,255,${eop * 0.42})`
            : `rgba(255,255,255,${eop * 0.32})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(d.a.x, d.a.y); ctx.lineTo(d.b.x, d.b.y); ctx.stroke();
        }
      } else {
        const pt = d.ref;
        const r = Math.max(0.7, pt.r * pt._scale * 2.4);
        
        // Subtle Colored Glow
        const grad = ctx.createRadialGradient(pt._sx, pt._sy, 0, pt._sx, pt._sy, r * 2.5);
        grad.addColorStop(0, hexToRgba(pt.color, pt._op * 0.7)); 
        grad.addColorStop(1, hexToRgba(pt.color, 0));
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(pt._sx, pt._sy, r * 2.5, 0, Math.PI * 2); ctx.fill();

        // Inner solid core
        ctx.fillStyle = hexToRgba(pt.color, pt._op);
        ctx.beginPath(); ctx.arc(pt._sx, pt._sy, r * 0.6, 0, Math.PI * 2); ctx.fill();
      }
    }
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const readScroll = () => {
      // documentElement.scrollHeight represents the entire page (including the footer/explore sections)
      // We map the scroll progress so that 1.0 is reached when scrolled to the very bottom
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const raw = max > 0 ? window.pageYOffset / max : 0;
      stateRef.current.progress = Math.max(0, Math.min(1, raw));
      stateRef.current.seekTo = stateRef.current.progress;
    };

    const frame = (time) => {
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

      // Draw graph
      if (!reducedMotion) {
        drawGraph(s.seekAt, canvas, time, reducedMotion);
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

  // Handle resize for canvas graph reconstruction
  useEffect(() => {
    const onResize = () => {
      const isMob = window.innerWidth < 768;
      const currentIsMob = graphRef.current && graphRef.current.points.length === 15;
      if (isMob !== currentIsMob) {
        graphRef.current = createGraph(isMob);
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
        @keyframes march {
          to { background-position: -12px 0; }
        }
        
        .rltx-track { height: 900vh; position: relative; }
        
        .rltx-stage { position: fixed; inset: 0; z-index: 0; overflow: hidden; background: #000; }
        .rltx-stage canvas { width: 100%; height: 100%; display: block; }
        .rltx-veil {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 90% 70% at 50% 42%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 58%, rgba(0,0,0,0.8) 100%),
                      linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.8) 100%);
        }
        .rltx-grain {
          position: absolute; inset: 0; pointer-events: none; opacity: 0.045; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 140 140' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
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

        /* Standard flow for footer */
        .rltx-explore {
          position: relative; z-index: 30;
          padding: 80px 24px; display: flex; justify-content: center;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .rltx-link-card {
          padding: 14px 18px; background: rgba(255,255,255,0.04); border-radius: 8px;
          display: flex; align-items: center; gap: 12px; color: #fff;
          border: 1px solid rgba(255,255,255,0.1); text-decoration: none;
          transition: all 0.2s; font-size: 14px;
        }
        .rltx-link-card:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }
      
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes tilt3d {
          0%, 100% { transform: rotateY(-10deg) rotateX(4deg); }
          50% { transform: rotateY(10deg) rotateX(-4deg); }
        }
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 10px rgba(255,255,255,0.05); }
          50% { text-shadow: 0 0 25px rgba(255,255,255,0.3), 0 0 45px rgba(255,255,255,0.1); }
        }
        @keyframes march-down {
          to { background-position: 0 8px; }
        }
`}</style>

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

      {/* Scroll track (gives page height, but panels are fixed) */}
      <div className="rltx-track">
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

      {/* Explore Section (normal flow, scrolls UP over the graph at the end of the track) */}
      <section className="rltx-explore">
        <div style={{ width: '100%', maxWidth: 560 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.opinion, marginBottom: 8, fontFamily: 'monospace' }}>Get Started</div>
            <h2 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Explore Relatrix</h2>
            <p style={{ color: C.dim, fontSize: 14, margin: 0, lineHeight: 1.6 }}>Open source. Privacy-first. Available on F-Droid.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <a href="https://github.com/saad-ibra/gray-matter" target="_blank" rel="noreferrer" className="rltx-link-card">
              <Terminal size={16} /> <span>GitHub</span> <ExternalLink size={11} style={{ marginLeft: 'auto', opacity: 0.3 }} />
            </a>
            <a href="https://f-droid.org/packages/com.saadibra.graymatter" target="_blank" rel="noreferrer" className="rltx-link-card">
              <Smartphone size={16} /> <span>F-Droid</span> <ExternalLink size={11} style={{ marginLeft: 'auto', opacity: 0.3 }} />
            </a>
            <a href="https://github.com/saad-ibra/gray-matter/releases" target="_blank" rel="noreferrer" className="rltx-link-card">
              <Tag size={16} /> <span>Releases</span> <ExternalLink size={11} style={{ marginLeft: 'auto', opacity: 0.3 }} />
            </a>
            <a href="https://github.com/saad-ibra/gray-matter/issues" target="_blank" rel="noreferrer" className="rltx-link-card">
              <AlertCircle size={16} /> <span>Issues</span> <ExternalLink size={11} style={{ marginLeft: 'auto', opacity: 0.3 }} />
            </a>
          </div>
          <div style={{ marginTop: 8 }}>
            <a href="https://saadibra.mooo.com/contact/" className="rltx-link-card" style={{ justifyContent: 'center' }}>
              <Mail size={16} /> <span>Contact the Developer</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer (normal flow) */}
      <footer style={{
        borderTop: `1px solid rgba(255,255,255,0.08)`, padding: '24px 20px',
        display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', position: 'relative', zIndex: 30,
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
