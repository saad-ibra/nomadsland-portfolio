const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'chemistry_lab.jsx');
const destPath = path.join(__dirname, 'src', 'scenes', 'ChemistryLabScene.jsx');

let content = fs.readFileSync(srcPath, 'utf8');

// 1. Add imports
content = content.replace(
  /import ControlBar from "\.\/ControlBar";/,
  `import { TILE, INTERNAL_W, INTERNAL_H, MOVE_COOLDOWN } from '../engine/constants';
import PlayerSprite from '../components/sprites/PlayerSprite';
import ControlBar from '../components/ui/ControlBar';`
);

// 2. Remove inline constants
content = content.replace(/const TILE = 32;\n/, '');
content = content.replace(/\/\/ Fixed viewport \(camera follows player — world can be much larger\)\n/, '');
content = content.replace(/const INTERNAL_W = 384;\n/, '');
content = content.replace(/const INTERNAL_H = 288;\n/, '');
content = content.replace(/const MOVE_COOLDOWN = 140;\n/, '');

// 3. Remove inline PlayerSprite function
// It starts from `function PlayerSprite({ direction, stepping }) {`
// and ends with `}\n\n// ============================================================` before CHALKBOARD
content = content.replace(/\/\/ ============================================================\n\/\/  PLAYER SPRITE \(lab-coat scientist\)\n\/\/ ============================================================\nfunction PlayerSprite\([\s\S]*?<\/svg>\n  \);\n}\n\n/, '');

// 4. Update PlayerSprite usage to add costume="labcoat"
content = content.replace(/<PlayerSprite direction=\{facing\} stepping=\{stepping\} \/>/, '<PlayerSprite direction={facing} stepping={stepping} costume="labcoat" />');

// 5. Update Camera
content = content.replace(
  /const rawCamX = pos\.col \* TILE \+ TILE \/ 2 - INTERNAL_W \/ 2;\n  const rawCamY = pos\.row \* TILE \+ TILE \/ 2 - INTERNAL_H \/ 2;\n  const camX = Math\.max\(0, Math\.min\(Math\.max\(0, layout\.totalCols \* TILE - INTERNAL_W\), rawCamX\)\);\n  const camY = Math\.max\(0, Math\.min\(Math\.max\(0, layout\.totalRows \* TILE - INTERNAL_H\), rawCamY\)\);/,
  `const rawCamX = pos.col * TILE + TILE / 2 - INTERNAL_W / 2;
  const rawCamY = pos.row * TILE + TILE / 2 - INTERNAL_H / 2;
  const camX = Math.max(0, Math.min(Math.max(0, layout.totalCols * TILE - INTERNAL_W), rawCamX));
  const camY = Math.max(0, Math.min(Math.max(0, layout.totalRows * TILE - INTERNAL_H), rawCamY));`
);

fs.mkdirSync(path.dirname(destPath), { recursive: true });
fs.writeFileSync(destPath, content);
console.log('Done');
