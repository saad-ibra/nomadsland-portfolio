const fs = require('fs');

const scenes = [
  'LibraryScene.jsx',
  'ChemistryLabScene.jsx',
  'NewsroomScene.jsx',
  'NomadshomeScene.jsx',
  'MusicRoomScene.jsx',
  'VillageScene.jsx'
];

for (const scene of scenes) {
  let content = fs.readFileSync('src/scenes/' + scene, 'utf8');

  // 1. Remove import
  content = content.replace(/import GameBoyBezel from '\.\.\/components\/ui\/GameBoyBezel';\n/, "");

  // 2. Revert ResizeObserver
  const resizeRegex = /const newScale = Math\.max\(1, Math\.floor\(width \/ targetW\)\);[\s\S]*?setInternalH\(Math\.max\(144, Math\.floor\(height \/ newScale\) - bezelH\)\);/g;
  const oldResize = `const newScale = Math.max(1, Math.floor(width / targetW));
        setInternalW(Math.floor(width / newScale));
        setInternalH(Math.floor(height / newScale));`;
  content = content.replace(resizeRegex, oldResize);

  // 3. Revert containerRef background
  content = content.replace(/<div ref=\{containerRef\} style=\{\{\s*flex: 1,\s*display: "flex",\s*alignItems: "center",\s*justifyContent: "center",\s*position: "relative",\s*overflow: "hidden",\s*background: "#d0d0c0"\s*\}\}>/g, 
  `<div ref={containerRef} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>`);

  // 4. Unwrap GameBoyBezel
  // Find <GameBoyBezel>\n        <div style={{ ... }}>
  const bezelRegex = /<GameBoyBezel>\s*(<div style=\{\{\s*position:\s*"relative",\s*width:\s*internalW,\s*height:\s*internalH,\s*overflow:\s*"hidden"[^\}]*?\}\}\s*>)/g;
  content = content.replace(bezelRegex, (match, div) => {
    // Restore the old boxShadow. For VillageScene it was different? Let's just give them all a standard one, or none.
    // Originally they were: boxShadow: "0 0 0 4px #1a5580" (Village), boxShadow: "0 0 0 4px #1a2b3c..." (Chem) etc.
    // If I just strip the GameBoyBezel and replace 'boxShadow: "inset 0 0 8px rgba(0,0,0,0.8)"' with 'boxShadow: "0 0 0 4px #222"'
    return div.replace(/boxShadow:\s*".*?"/, 'boxShadow: "0 0 0 4px #222"');
  });

  // 5. Remove closing tag
  content = content.replace(/<\/GameBoyBezel>\n\s*<\/div>\n\s*<\/div>\n\s*<ControlBar/g, `</div>\n      </div>\n      <ControlBar`);

  fs.writeFileSync('src/scenes/' + scene, content);
  console.log('Undone', scene);
}
