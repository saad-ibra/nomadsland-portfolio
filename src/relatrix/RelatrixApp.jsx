import React, { useState, useEffect } from 'react';
import { 
  FileText, Globe, Edit2, Plus, File, Book, Image as ImageIcon, 
  Bookmark, Rocket, ArrowLeft, ArrowRight,
  Terminal, Smartphone, Mail, Tag, AlertCircle
} from 'lucide-react';

// Theme Colors matching Android compose
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
      ...style
    }}
  >
    {children}
  </button>
);

const SlideContainer = ({ children }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', 
    width: '100%', maxWidth: '400px', margin: '0 auto', minHeight: '300px',
    justifyContent: 'center', textAlign: 'center'
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
          <div style={{ width: 80, height: 80, background: colors.surfaceHigh, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <FileText size={40} color={colors.primary} />
          </div>
          <h1 style={{ fontSize: 24, margin: '0 0 12px 0' }}>Welcome to Relatrix</h1>
          <p style={{ color: colors.textSecondary }}>Let's build your first piece of knowledge.</p>
        </SlideContainer>
      );
      case 1: return (
        <SlideContainer>
          <div 
            onClick={advance}
            style={{ 
              width: 120, height: 120, borderRadius: '50%', 
              background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', marginBottom: 32
            }}
          >
            <Plus size={48} />
          </div>
          <h2 style={{ fontSize: 20, margin: '0 0 8px 0' }}>This is how everything starts</h2>
          <p style={{ color: colors.textSecondary }}>Tap the + to begin.</p>
        </SlideContainer>
      );
      case 2: return (
        <SlideContainer>
          <h2 style={{ fontSize: 20, margin: '0 0 8px 0' }}>Add a Resource</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 24 }}>What would you like to add? Pick one.</p>
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            {[
              { id: 'File', icon: File, color: colors.primary },
              { id: 'Link', icon: Globe, color: colors.primary },
              { id: 'Note', icon: Edit2, color: colors.primary }
            ].map(r => (
              <div 
                key={r.id} 
                onClick={() => setResource(r.id)}
                style={{
                  flex: 1, aspectRatio: '1/1', borderRadius: 16,
                  background: resource === r.id ? 'rgba(255,255,255,0.15)' : colors.surface,
                  border: `2px solid ${resource === r.id ? r.color : colors.surfaceHigh}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', opacity: (resource && resource !== r.id) ? 0.3 : 1
                }}
              >
                <r.icon size={32} color={r.color} />
                <span style={{ marginTop: 8, fontSize: 14 }}>{r.id}</span>
              </div>
            ))}
          </div>
        </SlideContainer>
      );
      case 3: return (
        <SlideContainer>
          <div style={{ background: colors.surface, padding: 12, borderRadius: 12, width: '100%', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={20} /> <span>My First {resource}</span>
          </div>
          <h2 style={{ fontSize: 20, margin: '0 0 8px 0' }}>Your First Opinion</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 24 }}>Capture your preconceived notion about this {resource.toLowerCase()}.</p>
          <input 
            value={opinion} onChange={e => setOpinion(e.target.value)}
            placeholder="Type your thoughts..."
            style={{ 
              width: '100%', padding: 16, borderRadius: 12, background: colors.surface, 
              border: `1px solid ${colors.surfaceHigh}`, color: '#fff', fontSize: 16, marginBottom: 16 
            }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {["Interesting concept", "Need to revisit", "Key insight"].map(s => (
              <div 
                key={s} onClick={() => setOpinion(s)}
                style={{ padding: '6px 12px', background: colors.surfaceHigh, borderRadius: 16, fontSize: 12, cursor: 'pointer' }}
              >
                {s}
              </div>
            ))}
          </div>
        </SlideContainer>
      );
      case 4: return (
        <SlideContainer>
          <h2 style={{ fontSize: 20, margin: '0 0 8px 0' }}>Organize into a Topic</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 24 }}>Every resource belongs to a Topic. Pick one.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            {["Philosophy", "Science", "My Notes"].map(t => (
              <div 
                key={t} onClick={() => setTopic(t)}
                style={{
                  padding: 16, borderRadius: 12,
                  background: topic === t ? 'rgba(255,255,255,0.1)' : colors.surface,
                  border: `2px solid ${topic === t ? '#fff' : colors.surfaceHigh}`,
                  cursor: 'pointer', opacity: (topic && topic !== t) ? 0.3 : 1
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </SlideContainer>
      );
      case 5: return (
        <SlideContainer>
          <h2 style={{ fontSize: 20, margin: '0 0 8px 0' }}>Dedicated PDF Reader</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 24 }}>Active reading with 5 entry types.</p>
          <div style={{ width: '100%', height: 160, background: colors.surface, borderRadius: 12, border: `1px solid ${colors.surfaceHigh}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: '70%', height: 8, background: colors.surfaceHigh, borderRadius: 4 }} />
            <div style={{ width: '80%', height: 8, background: colors.surfaceHigh, borderRadius: 4 }} />
            <div style={{ width: '60%', height: 8, background: colors.surfaceHigh, borderRadius: 4 }} />
            <div style={{ width: '40%', height: 8, background: colors.surfaceHigh, borderRadius: 4 }} />
          </div>
        </SlideContainer>
      );
      case 6: return (
        <SlideContainer>
          <h2 style={{ fontSize: 20, margin: '0 0 8px 0' }}>Types of Entries</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 24 }}>Tap each to discover.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
            {[
              { id: 'Opinions', icon: Edit2, color: colors.opinion },
              { id: 'Annotations', icon: Highlight, color: colors.annotation }, // No Highlight in lucide? Wait, yes there is, imported above. But let's use Edit3 if not. Actually lucide-react has Highlight. Wait, I imported Edit2, Highlight, Bookmark, ListAlt, Book, ImageIcon. I'll stick to basic ones to be safe.
            ].map(type => false)}
            
            {/* Let's manually define them safely with safe icons */}
            {[
              { id: 'Opinions', icon: Edit2, color: colors.opinion },
              { id: 'Annotations', icon: Edit2, color: colors.annotation },
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
                  cursor: 'pointer', opacity: discovered.has(t.id) ? 1 : 0.6
                }}
              >
                <t.icon color={discovered.has(t.id) ? t.color : colors.textSecondary} />
                <span style={{ fontSize: 12 }}>{t.id}</span>
              </div>
            ))}
          </div>
        </SlideContainer>
      );
      case 7: return (
        <SlideContainer>
          <h2 style={{ fontSize: 20, margin: '0 0 8px 0' }}>Connecting the Dots</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 24 }}>Your knowledge forms a graph.</p>
          <div style={{ width: '100%', height: 160, background: colors.surface, borderRadius: 12, position: 'relative' }}>
             <div style={{ position: 'absolute', top: 40, left: 60, width: 12, height: 12, background: colors.opinion, borderRadius: '50%' }} />
             <div style={{ position: 'absolute', top: 100, left: 120, width: 12, height: 12, background: colors.bookmark, borderRadius: '50%' }} />
             <div style={{ position: 'absolute', top: 60, right: 80, width: 12, height: 12, background: colors.annotation, borderRadius: '50%' }} />
             <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
               <line x1="66" y1="46" x2="126" y2="106" stroke={colors.surfaceHigh} strokeWidth="2" />
               <line x1="126" y1="106" x2="240" y2="66" stroke={colors.surfaceHigh} strokeWidth="2" />
             </svg>
          </div>
        </SlideContainer>
      );
      case 8: return (
        <SlideContainer>
          <h2 style={{ fontSize: 20, margin: '0 0 8px 0' }}>Organize with Tags</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 24 }}>Group related entries instantly.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            {["important", "review"].map(t => (
              <div 
                key={t} onClick={() => setTag(t)}
                style={{
                  padding: '8px 16px', borderRadius: 20,
                  background: tag === t ? 'rgba(255,255,255,0.2)' : colors.surfaceHigh,
                  color: tag === t ? '#fff' : colors.textSecondary,
                  cursor: 'pointer'
                }}
              >
                #{t}
              </div>
            ))}
          </div>
        </SlideContainer>
      );
      case 9: return (
        <SlideContainer>
          <h2 style={{ fontSize: 20, margin: '0 0 8px 0' }}>Knowledge Links</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 24 }}>Connect any entries.</p>
          <div style={{ width: '100%', height: 160, background: colors.surface, borderRadius: 12, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', cursor: 'pointer' }} onClick={() => setLinked(true)}>
             <div style={{ width: 48, height: 48, borderRadius: '50%', background: linked ? colors.opinion : colors.surfaceHigh, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <FileText color={linked ? '#000' : '#fff'} />
             </div>
             {linked && (
               <div style={{ flex: 1, height: 4, background: 'repeating-linear-gradient(90deg, #fff, #fff 10px, transparent 10px, transparent 20px)', margin: '0 16px', opacity: 0.5 }} />
             )}
             {!linked && <div style={{ flex: 1 }} />}
             <div style={{ width: 48, height: 48, borderRadius: '50%', background: linked ? colors.template : colors.surfaceHigh, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Globe color={linked ? '#000' : '#fff'} />
             </div>
          </div>
          {!linked && <p style={{ fontSize: 12, color: colors.textSecondary, marginTop: 16 }}>Tap box to link them</p>}
        </SlideContainer>
      );
      case 10: return (
        <SlideContainer>
          <Rocket size={64} color={colors.opinion} style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 24, margin: '0 0 12px 0' }}>You're Ready</h2>
          <p style={{ color: colors.textSecondary, marginBottom: 32 }}>Start building your knowledge.</p>
          
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
            <a href="https://github.com/saad-ibra/gray-matter" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ padding: 16, background: colors.surface, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, color: '#fff', border: `1px solid ${colors.surfaceHigh}` }}>
                <Terminal size={20} /> <span>GitHub Repository</span>
              </div>
            </a>
            <a href="https://f-droid.org/packages/com.saadibra.graymatter" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ padding: 16, background: colors.surface, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, color: '#fff', border: `1px solid ${colors.surfaceHigh}` }}>
                <Smartphone size={20} /> <span>Get it on F-Droid</span>
              </div>
            </a>
            <a href="https://github.com/saad-ibra/gray-matter/releases" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ padding: 16, background: colors.surface, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, color: '#fff', border: `1px solid ${colors.surfaceHigh}` }}>
                <Tag size={20} /> <span>Releases</span>
              </div>
            </a>
            <a href="https://github.com/saad-ibra/gray-matter/issues" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ padding: 16, background: colors.surface, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, color: '#fff', border: `1px solid ${colors.surfaceHigh}` }}>
                <AlertCircle size={20} /> <span>Raise Issues</span>
              </div>
            </a>
            <a href="https://saadibra.mooo.com/contact/" style={{ textDecoration: 'none' }}>
              <div style={{ padding: 16, background: colors.surface, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, color: '#fff', border: `1px solid ${colors.surfaceHigh}` }}>
                <Mail size={20} /> <span>Contact Me</span>
              </div>
            </a>
          </div>
        </SlideContainer>
      );
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.textPrimary, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ flex: 1, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 600, margin: '0 auto', width: '100%' }}>
        
        {/* Progress bar */}
        <div style={{ width: '100%', height: 4, background: colors.surfaceHigh, borderRadius: 2, marginBottom: 40, display: 'flex' }}>
          <div style={{ width: `${(slide / 10) * 100}%`, background: colors.primary, transition: 'width 0.3s ease' }} />
        </div>

        <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center' }}>
          {renderSlide()}
        </div>

        {/* Navigation */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginTop: 40, alignItems: 'center' }}>
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
        </div>
      </div>
    </div>
  );
}
