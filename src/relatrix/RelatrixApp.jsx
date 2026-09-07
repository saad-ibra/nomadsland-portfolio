import React, { useState, useEffect } from 'react';
import { 
  FileText, Globe, Edit2, Plus, File, Book, Image as ImageIcon, 
  Bookmark, Rocket, ArrowLeft, ArrowRight, Check,
  Terminal, Smartphone, Mail, Tag, AlertCircle, Edit, Folder,
  Highlighter, List, Camera
} from 'lucide-react';

const colors = {
  primary: '#e0e0e0',
  onPrimary: '#000',
  bg: '#000000',
  surface: '#111111',
  surfaceHigh: '#222222',
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  opinion: '#ffb74d',
  annotation: '#81c784',
  bookmark: '#64b5f6',
  template: '#ba68c8',
  lookup: '#4dd0e1',
  visual: '#f06292',
  neutral400: '#9e9e9e',
  neutral500: '#757575',
  neutral700: '#616161',
  neutral800: '#424242',
  neutral900: '#212121',
};

const Button = ({ onClick, disabled, children, style }) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    style={{
      padding: '12px 24px', borderRadius: '24px', border: 'none',
      background: disabled ? colors.neutral800 : colors.primary,
      color: disabled ? colors.textSecondary : colors.onPrimary,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      fontSize: 24, fontFamily: 'inherit',
      ...style
    }}
  >
    {children}
  </button>
);

const SlideContainer = ({ children }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', 
    width: '100%', maxWidth: '550px', margin: '0 auto', minHeight: '380px',
    justifyContent: 'center', textAlign: 'center', fontFamily: 'inherit'
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

  // Graph state
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
      case 0: return (
        <SlideContainer>
          <img 
            src="https://raw.githubusercontent.com/saad-ibra/gray-matter/main/core/designsystem/src/main/res/drawable/app_logo_full.png" 
            alt="Relatrix Logo" 
            style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 16, objectFit: 'cover' }} 
          />
          <h1 style={{ fontSize: 40, margin: '0 0 12px 0' }}>Welcome to Relatrix</h1>
          <p style={{ color: colors.textSecondary, fontSize: 24 }}>Let's build your first piece of knowledge.</p>
        </SlideContainer>
      );
      case 1: return (
        <SlideContainer>
          <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div 
              onClick={advance}
              style={{ 
                width: 100, height: 100, borderRadius: '50%', 
                background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                animation: 'pulse 2s infinite'
              }}
            >
              <Plus size={48} color="#fff" />
            </div>
          </div>
          <h2 style={{ fontSize: 40, margin: '0 0 8px 0' }}>This is how everything starts</h2>
          <p style={{ color: colors.textSecondary, fontSize: 24 }}>Tap the + to begin.</p>
        </SlideContainer>
      );
      case 2: return (
        <SlideContainer>
          <h2 style={{ fontSize: 40, margin: '0 0 8px 0' }}>Add a Resource</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 20, fontSize: 24 }}>What would you like to add? Pick one.</p>
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            {[
              { id: 'File', icon: File },
              { id: 'Link', icon: Globe },
              { id: 'Note', icon: Edit2 }
            ].map(r => {
              const isSel = resource === r.id;
              const op = (resource && !isSel) ? 0.3 : 1;
              return (
                <div 
                  key={r.id} onClick={() => setResource(r.id)}
                  style={{
                    flex: 1, aspectRatio: '1/1', borderRadius: 16,
                    background: isSel ? 'rgba(224,224,224,0.15)' : colors.neutral900,
                    border: `1px solid ${isSel ? colors.primary : colors.neutral800}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', opacity: op, transition: 'all 0.2s'
                  }}
                >
                  <r.icon size={32} color={isSel ? colors.primary : colors.textPrimary} />
                  <span style={{ marginTop: 8, fontSize: 24, color: isSel ? colors.primary : colors.textSecondary }}>{r.id}</span>
                </div>
              )
            })}
          </div>
          {resource && <p style={{ color: colors.opinion, marginTop: 16, fontSize: 24 }}>✓ {resource} added!</p>}
        </SlideContainer>
      );
      case 3: 
        const confLabel = confidence <= 25 ? "Uncertain" : confidence <= 50 ? "Somewhat sure" : confidence <= 75 ? "Confident" : "Very confident";
        const ResIcon = resource === 'Link' ? Globe : resource === 'Note' ? Edit2 : File;
        return (
          <SlideContainer>
            <div style={{ background: colors.neutral900, padding: 12, borderRadius: 12, width: '100%', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${colors.neutral800}` }}>
              <ResIcon size={20} color={colors.primary} />
              <span style={{ fontSize: 24 }}>My First {resource || "Resource"}</span>
            </div>
            
            {!opinionSaved ? (
              <>
                <h2 style={{ fontSize: 40, margin: '0 0 4px 0' }}>Your First Opinion</h2>
                <p style={{ color: colors.textSecondary, marginBottom: 12, fontSize: 20 }}>Capture your preconceived notion or initial thought about this {resource?.toLowerCase()}.</p>
                
                <input 
                  value={opinion} onChange={e => setOpinion(e.target.value)}
                  placeholder="Type your thoughts..."
                  style={{ 
                    width: '100%', padding: '16px', borderRadius: 12, background: colors.neutral900, 
                    border: `1px solid ${colors.neutral800}`, color: '#fff', fontSize: 24, marginBottom: 12,
                    fontFamily: 'inherit', boxSizing: 'border-box'
                  }}
                />
                
                <div style={{ width: '100%', textAlign: 'left', color: colors.textSecondary, fontSize: 20, marginBottom: 6 }}>Suggestions:</div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', width: '100%', paddingBottom: 16 }}>
                  {["Interesting concept", "Need to revisit", "Key insight"].map(s => (
                    <div 
                      key={s} onClick={() => setOpinion(s)}
                      style={{ padding: '6px 12px', background: `${colors.opinion}1a`, border: `1px solid ${colors.opinion}4d`, borderRadius: 20, fontSize: 20, cursor: 'pointer', color: colors.opinion, whiteSpace: 'nowrap' }}
                    >
                      {s}
                    </div>
                  ))}
                </div>

                <div style={{ width: '100%', textAlign: 'left', color: colors.textSecondary, fontSize: 20, marginTop: 16 }}>Confidence: {confidence}% · {confLabel}</div>
                <input type="range" min="0" max="100" value={confidence} onChange={e => setConfidence(e.target.value)} style={{ width: '100%', marginTop: 8, marginBottom: 16, accentColor: colors.opinion }} />
                
                <button 
                  onClick={() => { if(opinion) setOpinionSaved(true); }}
                  style={{ padding: '12px', background: opinion ? colors.opinion : `${colors.opinion}4d`, color: '#000', borderRadius: 12, border: 'none', width: '100%', fontSize: 24, cursor: opinion ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
                >
                  Save Opinion
                </button>
              </>
            ) : (
              <>
                <div style={{ width: '100%', background: `${colors.opinion}1a`, border: `1px solid ${colors.opinion}4d`, borderRadius: 12, padding: 16, textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: colors.opinion }}>
                    <Edit size={16} /> <span style={{ fontSize: 20 }}>Opinion</span>
                  </div>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>"{opinion}"</div>
                  <div style={{ fontSize: 20, color: colors.textSecondary }}>Confidence: {confidence}%</div>
                </div>
                <p style={{ color: colors.opinion, marginTop: 12, fontSize: 20 }}>This is an Opinion, your core unit of thinking.</p>
              </>
            )}
          </SlideContainer>
        );
      case 4: return (
        <SlideContainer>
          <h2 style={{ fontSize: 40, margin: '0 0 8px 0' }}>Organize into a Topic</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 20, fontSize: 24 }}>Every resource belongs to a Topic. Pick one.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            {["Philosophy", "Science", "My Notes"].map(t => {
              const isSel = topic === t;
              return (
                <div 
                  key={t} onClick={() => setTopic(t)}
                  style={{
                    padding: 16, borderRadius: 12,
                    background: isSel ? `${colors.bookmark}26` : colors.neutral900,
                    border: `1px solid ${isSel ? colors.bookmark : colors.neutral800}`,
                    cursor: 'pointer', opacity: (topic && !isSel) ? 0.3 : 1,
                    display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s'
                  }}
                >
                  <Folder size={24} color={colors.bookmark} />
                  <span style={{ fontSize: 24, color: isSel ? colors.bookmark : colors.textPrimary }}>{t}</span>
                  {isSel && <span style={{ marginLeft: 'auto', fontSize: 20, color: `${colors.bookmark}b3` }}>1 resource</span>}
                </div>
              )
            })}
          </div>
          {topic && <p style={{ color: colors.bookmark, marginTop: 16, fontSize: 20 }}>✓ Organized! Topics help you synthesize later.</p>}
        </SlideContainer>
      );
      case 5: return (
        <SlideContainer>
          <h2 style={{ fontSize: 40, margin: '0 0 8px 0' }}>Dedicated PDF Reader</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 20, fontSize: 24 }}>Active reading with 5 entry types.</p>
          <div style={{ width: '100%', height: 200, background: '#f5f5f5', borderRadius: 12, position: 'relative', overflow: 'hidden', display: 'flex' }}>
            <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ width: '90%', height: 12, background: colors.neutral700, borderRadius: 4 }} />
              <div style={{ width: '100%', height: 12, background: colors.neutral700, borderRadius: 4 }} />
              <div style={{ width: '70%', height: 12, background: colors.annotation, borderRadius: 4 }} />
              <div style={{ width: '85%', height: 12, background: colors.neutral700, borderRadius: 4 }} />
            </div>
            <div style={{ width: 80, background: '#e0e0e0', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16, gap: 16, borderLeft: '1px solid #ccc' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: colors.annotation, border: '2px solid #fff' }} />
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: colors.opinion, border: '2px solid #fff' }} />
            </div>
            <Bookmark size={32} color={colors.bookmark} style={{ position: 'absolute', top: -4, right: 8 }} />
          </div>
        </SlideContainer>
      );
      case 6: 
        const types = [
          { name: "Opinions", icon: Edit2, color: colors.opinion, desc: "Your personal thoughts" },
          { name: "Annotations", icon: Highlighter, color: colors.annotation, desc: "Highlights with notes" },
          { name: "Bookmarks", icon: Bookmark, color: colors.bookmark, desc: "Saved places in text" },
          { name: "Templates", icon: List, color: colors.template, desc: "Structured forms" },
          { name: "Lookups", icon: Book, color: colors.lookup, desc: "Search definitions" },
          { name: "Vision", icon: Camera, color: colors.visual, desc: "Image entry" }
        ];
        return (
          <SlideContainer>
            <h2 style={{ fontSize: 40, margin: '0 0 8px 0' }}>Types of Entries</h2>
            <p style={{ color: colors.textSecondary, marginBottom: 20, fontSize: 24 }}>Like an opinion, there are other ways to capture knowledge. Tap each to discover.</p>
            <div style={{ display: 'flex', justifyContent: 'space-evenly', width: '100%', marginBottom: 16 }}>
              {types.map((t, idx) => {
                const isDisc = discovered.has(idx);
                const isSel = selEntryType === idx;
                return (
                  <div 
                    key={idx} onClick={() => { setSelEntryType(idx); setDiscovered(new Set(discovered).add(idx)); }}
                    style={{
                      width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isSel ? `${t.color}33` : isDisc ? `${t.color}1a` : colors.neutral900,
                      border: `2px solid ${isSel || isDisc ? `${t.color}80` : colors.neutral800}`,
                      cursor: 'pointer'
                    }}
                  >
                    <t.icon size={24} color={isDisc ? t.color : colors.neutral700} />
                  </div>
                )
              })}
            </div>
            
            {selEntryType !== -1 ? (
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: `${types[selEntryType].color}1a`, border: `1px solid ${types[selEntryType].color}4d`, borderRadius: 12, textAlign: 'left', minHeight: 76 }}>
                <div style={{ minWidth: 24 }}>
                  {(() => { const SelIcon = types[selEntryType].icon; return <SelIcon size={24} color={types[selEntryType].color} />; })()}
                </div>
                <div>
                  <div style={{ fontSize: 24, color: types[selEntryType].color, fontWeight: 'bold' }}>{types[selEntryType].name}</div>
                  <div style={{ fontSize: 20, color: colors.textSecondary }}>{types[selEntryType].desc}</div>
                </div>
              </div>
            ) : <div style={{ height: 96 }} />}

            <p style={{ marginTop: 12, fontSize: 20, color: discovered.size >= 6 ? colors.opinion : colors.neutral500 }}>{discovered.size} / 6 discovered</p>
          </SlideContainer>
        );
      case 7: 
        const nodes = [
          { l: topic || "Topic", c: colors.neutral400, x: 0.5, y: 0.2, s: 'hex', lb: "Topic [Folder]" },
          { l: `My ${resource || "Resource"}`, c: colors.neutral400, x: 0.5, y: 0.5, s: 'tri', lb: "Resource [Link, File, Note]" },
          { l: opinion || "My thought", c: colors.opinion, x: 0.2, y: 0.7, s: 'circ', lb: "Entries" },
          { l: "Bookmark", c: colors.bookmark, x: 0.2, y: 0.85, s: 'circ' },
          { l: "Annotation", c: colors.annotation, x: 0.35, y: 0.85, s: 'circ' },
          { l: "Template", c: colors.template, x: 0.5, y: 0.85, s: 'circ' },
          { l: "Lookup", c: colors.lookup, x: 0.65, y: 0.85, s: 'circ' },
          { l: "Vision", c: colors.visual, x: 0.8, y: 0.85, s: 'circ' }
        ];
        const edges = [[0,1], [1,2], [1,3], [1,4], [1,5], [1,6], [1,7]];
        return (
          <SlideContainer>
            <h2 style={{ fontSize: 40, margin: '0 0 8px 0' }}>The Relatrix</h2>
            <p style={{ color: colors.textSecondary, marginBottom: 16, fontSize: 24 }}>Your knowledge, visualized in a 3D relationship matrix. Tap nodes to explore.</p>
            <div style={{ width: '100%', height: 260, background: 'rgba(0,0,0,0.3)', borderRadius: 16, position: 'relative' }}>
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                {edges.map((e, i) => (
                  e[0] < visibleNodes && e[1] < visibleNodes && (
                    <line key={i} x1={`${nodes[e[0]].x * 100}%`} y1={`${nodes[e[0]].y * 100}%`} x2={`${nodes[e[1]].x * 100}%`} y2={`${nodes[e[1]].y * 100}%`} stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
                  )
                ))}
              </svg>
              {nodes.map((n, i) => i < visibleNodes && (
                <div key={i}>
                  <div 
                    onClick={() => { setSelNode(i); setTappedNodes(new Set(tappedNodes).add(i)); }}
                    style={{
                      position: 'absolute', left: `${n.x * 100}%`, top: `${n.y * 100}%`,
                      width: 24, height: 24, background: (n.s === 'hex' || n.s === 'tri') ? 'transparent' : n.c,
                      border: (n.s === 'hex' || n.s === 'tri') ? `3px solid ${n.c}` : 'none',
                      borderRadius: n.s === 'circ' ? '50%' : 0,
                      transform: 'translate(-50%, -50%)',
                      clipPath: n.s === 'hex' ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' : n.s === 'tri' ? 'polygon(50% 0%, 100% 100%, 0% 100%)' : 'none',
                      cursor: 'pointer'
                    }}
                  />
                  {n.lb && <div style={{ position: 'absolute', left: `calc(${n.x * 100}% + 20px)`, top: `calc(${n.y * 100}% - 10px)`, fontSize: 16, color: colors.neutral400, textAlign: 'left', width: 120, textShadow: '0 1px 2px #000' }}>{n.lb}</div>}
                </div>
              ))}
            </div>
            <div style={{ height: 40, marginTop: 12, width: '100%' }}>
              {selNode !== -1 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', background: `${nodes[selNode].c}26`, padding: '8px 12px', borderRadius: 8, gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: nodes[selNode].c }} />
                  <span style={{ fontSize: 24 }}>{nodes[selNode].l}</span>
                </div>
              )}
            </div>
            <div style={{ fontSize: 20, color: tappedNodes.size >= 8 ? colors.opinion : colors.neutral500 }}>{tappedNodes.size} / 8 explored</div>
          </SlideContainer>
        );
      case 8: return (
        <SlideContainer>
          <h2 style={{ fontSize: 40, margin: '0 0 8px 0' }}>Organize with Tags</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 24, fontSize: 24 }}>Group related entries instantly.<br/>Tap a tag below to categorize this thought.</p>
          
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 16, width: '100%', marginBottom: 32, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: colors.opinion }} />
              <span style={{ fontSize: 24 }}>{opinion || "My crucial insight"}</span>
            </div>
            {tag && (
              <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)' }}>
                <Tag size={14} color="#fff" />
                <span style={{ fontSize: 20, color: '#fff' }}>{tag}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            {["important", "review"].map(t => (
              <div 
                key={t} onClick={() => setTag(t)}
                style={{
                  padding: '10px 16px', borderRadius: 16,
                  background: tag === t ? 'rgba(255,255,255,0.2)' : colors.neutral800,
                  display: 'flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Tag size={16} color={tag === t ? '#fff' : colors.textSecondary} />
                <span style={{ color: tag === t ? '#fff' : colors.textSecondary, fontSize: 24 }}>{t}</span>
              </div>
            ))}
          </div>
        </SlideContainer>
      );
      case 9: return (
        <SlideContainer>
          <h2 style={{ fontSize: 40, margin: '0 0 8px 0' }}>Knowledge Links</h2>
          <p style={{ color: linked ? colors.opinion : colors.textSecondary, marginBottom: 24, height: 48, fontSize: 24 }}>
            {linked ? "Connected! You can jump between them instantly." : "Knowledge links can connect any Topic, Resource, or Entry in your library.\nTap the entries below to link them."}
          </p>
          <div style={{ width: '100%', height: 200, background: 'rgba(0,0,0,0.3)', borderRadius: 16, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
             {linked && (
               <div style={{ position: 'absolute', left: 80, right: 80, height: 6, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.8), rgba(255,255,255,0.8) 15px, transparent 15px, transparent 25px)', opacity: 0.8, zIndex: 0 }} />
             )}
             <div onClick={() => setSourceSel(true)} style={{ width: 64, height: 64, borderRadius: '50%', background: sourceSel ? colors.opinion : colors.neutral800, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1 }}>
               <Book color={sourceSel ? '#000' : '#fff'} size={32} />
             </div>
             <div onClick={() => setTargetSel(true)} style={{ width: 64, height: 64, borderRadius: '50%', background: targetSel ? colors.template : colors.neutral800, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1 }}>
               <FileText color={targetSel ? '#000' : '#fff'} size={32} />
             </div>
          </div>
        </SlideContainer>
      );
      case 10: return (
        <SlideContainer>
          <Rocket size={64} color={colors.opinion} style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 40, margin: '0 0 12px 0' }}>You're Ready</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 32, fontSize: 24 }}>Start building your knowledge.</p>
        </SlideContainer>
      );
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.textPrimary, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 15px rgba(255, 255, 255, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
        .links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }
        .link-card {
          padding: 16px;
          background: ${colors.surface};
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #fff;
          border: 1px solid ${colors.surfaceHigh};
          text-decoration: none;
          transition: background 0.2s;
          font-size: 24px;
        }
        .link-card:hover {
          background: ${colors.surfaceHigh};
        }
      `}</style>
      
      <div style={{ flex: 1, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{ width: '100%', maxWidth: 600, display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 40 }}>
          {[...Array(totalSlides)].map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === slide ? colors.primary : colors.neutral800 }} />
          ))}
        </div>

        <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center' }}>
          {renderSlide()}
        </div>

        <div style={{ width: '100%', maxWidth: 600, display: 'flex', justifyContent: 'space-between', marginTop: 40, alignItems: 'center' }}>
          <div style={{ width: 60 }}>
            {slide > 0 && (
              <button onClick={goBack} style={{ width: 44, height: 44, borderRadius: '50%', background: colors.neutral800, border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ArrowLeft size={20} />
              </button>
            )}
          </div>
          
          <div style={{ width: 60 }}>
            {slide < totalSlides - 1 && canAdvance() && (
              <button onClick={advance} style={{ width: 44, height: 44, borderRadius: '50%', background: colors.primary, border: 'none', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', float: 'right' }}>
                <ArrowRight size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ width: '100%', background: colors.surfaceHigh, padding: '40px 24px', borderTop: `1px solid #333` }}>
        <h3 style={{ textAlign: 'center', color: colors.textSecondary, marginBottom: 24, fontSize: 24, fontWeight: 'normal' }}>Explore Relatrix</h3>
        <div className="links-grid">
          <a href="https://github.com/saad-ibra/gray-matter" target="_blank" rel="noreferrer" className="link-card">
            <Terminal size={24} /> <span>GitHub Repository</span>
          </a>
          <a href="https://f-droid.org/packages/com.saadibra.graymatter" target="_blank" rel="noreferrer" className="link-card">
            <Smartphone size={24} /> <span>Get it on F-Droid</span>
          </a>
          <a href="https://github.com/saad-ibra/gray-matter/releases" target="_blank" rel="noreferrer" className="link-card">
            <Tag size={24} /> <span>Releases</span>
          </a>
          <a href="https://github.com/saad-ibra/gray-matter/issues" target="_blank" rel="noreferrer" className="link-card">
            <AlertCircle size={24} /> <span>Raise Issues</span>
          </a>
          <a href="https://saadibra.mooo.com/contact/" className="link-card">
            <Mail size={24} /> <span>Contact Me</span>
          </a>
        </div>
      </div>
    </div>
  );
}
