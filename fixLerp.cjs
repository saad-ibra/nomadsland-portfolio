const fs = require('fs');
const path = require('path');

const scenes = [
  { file: 'src/scenes/LibraryScene.jsx', cols: 'MAP_COLS', rows: 'MAP_ROWS' },
  { file: 'src/scenes/ChemistryLabScene.jsx', cols: 'layout.totalCols', rows: 'layout.totalRows' },
  { file: 'src/scenes/NewsroomScene.jsx', cols: 'layout.totalCols', rows: 'layout.totalRows' },
  { file: 'src/scenes/NomadshomeScene.jsx', cols: 'MAP_COLS', rows: 'MAP_ROWS' },
  { file: 'src/scenes/MusicRoomScene.jsx', cols: 'MAP_COLS', rows: 'MAP_ROWS' }
];

scenes.forEach(({ file, cols, rows }) => {
  const p = path.resolve(process.cwd(), file);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');

  // Add import
  if (!content.includes('useCameraLerp')) {
    content = content.replace(/import {.*?}.*?;/, match => `${match}\nimport { useCameraLerp } from '../hooks/useCameraLerp.js';`);
  }

  // Replace camera calculations
  const rawCamRegex = /const rawCamX[\s\S]*?const camY.*?;/g;
  content = content.replace(rawCamRegex, `const cam = useCameraLerp(pos, TILE, internalW, internalH, ${cols}, ${rows}, speedMultiplier);`);

  // Replace left: -camX, top: -camY, transition... with left: -cam.x, top: -cam.y
  content = content.replace(/left: -camX, top: -camY, transition: "left 0\.14s linear, top 0\.14s linear",/g, 'left: -cam.x, top: -cam.y,');
  content = content.replace(/left: -camX, top: -camY,/g, 'left: -cam.x, top: -cam.y,');

  // Replace any other remaining `-camX` and `-camY` just in case
  content = content.replace(/-camX/g, '-cam.x').replace(/-camY/g, '-cam.y');

  fs.writeFileSync(p, content);
  console.log(`Updated lerp in ${file}`);
});
