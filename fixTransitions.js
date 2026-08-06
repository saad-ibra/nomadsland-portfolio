const fs = require('fs');
const glob = require('glob'); // wait, I can just use basic node fs with a hardcoded list
const files = [
  'src/scenes/VillageScene.jsx',
  'src/scenes/LibraryScene.jsx',
  'src/scenes/ChemistryLabScene.jsx',
  'src/scenes/NewsroomScene.jsx',
  'src/scenes/NomadshomeScene.jsx',
  'src/scenes/MusicRoomScene.jsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  // Look for: position: "absolute", left: pos.col * TILE, top: pos.row * TILE
  // Or: left: pos.col * TILE, top: pos.row * TILE,
  content = content.replace(/left: pos\.col \* TILE, top: pos\.row \* TILE,?/, `left: pos.col * TILE, top: pos.row * TILE, transition: "left 0.14s linear, top 0.14s linear",`);
  
  if (f === 'src/scenes/NewsroomScene.jsx') {
    // Fix the newspaper link
    content = content.replace(/window\.location\.href = '\/blogs\/'/g, `window.location.href = 'blogs/'`);
  }
  
  fs.writeFileSync(f, content);
});
console.log("Done");
