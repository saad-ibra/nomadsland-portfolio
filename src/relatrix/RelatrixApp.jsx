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
  opinion: '#8E9E5A',     // Green
  bookmark: '#C4A84E',    // Yellow
  annotation: '#C47A5A',  // Orange
  template: '#7E6A8C',    // Purple
  lookup: '#BF5A6A',      // Pink/Red
  visual: '#5A9E8C',      // Teal
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
      fontSize: 16, fontWeight: 'bold', fontFamily: 'inherit',
      ...style
    }}
  >
    {children}
  </button>
);

const SlideContainer = ({ children, accent }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', 
    width: '100%', maxWidth: '480px', margin: '0 auto', minHeight: 'min(380px, 60vh)',
    justifyContent: 'center', textAlign: 'center', fontFamily: 'inherit',
    padding: '32px 24px', boxSizing: 'border-box',
    background: `linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.005) 100%)`,
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 24,
    backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    boxShadow: '0 4px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
    position: 'relative', overflow: 'hidden'
  }}>
    {/* Top accent line */}
    {accent && <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, borderRadius: '0 0 4px 4px', background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.5 }} />}
    {children}
  </div>
);

/* ── Feature pill for the features section ── */
const FeatureCard = ({ icon: Icon, color, title, desc }) => (
  <div style={{
    padding: 20, borderRadius: 16, background: colors.surface,
    border: `1px solid ${colors.surfaceHigh}`,
    display: 'flex', flexDirection: 'column', gap: 12,
    transition: 'border-color 0.25s, transform 0.25s',
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = colors.surfaceHigh; e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={20} color={color} />
    </div>
    <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
    <div style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 1.5 }}>{desc}</div>
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
      case 0: return (
        <SlideContainer accent={colors.opinion}>
          <div style={{ position: 'relative', marginBottom: 28 }}>
            <div style={{ position: 'absolute', inset: -16, borderRadius: 32, background: `radial-gradient(circle, ${colors.opinion}20 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <img 
              src="https://raw.githubusercontent.com/saad-ibra/gray-matter/main/core/designsystem/src/main/res/drawable/app_logo_full.png" 
              alt="Relatrix Logo" 
              style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover', position: 'relative', boxShadow: `0 0 32px ${colors.opinion}30` }} 
            />
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.opinion, marginBottom: 12 }}>Interactive Tutorial</div>
          <h1 style={{ fontSize: 28, margin: '0 0 12px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>Welcome to Relatrix</h1>
          <p style={{ color: colors.textSecondary, fontSize: 16, lineHeight: 1.6, maxWidth: 340 }}>Let's build your first piece of knowledge together, step by step.</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 28, alignItems: 'center' }}>
            {[
              { c: colors.opinion, l: 'Opinion' },
              { c: colors.bookmark, l: 'Bookmark' },
              { c: colors.annotation, l: 'Annotation' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 12, background: `${item.c}12`, border: `1px solid ${item.c}25` }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.c }} />
                <span style={{ fontSize: 11, color: item.c }}>{item.l}</span>
              </div>
            ))}
          </div>
        </SlideContainer>
      );
      case 1: return (
        <SlideContainer>
          <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: -24, borderRadius: '50%', background: `radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)`, pointerEvents: 'none' }} />
            {/* Orbit ring */}
            <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.1)' }} />
            <div 
              onClick={advance}
              style={{ 
                width: 100, height: 100, borderRadius: '50%', 
                background: 'linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
                border: '2px solid rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                animation: 'pulse 2s infinite',
                boxShadow: '0 0 40px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.15)'
              }}
            >
              <Plus size={44} color="#fff" strokeWidth={1.5} />
            </div>
          </div>
          <h2 style={{ fontSize: 26, margin: '0 0 10px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>This is how everything starts</h2>
          <p style={{ color: colors.textSecondary, fontSize: 15 }}>Tap the <span style={{ color: '#fff', fontWeight: 600 }}>+</span> to begin.</p>
        </SlideContainer>
      );
      case 2: return (
        <SlideContainer accent={colors.primary}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.neutral500, marginBottom: 8 }}>Step 1</div>
          <h2 style={{ fontSize: 24, margin: '0 0 6px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>Add a Resource</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 24, fontSize: 15 }}>What would you like to capture?</p>
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            {[
              { id: 'File', icon: File, sub: 'PDF, doc, image' },
              { id: 'Link', icon: Globe, sub: 'URL or webpage' },
              { id: 'Note', icon: Edit2, sub: 'Write from scratch' }
            ].map(r => {
              const isSel = resource === r.id;
              const op = (resource && !isSel) ? 0.3 : 1;
              return (
                <div 
                  key={r.id} onClick={() => setResource(r.id)}
                  style={{
                    flex: 1, borderRadius: 20, padding: '20px 8px',
                    background: isSel ? `rgba(224,224,224,0.10)` : 'rgba(33,33,33,0.5)',
                    border: `1.5px solid ${isSel ? colors.primary : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                    cursor: 'pointer', opacity: op, transition: 'all 0.25s',
                    boxShadow: isSel ? `0 0 16px rgba(224,224,224,0.08)` : 'none'
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: isSel ? 'rgba(224,224,224,0.12)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <r.icon size={24} color={isSel ? colors.primary : colors.neutral500} strokeWidth={1.5} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: isSel ? colors.primary : colors.textPrimary }}>{r.id}</span>
                  <span style={{ fontSize: 11, color: colors.neutral500 }}>{r.sub}</span>
                </div>
              )
            })}
          </div>
          {resource && (
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: `${colors.opinion}15`, border: `1px solid ${colors.opinion}30` }}>
              <Check size={16} color={colors.opinion} />
              <span style={{ color: colors.opinion, fontSize: 14, fontWeight: 500 }}>{resource} selected</span>
            </div>
          )}
        </SlideContainer>
      );
      case 3: 
        const confLabel = confidence <= 25 ? "Uncertain" : confidence <= 50 ? "Somewhat sure" : confidence <= 75 ? "Confident" : "Very confident";
        const ResIcon = resource === 'Link' ? Globe : resource === 'Note' ? Edit2 : File;
        const confColor = confidence <= 25 ? colors.lookup : confidence <= 50 ? colors.annotation : confidence <= 75 ? colors.bookmark : colors.opinion;
        return (
          <SlideContainer accent={colors.opinion}>
            {/* Resource context bar */}
            <div style={{ background: 'rgba(33,33,33,0.5)', padding: '10px 14px', borderRadius: 14, width: '100%', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResIcon size={16} color={colors.primary} strokeWidth={1.5} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>My First {resource || "Resource"}</div>
                <div style={{ fontSize: 11, color: colors.neutral500 }}>{resource || "Resource"} · Just added</div>
              </div>
            </div>
            
            {!opinionSaved ? (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.opinion, marginBottom: 6 }}>Step 2</div>
                <h2 style={{ fontSize: 22, margin: '0 0 6px 0', fontWeight: 700 }}>Your First Opinion</h2>
                <p style={{ color: colors.textSecondary, marginBottom: 14, fontSize: 13, lineHeight: 1.5 }}>What's your initial thought about this {resource?.toLowerCase()}?</p>
                
                <input 
                  value={opinion} onChange={e => setOpinion(e.target.value)}
                  placeholder="Type your thoughts..."
                  style={{ 
                    width: '100%', padding: '14px 16px', borderRadius: 14, background: 'rgba(33,33,33,0.6)', 
                    border: `1.5px solid rgba(255,255,255,0.08)`, color: '#fff', fontSize: 15,
                    fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 10,
                    transition: 'border-color 0.2s'
                  }}
                />
                
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', width: '100%', paddingBottom: 14 }}>
                  {["Interesting concept", "Need to revisit", "Key insight"].map(s => (
                    <div 
                      key={s} onClick={() => setOpinion(s)}
                      style={{ 
                        padding: '7px 14px', background: opinion === s ? `${colors.opinion}25` : `${colors.opinion}0d`, 
                        border: `1px solid ${opinion === s ? colors.opinion : `${colors.opinion}30`}`, 
                        borderRadius: 20, fontSize: 13, cursor: 'pointer', color: colors.opinion, whiteSpace: 'nowrap',
                        transition: 'all 0.2s', fontWeight: opinion === s ? 600 : 400
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>

                <div style={{ width: '100%', marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: colors.textSecondary }}>Confidence</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: confColor }}>{confidence}% · {confLabel}</span>
                  </div>
                  <input type="range" min="0" max="100" value={confidence} onChange={e => setConfidence(e.target.value)} style={{ width: '100%', marginBottom: 16, accentColor: colors.opinion }} />
                </div>
                
                <button 
                  onClick={() => { if(opinion) setOpinionSaved(true); }}
                  style={{ 
                    padding: '14px', background: opinion ? colors.opinion : `${colors.opinion}4d`, color: '#000', 
                    borderRadius: 16, border: 'none', width: '100%', fontSize: 15, fontWeight: 700, 
                    cursor: opinion ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                    boxShadow: opinion ? `0 0 20px ${colors.opinion}30` : 'none',
                    transition: 'all 0.25s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  <Check size={18} /> Save Opinion
                </button>
              </>
            ) : (
              <>
                <div style={{ width: '100%', background: `${colors.opinion}12`, border: `1px solid ${colors.opinion}30`, borderRadius: 16, padding: 20, textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${colors.opinion}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Edit size={14} color={colors.opinion} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.opinion, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opinion</span>
                  </div>
                  <div style={{ fontSize: 17, marginBottom: 8, lineHeight: 1.4 }}>"{opinion}"</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: colors.neutral800, overflow: 'hidden' }}>
                      <div style={{ width: `${confidence}%`, height: '100%', borderRadius: 2, background: confColor, transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 12, color: colors.textSecondary, minWidth: 30 }}>{confidence}%</span>
                  </div>
                </div>
                <p style={{ color: colors.opinion, marginTop: 14, fontSize: 13, lineHeight: 1.5 }}>Opinions are your core unit of thinking in Relatrix.</p>
              </>
            )}
          </SlideContainer>
        );
      case 4: return (
        <SlideContainer accent={colors.bookmark}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.neutral500, marginBottom: 8 }}>Step 3</div>
          <h2 style={{ fontSize: 24, margin: '0 0 6px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>Organize into a Topic</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 22, fontSize: 15 }}>Topics are folders for your resources.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            {[
              { name: "Philosophy", emoji: "🏛" },
              { name: "Science", emoji: "🔬" },
              { name: "My Notes", emoji: "📝" }
            ].map(t => {
              const isSel = topic === t.name;
              return (
                <div 
                  key={t.name} onClick={() => setTopic(t.name)}
                  style={{
                    padding: '14px 16px', borderRadius: 16,
                    background: isSel ? `${colors.bookmark}15` : 'rgba(33,33,33,0.5)',
                    border: `1.5px solid ${isSel ? colors.bookmark : 'rgba(255,255,255,0.06)'}`,
                    cursor: 'pointer', opacity: (topic && !isSel) ? 0.3 : 1,
                    display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.25s',
                    boxShadow: isSel ? `0 0 12px ${colors.bookmark}15` : 'none'
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: isSel ? `${colors.bookmark}20` : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {t.emoji}
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: isSel ? colors.bookmark : colors.textPrimary }}>{t.name}</div>
                    {isSel && <div style={{ fontSize: 12, color: `${colors.bookmark}99`, marginTop: 2 }}>1 resource inside</div>}
                  </div>
                  {isSel && <Check size={18} color={colors.bookmark} />}
                </div>
              )
            })}
          </div>
          {topic && (
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: `${colors.bookmark}12`, border: `1px solid ${colors.bookmark}25` }}>
              <Folder size={14} color={colors.bookmark} />
              <span style={{ color: colors.bookmark, fontSize: 13 }}>Topics help you synthesize knowledge later.</span>
            </div>
          )}
        </SlideContainer>
      );
      case 5: return (
        <SlideContainer accent={colors.annotation}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.neutral500, marginBottom: 8 }}>Built-in Reader</div>
          <h2 style={{ fontSize: 24, margin: '0 0 6px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>Dedicated PDF Reader</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 20, fontSize: 15 }}>Read actively with inline entries.</p>
          {/* Realistic PDF reader mockup */}
          <div style={{ width: '100%', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            {/* Title bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#1a1a1a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#febc2e' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840' }} />
              </div>
              <div style={{ flex: 1, fontSize: 11, color: colors.neutral500, textAlign: 'center' }}>research_paper.pdf</div>
            </div>
            {/* Document body */}
            <div style={{ display: 'flex', background: '#0d0d0d' }}>
              <div style={{ flex: 1, padding: '16px 16px 20px' }}>
                {/* Title line */}
                <div style={{ width: '75%', height: 10, background: 'rgba(255,255,255,0.25)', borderRadius: 3, marginBottom: 14 }} />
                {/* Text lines */}
                <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 8 }} />
                <div style={{ width: '92%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 8 }} />
                {/* Highlighted annotation */}
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <div style={{ width: '68%', height: 6, background: `${colors.annotation}50`, borderRadius: 2 }} />
                  <div style={{ position: 'absolute', left: '72%', top: -12, padding: '3px 8px', borderRadius: 6, background: colors.annotation, fontSize: 9, color: '#000', fontWeight: 600, whiteSpace: 'nowrap' }}>Annotation ✎</div>
                </div>
                <div style={{ width: '88%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 8 }} />
                <div style={{ width: '95%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 8 }} />
                {/* Bookmarked line */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Bookmark size={10} color={colors.bookmark} fill={colors.bookmark} />
                  <div style={{ width: '80%', height: 6, background: `${colors.bookmark}30`, borderRadius: 2 }} />
                </div>
                <div style={{ width: '70%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }} />
              </div>
              {/* Side toolbar */}
              <div style={{ width: 44, background: 'rgba(255,255,255,0.03)', borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 10 }}>
                {[
                  { icon: Edit2, color: colors.opinion },
                  { icon: Highlighter, color: colors.annotation },
                  { icon: Bookmark, color: colors.bookmark },
                  { icon: Camera, color: colors.visual },
                ].map((tool, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: 8, background: `${tool.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <tool.icon size={13} color={tool.color} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SlideContainer>
      );
      case 6: 
        const types = [
          { name: "Opinions", icon: Edit2, color: colors.opinion, desc: "Your personal thoughts and reactions" },
          { name: "Annotations", icon: Highlighter, color: colors.annotation, desc: "Highlighted passages with notes" },
          { name: "Bookmarks", icon: Bookmark, color: colors.bookmark, desc: "Save your place in a document" },
          { name: "Templates", icon: List, color: colors.template, desc: "Structured reusable forms" },
          { name: "Lookups", icon: Book, color: colors.lookup, desc: "Search and define terms" },
          { name: "Vision", icon: Camera, color: colors.visual, desc: "Capture from camera or image" }
        ];
        return (
          <SlideContainer accent={colors.visual}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.neutral500, marginBottom: 8 }}>6 Entry Types</div>
            <h2 style={{ fontSize: 24, margin: '0 0 6px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>Types of Entries</h2>
            <p style={{ color: colors.textSecondary, marginBottom: 20, fontSize: 15 }}>Tap each to discover how you can capture knowledge.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%', marginBottom: 16 }}>
              {types.map((t, idx) => {
                const isDisc = discovered.has(idx);
                const isSel = selEntryType === idx;
                const IconComp = t.icon;
                return (
                  <div 
                    key={idx} onClick={() => { setSelEntryType(idx); setDiscovered(new Set(discovered).add(idx)); }}
                    style={{
                      padding: '14px 8px', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      background: isSel ? `${t.color}18` : isDisc ? `${t.color}0a` : 'rgba(33,33,33,0.5)',
                      border: `1.5px solid ${isSel ? `${t.color}60` : isDisc ? `${t.color}25` : 'rgba(255,255,255,0.04)'}`,
                      cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: isSel ? `0 0 12px ${t.color}15` : 'none'
                    }}
                  >
                    <IconComp size={20} color={isDisc ? t.color : colors.neutral700} strokeWidth={1.5} />
                    <span style={{ fontSize: 11, fontWeight: isDisc ? 600 : 400, color: isDisc ? t.color : colors.neutral600 }}>{t.name}</span>
                  </div>
                )
              })}
            </div>
            
            {selEntryType !== -1 ? (
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: `${types[selEntryType].color}12`, border: `1px solid ${types[selEntryType].color}30`, borderRadius: 16, textAlign: 'left', minHeight: 72 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${types[selEntryType].color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {(() => { const SelIcon = types[selEntryType].icon; return <SelIcon size={20} color={types[selEntryType].color} /> })()}
                </div>
                <div>
                  <div style={{ fontSize: 16, color: types[selEntryType].color, fontWeight: 600 }}>{types[selEntryType].name}</div>
                  <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 1.4 }}>{types[selEntryType].desc}</div>
                </div>
              </div>
            ) : <div style={{ height: 72 }} />}

            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 60, height: 4, borderRadius: 2, background: colors.neutral800, overflow: 'hidden' }}>
                <div style={{ width: `${(discovered.size / 6) * 100}%`, height: '100%', borderRadius: 2, background: discovered.size >= 6 ? colors.opinion : colors.neutral500, transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: 13, color: discovered.size >= 6 ? colors.opinion : colors.neutral500 }}>{discovered.size}/6</span>
            </div>
          </SlideContainer>
        );
      case 7: 
        const nodes = [
          { l: topic || "Topic", c: colors.neutral400, x: 0.5, y: 0.2, s: 'hex', lb: "Topic [Folder]" },
          { l: `My ${resource || "Resource"}`, c: colors.neutral400, x: 0.5, y: 0.5, s: 'tri', lb: "Resource [Link, File, Note]" },
          { l: opinion || "Opinion", c: colors.opinion, x: 0.2, y: 0.7, s: 'circ', lb: "Entries" },
          { l: "Annotation", c: colors.annotation, x: 0.2, y: 0.85, s: 'circ' },
          { l: "Bookmark", c: colors.bookmark, x: 0.35, y: 0.85, s: 'circ' },
          { l: "Template", c: colors.template, x: 0.5, y: 0.85, s: 'circ' },
          { l: "Lookup", c: colors.lookup, x: 0.65, y: 0.85, s: 'circ' },
          { l: "Vision", c: colors.visual, x: 0.8, y: 0.85, s: 'circ' }
        ];
        const edges = [[0,1], [1,2], [1,3], [1,4], [1,5], [1,6], [1,7]];
        return (
          <SlideContainer accent={colors.template}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.neutral500, marginBottom: 8 }}>Visualization</div>
            <h2 style={{ fontSize: 24, margin: '0 0 6px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>The Relatrix</h2>
            <p style={{ color: colors.textSecondary, marginBottom: 16, fontSize: 15 }}>Your knowledge as an interactive graph. Tap to explore.</p>
            <div style={{ width: '100%', height: 260, background: 'rgba(0,0,0,0.4)', borderRadius: 20, position: 'relative', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              {/* Grid pattern background */}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
              <svg viewBox="0 0 480 260" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  {nodes.map((n, i) => (
                    <filter key={`glow${i}`} id={`glow${i}`}>
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  ))}
                </defs>
                {edges.map((e, i) => (
                  e[0] < visibleNodes && e[1] < visibleNodes && (
                    <line key={`e${i}`} x1={`${nodes[e[0]].x * 100}%`} y1={`${nodes[e[0]].y * 100}%`} x2={`${nodes[e[1]].x * 100}%`} y2={`${nodes[e[1]].y * 100}%`} stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="6,4" />
                  )
                ))}
                {nodes.map((n, i) => i < visibleNodes && (
                  <g key={`n${i}`} transform={`translate(${n.x * 480}, ${n.y * 260})`} onClick={() => { setSelNode(i); setTappedNodes(new Set(tappedNodes).add(i)); }} style={{ cursor: 'pointer' }} filter={selNode === i ? `url(#glow${i})` : undefined}>
                    {n.s === 'hex' && (
                      <polygon points="0,-18 16,-9 16,9 0,18 -16,9 -16,-9" fill="rgba(0,0,0,0.6)" stroke={n.c} strokeWidth="1.5" />
                    )}
                    {n.s === 'tri' && (
                      <polygon points="0,-18 16,13 -16,13" fill="rgba(0,0,0,0.6)" stroke={n.c} strokeWidth="1.5" />
                    )}
                    {n.s === 'circ' && (
                      <circle cx="0" cy="0" r="10" fill={n.c} opacity={0.8} />
                    )}
                  </g>
                ))}
              </svg>
              {nodes.map((n, i) => i < visibleNodes && n.lb && (
                <div key={`l${i}`} style={{ position: 'absolute', left: `calc(${n.x * 100}% + 22px)`, top: `calc(${n.y * 100}% - 10px)`, fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'left', width: 110, letterSpacing: '0.02em' }}>{n.lb}</div>
              ))}
            </div>
            <div style={{ height: 36, marginTop: 12, width: '100%' }}>
              {selNode !== -1 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', background: `${nodes[selNode].c}18`, padding: '6px 14px', borderRadius: 10, gap: 8, border: `1px solid ${nodes[selNode].c}30` }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: nodes[selNode].c }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{nodes[selNode].l}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 60, height: 4, borderRadius: 2, background: colors.neutral800, overflow: 'hidden' }}>
                <div style={{ width: `${(tappedNodes.size / 8) * 100}%`, height: '100%', borderRadius: 2, background: tappedNodes.size >= 8 ? colors.opinion : colors.neutral500, transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: 13, color: tappedNodes.size >= 8 ? colors.opinion : colors.neutral500 }}>{tappedNodes.size}/8</span>
            </div>
          </SlideContainer>
        );
      case 8: return (
        <SlideContainer accent={colors.opinion}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.neutral500, marginBottom: 8 }}>Organize</div>
          <h2 style={{ fontSize: 24, margin: '0 0 6px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>Organize with Tags</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 20, fontSize: 15 }}>Group related entries instantly.</p>
          
          {/* Entry preview card */}
          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '16px 18px', borderRadius: 16, width: '100%', marginBottom: 24, textAlign: 'left', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: tag ? 14 : 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${colors.opinion}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Edit2 size={16} color={colors.opinion} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{opinion || "My crucial insight"}</div>
                <div style={{ fontSize: 11, color: colors.neutral500, marginTop: 2 }}>Opinion · {confidence}% confidence</div>
              </div>
            </div>
            {tag && (
              <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)' }}>
                  <Tag size={11} color="#fff" />
                  <span style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{tag}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 10, textAlign: 'left', width: '100%' }}>Select a tag:</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
            {[
              { name: "important", emoji: "🔴" },
              { name: "review", emoji: "🔄" },
              { name: "revision", emoji: "📌" }
            ].map(t => (
              <div 
                key={t.name} onClick={() => setTag(t.name)}
                style={{
                  flex: 1, padding: '12px 14px', borderRadius: 14,
                  background: tag === t.name ? 'rgba(255,255,255,0.12)' : 'rgba(33,33,33,0.5)',
                  border: `1.5px solid ${tag === t.name ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.04)'}`,
                  display: 'flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer', transition: 'all 0.2s', minWidth: 0
                }}
              >
                <span style={{ fontSize: 14 }}>{t.emoji}</span>
                <span style={{ color: tag === t.name ? '#fff' : colors.textSecondary, fontSize: 13, fontWeight: tag === t.name ? 600 : 400 }}>{t.name}</span>
              </div>
            ))}
          </div>
        </SlideContainer>
      );
      case 9: return (
        <SlideContainer accent={colors.template}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.neutral500, marginBottom: 8 }}>Connections</div>
          <h2 style={{ fontSize: 24, margin: '0 0 6px 0', fontWeight: 700, letterSpacing: '-0.02em' }}>Knowledge Links</h2>
          <p style={{ color: linked ? colors.opinion : colors.textSecondary, marginBottom: 20, fontSize: 15, lineHeight: 1.5 }}>
            {linked ? "Connected! Your knowledge is now linked." : "Tap both entries below to create a link between them."}
          </p>
          <div style={{ width: '100%', height: 180, background: 'rgba(0,0,0,0.4)', borderRadius: 20, position: 'relative', display: 'flex', border: '1px solid rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', gap: '18%', padding: '0 10%' }}>
             {/* Dashed connection line */}
             {linked && (
               <div style={{ position: 'absolute', left: '30%', right: '30%', height: 2, background: `repeating-linear-gradient(90deg, ${colors.opinion}, ${colors.opinion} 8px, transparent 8px, transparent 16px)`, zIndex: 0 }} />
             )}
             {/* Source node */}
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1 }}>
               <div onClick={() => setSourceSel(true)} style={{ 
                 width: 64, height: 64, borderRadius: 18, 
                 background: sourceSel ? `${colors.opinion}20` : 'rgba(33,33,33,0.8)', 
                 border: `2px solid ${sourceSel ? colors.opinion : 'rgba(255,255,255,0.1)'}`,
                 display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                 boxShadow: sourceSel ? `0 0 16px ${colors.opinion}25` : 'none',
                 transition: 'all 0.25s'
               }}>
                 <Book color={sourceSel ? colors.opinion : colors.neutral500} size={26} strokeWidth={1.5} />
               </div>
               <span style={{ fontSize: 11, color: sourceSel ? colors.opinion : colors.neutral500, fontWeight: 500 }}>Resource</span>
             </div>
             {/* Target node */}
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1 }}>
               <div onClick={() => setTargetSel(true)} style={{ 
                 width: 64, height: 64, borderRadius: 18,
                 background: targetSel ? `${colors.template}20` : 'rgba(33,33,33,0.8)', 
                 border: `2px solid ${targetSel ? colors.template : 'rgba(255,255,255,0.1)'}`,
                 display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                 boxShadow: targetSel ? `0 0 16px ${colors.template}25` : 'none',
                 transition: 'all 0.25s'
               }}>
                 <FileText color={targetSel ? colors.template : colors.neutral500} size={26} strokeWidth={1.5} />
               </div>
               <span style={{ fontSize: 11, color: targetSel ? colors.template : colors.neutral500, fontWeight: 500 }}>Entry</span>
             </div>
          </div>
          {linked && (
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: `${colors.opinion}12`, border: `1px solid ${colors.opinion}25` }}>
              <Check size={14} color={colors.opinion} />
              <span style={{ color: colors.opinion, fontSize: 13 }}>Link created between resource and entry.</span>
            </div>
          )}
        </SlideContainer>
      );
      case 10: return (
        <SlideContainer accent={colors.opinion}>
          {/* Sparkle decorations */}
          <div style={{ position: 'absolute', top: 40, left: 30, width: 6, height: 6, borderRadius: '50%', background: colors.opinion, opacity: 0.3, animation: 'float 3s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: 60, right: 40, width: 4, height: 4, borderRadius: '50%', background: colors.bookmark, opacity: 0.4, animation: 'float 4s ease-in-out infinite 1s' }} />
          <div style={{ position: 'absolute', bottom: 80, left: 50, width: 5, height: 5, borderRadius: '50%', background: colors.visual, opacity: 0.3, animation: 'float 3.5s ease-in-out infinite 0.5s' }} />
          
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: `radial-gradient(circle, ${colors.opinion}20 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <Rocket size={56} color={colors.opinion} strokeWidth={1.5} style={{ position: 'relative' }} />
          </div>
          <h2 style={{ fontSize: 34, margin: '0 0 8px 0', fontWeight: 800, letterSpacing: '-0.03em' }}>You're Ready</h2>
          <p style={{ color: colors.textSecondary, fontSize: 15, marginBottom: 8, lineHeight: 1.5, maxWidth: 300 }}>You've learned to create resources, capture opinions, organize topics, and link knowledge.</p>
          
          {/* Summary pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24, marginTop: 8 }}>
            {[
              { label: resource || 'Resource', color: colors.primary },
              { label: topic || 'Topic', color: colors.bookmark },
              { label: 'Opinion', color: colors.opinion },
            ].map((item, i) => (
              <div key={i} style={{ padding: '4px 12px', borderRadius: 10, background: `${item.color}15`, border: `1px solid ${item.color}25`, fontSize: 12, color: item.color, fontWeight: 500 }}>
                ✓ {item.label}
              </div>
            ))}
          </div>
          
          <Button 
            onClick={() => document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ padding: '16px 36px', background: colors.opinion, color: '#000', fontSize: 16, boxShadow: `0 0 24px ${colors.opinion}40`, borderRadius: 28, fontWeight: 700 }}
          >
            Start building your knowledge <ArrowRight size={18} />
          </Button>
        </SlideContainer>
      );
    }
  };

  return (
    <div style={{ background: colors.bg, color: colors.textPrimary }}>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 15px rgba(255, 255, 255, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rltx-slide-wrap {
          animation: slideIn 0.4s ease-out;
        }
        input[type=range] {
          -webkit-appearance: none;
          height: 6px;
          border-radius: 3px;
          background: ${colors.neutral800};
          outline: none;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${colors.opinion};
          cursor: pointer;
          box-shadow: 0 0 8px ${colors.opinion}40;
        }
        input[type=text], input[type=text]:focus {
          outline: none;
          transition: border-color 0.2s;
        }
        input[type=text]:focus {
          border-color: ${colors.opinion} !important;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rltx-link-card {
          padding: 14px 18px;
          background: ${colors.surface};
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #fff;
          border: 1px solid ${colors.surfaceHigh};
          text-decoration: none;
          transition: all 0.25s;
          font-size: 15px;
        }
        .rltx-link-card:hover {
          background: ${colors.surfaceHigh};
          border-color: ${colors.neutral500};
          transform: translateY(-1px);
        }
        @media (max-width: 480px) {
          .rltx-features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ─── STICKY HEADER ─── */}
      <header style={{ 
        width: '100%', borderBottom: `1px solid ${colors.surfaceHigh}`,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'center'
      }}>
        <div style={{
          width: '100%', maxWidth: 560, padding: '14px 24px', boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img 
              src="https://raw.githubusercontent.com/saad-ibra/gray-matter/main/core/designsystem/src/main/res/drawable/app_logo_full.png" 
              alt="Relatrix Logo" 
              style={{ width: 28, height: 28, borderRadius: 7 }} 
            />
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Relatrix</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="https://github.com/saad-ibra/gray-matter" target="_blank" rel="noreferrer"
              style={{ color: colors.textSecondary, textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = colors.textSecondary}
            >
              <Terminal size={14} /> GitHub
            </a>
            <a href="/" style={{ 
              color: colors.textSecondary, textDecoration: 'none', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 5, transition: 'color 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = colors.textSecondary}
            >
              <ArrowLeft size={14} /> Lab
            </a>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section style={{
        minHeight: '85dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '60px 24px 40px', position: 'relative', overflow: 'hidden', textAlign: 'center'
      }}>
        {/* Subtle radial glow behind logo */}
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.opinion}15 0%, transparent 70%)`,
          top: '15%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none'
        }} />

        {/* Floating color orbs */}
        <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: `${colors.opinion}08`, top: '10%', left: '10%', animation: 'float 6s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: `${colors.template}08`, bottom: '20%', right: '10%', animation: 'float 8s ease-in-out infinite 1s', pointerEvents: 'none' }} />

        <img 
          src="https://raw.githubusercontent.com/saad-ibra/gray-matter/main/core/designsystem/src/main/res/drawable/app_logo_full.png" 
          alt="Relatrix" 
          style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 28, position: 'relative', animation: 'float 4s ease-in-out infinite' }} 
        />
        <div style={{
          fontSize: 'clamp(14px, 3vw, 15px)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: colors.opinion, marginBottom: 16, position: 'relative'
        }}>
          Gray Matter
        </div>
        <h1 style={{ 
          fontSize: 'clamp(32px, 7vw, 52px)', fontWeight: 800, margin: '0 0 20px 0',
          letterSpacing: '-0.03em', lineHeight: 1.1, position: 'relative', maxWidth: 500
        }}>
          A 3D spatial knowledge base
        </h1>
        <p style={{ 
          color: colors.textSecondary, fontSize: 'clamp(16px, 3.5vw, 18px)', maxWidth: 420, lineHeight: 1.6,
          margin: '0 0 36px 0', position: 'relative'
        }}>
          Capture thoughts, annotate documents, and watch your ideas form a living, interconnected matrix.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', position: 'relative' }}>
          <a href="#tutorial" onClick={e => { e.preventDefault(); document.getElementById('tutorial')?.scrollIntoView({ behavior: 'smooth' }); }}
            style={{
              padding: '14px 28px', borderRadius: 28, background: colors.opinion, color: '#000',
              fontSize: 16, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: `0 0 20px ${colors.opinion}40`
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 24px ${colors.opinion}60`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 0 20px ${colors.opinion}40`; }}
          >
            Try the Tutorial <ChevronDown size={18} />
          </a>
          <a href="https://github.com/saad-ibra/gray-matter" target="_blank" rel="noreferrer"
            style={{
              padding: '14px 28px', borderRadius: 28, background: 'transparent',
              border: `1px solid ${colors.neutral700}`, color: '#fff',
              fontSize: 16, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = colors.neutral700; }}
          >
            <Terminal size={16} /> View Source
          </a>
        </div>
      </section>

      {/* ─── FEATURES SECTION ─── */}
      <section style={{ padding: '60px 24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.opinion, marginBottom: 8 }}>Features</div>
            <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Built for deep thinking</h2>
          </div>
          <div className="rltx-features-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16
          }}>
            <FeatureCard icon={Edit2} color={colors.opinion} title="Opinions" desc="Capture your gut feeling about any resource before diving deeper." />
            <FeatureCard icon={Layers} color={colors.annotation} title="6 Entry Types" desc="Opinions, annotations, bookmarks, templates, lookups, and vision entries." />
            <FeatureCard icon={GitBranch} color={colors.template} title="Knowledge Links" desc="Connect any topic, resource, or entry to reveal hidden relationships." />
            <FeatureCard icon={Zap} color={colors.visual} title="3D Relatrix" desc="Visualize your entire knowledge base as an interactive spatial graph." />
          </div>
        </div>
      </section>

      {/* ─── COLOR PALETTE STRIP ─── */}
      <section style={{ padding: '0 24px 48px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { name: 'Opinion', color: colors.opinion },
              { name: 'Bookmark', color: colors.bookmark },
              { name: 'Annotation', color: colors.annotation },
              { name: 'Template', color: colors.template },
              { name: 'Lookup', color: colors.lookup },
              { name: 'Vision', color: colors.visual },
            ].map(c => (
              <div key={c.name} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 20,
                background: `${c.color}15`, border: `1px solid ${c.color}30`,
                fontSize: 13, color: c.color
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                {c.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE TUTORIAL ─── */}
      <section id="tutorial" style={{
        borderTop: `1px solid ${colors.surfaceHigh}`, borderBottom: `1px solid ${colors.surfaceHigh}`,
        background: `linear-gradient(180deg, ${colors.surface} 0%, ${colors.bg} 100%)`
      }}>
        <div style={{ textAlign: 'center', padding: '48px 24px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.opinion, marginBottom: 8 }}>Interactive</div>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>Try it yourself</h2>
          <p style={{ color: colors.textSecondary, fontSize: 15, margin: '0 0 32px 0' }}>Walk through the onboarding — no download needed.</p>
        </div>
        <div style={{ minHeight: '75dvh', display: 'flex', flexDirection: 'column', padding: 'clamp(16px, 4vh, 32px) 16px', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
          <div key={slide} className="rltx-slide-wrap" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {renderSlide()}
          </div>

          <div style={{ width: '100%', maxWidth: 480, display: 'flex', justifyContent: 'space-between', marginTop: 'clamp(24px, 5vh, 40px)', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ width: 44 }}>
              {slide > 0 && (
                <button onClick={goBack} style={{ width: 44, height: 44, borderRadius: '50%', background: colors.neutral800, border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = colors.neutral700}
                  onMouseLeave={e => e.currentTarget.style.background = colors.neutral800}
                >
                  <ArrowLeft size={20} />
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: 6 }}>
              {[...Array(totalSlides)].map((_, i) => (
                <div key={i} style={{ 
                  width: i === slide ? 24 : 8, height: 8, borderRadius: 4,
                  background: i === slide ? colors.opinion : colors.neutral800,
                  transition: 'all 0.3s'
                }} />
              ))}
            </div>

            <div style={{ width: 44 }}>
              {slide < totalSlides - 1 && canAdvance() && (
                <button onClick={advance} style={{ width: 44, height: 44, borderRadius: '50%', background: colors.primary, border: 'none', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', float: 'right', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <ArrowRight size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── GET IT / EXPLORE SECTION ─── */}
      <section id="explore-section" style={{ padding: '60px 24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.opinion, marginBottom: 8 }}>Get Started</div>
            <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Explore Relatrix</h2>
            <p style={{ color: colors.textSecondary, fontSize: 15, margin: 0, lineHeight: 1.6 }}>Open source. Privacy-first. Available on F-Droid.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <a href="https://github.com/saad-ibra/gray-matter" target="_blank" rel="noreferrer" className="rltx-link-card">
              <Terminal size={18} /> <span>GitHub</span> <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.4 }} />
            </a>
            <a href="https://f-droid.org/packages/com.saadibra.graymatter" target="_blank" rel="noreferrer" className="rltx-link-card">
              <Smartphone size={18} /> <span>F-Droid</span> <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.4 }} />
            </a>
            <a href="https://github.com/saad-ibra/gray-matter/releases" target="_blank" rel="noreferrer" className="rltx-link-card">
              <Tag size={18} /> <span>Releases</span> <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.4 }} />
            </a>
            <a href="https://github.com/saad-ibra/gray-matter/issues" target="_blank" rel="noreferrer" className="rltx-link-card">
              <AlertCircle size={18} /> <span>Issues</span> <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.4 }} />
            </a>
          </div>
          <div style={{ marginTop: 12 }}>
            <a href="https://saadibra.mooo.com/contact/" className="rltx-link-card" style={{ justifyContent: 'center' }}>
              <Mail size={18} /> <span>Contact the Developer</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{
        borderTop: `1px solid ${colors.surfaceHigh}`, padding: '32px 24px',
        display: 'flex', justifyContent: 'center'
      }}>
        <div style={{
          width: '100%', maxWidth: 560,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 13, color: colors.neutral500
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img 
              src="https://raw.githubusercontent.com/saad-ibra/gray-matter/main/core/designsystem/src/main/res/drawable/app_logo_full.png" 
              alt="" style={{ width: 16, height: 16, borderRadius: 4, opacity: 0.6 }} 
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
