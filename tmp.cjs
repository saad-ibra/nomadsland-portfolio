const fs = require('fs');

const BEZEL_COMP = `import React from 'react';

export default function GameBoyBezel({ children }) {
  return (
    <div style={{
        padding: "24px 24px 44px 24px",
        background: "#7b7a85",
        borderRadius: "8px 8px 48px 8px",
        border: "3px solid #333",
        boxShadow: "0 8px 16px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2)",
        position: "relative",
      }}>
        <div style={{ position: "absolute", top: 24, left: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
           <div style={{ width: 6, height: 6, background: "#ff0000", borderRadius: "50%", boxShadow: "0 0 6px #ff0000" }} />
           <div style={{ fontSize: 4, color: "#ccc", marginTop: 2, fontFamily: "sans-serif" }}>BATTERY</div>
        </div>
        
        <div style={{ position: "absolute", top: 8, left: 32, right: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ height: 2, flex: 1, background: "linear-gradient(to right, #800040, #200060)" }} />
          <div style={{ fontSize: 5, color: "#ccc", fontFamily: "sans-serif", margin: "0 8px", letterSpacing: 0.5 }}>DOT MATRIX WITH STEREO SOUND</div>
          <div style={{ height: 2, flex: 1, background: "linear-gradient(to left, #800040, #200060)" }} />
        </div>

        {children}
    </div>
  );
}
`;

fs.writeFileSync('src/components/ui/GameBoyBezel.jsx', BEZEL_COMP);

const scenes = [
  'VillageScene.jsx',
  'LibraryScene.jsx',
  'ChemistryLabScene.jsx',
  'NewsroomScene.jsx',
  'NomadshomeScene.jsx',
  'MusicRoomScene.jsx'
];

for (const scene of scenes) {
  let content = fs.readFileSync('src/scenes/' + scene, 'utf8');
  
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

  fs.writeFileSync('src/scenes/' + scene, content);
}
