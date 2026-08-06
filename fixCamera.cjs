const fs = require('fs');
const glob = require('glob');
const path = require('path');

const scenes = [
  'src/scenes/LibraryScene.jsx',
  'src/scenes/ChemistryLabScene.jsx',
  'src/scenes/NewsroomScene.jsx',
  'src/scenes/NomadshomeScene.jsx',
  'src/scenes/MusicRoomScene.jsx'
];

scenes.forEach(file => {
  const p = path.resolve(process.cwd(), file);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');
  
  // We want to find the camera wrapper which usually looks like:
  // <div style={{ position: "absolute", left: -camX, top: -camY, ... }}
  // Or: left: -camX, top: -camY,
  
  // We'll replace it to include the transition.
  content = content.replace(
    /left: -camX, top: -camY,/g,
    `left: -camX, top: -camY, transition: "left 0.14s linear, top 0.14s linear",`
  );

  fs.writeFileSync(p, content);
  console.log(`Updated camera in ${file}`);
});
