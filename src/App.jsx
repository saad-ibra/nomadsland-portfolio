import { useState } from 'react';
import LibraryScene from './scenes/LibraryScene.jsx';
import ChemistryLabScene from './scenes/ChemistryLabScene.jsx';
import NewsroomScene from './scenes/NewsroomScene.jsx';
import './App.css';

function App() {
  const [scene, setScene] = useState('library');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a14',
      padding: 0,
      margin: 0,
      boxSizing: 'border-box'
    }}>
      {scene === 'library' && (
        <LibraryScene onGoToLab={() => setScene('lab')} onGoToNewsroom={() => setScene('newsroom')} />
      )}
      {scene === 'lab' && (
        <ChemistryLabScene onBackToLibrary={() => setScene('library')} />
      )}
      {scene === 'newsroom' && (
        <NewsroomScene onBackToLibrary={() => setScene('library')} />
      )}
    </div>
  );
}

export default App;
