import { useState } from 'react';
import VillageScene from './scenes/VillageScene.jsx';
import LibraryScene from './scenes/LibraryScene.jsx';
import ChemistryLabScene from './scenes/ChemistryLabScene.jsx';
import NewsroomScene from './scenes/NewsroomScene.jsx';
import NomadshomeScene from './scenes/NomadshomeScene.jsx';
import MusicRoomScene from './scenes/MusicRoomScene.jsx';
import './App.css';

function App() {
  const [scene, setScene] = useState('village');

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
      {scene === 'village' && (
        <VillageScene
          onGoToLibrary={() => setScene('library')}
          onGoToLab={() => setScene('lab')}
          onGoToNewsroom={() => setScene('newsroom')}
          onGoToNomadshome={() => setScene('nomadshome')}
          onGoToMusicRoom={() => setScene('musicroom')}
        />
      )}
      {scene === 'library' && (
        <LibraryScene onBackToVillage={() => setScene('village')} />
      )}
      {scene === 'lab' && (
        <ChemistryLabScene onBackToVillage={() => setScene('village')} />
      )}
      {scene === 'newsroom' && (
        <NewsroomScene onBackToVillage={() => setScene('village')} />
      )}
      {scene === 'nomadshome' && (
        <NomadshomeScene onBackToVillage={() => setScene('village')} />
      )}
      {scene === 'musicroom' && (
        <MusicRoomScene onBackToVillage={() => setScene('village')} />
      )}
    </div>
  );
}

export default App;
