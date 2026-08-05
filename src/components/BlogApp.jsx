import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { BLOG_POSTS } from '../data/posts';

export default function BlogApp() {
  const [selectedPostId, setSelectedPostId] = useState(null);

  useEffect(() => {
    // Remove the global body styling from App.css just in case
    document.body.style.backgroundColor = '#f4f1ea';
    document.body.style.margin = '0';
    document.body.style.color = '#1a1a1a';
    document.body.classList.add('no-crt');
    return () => {
      document.body.classList.remove('no-crt');
    };
  }, []);

  const selectedPost = BLOG_POSTS.find(p => p.id === selectedPostId);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f4f1ea', // Off-white newspaper tone
      backgroundImage: 'radial-gradient(#e0ddd1 1px, transparent 1px)',
      backgroundSize: '32px 32px',
      color: '#1a1a1a',
      fontFamily: '"Georgia", "Times New Roman", serif',
      padding: '0 20px 80px',
      boxSizing: 'border-box',
      userSelect: 'text',
      WebkitUserSelect: 'text'
    }}>
      
      {/* Return to Game Banner */}
      <div style={{
        background: '#1a1a1a',
        color: '#f4f1ea',
        padding: '12px 24px',
        textAlign: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '40px'
      }}>
        <button 
          onClick={() => { window.location.href = '/'; }}
          style={{
            background: 'transparent',
            border: '1px solid #f4f1ea',
            color: '#f4f1ea',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: '"Inter", "Helvetica Neue", sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f4f1ea';
            e.currentTarget.style.color = '#1a1a1a';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#f4f1ea';
          }}
        >
          ← Return to Nomadsland
        </button>
      </div>

      {/* Main Content Area */}
      <main style={{ maxWidth: 900, margin: '0 auto', background: '#f4f1ea', padding: '40px 60px', boxShadow: '0 0 40px rgba(0,0,0,0.05)', border: '1px solid #e0ddd1' }}>
        
        {/* Newspaper Masthead */}
        <header style={{
          textAlign: 'center',
          borderBottom: '4px solid #1a1a1a',
          paddingBottom: '20px',
          marginBottom: '40px',
          borderTop: '1px solid #1a1a1a',
          paddingTop: '20px'
        }}>
          <h1 style={{
            fontFamily: '"Playfair Display", "Georgia", serif',
            fontSize: '56px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '-1px',
            margin: '0 0 10px',
            lineHeight: 1
          }}>
            The Nomad's Land Gazette
          </h1>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid #1a1a1a',
            borderBottom: '1px solid #1a1a1a',
            padding: '8px 0',
            fontFamily: '"Inter", "Helvetica Neue", sans-serif',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: 600
          }}>
            <span>Vol. I, No. 1</span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span>Free Edition</span>
          </div>
        </header>

        {!selectedPostId ? (
          /* --- MENU LIST VIEW (Multi-column Masonry) --- */
          <div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '40px',
              borderBottom: '2px solid #1a1a1a',
              paddingBottom: '40px',
              marginBottom: '40px'
            }}>
              {BLOG_POSTS.map((post, index) => (
                <article 
                  key={post.id} 
                  onClick={() => setSelectedPostId(post.id)}
                  style={{ 
                    cursor: 'pointer',
                    paddingRight: index % 2 === 0 ? '40px' : '0',
                    borderRight: index % 2 === 0 ? '1px solid #d0ccc1' : 'none',
                  }}
                >
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    margin: '0 0 12px',
                    lineHeight: 1.1,
                    fontFamily: '"Playfair Display", "Georgia", serif',
                    color: '#1a1a1a'
                  }}>
                    {post.title}
                  </h2>
                  
                  {post.subtitle && (
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 400,
                      margin: '0 0 16px',
                      color: '#444',
                      fontStyle: 'italic',
                      lineHeight: 1.4
                    }}>
                      {post.subtitle}
                    </h3>
                  )}

                  <div style={{ 
                    fontFamily: '"Inter", "Helvetica Neue", sans-serif',
                    fontSize: '11px',
                    color: '#555',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '16px',
                    borderTop: '1px solid #e0ddd1',
                    borderBottom: '1px solid #e0ddd1',
                    padding: '6px 0',
                    display: 'inline-block'
                  }}>
                    By Saad Ibrahim &nbsp; | &nbsp; {post.date}
                  </div>
                  
                  <p style={{
                    fontFamily: '"Georgia", serif',
                    fontSize: '15px',
                    lineHeight: 1.6,
                    color: '#333',
                    margin: '0 0 20px',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {post.content[0]}
                  </p>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    {post.tags.map(tag => (
                      <span key={tag} style={{
                        fontFamily: '"Inter", "Helvetica Neue", sans-serif',
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        background: '#e0ddd1',
                        padding: '2px 8px',
                        color: '#1a1a1a'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          /* --- FULL POST VIEW --- */
          <article style={{ animation: 'fadeIn 0.5s ease' }}>
            <button 
              onClick={() => setSelectedPostId(null)}
              style={{
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontFamily: '"Inter", "Helvetica Neue", sans-serif',
                fontWeight: 600,
                color: '#1a1a1a',
                padding: '0 0 20px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              <ArrowLeft size={16} />
              Return to Front Page
            </button>

            <header style={{ marginBottom: '40px', textAlign: 'center' }}>
              <h1 style={{
                fontSize: '48px',
                fontWeight: 900,
                margin: '0 0 16px',
                lineHeight: 1.1,
                fontFamily: '"Playfair Display", "Georgia", serif',
                color: '#1a1a1a'
              }}>
                {selectedPost.title}
              </h1>
              
              {selectedPost.subtitle && (
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 400,
                  margin: '0 0 24px',
                  color: '#444',
                  fontStyle: 'italic',
                  fontFamily: '"Playfair Display", "Georgia", serif'
                }}>
                  {selectedPost.subtitle}
                </h2>
              )}

              <div style={{ 
                fontFamily: '"Inter", "Helvetica Neue", sans-serif',
                fontSize: '12px',
                color: '#1a1a1a',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                borderTop: '1px solid #1a1a1a',
                borderBottom: '1px solid #1a1a1a',
                padding: '12px 0',
                display: 'inline-block',
                minWidth: '50%'
              }}>
                <strong>By Saad Ibrahim</strong> &nbsp; | &nbsp; {selectedPost.date} &nbsp; | &nbsp; {selectedPost.readTime}
              </div>
            </header>

            <div style={{
              fontSize: '18px',
              lineHeight: 1.8,
              color: '#222',
              columnCount: 2,
              columnGap: '40px',
              columnRule: '1px solid #d0ccc1',
              textAlign: 'justify'
            }}>
              {selectedPost.content.map((paragraph, index) => (
                <p key={index} style={{ 
                  margin: '0 0 24px', 
                  textIndent: index > 0 ? '24px' : '0' 
                }}>
                  {index === 0 ? (
                    <span style={{
                      float: 'left',
                      fontSize: '64px',
                      lineHeight: '52px',
                      paddingTop: '8px',
                      paddingRight: '8px',
                      fontFamily: '"Playfair Display", serif',
                      fontWeight: 900,
                      color: '#1a1a1a'
                    }}>
                      {paragraph.charAt(0)}
                    </span>
                  ) : null}
                  {index === 0 ? paragraph.substring(1) : paragraph}
                </p>
              ))}
            </div>

            <div style={{ 
              marginTop: '60px',
              paddingTop: '32px',
              borderTop: '2px solid #1a1a1a',
              display: 'flex', 
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {selectedPost.tags.map(tag => (
                <span key={tag} style={{
                  fontFamily: '"Inter", "Helvetica Neue", sans-serif',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  padding: '4px 12px',
                  border: '1px solid #1a1a1a',
                  color: '#1a1a1a'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </article>
        )}
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          div[style*="columnCount: 2"] {
            columnCount: 1 !important;
          }
          div[style*="gridTemplateColumns"] {
            gridTemplateColumns: 1fr !important;
          }
          article[style*="borderRight"] {
            borderRight: none !important;
            paddingRight: 0 !important;
            borderBottom: 1px solid #d0ccc1 !important;
            paddingBottom: 24px !important;
            marginBottom: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
