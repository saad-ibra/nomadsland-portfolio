const fs = require('fs');
const path = require('path');

const scenesDir = path.join(__dirname, 'src/scenes');
const files = fs.readdirSync(scenesDir).filter(f => f.endsWith('Scene.jsx'));

for (const file of files) {
  const filePath = path.join(scenesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add useState for internalW and internalH if they don't exist
  if (!content.includes('const [internalW, setInternalW] = useState(384);')) {
    content = content.replace(
      /const \[scale, setScale\] = useState\(1\);/g,
      `const [scale, setScale] = useState(1);\n  const [internalW, setInternalW] = useState(384);\n  const [internalH, setInternalH] = useState(288);`
    );
  }

  // 2. Replace the resize logic
  const resizeRegex = /const resize = \(\) => {[\s\S]*?setScale\([^)]+\)\)?;\n\s*}/;
  const newResizeLogic = `const resize = () => {
      const isMobile = window.innerWidth < 768;
      const consoleHeight = isLandscape ? 0 : window.innerHeight * (isMobile ? 0.4 : 0.333);
      const availableHeight = window.innerHeight - consoleHeight;
      const baseW = 384;
      const baseH = 288;
      const newScale = Math.max(1, Math.floor(Math.min(window.innerWidth / baseW, availableHeight / baseH)));
      setInternalW(Math.floor(window.innerWidth / newScale));
      setInternalH(Math.floor(availableHeight / newScale));
      setScale(newScale);
    }`;
  content = content.replace(resizeRegex, newResizeLogic);

  // 3. Replace INTERNAL_W/INTERNAL_H with internalW/internalH for rendering logic
  content = content.replace(/import {([^}]+)} from (['"])\.\.\/engine\/constants\2;/g, (match, imports) => {
    const cleanImports = imports.split(',').map(s => s.trim()).filter(s => s !== 'INTERNAL_W' && s !== 'INTERNAL_H').join(', ');
    return `import { ${cleanImports} } from '../engine/constants';`;
  });
  
  // Replace usage in the file
  content = content.replace(/INTERNAL_W/g, 'internalW');
  content = content.replace(/INTERNAL_H/g, 'internalH');

  fs.writeFileSync(filePath, content);
  console.log('Updated ' + file);
}
