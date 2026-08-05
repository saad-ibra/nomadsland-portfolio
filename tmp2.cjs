const fs = require('fs');

const scenes = [
  'LibraryScene.jsx',
  'ChemistryLabScene.jsx',
  'NewsroomScene.jsx',
  'NomadshomeScene.jsx',
  'MusicRoomScene.jsx'
];

for (const scene of scenes) {
  let content = fs.readFileSync('src/scenes/' + scene, 'utf8');

  // Find the div that has width: internalW and height: internalH and overflow: "hidden"
  const divRegex = /(<div style=\{\{\s*position:\s*"relative",\s*width:\s*internalW,\s*height:\s*internalH,\s*overflow:\s*"hidden"[\s\S]*?\}\}\s*>)/;
  
  if (divRegex.test(content)) {
    content = content.replace(divRegex, (match) => {
      let modified = match.replace(/boxShadow:\s*".*?"/, 'boxShadow: "inset 0 0 8px rgba(0,0,0,0.8)"');
      return `<GameBoyBezel>\n        ${modified}`;
    });

    const endRegex = /<\/div>\s*<\/div>\s*<ControlBar/g;
    content = content.replace(endRegex, `  </div>\n        </GameBoyBezel>\n      </div>\n      <ControlBar`);
    
    fs.writeFileSync('src/scenes/' + scene, content);
    console.log('Wrapped', scene);
  } else {
    console.log('Failed to find wrapper in', scene);
  }
}
