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
    <div className="blog-app-wrapper">
      
      {/* Return to Game Banner */}
      <div className="blog-banner">
        <button 
          onClick={() => { window.location.href = '/'; }}
          className="blog-return-btn"
        >
          ← Return to Nomadsland
        </button>
      </div>

      {/* Main Content Area */}
      <main className="blog-main">
        
        {/* Newspaper Masthead */}
        <header className="blog-header">
          <h1 className="blog-title">
            The Nomad's Land Gazette
          </h1>
          <div className="blog-meta-bar">
            <span>Vol. I, No. 1</span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span>Free Edition</span>
          </div>
        </header>

        {!selectedPostId ? (
          /* --- MENU LIST VIEW (Multi-column Masonry) --- */
          <div>
            <div className="blog-grid">
              {BLOG_POSTS.map((post, index) => (
                <article 
                  key={post.id} 
                  onClick={() => setSelectedPostId(post.id)}
                  className={`blog-card ${index % 2 === 0 ? 'even-card' : 'odd-card'}`}
                >
                  <h2 className="card-title">
                    {post.title}
                  </h2>
                  
                  {post.subtitle && (
                    <h3 className="card-subtitle">
                      {post.subtitle}
                    </h3>
                  )}

                  <div className="card-meta">
                    By Saad Ibrahim &nbsp; | &nbsp; {post.date}
                  </div>
                  
                  <p className="card-excerpt">
                    {post.content[0]}
                  </p>
                  
                  <div className="tags-container">
                    {post.tags.map(tag => (
                      <span key={tag} className="tag-pill">
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
          <article className="full-post">
            <button 
              onClick={() => setSelectedPostId(null)}
              className="post-return-btn"
            >
              <ArrowLeft size={16} />
              Return to Front Page
            </button>

            <header className="post-header">
              <h1 className="post-title">
                {selectedPost.title}
              </h1>
              
              {selectedPost.subtitle && (
                <h2 className="post-subtitle">
                  {selectedPost.subtitle}
                </h2>
              )}

              <div className="post-meta">
                <strong>By Saad Ibrahim</strong> &nbsp; | &nbsp; {selectedPost.date} &nbsp; | &nbsp; {selectedPost.readTime}
              </div>
            </header>

            <div className="post-content">
              {selectedPost.content.map((paragraph, index) => (
                <p key={index} className={index === 0 ? "first-paragraph" : ""}>
                  {index === 0 ? (
                    <span className="dropcap">
                      {paragraph.charAt(0)}
                    </span>
                  ) : null}
                  {index === 0 ? paragraph.substring(1) : paragraph}
                </p>
              ))}
            </div>

            <div className="post-footer">
              {selectedPost.tags.map(tag => (
                <span key={tag} className="footer-tag-pill">
                  {tag}
                </span>
              ))}
            </div>
          </article>
        )}
      </main>

      <style>{`
        /* Reset and Base Variables */
        .blog-app-wrapper {
          min-height: 100vh;
          background-color: #f4f1ea;
          background-image: radial-gradient(#e0ddd1 1px, transparent 1px);
          background-size: 32px 32px;
          color: #1a1a1a;
          font-family: "Georgia", "Times New Roman", serif;
          padding: 0 20px 80px;
          box-sizing: border-box;
          user-select: text;
          -webkit-user-select: text;
        }

        .blog-banner {
          background: #1a1a1a;
          color: #f4f1ea;
          padding: 12px 24px;
          text-align: center;
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          margin-bottom: 40px;
          margin-left: -20px;
          margin-right: -20px;
        }

        .blog-return-btn {
          background: transparent;
          border: 1px solid #f4f1ea;
          color: #f4f1ea;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 12px;
          font-family: "Inter", "Helvetica Neue", sans-serif;
          text-transform: uppercase;
          letter-spacing: 2px;
          transition: all 0.2s ease;
        }
        .blog-return-btn:hover {
          background: #f4f1ea;
          color: #1a1a1a;
        }

        .blog-main {
          max-width: 900px;
          margin: 0 auto;
          background: #f4f1ea;
          padding: 40px 60px;
          box-shadow: 0 0 40px rgba(0,0,0,0.05);
          border: 1px solid #e0ddd1;
        }

        .blog-header {
          text-align: center;
          border-bottom: 4px solid #1a1a1a;
          padding-bottom: 20px;
          margin-bottom: 40px;
          border-top: 1px solid #1a1a1a;
          padding-top: 20px;
        }

        .blog-title {
          font-family: "Playfair Display", "Georgia", serif;
          font-size: 56px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -1px;
          margin: 0 0 10px;
          line-height: 1.1;
        }

        .blog-meta-bar {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #1a1a1a;
          border-bottom: 1px solid #1a1a1a;
          padding: 8px 0;
          font-family: "Inter", "Helvetica Neue", sans-serif;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }

        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 40px;
          border-bottom: 2px solid #1a1a1a;
          padding-bottom: 40px;
          margin-bottom: 40px;
        }

        .blog-card {
          cursor: pointer;
        }
        .blog-card.even-card {
          padding-right: 40px;
          border-right: 1px solid #d0ccc1;
        }

        .card-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 12px;
          line-height: 1.1;
          font-family: "Playfair Display", "Georgia", serif;
          color: #1a1a1a;
        }

        .card-subtitle {
          font-size: 16px;
          font-weight: 400;
          margin: 0 0 16px;
          color: #444;
          font-style: italic;
          line-height: 1.4;
        }

        .card-meta {
          font-family: "Inter", "Helvetica Neue", sans-serif;
          font-size: 11px;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
          border-top: 1px solid #e0ddd1;
          border-bottom: 1px solid #e0ddd1;
          padding: 6px 0;
          display: inline-block;
        }

        .card-excerpt {
          font-family: "Georgia", serif;
          font-size: 15px;
          line-height: 1.6;
          color: #333;
          margin: 0 0 20px;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .tags-container {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tag-pill {
          font-family: "Inter", "Helvetica Neue", sans-serif;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          background: #e0ddd1;
          padding: 2px 8px;
          color: #1a1a1a;
        }

        .full-post {
          animation: fadeIn 0.5s ease;
        }

        .post-return-btn {
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
          font-family: "Inter", "Helvetica Neue", sans-serif;
          font-weight: 600;
          color: #1a1a1a;
          padding: 0 0 20px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .post-header {
          margin-bottom: 40px;
          text-align: center;
        }

        .post-title {
          font-size: 48px;
          font-weight: 900;
          margin: 0 0 16px;
          line-height: 1.1;
          font-family: "Playfair Display", "Georgia", serif;
          color: #1a1a1a;
        }

        .post-subtitle {
          font-size: 24px;
          font-weight: 400;
          margin: 0 0 24px;
          color: #444;
          font-style: italic;
          font-family: "Playfair Display", "Georgia", serif;
        }

        .post-meta {
          font-family: "Inter", "Helvetica Neue", sans-serif;
          font-size: 12px;
          color: #1a1a1a;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-top: 1px solid #1a1a1a;
          border-bottom: 1px solid #1a1a1a;
          padding: 12px 0;
          display: inline-block;
          min-width: 50%;
        }

        .post-content {
          font-size: 18px;
          line-height: 1.8;
          color: #222;
          column-count: 2;
          column-gap: 40px;
          column-rule: 1px solid #d0ccc1;
          text-align: justify;
        }

        .post-content p {
          margin: 0 0 24px;
          text-indent: 24px;
        }
        .post-content p.first-paragraph {
          text-indent: 0;
        }

        .dropcap {
          float: left;
          font-size: 64px;
          line-height: 52px;
          padding-top: 8px;
          padding-right: 8px;
          font-family: "Playfair Display", serif;
          font-weight: 900;
          color: #1a1a1a;
        }

        .post-footer {
          margin-top: 60px;
          padding-top: 32px;
          border-top: 2px solid #1a1a1a;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .footer-tag-pill {
          font-family: "Inter", "Helvetica Neue", sans-serif;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 4px 12px;
          border: 1px solid #1a1a1a;
          color: #1a1a1a;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* --- MOBILE STYLES --- */
        @media (max-width: 768px) {
          .blog-app-wrapper {
            padding: 0 0 40px;
          }
          .blog-banner {
            margin-left: 0;
            margin-right: 0;
            margin-bottom: 20px;
          }
          .blog-main {
            padding: 24px 16px;
            box-shadow: none;
            border-left: none;
            border-right: none;
          }
          .blog-header {
            margin-bottom: 24px;
          }
          .blog-title {
            font-size: 32px;
          }
          .blog-meta-bar {
            flex-direction: column;
            gap: 8px;
            font-size: 10px;
            border-top: none;
            border-bottom: none;
            padding: 0;
          }
          .blog-meta-bar span {
            display: block;
            border-bottom: 1px solid #1a1a1a;
            padding-bottom: 4px;
          }
          .blog-meta-bar span:last-child {
            border-bottom: none;
          }
          .blog-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .blog-card.even-card {
            padding-right: 0;
            border-right: none;
            border-bottom: 1px solid #d0ccc1;
            padding-bottom: 24px;
          }
          .card-title {
            font-size: 24px;
          }
          .post-header {
            margin-bottom: 24px;
          }
          .post-title {
            font-size: 28px;
          }
          .post-subtitle {
            font-size: 18px;
          }
          .post-meta {
            min-width: 100%;
            font-size: 10px;
            line-height: 1.6;
          }
          .post-content {
            column-count: 1;
            font-size: 16px;
            text-align: left;
          }
          .dropcap {
            font-size: 48px;
            line-height: 40px;
          }
        }
      `}</style>
    </div>
  );
}
