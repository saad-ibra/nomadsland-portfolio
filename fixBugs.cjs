const fs = require('fs');
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
  
  // 1. Fix Camera Jitter (add transition to container)
  content = content.replace(
    /left: -camX, top: -camY,/g,
    `left: -camX, top: -camY, transition: "left 0.14s linear, top 0.14s linear",`
  );

  // 2. Fix Audio Context
  // If it doesn't already import getSharedAudioCtx, add it
  if (!content.includes('getSharedAudioCtx')) {
    content = content.replace(/import {.*?}.*?;/, match => `${match}\nimport { getSharedAudioCtx } from '../engine/sfx.js';`);
  }
  
  // Replace new (window.AudioContext || window.webkitAudioContext)()
  content = content.replace(/new \(window\.AudioContext \|\| window\.webkitAudioContext\)\(\)/g, 'getSharedAudioCtx()');

  fs.writeFileSync(p, content);
  console.log(`Updated ${file}`);
});

// Also fix Audio Context in VillageScene
const villagePath = path.resolve(process.cwd(), 'src/scenes/VillageScene.jsx');
let villageContent = fs.readFileSync(villagePath, 'utf8');
if (!villageContent.includes('getSharedAudioCtx')) {
  villageContent = villageContent.replace(/import {.*?}.*?;/, match => `${match}\nimport { getSharedAudioCtx } from '../engine/sfx.js';`);
}
villageContent = villageContent.replace(/new \(window\.AudioContext \|\| window\.webkitAudioContext\)\(\)/g, 'getSharedAudioCtx()');
fs.writeFileSync(villagePath, villageContent);
console.log(`Updated src/scenes/VillageScene.jsx`);
