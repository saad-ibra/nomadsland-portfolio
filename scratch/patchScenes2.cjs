const fs = require('fs');
const path = require('path');
const scenesDir = path.join(__dirname, '..', 'src', 'scenes');

const scenes = [
  { file: 'VillageScene.jsx', maxCols: 'MAP_COLS', maxRows: 'MAP_ROWS', hasWorldRef: true },
  { file: 'LibraryScene.jsx', maxCols: 'MAP_COLS', maxRows: 'MAP_ROWS', hasWorldRef: false },
  { file: 'NomadshomeScene.jsx', maxCols: 'MAP_COLS', maxRows: 'MAP_ROWS', hasWorldRef: false },
  { file: 'MusicRoomScene.jsx', maxCols: 'MAP_COLS', maxRows: 'MAP_ROWS', hasWorldRef: false },
  { file: 'NewsroomScene.jsx', maxCols: 'layout.totalCols', maxRows: 'layout.totalRows', hasWorldRef: false },
  { file: 'ChemistryLabScene.jsx', maxCols: 'layout.totalCols', maxRows: 'layout.totalRows', hasWorldRef: false },
];

for (const s of scenes) {
  const filePath = path.join(scenesDir, s.file);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add Imports
  content = content.replace(
    "import { usePlayerMovement } from '../hooks/usePlayerMovement.js';",
    "import { usePlayerMovement } from '../hooks/usePlayerMovement.js';\nimport { useTapToMove, TapMarker } from '../hooks/useTapToMove.jsx';"
  );
  content = content.replace(
    'import { usePlayerMovement } from "../hooks/usePlayerMovement";',
    'import { usePlayerMovement } from "../hooks/usePlayerMovement";\nimport { useTapToMove, TapMarker } from "../hooks/useTapToMove.jsx";'
  );

  // 2. Destructure setPath and tapTarget
  content = content.replace(
    /const\s+{\s*pos,\s*setPos,\s*facing,\s*stepping\s*}\s*=\s*usePlayerMovement/g,
    'const { pos, setPos, facing, stepping, setPath, tapTarget } = usePlayerMovement'
  );
  content = content.replace(
    /const\s+{\s*pos,\s*facing,\s*stepping\s*}\s*=\s*usePlayerMovement/g,
    'const { pos, facing, stepping, setPath, tapTarget } = usePlayerMovement'
  );

  // 3. Add worldRef
  if (!s.hasWorldRef) {
    content = content.replace(
      /const camRef = useRef\({.*?}\);/,
      "$& \n  const worldRef = useRef(null);"
    );
    content = content.replace(
      /const cam = useCameraLerp.*?;/,
      "$& \n  const worldRef = useRef(null);"
    );
  }

  // 4. Inject hook correctly (after usePlayerMovement declaration)
  const hookInjection = `\n  const handleWorldTap = useTapToMove(worldRef, pos, ${s.file==='ChemistryLabScene.jsx' || s.file==='NewsroomScene.jsx'?'(c, r) => canLayoutWalk(layoutRef.current, c, r)':'canWalk'}, setPath, ${s.maxCols}, ${s.maxRows}, phase === "free" && !isTransitioning${s.file==='VillageScene.jsx'?' && !isSailing':''});\n`;
  
  content = content.replace(
    /const { pos[^\}]+} = usePlayerMovement\(\{[\s\S]*?\}\);/,
    "$&" + hookInjection
  );

  // 5. Attach worldRef to the world div
  const divRegex = /<div(?=[^>]*width:\s*(?:MAP_COLS|layout\.totalCols)\s*\*\s*TILE)([^>]*)>/;
  content = content.replace(divRegex, (match, p1) => {
    if (match.includes('ref={worldRef}')) {
      return `<div${p1} onPointerDown={handleWorldTap}>`;
    } else {
      return `<div ref={worldRef} onPointerDown={handleWorldTap}${p1}>`;
    }
  });
  
  // 5.b Add TapMarker
  const markerInjection = `\n            <TapMarker tapTarget={tapTarget} TILE={TILE} />\n`;
  content = content.replace(
    /(<div(?=[^>]*width:\s*(?:MAP_COLS|layout\.totalCols)\s*\*\s*TILE)[^>]*>)/,
    `$1${markerInjection}`
  );

  fs.writeFileSync(filePath, content);
}
console.log("Done patching scenes perfectly");
