import { useState } from 'react';
import VillageScene from './scenes/VillageScene.jsx';
import LibraryScene from './scenes/LibraryScene.jsx';
import ChemistryLabScene from './scenes/ChemistryLabScene.jsx';
import NewsroomScene from './scenes/NewsroomScene.jsx';
import NomadshomeScene from './scenes/NomadshomeScene.jsx';
import MusicRoomScene from './scenes/MusicRoomScene.jsx';
import './App.css';

function App() {
  const [scene, setScene] = useState('nomadshome');
  const [fading, setFading] = useState(false);

  const changeScene = (newScene) => {
    setFading(true);
    setTimeout(() => {
      setScene(newScene);
      setFading(false);
    }, 400); // 400ms fade transition
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a14',
      padding: 0,
      margin: 0,
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      {/* Global Fade Overlay */}
      <div style={{
        position: 'fixed', inset: 0, background: '#000', zIndex: 9999, pointerEvents: 'none',
        opacity: fading ? 1 : 0, transition: 'opacity 0.4s ease-in-out'
      }} />

      {scene === 'village' && (
        <VillageScene
          onGoToLibrary={() => changeScene('library')}
          onGoToLab={() => changeScene('lab')}
          onGoToNewsroom={() => changeScene('newsroom')}
          onGoToNomadshome={() => changeScene('nomadshome')}
          onGoToMusicRoom={() => changeScene('musicroom')}
        />
      )}
      {scene === 'library' && (
        <LibraryScene onBackToVillage={() => changeScene('village')} />
      )}
      {scene === 'lab' && (
        <ChemistryLabScene onBackToVillage={() => changeScene('village')} />
      )}
      {scene === 'newsroom' && (
        <NewsroomScene onBackToVillage={() => changeScene('village')} />
      )}
      {scene === 'nomadshome' && (
        <NomadshomeScene onBackToVillage={() => changeScene('village')} />
      )}
      {scene === 'musicroom' && (
        <MusicRoomScene onBackToVillage={() => changeScene('village')} />
      )}
    </div>
  );
}

export default App;
