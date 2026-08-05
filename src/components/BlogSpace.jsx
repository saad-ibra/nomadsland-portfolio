import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { BLOG_POSTS } from '../data/posts';

export default function BlogSpace() {
  const [selectedPostId, setSelectedPostId] = useState(null);

  // Enforce light mode background on the body for the blog view
  useEffect(() => {
    document.body.style.backgroundColor = '#fdfcf8';
    document.body.classList.add('no-crt');
    return () => {
      document.body.style.backgroundColor = '';
      document.body.classList.remove('no-crt');
    };
  }, []);

  const selectedPost = BLOG_POSTS.find(p => p.id === selectedPostId);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fdfcf8', // Newsprint off-white
      color: '#1a1a1a',
      fontFamily: '"Georgia", "Times New Roman", serif',
      padding: '0 20px 80px',
      boxSizing: 'border-box',
      userSelect: 'text',
      WebkitUserSelect: 'text'
    }}>
      
      {/* Navigation Header */}
      <header style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '24px 0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e0ddd1'
      }}>
        {selectedPostId ? (
          <button 
            onClick={() => setSelectedPostId(null)}
            style={{
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: '"Inter", "Helvetica Neue", sans-serif',
              fontWeight: 500,
              color: '#555',
              padding: 0,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            <ArrowLeft size={16} />
            Back to Menu
          </button>
        ) : (
          <button 
            onClick={() => { window.location.search = '?view=home'; }}
            style={{
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: '"Inter", "Helvetica Neue", sans-serif',
              fontWeight: 500,
              color: '#555',
              padding: 0,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            <ArrowLeft size={16} />
            Back to Nomadsland
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: 720, margin: '40px auto 0' }}>
        
        {!selectedPostId ? (
          /* --- MENU LIST VIEW --- */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {BLOG_POSTS.map(post => (
              <article 
                key={post.id} 
                onClick={() => setSelectedPostId(post.id)}
                style={{ 
                  cursor: 'pointer',
                  padding: '24px',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f4f2e9'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ 
                  display: 'flex', gap: '16px', alignItems: 'center', 
                  fontFamily: '"Inter", "Helvetica Neue", sans-serif',
                  fontSize: '12px',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '12px'
                }}>
                  <time>{post.date}</time>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  margin: '0 0 8px',
                  lineHeight: 1.2,
                  fontFamily: '"Playfair Display", "Georgia", serif',
                  color: '#111'
                }}>
                  {post.title}
                </h2>
                
                {post.subtitle && (
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 400,
                    margin: '0 0 16px',
                    color: '#555',
                    fontStyle: 'italic'
                  }}>
                    {post.subtitle}
                  </h3>
                )}
                
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
                      padding: '3px 8px',
                      border: '1px solid #d0ccc1',
                      borderRadius: '40px',
                      color: '#666'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* --- FULL POST VIEW --- */
          <article>
            <header style={{ marginBottom: '40px' }}>
              <div style={{ 
                display: 'flex', gap: '16px', alignItems: 'center', 
                fontFamily: '"Inter", "Helvetica Neue", sans-serif',
                fontSize: '13px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '16px'
              }}>
                <time>{selectedPost.date}</time>
                <span>•</span>
                <span>{selectedPost.readTime}</span>
              </div>
              
              <h1 style={{
                fontSize: '40px',
                fontWeight: 700,
                margin: '0 0 12px',
                lineHeight: 1.2,
                fontFamily: '"Playfair Display", "Georgia", serif',
                color: '#111'
              }}>
                {selectedPost.title}
              </h1>
              
              {selectedPost.subtitle && (
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: 400,
                  margin: '0 0 20px',
                  color: '#555',
                  fontStyle: 'italic'
                }}>
                  {selectedPost.subtitle}
                </h2>
              )}
            </header>

            <div style={{
              fontSize: '18px',
              lineHeight: 1.8,
              color: '#333',
            }}>
              {selectedPost.content.map((paragraph, index) => (
                <p key={index} style={{ marginBottom: '24px' }}>
                  {paragraph}
                </p>
              ))}
            </div>

            <div style={{ 
              marginTop: '60px',
              paddingTop: '32px',
              borderTop: '1px solid #e0ddd1',
              display: 'flex', 
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {selectedPost.tags.map(tag => (
                <span key={tag} style={{
                  fontFamily: '"Inter", "Helvetica Neue", sans-serif',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  padding: '4px 10px',
                  border: '1px solid #d0ccc1',
                  borderRadius: '40px',
                  color: '#666'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </article>
        )}
      </main>

    </div>
  );
}
