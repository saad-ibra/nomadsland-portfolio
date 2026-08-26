import React, { useState, useEffect } from 'react';
import { useForm, ValidationError } from '@formspree/react';

const CATEGORIES = [
  { id: 'review', label: '[*] REVIEW', color: '#d4af37' },
  { id: 'comment', label: '[>] COMMENT', color: '#4a90d9' },
  { id: 'complaint', label: '[!] COMPLAINT', color: '#c03030' },
  { id: 'tip', label: '[?] TIP', color: '#228b22' },
];

function PixelEnvelope({ size = 80 }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 80 56" style={{ imageRendering: "pixelated" }}>
      {/* Envelope body */}
      <rect x="2" y="10" width="76" height="44" rx="2" fill="#f4e8d0" stroke="#3a1c11" strokeWidth="2" />
      {/* Envelope flap */}
      <polygon points="2,10 40,32 78,10" fill="#e8d8b8" stroke="#3a1c11" strokeWidth="2" />
      {/* Seal */}
      <circle cx="40" cy="20" r="6" fill="#c03030" stroke="#8a2020" strokeWidth="1.5" />
      {/* Stamp */}
      <rect x="58" y="14" width="14" height="10" fill="#4a90d9" stroke="#2a5a8a" strokeWidth="1" rx="1" />
      <rect x="60" y="16" width="10" height="6" fill="#fff" opacity="0.3" />
      {/* Address lines */}
      <line x1="10" y1="36" x2="50" y2="36" stroke="#3a1c11" strokeWidth="1.5" opacity="0.4" />
      <line x1="10" y1="42" x2="45" y2="42" stroke="#3a1c11" strokeWidth="1.5" opacity="0.4" />
      <line x1="10" y1="48" x2="35" y2="48" stroke="#3a1c11" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}

function PixelMailbox({ size = 60 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: "pixelated" }}>
      {/* Post */}
      <rect x="14" y="16" width="4" height="14" fill="#6b4a2e" stroke="#3a1c11" strokeWidth="1" />
      {/* Base */}
      <rect x="10" y="28" width="12" height="3" fill="#5a3a2a" stroke="#3a1c11" strokeWidth="1" rx="1" />
      {/* Box body */}
      <rect x="6" y="6" width="20" height="12" rx="2" fill="#3060a0" stroke="#1a3050" strokeWidth="2" />
      {/* Rounded top */}
      <ellipse cx="16" cy="6" rx="10" ry="4" fill="#3a70b0" stroke="#1a3050" strokeWidth="2" />
      {/* Mail slot */}
      <rect x="10" y="10" width="12" height="2" fill="#0a1a2c" rx="1" />
      {/* Flag */}
      <rect x="26" y="4" width="2" height="10" fill="#4a4a4a" />
      <polygon points="28,4 34,7 28,10" fill="#d84040" stroke="#8a2020" strokeWidth="1" />
      {/* Letters peeking out */}
      <rect x="11" y="8" width="4" height="1" fill="#f4e8d0" opacity="0.6" />
    </svg>
  );
}

export default function ContactApp() {
  const [state, handleSubmit] = useForm('mljrjbde');
  const [category, setCategory] = useState('tip');
  const [hoveredCat, setHoveredCat] = useState(null);

  useEffect(() => {
    document.body.style.backgroundColor = '#0a0a14';
    document.body.style.margin = '0';
    document.body.style.color = '#f4e8d0';
    document.body.classList.add('no-crt');
    return () => {
      document.body.classList.remove('no-crt');
    };
  }, []);

  if (state.succeeded) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Micro 5', monospace",
        background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a14 70%)',
        padding: 20,
        boxSizing: 'border-box',
      }}>
        <div style={{
          textAlign: 'center', maxWidth: 400, width: '100%',
          background: '#1a1a2e', border: '3px solid #f4e8d0',
          borderRadius: 8, padding: '40px 30px',
          boxShadow: '0 0 40px rgba(244,232,208,0.1), 4px 4px 0 rgba(0,0,0,0.5)',
        }}>
          <div style={{ marginBottom: 16 }}><PixelMailbox size={64} /></div>
          <h2 style={{ fontSize: 28, color: '#228b22', marginBottom: 12, letterSpacing: 1 }}>MESSAGE SENT!</h2>
          <p style={{ fontSize: 16, color: '#f4e8d0', marginBottom: 24, opacity: 0.8 }}>
            Your message has been delivered to the Nomadsland Post Office.
            <br />I'll get back to you soon!
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                fontFamily: "'Micro 5', monospace", fontSize: 16,
                background: '#f4e8d0', color: '#111', padding: '10px 20px',
                border: '2px solid #111', cursor: 'pointer',
                boxShadow: '3px 3px 0 rgba(0,0,0,0.4)',
              }}
            >
              [ SEND ANOTHER ]
            </button>
            <a
              href="/"
              style={{
                fontFamily: "'Micro 5', monospace", fontSize: 16,
                background: '#228b22', color: '#fff', padding: '10px 20px',
                border: '2px solid #1a6b1a', cursor: 'pointer',
                boxShadow: '3px 3px 0 rgba(0,0,0,0.4)',
                textDecoration: 'none', display: 'inline-block',
              }}
            >
              [ VISIT THE VILLAGE ] →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: "'Micro 5', monospace",
      background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a14 70%)',
      padding: '20px 16px 40px',
      boxSizing: 'border-box',
      imageRendering: 'auto',
    }}>
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes stampRotate { 0% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } 100% { transform: rotate(-2deg); } }
        @keyframes scanline {
          0% { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }
        .contact-input:focus { outline: none; border-color: #d4af37 !important; box-shadow: 0 0 8px rgba(212,175,55,0.3) !important; }
        .contact-input::placeholder { color: #6a5a4a; }
        .cat-btn { transition: transform 0.1s, box-shadow 0.1s; }
        .cat-btn:hover { transform: translateY(-2px); }
        .cat-btn:active { transform: translateY(1px); box-shadow: 1px 1px 0 rgba(0,0,0,0.4) !important; }
      `}</style>

      {/* CRT Scanline Overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.04), rgba(0,0,0,0.04) 1px, transparent 1px, transparent 2px)',
      }} />

      {/* Header */}
      <header style={{
        textAlign: 'center', marginBottom: 24, maxWidth: 500, width: '100%',
      }}>
        {/* Pixel art decorations */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 12, animation: 'float 3s ease-in-out infinite' }}>
          <PixelMailbox size={50} />
          <PixelEnvelope size={70} />
          <PixelMailbox size={50} />
        </div>

        <div style={{
          fontSize: 14, color: '#a09880', letterSpacing: 3,
          borderTop: '2px solid #3a3020', borderBottom: '2px solid #3a3020',
          padding: '6px 0', margin: '0 auto',
        }}>
          LEAVE A REVIEW · COMMENT · COMPLAINT · TIP
        </div>
        <p style={{ fontSize: 14, color: '#8a7a6a', margin: '12px 0 0', lineHeight: 1.6 }}>
          Got something to say? Drop a message below and I'll get back to you!
        </p>
      </header>

      {/* Main Card */}
      <div style={{
        maxWidth: 460, width: '100%',
        background: '#f4e8d0', border: '3px solid #3a1c11',
        borderRadius: 6,
        boxShadow: '6px 6px 0 rgba(0,0,0,0.5), 0 0 30px rgba(244,232,208,0.05)',
        overflow: 'hidden',
      }}>
        {/* Card Header Bar */}
        <div style={{
          background: '#3a1c11', padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 14, color: '#f4e8d0', letterSpacing: 1 }}>📮 NEW MESSAGE</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c03030' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d4af37' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#228b22' }} />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          padding: '20px 20px 24px',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {/* Hidden category field for Formspree */}
          <input type="hidden" name="category" value={category} />

          {/* Category Selector */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#3a1c11', letterSpacing: 1 }}>
              WHAT'S THIS ABOUT?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {CATEGORIES.map(cat => {
                const isSelected = category === cat.id;
                const isHovered = hoveredCat === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className="cat-btn"
                    onClick={() => setCategory(cat.id)}
                    onMouseEnter={() => setHoveredCat(cat.id)}
                    onMouseLeave={() => setHoveredCat(null)}
                    style={{
                      fontFamily: "'Micro 5', monospace",
                      fontSize: 14,
                      padding: '10px 8px',
                      background: isSelected ? cat.color : (isHovered ? '#e8d8b8' : '#fff'),
                      color: isSelected ? '#fff' : '#3a1c11',
                      border: `2px solid ${isSelected ? cat.color : '#3a1c11'}`,
                      cursor: 'pointer',
                      boxShadow: isSelected
                        ? `0 0 12px ${cat.color}40, 3px 3px 0 rgba(0,0,0,0.3)`
                        : '2px 2px 0 rgba(0,0,0,0.2)',
                      letterSpacing: 0.5,
                      textAlign: 'center',
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', marginBottom: 4, color: '#3a1c11', letterSpacing: 1 }}>
              YOUR NAME
            </label>
            <input
              name="name"
              required
              className="contact-input"
              placeholder="What should I call you?"
              style={{
                width: '100%', padding: '10px 12px', boxSizing: 'border-box',
                border: '2px solid #3a1c11', background: '#fff',
                fontFamily: "'Micro 5', monospace", fontSize: 14, color: '#111',
              }}
            />
            <ValidationError field="name" prefix="Name" errors={state.errors} style={{ fontSize: 12, color: '#c03030', marginTop: 4, display: 'block' }} />
          </div>

          {/* Contact */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', marginBottom: 4, color: '#3a1c11', letterSpacing: 1 }}>
              YOUR CONTACT
            </label>
            <input
              name="email"
              required
              className="contact-input"
              placeholder="Email, phone, or any handle"
              style={{
                width: '100%', padding: '10px 12px', boxSizing: 'border-box',
                border: '2px solid #3a1c11', background: '#fff',
                fontFamily: "'Micro 5', monospace", fontSize: 14, color: '#111',
              }}
            />
            <ValidationError field="email" prefix="Contact" errors={state.errors} style={{ fontSize: 12, color: '#c03030', marginTop: 4, display: 'block' }} />
          </div>

          {/* Message */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', marginBottom: 4, color: '#3a1c11', letterSpacing: 1 }}>
              YOUR MESSAGE
            </label>
            <textarea
              name="message"
              required
              rows={5}
              className="contact-input"
              placeholder="Write your review, comment, complaint, or tip here..."
              style={{
                width: '100%', padding: '10px 12px', boxSizing: 'border-box',
                border: '2px solid #3a1c11', background: '#fff',
                fontFamily: "'Micro 5', monospace", fontSize: 14, resize: 'vertical', color: '#111',
                minHeight: 100,
              }}
            />
            <ValidationError field="message" prefix="Message" errors={state.errors} style={{ fontSize: 12, color: '#c03030', marginTop: 4, display: 'block' }} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={state.submitting}
            style={{
              fontFamily: "'Micro 5', monospace", fontSize: 18,
              background: state.submitting ? '#666' : '#3a1c11',
              color: '#f4e8d0', padding: '14px',
              border: '2px solid #111', cursor: state.submitting ? 'wait' : 'pointer',
              boxShadow: '4px 4px 0 rgba(0,0,0,0.4)',
              letterSpacing: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 4,
            }}
          >
            {state.submitting ? '[ SENDING... ]' : '[ SEND MESSAGE ]'}
          </button>
          {state.errors && state.errors.length > 0 && (
            <div style={{ fontSize: 12, color: '#c03030', textAlign: 'center', background: '#fff0f0', padding: 8, border: '1px solid #c03030' }}>
              Failed to send. Please try again.
            </div>
          )}
        </form>
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', marginTop: 30, maxWidth: 460, width: '100%',
      }}>
        <a
          href="/"
          style={{
            fontFamily: "'Micro 5', monospace", fontSize: 16,
            color: '#f4e8d0', textDecoration: 'none',
            border: '2px solid #3a3020', padding: '10px 24px',
            display: 'inline-block',
            boxShadow: '3px 3px 0 rgba(0,0,0,0.3)',
            background: 'rgba(244,232,208,0.05)',
            letterSpacing: 1,
          }}
        >
          [ VISIT THE VILLAGE ] →
        </a>
        <p style={{ fontSize: 12, color: '#4a4030', marginTop: 16 }}>
          Nomadsland Post Office · est. 2025
        </p>
      </footer>
    </div>
  );
}
