/**
 * PlayerSprite — Pixel-art character renderer.
 *
 * Accepts a `costume` prop that swaps palette and accessories per room.
 * Costumes: "casual" (default), "labcoat", "newsroom"
 */
import { TILE } from '../../engine/constants';

const COSTUMES = {
  casual: {
    hair: "#3a1c08", hairLight: "#5a3018",
    shirt: "#e04040", shirtShade: "#b83030",
    pants: "#2850a0", pantsStripe: "#183878",
    shoe: "#282828",
    accessories: () => null,
  },
  labcoat: {
    hair: "#4a4a4a", hairLight: "#6a6a6a",
    shirt: "#f4f4f6", shirtShade: "#f4f4f6",
    pants: "#304050", pantsStripe: null,
    shoe: "#1a1a1a",
    accessories: (px, direction) => {
      // Lab buttons on front, test tube on side
      if (direction === "down") return (<>{px(6,10,1,1,"#aaa")}{px(6,12,1,1,"#aaa")}</>);
      return null;
    },
    sideAccessories: (px) => (<>{px(13,11,1,2,"#ffffff")}{px(13,12,1,1,"#00ffcc")}</>),
  },
  newsroom: {
    hair: "#2c1b18", hairLight: "#4a3828",
    shirt: "#8b4513", shirtShade: "#8b4513",
    pants: "#2a2a3a", pantsStripe: null,
    shoe: "#1a1a1a",
    accessories: () => null,
  },
};

export default function PlayerSprite({ direction, stepping, costume = "casual" }) {
  const frame = stepping ? 1 : 0;
  const skin = "#fcd8b4", skinShade = "#e8b888";
  const eye = "#181818", white = "#ffffff";
  const c = COSTUMES[costume] || COSTUMES.casual;

  const px = (x, y, w, h, color) => (
    <rect key={`${x}-${y}-${color}`} x={x} y={y} width={w} height={h} fill={color} />
  );

  const renderDown = () => {
    const lL = frame ? 1 : 0, lR = frame ? -1 : 0;
    return (<>
      {px(4,0,8,2,c.hair)}{px(3,1,10,1,c.hair)}{px(3,2,10,2,c.hair)}
      {px(4,4,8,5,skin)}{px(3,4,1,4,skin)}{px(12,4,1,4,skin)}
      {px(5,5,2,2,white)}{px(9,5,2,2,white)}{px(6,6,1,1,eye)}{px(10,6,1,1,eye)}
      {px(7,8,2,1,skinShade)}
      {px(3,9,10,4,c.shirt)}{px(2,10,1,3,c.shirt)}{px(13,10,1,3,c.shirt)}
      {c.shirtShade !== c.shirt && px(4,9,8,1,c.shirtShade)}
      {px(1,10,2,3,skin)}{px(13,10,2,3,skin)}
      {c.accessories && c.accessories(px, "down")}
      {px(4,13,3,2,c.pants)}{px(9,13,3,2,c.pants)}
      {c.pantsStripe && px(7,13,2,1,c.pantsStripe)}
      {px(4,15+lL,3,1,c.shoe)}{px(9,15+lR,3,1,c.shoe)}
    </>);
  };

  const renderUp = () => {
    const lL = frame ? 1 : 0, lR = frame ? -1 : 0;
    return (<>
      {px(4,0,8,2,c.hair)}{px(3,1,10,1,c.hair)}{px(3,2,10,6,c.hair)}{px(4,7,8,2,c.hairLight)}
      {px(3,9,10,4,c.shirt)}{px(2,10,1,3,c.shirt)}{px(13,10,1,3,c.shirt)}
      {px(1,10,2,3,skin)}{px(13,10,2,3,skin)}
      {px(4,13,3,2,c.pants)}{px(9,13,3,2,c.pants)}
      {c.pantsStripe && px(7,13,2,1,c.pantsStripe)}
      {px(4,15+lL,3,1,c.shoe)}{px(9,15+lR,3,1,c.shoe)}
    </>);
  };

  const renderSide = (flip) => {
    const lo = frame ? 1 : 0;
    return (
      <g transform={flip ? "translate(16,0) scale(-1,1)" : undefined}>
        {px(5,0,7,2,c.hair)}{px(4,1,9,1,c.hair)}{px(4,2,9,2,c.hair)}{px(3,3,2,3,c.hair)}
        {px(5,4,7,5,skin)}{px(4,5,1,3,skin)}{px(12,5,1,3,skin)}
        {px(10,5,2,2,white)}{px(11,6,1,1,eye)}{px(10,8,2,1,skinShade)}
        {px(4,9,9,4,c.shirt)}{px(3,10,1,3,c.shirt)}
        {px(12,10,2,3,skin)}
        {c.sideAccessories && c.sideAccessories(px)}
        {px(5,13,3,2,c.pants)}{px(9,13,3,2,c.pants)}
        {px(5,15,3,1+lo,c.shoe)}{px(9,15,3,1,c.shoe)}
      </g>
    );
  };

  return (
    <svg width={TILE} height={TILE+2} viewBox="0 0 16 17" style={{ imageRendering: "pixelated", overflow: "visible" }}>
      <ellipse cx="8" cy="16.5" rx="5" ry="1.5" fill="rgba(0,0,0,0.3)" />
      {direction === "down"  && renderDown()}
      {direction === "up"    && renderUp()}
      {direction === "left"  && renderSide(true)}
      {direction === "right" && renderSide(false)}
    </svg>
  );
}
