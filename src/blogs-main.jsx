import React from 'react';
import ReactDOM from 'react-dom/client';
import BlogApp from './components/BlogApp.jsx';
import './App.css'; // Just in case, though we will override background in BlogApp

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BlogApp />
  </React.StrictMode>,
);
