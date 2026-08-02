import { useState } from 'react';
import LibraryOverworld from '../library_overworld.jsx';
import ChemistryLab from '../chemistry_lab.jsx';
import Newsroom from '../newsroom.jsx';
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
        <LibraryOverworld onGoToLab={() => setScene('lab')} onGoToNewsroom={() => setScene('newsroom')} />
      )}
      {scene === 'lab' && (
        <ChemistryLab onBackToLibrary={() => setScene('library')} />
      )}
      {scene === 'newsroom' && (
        <Newsroom onBackToLibrary={() => setScene('library')} />
      )}
    </div>
  );
}

export default App;
