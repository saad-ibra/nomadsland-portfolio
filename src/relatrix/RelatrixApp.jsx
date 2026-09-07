import React, { useState, useEffect } from 'react';
import { 
  FileText, Globe, Edit2, Plus, File, Book, Image as ImageIcon, 
  Bookmark, Rocket, ArrowLeft, ArrowRight, Check,
  Terminal, Smartphone, Mail, Tag, AlertCircle, Edit, Folder,
  Scan, List, Camera, Highlighter, ExternalLink, ChevronDown,
  Layers, Zap, GitBranch
} from 'lucide-react';

const colors = {
  primary: '#e0e0e0',
  onPrimary: '#000',
  bg: '#000000',
  surface: '#111111',
  surfaceHigh: '#222222',
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  opinion: '#8E9E5A',
  bookmark: '#C4A84E',
  annotation: '#C47A5A',
  template: '#7E6A8C',
  lookup: '#BF5A6A',
  visual: '#5A9E8C',
  neutral400: '#9e9e9e',
  neutral500: '#757575',
  neutral600: '#616161',
  neutral700: '#616161',
  neutral800: '#424242',
  neutral900: '#212121',
};

/* ─── Slide wrapper: fixed 440px height, no accent line ─── */
const Slide = ({ children }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    width: '100%', maxWidth: 480, margin: '0 auto', height: 440,
    justifyContent: 'center', textAlign: 'center',
    padding: '36px 28px', boxSizing: 'border-box',
    background: '#0A0A0A',
    border: '1px solid #1F1F1F',
    borderRadius: 8, position: 'relative', overflow: 'hidden'
  }}>
    {children}
  </div>
);

/* ─── Tiny monospace label ─── */
const StepLabel = ({ children, color }) => (
  <div style={{
    fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
    color: color || colors.neutral500, marginBottom: 12, fontFamily: 'monospace'
  }}>
    {children}
  </div>
);

export default function RelatrixApp() {
  const [slide, setSlide] = useState(0);
  const [resource, setResource] = useState(null);
  const [opinion, setOpinion] = useState('');
  const [opinionSaved, setOpinionSaved] = useState(false);
  const [confidence, setConfidence] = useState(50);
  const [topic, setTopic] = useState(null);
  const [discovered, setDiscovered] = useState(new Set());
  const [selEntryType, setSelEntryType] = useState(-1);
  const [tag, setTag] = useState(null);
  const [linked, setLinked] = useState(false);
  const [sourceSel, setSourceSel] = useState(false);
  const [targetSel, setTargetSel] = useState(false);

  const [visibleNodes, setVisibleNodes] = useState(0);
  const [tappedNodes, setTappedNodes] = useState(new Set());
  const [selNode, setSelNode] = useState(-1);

  const totalSlides = 11;

  useEffect(() => {
    if (sourceSel && targetSel) setLinked(true);
  }, [sourceSel, targetSel]);

  useEffect(() => {
    if (slide === 7) {
      setVisibleNodes(0);
      setTappedNodes(new Set());
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setVisibleNodes(count);
        if (count >= 8) clearInterval(interval);
      }, 350);
      return () => clearInterval(interval);
    }
  }, [slide]);

  const canAdvance = () => {
    switch(slide) {
      case 1: return false;
      case 2: return !!resource;
      case 3: return opinionSaved;
      case 4: return !!topic;
      case 6: return discovered.size >= 6;
      case 7: return true;
      case 8: return !!tag;
      case 9: return linked;
      default: return true;
    }
  };

  const advance = () => setSlide(s => Math.min(s + 1, totalSlides - 1));
  const goBack = () => setSlide(s => Math.max(s - 1, 0));

  const renderSlide = () => {
    switch (slide) {

      /* ── 0  WELCOME ── */
      case 0: return (
        <Slide>
          <img 
            src="https://raw.githubusercontent.com/saad-ibra/gray-matter/main/core/designsystem/src/main/res/drawable/app_logo_full.png" 
            alt="Relatrix" 
            style={{ width: 72, height: 72, borderRadius: 14, marginBottom: 32 }} 
          />
          <h1 style={{ fontSize: 26, margin: '0 0 10px 0', fontWeight: 700, letterSpacing: '-0.025em' }}>Welcome to Relatrix</h1>
          <p style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 1.6, maxWidth: 320, margin: 0 }}>
            Build your first piece of knowledge, step by step.
          </p>
        </Slide>
      );

      /* ── 1  TAP TO START ── */
      case 1: return (
        <Slide>
          <div style={{ position: 'relative', width: 96, height: 96, marginBottom: 40 }}>
            <div 
              onClick={advance}
              style={{ 
                width: 96, height: 96, borderRadius: '50%', 
                background: '#111',
                border: '1px solid #333',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                animation: 'pulse 2.5s infinite',
                transition: 'border-color 0.3s'
              }}
            >
              <Plus size={40} color="#fff" strokeWidth={1.5} />
            </div>
          </div>
          <h2 style={{ fontSize: 22, margin: '0 0 8px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>This is how everything starts</h2>
          <p style={{ color: colors.textSecondary, fontSize: 14 }}>
            Tap <span style={{ color: '#fff', fontWeight: 600 }}>+</span> to begin.
          </p>
        </Slide>
      );

      /* ── 2  ADD RESOURCE ── */
      case 2: return (
        <Slide>
          <StepLabel>Step 1</StepLabel>
          <h2 style={{ fontSize: 22, margin: '0 0 4px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>Add a Resource</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 24, fontSize: 14 }}>What would you like to capture?</p>
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            {[
              { id: 'File', icon: File, sub: 'PDF, doc, image' },
              { id: 'Link', icon: Globe, sub: 'URL or webpage' },
              { id: 'Note', icon: Edit2, sub: 'Write from scratch' }
            ].map(r => {
              const sel = resource === r.id;
              return (
                <div 
                  key={r.id} onClick={() => setResource(r.id)}
                  style={{
                    flex: 1, borderRadius: 8, padding: '18px 8px',
                    background: sel ? '#161616' : '#0D0D0D',
                    border: `1px solid ${sel ? '#444' : '#1A1A1A'}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    cursor: 'pointer', opacity: (resource && !sel) ? 0.25 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <r.icon size={22} color={sel ? '#fff' : colors.neutral500} strokeWidth={1.5} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: sel ? '#fff' : colors.textSecondary }}>{r.id}</span>
                  <span style={{ fontSize: 10, color: colors.neutral500 }}>{r.sub}</span>
                </div>
              )
            })}
          </div>
          <div style={{ height: 36, marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {resource && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.opinion, fontSize: 13 }}>
                <Check size={14} /> {resource} selected
              </div>
            )}
          </div>
        </Slide>
      );

      /* ── 3  OPINION ── */
      case 3: {
        const confLabel = confidence <= 25 ? "Uncertain" : confidence <= 50 ? "Somewhat sure" : confidence <= 75 ? "Confident" : "Very confident";
        const confColor = confidence <= 25 ? colors.lookup : confidence <= 50 ? colors.annotation : confidence <= 75 ? colors.bookmark : colors.opinion;
        return (
          <Slide>
            {!opinionSaved ? (
              <>
                <StepLabel color={colors.opinion}>Step 2</StepLabel>
                <h2 style={{ fontSize: 22, margin: '0 0 4px 0', fontWeight: 700 }}>Your First Opinion</h2>
                <p style={{ color: colors.textSecondary, marginBottom: 16, fontSize: 13, lineHeight: 1.5 }}>
                  What do you think about this {resource?.toLowerCase()}?
                </p>
                
                <input 
                  value={opinion} onChange={e => setOpinion(e.target.value)}
                  placeholder="Type your thoughts..."
                  type="text"
                  style={{ 
                    width: '100%', padding: '12px 14px', borderRadius: 6, background: '#0D0D0D', 
                    border: '1px solid #1F1F1F', color: '#fff', fontSize: 14,
                    fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 10
                  }}
                />
                
                <div style={{ display: 'flex', gap: 6, width: '100%', marginBottom: 14 }}>
                  {["Interesting concept", "Need to revisit", "Key insight"].map(s => (
                    <div 
                      key={s} onClick={() => setOpinion(s)}
                      style={{ 
                        padding: '6px 12px', background: opinion === s ? '#1A1A1A' : '#0D0D0D', 
                        border: `1px solid ${opinion === s ? colors.opinion : '#1A1A1A'}`, 
                        borderRadius: 6, fontSize: 12, cursor: 'pointer', color: opinion === s ? colors.opinion : colors.neutral500,
                        whiteSpace: 'nowrap', transition: 'all 0.2s'
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>

                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: colors.textSecondary }}>Confidence</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: confColor, fontFamily: 'monospace' }}>{confidence}% {confLabel}</span>
                  </div>
                  <input type="range" min="0" max="100" value={confidence} onChange={e => setConfidence(e.target.value)} style={{ width: '100%', marginBottom: 14, background: `linear-gradient(to right, ${colors.opinion} ${confidence}%, #1F1F1F ${confidence}%)` }} />
                </div>
                
                <button 
                  onClick={() => { if(opinion) setOpinionSaved(true); }}
                  style={{ 
                    padding: '12px', background: opinion ? colors.opinion : '#1A1A1A', 
                    color: opinion ? '#000' : '#555', 
                    borderRadius: 6, border: 'none', width: '100%', fontSize: 14, fontWeight: 700, 
                    cursor: opinion ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  <Check size={16} /> Save Opinion
                </button>
              </>
            ) : (
              <>
                <div style={{ width: '100%', background: '#0D0D0D', border: '1px solid #1F1F1F', borderRadius: 8, padding: 20, textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: '#161616', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Edit size={13} color={colors.opinion} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: colors.opinion, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace' }}>Opinion</span>
                  </div>
                  <div style={{ fontSize: 16, marginBottom: 12, lineHeight: 1.4 }}>"{opinion}"</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: '#1A1A1A', overflow: 'hidden' }}>
                      <div style={{ width: `${confidence}%`, height: '100%', background: confColor, transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 11, color: colors.textSecondary, fontFamily: 'monospace' }}>{confidence}%</span>
                  </div>
                </div>
                <p style={{ color: colors.opinion, marginTop: 16, fontSize: 13, lineHeight: 1.5 }}>Opinions are your core unit of thinking in Relatrix.</p>
              </>
            )}
          </Slide>
        );
      }

      /* ── 4  TOPIC (yellow folder icons, no emojis) ── */
      case 4: return (
        <Slide>
          <StepLabel>Step 3</StepLabel>
          <h2 style={{ fontSize: 22, margin: '0 0 4px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>Organize into a Topic</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 22, fontSize: 14 }}>Topics are folders for your resources.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            {[
              { name: "Philosophy" },
              { name: "Science" },
              { name: "My Notes" }
            ].map(t => {
              const sel = topic === t.name;
              return (
                <div 
                  key={t.name} onClick={() => setTopic(t.name)}
                  style={{
                    padding: '12px 14px', borderRadius: 8,
                    background: sel ? '#161616' : '#0D0D0D',
                    border: `1px solid ${sel ? colors.bookmark : '#1A1A1A'}`,
                    cursor: 'pointer', opacity: (topic && !sel) ? 0.25 : 1,
                    display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s'
                  }}
                >
                  <Folder size={20} color="#EAB308" strokeWidth={1.5} />
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: sel ? '#fff' : colors.textSecondary }}>{t.name}</div>
                    {sel && <div style={{ fontSize: 11, color: colors.neutral500, marginTop: 2 }}>1 resource inside</div>}
                  </div>
                  {sel && <Check size={16} color={colors.bookmark} />}
                </div>
              )
            })}
          </div>
        </Slide>
      );

      /* ── 5  PDF READER ── */
      case 5: return (
        <Slide>
          <StepLabel>Built-in Reader</StepLabel>
          <h2 style={{ fontSize: 22, margin: '0 0 4px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>Dedicated PDF Reader</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 18, fontSize: 14 }}>Read actively with inline entries.</p>
          <div style={{ width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid #1F1F1F' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: '#0D0D0D', borderBottom: '1px solid #1A1A1A' }}>
              <div style={{ display: 'flex', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#febc2e' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840' }} />
              </div>
              <div style={{ flex: 1, fontSize: 10, color: colors.neutral500, textAlign: 'center', fontFamily: 'monospace' }}>research_paper.pdf</div>
            </div>
            <div style={{ display: 'flex', background: '#060606' }}>
              <div style={{ flex: 1, padding: '14px 14px 18px' }}>
                <div style={{ width: '75%', height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 2, marginBottom: 12 }} />
                <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 1, marginBottom: 6 }} />
                <div style={{ width: '92%', height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 1, marginBottom: 6 }} />
                <div style={{ position: 'relative', marginBottom: 6 }}>
                  <div style={{ width: '68%', height: 5, background: `${colors.annotation}40`, borderRadius: 1 }} />
                  <div style={{ position: 'absolute', left: '72%', top: -10, padding: '2px 6px', borderRadius: 4, background: colors.annotation, fontSize: 8, color: '#000', fontWeight: 600, fontFamily: 'monospace' }}>Annotation</div>
                </div>
                <div style={{ width: '88%', height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 1, marginBottom: 6 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                  <Bookmark size={9} color={colors.bookmark} fill={colors.bookmark} />
                  <div style={{ width: '80%', height: 5, background: '#333', borderRadius: 1 }} />
                </div>
                <div style={{ width: '70%', height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 1 }} />
              </div>
              <div style={{ width: 40, background: 'rgba(255,255,255,0.02)', borderLeft: '1px solid #1A1A1A', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', gap: 8 }}>
                {[
                  { icon: Edit2, color: colors.opinion },
                  { icon: Highlighter, color: colors.annotation },
                  { icon: Bookmark, color: colors.bookmark },
                  { icon: Camera, color: colors.visual },
                ].map((tool, i) => (
                  <div key={i} style={{ width: 24, height: 24, borderRadius: 4, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <tool.icon size={12} color={tool.color} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Slide>
      );

      /* ── 6  ENTRY TYPES ── */
      case 6: {
        const types = [
          { name: "Opinions", icon: Edit2, color: colors.opinion, desc: "Your personal thoughts and reactions" },
          { name: "Annotations", icon: Highlighter, color: colors.annotation, desc: "Highlighted passages with notes" },
          { name: "Bookmarks", icon: Bookmark, color: colors.bookmark, desc: "Save your place in a document" },
          { name: "Templates", icon: List, color: colors.template, desc: "Structured reusable forms" },
          { name: "Lookups", icon: Book, color: colors.lookup, desc: "Search and define terms" },
          { name: "Vision", icon: Camera, color: colors.visual, desc: "Capture from camera or image" }
        ];
        return (
          <Slide>
            <StepLabel>6 Entry Types</StepLabel>
            <h2 style={{ fontSize: 22, margin: '0 0 4px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>Types of Entries</h2>
            <p style={{ color: colors.textSecondary, marginBottom: 18, fontSize: 14 }}>Tap each to discover how you can capture knowledge.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%', marginBottom: 14 }}>
              {types.map((t, idx) => {
                const isDisc = discovered.has(idx);
                const isSel = selEntryType === idx;
                const IconComp = t.icon;
                return (
                  <div 
                    key={idx} onClick={() => { setSelEntryType(idx); setDiscovered(new Set(discovered).add(idx)); }}
                    style={{
                      padding: '12px 6px', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      background: isSel ? '#161616' : '#0D0D0D',
                      border: `1px solid ${isSel ? t.color : isDisc ? '#2A2A2A' : '#1A1A1A'}`,
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <IconComp size={18} color={isDisc ? t.color : colors.neutral600} strokeWidth={1.5} />
                    <span style={{ fontSize: 10, fontWeight: isDisc ? 600 : 400, color: isDisc ? t.color : colors.neutral600 }}>{t.name}</span>
                  </div>
                )
              })}
            </div>
            
            <div style={{ width: '100%', minHeight: 64, display: 'flex', alignItems: 'center' }}>
              {selEntryType !== -1 ? (
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#0D0D0D', border: `1px solid #1F1F1F`, borderRadius: 6, textAlign: 'left' }}>
                  {(() => { const SelIcon = types[selEntryType].icon; return <SelIcon size={18} color={types[selEntryType].color} /> })()}
                  <div>
                    <div style={{ fontSize: 14, color: types[selEntryType].color, fontWeight: 600 }}>{types[selEntryType].name}</div>
                    <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1, lineHeight: 1.4 }}>{types[selEntryType].desc}</div>
                  </div>
                </div>
              ) : <div />}
            </div>

            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 48, height: 3, borderRadius: 2, background: '#1A1A1A', overflow: 'hidden' }}>
                <div style={{ width: `${(discovered.size / 6) * 100}%`, height: '100%', background: discovered.size >= 6 ? colors.opinion : colors.neutral500, transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: 11, color: discovered.size >= 6 ? colors.opinion : colors.neutral500, fontFamily: 'monospace' }}>{discovered.size}/6</span>
            </div>
          </Slide>
        );
      }

      /* ── 7  RELATRIX GRAPH (no dashed lines) ── */
      case 7: {
        const nodes = [
          { l: topic || "Topic", c: colors.neutral400, x: 0.5, y: 0.18, s: 'hex', lb: "Topic [Folder]" },
          { l: `My ${resource || "Resource"}`, c: colors.neutral400, x: 0.5, y: 0.48, s: 'tri', lb: "Resource" },
          { l: opinion || "Opinion", c: colors.opinion, x: 0.18, y: 0.72, s: 'circ', lb: "Entries" },
          { l: "Annotation", c: colors.annotation, x: 0.18, y: 0.88, s: 'circ' },
          { l: "Bookmark", c: colors.bookmark, x: 0.35, y: 0.88, s: 'circ' },
          { l: "Template", c: colors.template, x: 0.5, y: 0.88, s: 'circ' },
          { l: "Lookup", c: colors.lookup, x: 0.65, y: 0.88, s: 'circ' },
          { l: "Vision", c: colors.visual, x: 0.82, y: 0.88, s: 'circ' }
        ];
        const edges = [[0,1], [1,2], [1,3], [1,4], [1,5], [1,6], [1,7]];
        return (
          <Slide>
            <StepLabel>Visualization</StepLabel>
            <h2 style={{ fontSize: 22, margin: '0 0 4px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>The Relatrix</h2>
            <p style={{ color: colors.textSecondary, marginBottom: 14, fontSize: 14 }}>Your knowledge as an interactive graph. Tap to explore.</p>
            <div style={{ width: '100%', height: 220, background: '#060606', borderRadius: 6, position: 'relative', border: '1px solid #1A1A1A', overflow: 'hidden' }}>
              <svg viewBox="0 0 480 220" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <defs>
                  {nodes.map((n, i) => (
                    <filter key={`glow${i}`} id={`glow${i}`}>
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  ))}
                </defs>
                {edges.map((e, i) => (
                  e[0] < visibleNodes && e[1] < visibleNodes && (
                    <line key={`e${i}`} x1={`${nodes[e[0]].x * 100}%`} y1={`${nodes[e[0]].y * 100}%`} x2={`${nodes[e[1]].x * 100}%`} y2={`${nodes[e[1]].y * 100}%`} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                  )
                ))}
                {nodes.map((n, i) => i < visibleNodes && (
                  <g key={`n${i}`} transform={`translate(${n.x * 480}, ${n.y * 220})`} onClick={() => { setSelNode(i); setTappedNodes(new Set(tappedNodes).add(i)); }} style={{ cursor: 'pointer' }} filter={selNode === i ? `url(#glow${i})` : undefined}>
                    {n.s === 'hex' && (
                      <polygon points="0,-16 14,-8 14,8 0,16 -14,8 -14,-8" fill="#0A0A0A" stroke={n.c} strokeWidth="1" />
                    )}
                    {n.s === 'tri' && (
                      <polygon points="0,-16 14,11 -14,11" fill="#0A0A0A" stroke={n.c} strokeWidth="1" />
                    )}
                    {n.s === 'circ' && (
                      <circle cx="0" cy="0" r="8" fill={n.c} opacity={0.7} />
                    )}
                  </g>
                ))}
              </svg>
              {nodes.map((n, i) => i < visibleNodes && n.lb && (
                <div key={`l${i}`} style={{ position: 'absolute', left: `calc(${n.x * 100}% + 20px)`, top: `calc(${n.y * 100}% - 8px)`, fontSize: 9, color: 'rgba(255,255,255,0.25)', textAlign: 'left', width: 100, fontFamily: 'monospace' }}>{n.lb}</div>
              ))}
            </div>
            <div style={{ height: 32, marginTop: 10, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selNode !== -1 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', background: '#111', padding: '5px 12px', borderRadius: 6, gap: 6, border: '1px solid #1F1F1F' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: nodes[selNode].c }} />
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{nodes[selNode].l}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 48, height: 3, borderRadius: 2, background: '#1A1A1A', overflow: 'hidden' }}>
                <div style={{ width: `${(tappedNodes.size / 8) * 100}%`, height: '100%', background: tappedNodes.size >= 8 ? colors.opinion : colors.neutral500, transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: 11, color: tappedNodes.size >= 8 ? colors.opinion : colors.neutral500, fontFamily: 'monospace' }}>{tappedNodes.size}/8</span>
            </div>
          </Slide>
        );
      }

      /* ── 8  TAGS (tag icons, no emojis) ── */
      case 8: return (
        <Slide>
          <StepLabel>Organize</StepLabel>
          <h2 style={{ fontSize: 22, margin: '0 0 4px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>Organize with Tags</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 18, fontSize: 14 }}>Group related entries instantly.</p>
          
          <div style={{ background: '#0D0D0D', padding: '14px 16px', borderRadius: 8, width: '100%', marginBottom: 20, textAlign: 'left', border: '1px solid #1A1A1A' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: tag ? 12 : 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: '#161616', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Edit2 size={14} color={colors.opinion} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{opinion || "My insight"}</div>
                <div style={{ fontSize: 10, color: colors.neutral500, marginTop: 1, fontFamily: 'monospace' }}>Opinion · {confidence}%</div>
              </div>
            </div>
            {tag && (
              <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#161616', padding: '3px 8px', borderRadius: 4, border: '1px solid #2A2A2A' }}>
                  <Tag size={10} color="#fff" />
                  <span style={{ fontSize: 11, color: '#fff', fontWeight: 500 }}>{tag}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 8, textAlign: 'left', width: '100%' }}>Select a tag:</div>
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            {[
              { name: "important" },
              { name: "review" },
              { name: "revision" }
            ].map(t => (
              <div 
                key={t.name} onClick={() => setTag(t.name)}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 6,
                  background: tag === t.name ? '#161616' : '#0D0D0D',
                  border: `1px solid ${tag === t.name ? '#444' : '#1A1A1A'}`,
                  display: 'flex', alignItems: 'center', gap: 6,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Tag size={13} color={tag === t.name ? '#fff' : colors.neutral500} />
                <span style={{ color: tag === t.name ? '#fff' : colors.textSecondary, fontSize: 12, fontWeight: tag === t.name ? 600 : 400 }}>{t.name}</span>
              </div>
            ))}
          </div>
        </Slide>
      );

      /* ── 9  LINKS (white dashed line, circles, further apart) ── */
      case 9: return (
        <Slide>
          <StepLabel>Connections</StepLabel>
          <h2 style={{ fontSize: 22, margin: '0 0 4px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>Knowledge Links</h2>
          <p style={{ color: linked ? colors.opinion : colors.textSecondary, marginBottom: 18, fontSize: 14, lineHeight: 1.5 }}>
            {linked ? "Connected! Your knowledge is now linked." : "Tap both nodes to create a link between them."}
          </p>
          <div style={{ width: '100%', height: 160, background: '#060606', borderRadius: 6, display: 'flex', border: '1px solid #1A1A1A', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
             <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 260 }}>
               {linked && (
                 <div style={{ position: 'absolute', left: 40, right: 40, top: 28, height: 2, transform: 'translateY(-50%)', background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.7) 0, rgba(255,255,255,0.7) 6px, transparent 6px, transparent 12px)', backgroundSize: '12px 2px', animation: 'march 0.5s linear infinite', zIndex: 0 }} />
               )}
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1 }}>
                 <div onClick={() => setSourceSel(true)} style={{ 
                   width: 56, height: 56, borderRadius: '50%', 
                   background: sourceSel ? '#161616' : '#0D0D0D', 
                   border: `1px solid ${sourceSel ? colors.opinion : '#2A2A2A'}`,
                   display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                   transition: 'all 0.2s'
                 }}>
                   <Book color={sourceSel ? colors.opinion : colors.neutral500} size={22} strokeWidth={1.5} />
                 </div>
                 <span style={{ fontSize: 10, color: sourceSel ? colors.opinion : colors.neutral500, fontWeight: 500 }}>Resource</span>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1 }}>
                 <div onClick={() => setTargetSel(true)} style={{ 
                   width: 56, height: 56, borderRadius: '50%',
                   background: targetSel ? '#161616' : '#0D0D0D', 
                   border: `1px solid ${targetSel ? colors.template : '#2A2A2A'}`,
                   display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                   transition: 'all 0.2s'
                 }}>
                   <FileText color={targetSel ? colors.template : colors.neutral500} size={22} strokeWidth={1.5} />
                 </div>
                 <span style={{ fontSize: 10, color: targetSel ? colors.template : colors.neutral500, fontWeight: 500 }}>Entry</span>
               </div>
             </div>
          </div>
          <div style={{ height: 36, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {linked && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.opinion, fontSize: 12 }}>
                <Check size={13} /> Link created
              </div>
            )}
          </div>
        </Slide>
      );

      /* ── 10  DONE (no summary pills) ── */
      case 10: return (
        <Slide>
          <Rocket size={48} color={colors.opinion} strokeWidth={1.5} style={{ marginBottom: 24 }} />
          <h2 style={{ fontSize: 28, margin: '0 0 8px 0', fontWeight: 800, letterSpacing: '-0.03em' }}>You're Ready</h2>
          <p style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 28, lineHeight: 1.6, maxWidth: 300 }}>
            You've learned to create resources, capture opinions, organize topics, and link knowledge.
          </p>
          <button 
            onClick={() => document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ 
              padding: '14px 32px', background: colors.opinion, color: '#000', fontSize: 15, 
              borderRadius: 6, fontWeight: 700, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'opacity 0.2s'
            }}
          >
            Start building your knowledge <ArrowRight size={16} />
          </button>
        </Slide>
      );
    }
  };

  return (
    <div style={{ background: colors.bg, color: colors.textPrimary }}>
      <style>{`
        @keyframes march {
          to { background-position: -12px 0; }
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.15); }
          70% { box-shadow: 0 0 0 20px rgba(255, 255, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rltx-slide-wrap {
          animation: slideIn 0.35s ease-out;
        }
        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          outline: none;
          border: 1px solid #2A2A2A;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${colors.opinion};
          cursor: pointer;
          box-shadow: 0 0 10px rgba(142,158,90,0.5);
          border: 2px solid #fff;
        }
        input[type=text], input[type=text]:focus {
          outline: none;
          transition: border-color 0.2s;
        }
        input[type=text]:focus {
          border-color: #444 !important;
        }
        .rltx-link-card {
          padding: 14px 18px;
          background: ${colors.surface};
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #fff;
          border: 1px solid #1F1F1F;
          text-decoration: none;
          transition: all 0.2s;
          font-size: 14px;
        }
        .rltx-link-card:hover {
          background: #1A1A1A;
          border-color: #333;
        }
      `}</style>

      {/* ─── HEADER ─── */}
      <header style={{ 
        width: '100%', borderBottom: '1px solid #1A1A1A',
        background: colors.bg,
        position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'center'
      }}>
        <div style={{
          width: '100%', maxWidth: 560, padding: '14px 24px', boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img 
              src="https://raw.githubusercontent.com/saad-ibra/gray-matter/main/core/designsystem/src/main/res/drawable/app_logo_full.png" 
              alt="Relatrix" 
              style={{ width: 24, height: 24, borderRadius: 5 }} 
            />
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Relatrix</span>
          </div>
          <a href="https://github.com/saad-ibra/gray-matter" target="_blank" rel="noreferrer"
            style={{ color: colors.neutral500, textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = colors.neutral500}
          >
            <Terminal size={14} /> GitHub
          </a>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section style={{
        minHeight: '80dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '60px 24px 40px', textAlign: 'center'
      }}>
        <img 
          src="https://raw.githubusercontent.com/saad-ibra/gray-matter/main/core/designsystem/src/main/res/drawable/app_logo_full.png" 
          alt="Relatrix" 
          style={{ width: 72, height: 72, borderRadius: 14, marginBottom: 28 }} 
        />
        <div style={{
          fontSize: 13, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: colors.opinion, marginBottom: 16, fontFamily: 'monospace'
        }}>
          Relatrix
        </div>
        <h1 style={{ 
          fontSize: 'clamp(32px, 7vw, 48px)', fontWeight: 700, margin: '0 0 16px 0',
          letterSpacing: '-0.03em', lineHeight: 1.1, maxWidth: 480
        }}>
          Your personal knowledge base
        </h1>
        <p style={{ 
          color: colors.textSecondary, fontSize: 'clamp(15px, 3.5vw, 17px)', maxWidth: 400, lineHeight: 1.6,
          margin: '0 0 36px 0'
        }}>
          Capture thoughts, annotate documents, and watch your ideas form a living, interconnected matrix.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="#tutorial" onClick={e => { e.preventDefault(); document.getElementById('tutorial')?.scrollIntoView({ behavior: 'smooth' }); }}
            style={{
              padding: '12px 24px', borderRadius: 6, background: colors.opinion, color: '#000',
              fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'opacity 0.2s'
            }}
          >
            Try the Tutorial <ChevronDown size={16} />
          </a>
          <a href="https://github.com/saad-ibra/gray-matter" target="_blank" rel="noreferrer"
            style={{
              padding: '12px 24px', borderRadius: 6, background: 'transparent',
              border: '1px solid #333', color: '#fff',
              fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'border-color 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#666'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; }}
          >
            <Terminal size={15} /> View Source
          </a>
        </div>
      </section>

      {/* ─── COLOR STRIP ─── */}
      <section style={{ padding: '0 24px 48px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { name: 'Opinion', color: colors.opinion },
            { name: 'Bookmark', color: colors.bookmark },
            { name: 'Annotation', color: colors.annotation },
            { name: 'Template', color: colors.template },
            { name: 'Lookup', color: colors.lookup },
            { name: 'Vision', color: colors.visual },
          ].map(c => (
            <div key={c.name} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 4,
              background: '#0D0D0D', border: '1px solid #1A1A1A',
              fontSize: 11, color: c.color, fontFamily: 'monospace'
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
              {c.name}
            </div>
          ))}
        </div>
      </section>

      {/* ─── TUTORIAL ─── */}
      <section id="tutorial" style={{
        borderTop: '1px solid #1A1A1A', borderBottom: '1px solid #1A1A1A',
        background: colors.bg
      }}>
        <div style={{ textAlign: 'center', padding: '48px 24px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.opinion, marginBottom: 8, fontFamily: 'monospace' }}>Interactive</div>
          <h2 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>Try it yourself</h2>
          <p style={{ color: colors.textSecondary, fontSize: 14, margin: '0 0 32px 0' }}>Walk through the onboarding. No download needed.</p>
        </div>
        <div style={{ minHeight: '70dvh', display: 'flex', flexDirection: 'column', padding: 'clamp(16px, 4vh, 32px) 16px', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
          <div key={slide} className="rltx-slide-wrap" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {renderSlide()}
          </div>

          <div style={{ width: '100%', maxWidth: 480, display: 'flex', justifyContent: 'space-between', marginTop: 'clamp(20px, 4vh, 36px)', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ width: 40 }}>
              {slide > 0 && (
                <button onClick={goBack} style={{ width: 40, height: 40, borderRadius: '50%', background: '#111', border: '1px solid #1F1F1F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1A1A1A'}
                  onMouseLeave={e => e.currentTarget.style.background = '#111'}
                >
                  <ArrowLeft size={18} />
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: 4 }}>
              {[...Array(totalSlides)].map((_, i) => (
                <div key={i} style={{ 
                  width: i === slide ? 20 : 6, height: 6, borderRadius: 3,
                  background: i === slide ? colors.opinion : '#1A1A1A',
                  transition: 'all 0.3s'
                }} />
              ))}
            </div>

            <div style={{ width: 40 }}>
              {slide < totalSlides - 1 && canAdvance() && (
                <button onClick={advance} style={{ width: 40, height: 40, borderRadius: '50%', background: colors.primary, border: 'none', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── EXPLORE ─── */}
      <section id="explore-section" style={{ padding: '60px 24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: colors.opinion, marginBottom: 8, fontFamily: 'monospace' }}>Get Started</div>
            <h2 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Explore Relatrix</h2>
            <p style={{ color: colors.textSecondary, fontSize: 14, margin: 0, lineHeight: 1.6 }}>Open source. Privacy-first. Available on F-Droid.</p>
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

      {/* ─── FOOTER ─── */}
      <footer style={{
        borderTop: '1px solid #1A1A1A', padding: '28px 24px',
        display: 'flex', justifyContent: 'center'
      }}>
        <div style={{
          width: '100%', maxWidth: 560,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 12, color: colors.neutral500
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img 
              src="https://raw.githubusercontent.com/saad-ibra/gray-matter/main/core/designsystem/src/main/res/drawable/app_logo_full.png" 
              alt="" style={{ width: 14, height: 14, borderRadius: 3, opacity: 0.5 }} 
            />
            Relatrix · by Saad Ibra
          </div>
          <a href="/" style={{ color: colors.neutral500, textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = colors.neutral500}
          >
            saadibra.mooo.com
          </a>
        </div>
      </footer>
    </div>
  );
}
