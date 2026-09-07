import React, { useState, useEffect } from 'react';
import { 
  FileText, Globe, Edit2, Plus, File, Book, Image as ImageIcon, 
  Bookmark, Rocket, ArrowLeft, ArrowRight,
  Terminal, Smartphone, Mail, Tag, AlertCircle, Edit
} from 'lucide-react';

const colors = {
  primary: '#e0e0e0',
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
};

const Button = ({ onClick, disabled, children, style }) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    style={{
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      background: disabled ? colors.surfaceHigh : colors.primary,
      color: disabled ? colors.textSecondary : '#000',
      fontWeight: 'bold',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontFamily: 'inherit',
      ...style
    }}
  >
    {children}
  </button>
);

const SlideContainer = ({ children }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', 
    width: '100%', maxWidth: '400px', margin: '0 auto', minHeight: '350px',
    justifyContent: 'center', textAlign: 'center', fontFamily: 'inherit'
  }}>
    {children}
  </div>
);

export default function RelatrixApp() {
  const [slide, setSlide] = useState(0);
  const [resource, setResource] = useState(null);
  const [opinion, setOpinion] = useState('');
  const [topic, setTopic] = useState(null);
  const [discovered, setDiscovered] = useState(new Set());
  const [tag, setTag] = useState(null);
  const [linked, setLinked] = useState(false);
  const [sourceSel, setSourceSel] = useState(false);
  const [targetSel, setTargetSel] = useState(false);

  useEffect(() => {
    if (sourceSel && targetSel) setLinked(true);
  }, [sourceSel, targetSel]);

  const canAdvance = () => {
    switch(slide) {
      case 2: return !!resource;
      case 3: return opinion.length > 0;
      case 4: return !!topic;
      case 6: return discovered.size >= 6;
      case 8: return !!tag;
      case 9: return linked;
      default: return true;
    }
  };

  const advance = () => setSlide(s => Math.min(s + 1, 10));
  const goBack = () => setSlide(s => Math.max(s - 1, 0));

  const renderSlide = () => {
    switch (slide) {
      case 0: return (
        <SlideContainer>
          <img 
            src="https://raw.githubusercontent.com/saad-ibra/gray-matter/main/core/designsystem/src/main/res/drawable/app_logo_full.png" 
            alt="Relatrix Logo" 
            style={{ width: 80, height: 80, borderRadius: 16, marginBottom: 24, objectFit: 'cover' }} 
          />
          <h1 style={{ fontSize: 24, margin: '0 0 12px 0', fontWeight: 'bold' }}>Welcome to Relatrix</h1>
          <p style={{ color: colors.textSecondary, fontSize: 16 }}>Let's build your first piece of knowledge.</p>
        </SlideContainer>
      );
      case 1: return (
        <SlideContainer>
          <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
            <File style={{ position: 'absolute', top: 10, left: 10, color: colors.lookup, opacity: 0.4 }} size={24} />
            <Globe style={{ position: 'absolute', top: 20, right: 10, color: colors.bookmark, opacity: 0.4 }} size={24} />
            <Edit2 style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', color: colors.opinion, opacity: 0.4 }} size={24} />
            
            <div 
              onClick={advance}
              style={{ 
                width: 100, height: 100, borderRadius: '50%', 
                background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 2
              }}
            >
              <Plus size={48} color="#fff" />
            </div>
          </div>
          <h2 style={{ fontSize: 20, margin: '0 0 8px 0', fontWeight: 'bold' }}>This is how everything starts</h2>
          <p style={{ color: colors.textSecondary }}>Tap the + to begin.</p>
        </SlideContainer>
      );
      case 2: return (
        <SlideContainer>
          <h2 style={{ fontSize: 20, margin: '0 0 8px 0', fontWeight: 'bold' }}>Add a Resource</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 24 }}>What would you like to add? Pick one.</p>
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            {[
              { id: 'File', icon: File, color: colors.primary },
              { id: 'Link', icon: Globe, color: colors.primary },
              { id: 'Note', icon: Edit2, color: colors.primary }
            ].map(r => {
              const isSel = resource === r.id;
              const op = (resource && !isSel) ? 0.3 : 1;
              return (
                <div 
                  key={r.id} 
                  onClick={() => setResource(r.id)}
                  style={{
                    flex: 1, aspectRatio: '1/1', borderRadius: 16,
                    background: isSel ? 'rgba(255,255,255,0.15)' : colors.surface,
                    border: `2px solid ${isSel ? r.color : colors.surfaceHigh}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', opacity: op, transition: 'all 0.2s'
                  }}
                >
                  <r.icon size={32} color={isSel ? r.color : colors.textPrimary} />
                  <span style={{ marginTop: 8, fontSize: 14, color: isSel ? r.color : colors.textSecondary }}>{r.id}</span>
                </div>
              )
            })}
          </div>
          {resource && <p style={{ color: colors.opinion, marginTop: 24, fontWeight: 'bold' }}>✓ {resource} added!</p>}
        </SlideContainer>
      );
      case 3: return (
        <SlideContainer>
          <div style={{ background: colors.surface, padding: 12, borderRadius: 12, width: '100%', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${colors.surfaceHigh}` }}>
            {resource === 'Link' ? <Globe size={20} color="#fff" /> : resource === 'Note' ? <Edit2 size={20} color="#fff" /> : <File size={20} color="#fff" />}
            <span>My First {resource}</span>
          </div>
          <h2 style={{ fontSize: 20, margin: '0 0 8px 0', fontWeight: 'bold' }}>Your First Opinion</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 24, fontSize: 14 }}>Capture your preconceived notion or initial thought about this {resource?.toLowerCase()}.</p>
          
          <input 
            value={opinion} onChange={e => setOpinion(e.target.value)}
            placeholder="Type your thoughts..."
            style={{ 
              width: '100%', padding: 16, borderRadius: 12, background: colors.surface, 
              border: `1px solid ${colors.surfaceHigh}`, color: '#fff', fontSize: 16, marginBottom: 16,
              fontFamily: 'inherit', boxSizing: 'border-box'
            }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {["Interesting concept", "Need to revisit", "Key insight"].map(s => (
              <div 
                key={s} onClick={() => setOpinion(s)}
                style={{ padding: '8px 12px', background: colors.surfaceHigh, borderRadius: 16, fontSize: 13, cursor: 'pointer', color: '#ccc' }}
              >
                {s}
              </div>
            ))}
          </div>
        </SlideContainer>
      );
      case 4: return (
        <SlideContainer>
          <div style={{ background: colors.surface, padding: 12, borderRadius: 12, width: '100%', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${colors.surfaceHigh}` }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: colors.opinion }} />
            <span>My First Opinion</span>
          </div>
          <h2 style={{ fontSize: 20, margin: '0 0 8px 0', fontWeight: 'bold' }}>Organize into a Topic</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 24 }}>Every resource belongs to a Topic. Pick one.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            {["Philosophy", "Science", "My Notes"].map(t => (
              <div 
                key={t} onClick={() => setTopic(t)}
                style={{
                  padding: 16, borderRadius: 12,
                  background: topic === t ? 'rgba(255,255,255,0.1)' : colors.surface,
                  border: `2px solid ${topic === t ? '#fff' : colors.surfaceHigh}`,
                  cursor: 'pointer', opacity: (topic && topic !== t) ? 0.3 : 1,
                  display: 'flex', alignItems: 'center', gap: 12
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: 2, background: colors.textSecondary }} />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </SlideContainer>
      );
      case 5: return (
        <SlideContainer>
          <h2 style={{ fontSize: 20, margin: '0 0 8px 0', fontWeight: 'bold' }}>Dedicated PDF Reader</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 24 }}>Active reading with 5 entry types.</p>
          <div style={{ width: '100%', height: 200, background: colors.surface, borderRadius: 12, border: `1px solid ${colors.surfaceHigh}`, display: 'flex', overflow: 'hidden' }}>
            <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: '90%', height: 8, background: colors.surfaceHigh, borderRadius: 4 }} />
              <div style={{ width: '100%', height: 8, background: colors.surfaceHigh, borderRadius: 4 }} />
              <div style={{ width: '70%', height: 8, background: colors.annotation, borderRadius: 4 }} />
              <div style={{ width: '85%', height: 8, background: colors.surfaceHigh, borderRadius: 4 }} />
            </div>
            <div style={{ width: 80, background: '#1a1a1a', borderLeft: `1px solid ${colors.surfaceHigh}`, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16, gap: 16 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: colors.annotation }} />
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: colors.opinion }} />
            </div>
          </div>
        </SlideContainer>
      );
      case 6: return (
        <SlideContainer>
          <h2 style={{ fontSize: 20, margin: '0 0 8px 0', fontWeight: 'bold' }}>Types of Entries</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 24 }}>Tap each to discover.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
            {[
              { id: 'Opinions', icon: Edit2, color: colors.opinion },
              { id: 'Annotations', icon: Edit, color: colors.annotation },
              { id: 'Bookmarks', icon: Bookmark, color: colors.bookmark },
              { id: 'Templates', icon: FileText, color: colors.template },
              { id: 'Lookups', icon: Book, color: colors.lookup },
              { id: 'Vision', icon: ImageIcon, color: colors.visual },
            ].map(t => (
              <div 
                key={t.id} onClick={() => { const ns = new Set(discovered); ns.add(t.id); setDiscovered(ns); }}
                style={{
                  padding: 16, borderRadius: 12, background: colors.surface,
                  border: `2px solid ${discovered.has(t.id) ? t.color : colors.surfaceHigh}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  cursor: 'pointer', opacity: discovered.has(t.id) ? 1 : 0.6,
                  transition: 'all 0.2s'
                }}
              >
                <t.icon color={discovered.has(t.id) ? t.color : colors.textSecondary} />
                <span style={{ fontSize: 12, color: discovered.has(t.id) ? t.color : colors.textSecondary }}>{t.id}</span>
              </div>
            ))}
          </div>
        </SlideContainer>
      );
      case 7: return (
        <SlideContainer>
          <h2 style={{ fontSize: 20, margin: '0 0 8px 0', fontWeight: 'bold' }}>Connecting the Dots</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 24 }}>Your knowledge forms a graph.</p>
          <div style={{ width: '100%', height: 200, background: colors.surface, borderRadius: 12, position: 'relative', overflow: 'hidden' }}>
             <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
               <line x1="86" y1="56" x2="146" y2="136" stroke={colors.surfaceHigh} strokeWidth="2" />
               <line x1="146" y1="136" x2="260" y2="86" stroke={colors.surfaceHigh} strokeWidth="2" />
             </svg>
             <div style={{ position: 'absolute', top: 50, left: 80, width: 12, height: 12, background: colors.opinion, borderRadius: '50%', boxShadow: `0 0 10px ${colors.opinion}` }} />
             <div style={{ position: 'absolute', top: 130, left: 140, width: 12, height: 12, background: colors.bookmark, borderRadius: '50%', boxShadow: `0 0 10px ${colors.bookmark}` }} />
             <div style={{ position: 'absolute', top: 80, right: 100, width: 12, height: 12, background: colors.annotation, borderRadius: '50%', boxShadow: `0 0 10px ${colors.annotation}` }} />
          </div>
        </SlideContainer>
      );
      case 8: return (
        <SlideContainer>
          <div style={{ background: colors.surface, padding: 20, borderRadius: 16, width: '100%', marginBottom: 32, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: colors.opinion }} />
              <span style={{ fontSize: 16 }}>My crucial insight</span>
            </div>
            {tag && (
              <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)' }}>
                <Tag size={14} color="#fff" />
                <span style={{ fontSize: 12, color: '#fff' }}>{tag}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            {["important", "review"].map(t => (
              <div 
                key={t} onClick={() => setTag(t)}
                style={{
                  padding: '10px 16px', borderRadius: 16,
                  background: tag === t ? 'rgba(255,255,255,0.2)' : colors.surfaceHigh,
                  display: 'flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Tag size={16} color={tag === t ? '#fff' : colors.textSecondary} />
                <span style={{ color: tag === t ? '#fff' : colors.textSecondary, fontWeight: '500' }}>{t}</span>
              </div>
            ))}
          </div>
        </SlideContainer>
      );
      case 9: return (
        <SlideContainer>
          <h2 style={{ fontSize: 20, margin: '0 0 8px 0', fontWeight: 'bold' }}>Knowledge Links</h2>
          <p style={{ color: linked ? colors.opinion : colors.textSecondary, marginBottom: 24, height: 40 }}>
            {linked ? "Connected! You can jump between them instantly." : "Tap the entries below to link them."}
          </p>
          <div style={{ width: '100%', height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: 16, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
             {linked && (
               <div style={{ position: 'absolute', left: 80, right: 80, height: 6, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.8), rgba(255,255,255,0.8) 15px, transparent 15px, transparent 25px)', opacity: 0.8, zIndex: 0 }} />
             )}
             <div onClick={() => setSourceSel(true)} style={{ width: 64, height: 64, borderRadius: '50%', background: sourceSel ? colors.opinion : colors.surfaceHigh, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1 }}>
               <Book color={sourceSel ? '#000' : '#fff'} size={32} />
             </div>
             <div onClick={() => setTargetSel(true)} style={{ width: 64, height: 64, borderRadius: '50%', background: targetSel ? colors.template : colors.surfaceHigh, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1 }}>
               <FileText color={targetSel ? '#000' : '#fff'} size={32} />
             </div>
          </div>
        </SlideContainer>
      );
      case 10: return (
        <SlideContainer>
          <Rocket size={64} color={colors.opinion} style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 24, margin: '0 0 12px 0', fontWeight: 'bold' }}>You're Ready</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 32 }}>Start building your knowledge.</p>
        </SlideContainer>
      );
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', background: colors.bg, color: colors.textPrimary, 
      display: 'flex', flexDirection: 'column', 
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      <style>{`
        * { font-family: inherit; }
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
        }
        .link-card:hover {
          background: ${colors.surfaceHigh};
        }
      `}</style>
      
      {/* Top half: Tutorial */}
      <div style={{ flex: 1, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        
        {/* Progress bar */}
        <div style={{ width: '100%', maxWidth: 600, height: 4, background: colors.surfaceHigh, borderRadius: 2, marginBottom: 40, display: 'flex' }}>
          <div style={{ width: `${(slide / 10) * 100}%`, background: colors.primary, transition: 'width 0.3s ease' }} />
        </div>

        <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center' }}>
          {renderSlide()}
        </div>

        {/* Navigation */}
        <div style={{ width: '100%', maxWidth: 600, display: 'flex', justifyContent: 'space-between', marginTop: 40, alignItems: 'center' }}>
          {slide > 0 ? (
            <button onClick={goBack} style={{ width: 44, height: 44, borderRadius: '50%', background: colors.surfaceHigh, border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <ArrowLeft size={20} />
            </button>
          ) : <div style={{ width: 44 }} />}
          
          {slide < 10 && (
            <Button onClick={advance} disabled={!canAdvance()}>
              Next <ArrowRight size={20} />
            </Button>
          )}
          {slide === 10 && <div style={{ width: 44 }} />}
        </div>
      </div>

      {/* Bottom half: Persistent Links */}
      <div style={{ width: '100%', background: colors.surfaceHigh, padding: '40px 24px', borderTop: `1px solid #333` }}>
        <h3 style={{ textAlign: 'center', color: colors.textSecondary, marginBottom: 24, fontSize: 16, fontWeight: 'normal' }}>Explore Relatrix</h3>
        <div className="links-grid">
          <a href="https://github.com/saad-ibra/gray-matter" target="_blank" rel="noreferrer" className="link-card">
            <Terminal size={20} /> <span style={{ fontWeight: 500 }}>GitHub Repository</span>
          </a>
          <a href="https://f-droid.org/packages/com.saadibra.graymatter" target="_blank" rel="noreferrer" className="link-card">
            <Smartphone size={20} /> <span style={{ fontWeight: 500 }}>Get it on F-Droid</span>
          </a>
          <a href="https://github.com/saad-ibra/gray-matter/releases" target="_blank" rel="noreferrer" className="link-card">
            <Tag size={20} /> <span style={{ fontWeight: 500 }}>Releases</span>
          </a>
          <a href="https://github.com/saad-ibra/gray-matter/issues" target="_blank" rel="noreferrer" className="link-card">
            <AlertCircle size={20} /> <span style={{ fontWeight: 500 }}>Raise Issues</span>
          </a>
          <a href="https://saadibra.mooo.com/contact/" className="link-card">
            <Mail size={20} /> <span style={{ fontWeight: 500 }}>Contact Me</span>
          </a>
        </div>
      </div>
    </div>
  );
}
