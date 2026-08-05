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

  // Add import
  if (!content.includes('GameBoyBezel')) {
    content = content.replace(/(import .*?;)\n/, "$1\nimport GameBoyBezel from '../components/ui/GameBoyBezel';\n");
  }

  // Update ResizeObserver
  const resizeRegex = /const newScale = Math\.max\(1, Math\.floor\(width \/ targetW\)\);\s+setInternalW\(Math\.floor\(width \/ newScale\)\);\s+setInternalH\(Math\.floor\(height \/ newScale\)\);/g;
  const newResize = `const newScale = Math.max(1, Math.floor(width / targetW));
        const bezelW = 48; // 24px padding on left/right
        const bezelH = 68; // 24px top + 44px bottom padding
        setInternalW(Math.max(160, Math.floor(width / newScale) - bezelW));
        setInternalH(Math.max(144, Math.floor(height / newScale) - bezelH));`;
  content = content.replace(resizeRegex, newResize);

  // Set containerRef background
  content = content.replace(/<div ref=\{containerRef\} style=\{\{\s*flex: 1,\s*display: "flex",\s*alignItems: "center",\s*justifyContent: "center",\s*position: "relative",\s*overflow: "hidden"\s*\}\}>/, 
  `<div ref={containerRef} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "#d0d0c0" }}>`);

  // Wrap viewport
  const divRegex = /(<div style=\{\{\s*position:\s*"relative",\s*width:\s*internalW,\s*height:\s*internalH,\s*overflow:\s*"hidden"[\s\S]*?\}\}\s*>)/;
  content = content.replace(divRegex, (match) => {
    let modified = match.replace(/boxShadow:\s*".*?"/, 'boxShadow: "inset 0 0 8px rgba(0,0,0,0.8)"');
    return `<GameBoyBezel>\n        ${modified}`;
  });

  content = content.replace(/<\/div>\s*<\/div>\s*<ControlBar/g, `  </GameBoyBezel>\n      </div>\n      </div>\n      <ControlBar`);
  
  fs.writeFileSync('src/scenes/' + scene, content);
  console.log('Patched', scene);
}
