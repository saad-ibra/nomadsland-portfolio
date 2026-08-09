require('@babel/register')({
  presets: ['@babel/preset-env', '@babel/preset-react'],
  plugins: [],
  extensions: ['.js', '.jsx']
});
const React = require('react');
const { create } = require('react-test-renderer');
const NomadshomeScene = require('./src/scenes/NomadshomeScene.jsx').default;

console.log("Rendering...");
try {
  const root = create(React.createElement(NomadshomeScene, {
    isLandscape: true,
    onBackToVillage: () => {},
    speedMultiplier: 1,
    setSpeedMultiplier: () => {},
    musicPlaying: false,
    setMusicPlaying: () => {},
    musicMuted: false,
    setMusicMuted: () => {},
    musicVolume: 0.5,
    setMusicVolume: () => {}
  }));
  console.log("Render success!");
} catch (e) {
  console.error("Render failed:", e);
}
