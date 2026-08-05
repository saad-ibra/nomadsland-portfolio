import { TILE } from '../../engine/constants';

export default function SaadSprite({ direction = "down", stepping = false }) {
  const frame = stepping ? 1 : 0;
  
  // Custom palette for Saad Ibra
  const skin = "#e5b485", skinShade = "#c2956c";
  const hair = "#2a2a2a", hairLight = "#444444";
  const eye = "#111111", white = "#ffffff";
  const jacket = "#2E4C38", jacketShade = "#1F3325";
  const pants = "#222222", shoe = "#f0f0f0";
  const glasses = "#111111"; // Frame color

  const px = (x, y, w, h, color) => (
    <rect key={`${x}-${y}-${color}`} x={x} y={y} width={w} height={h} fill={color} />
  );

  const renderDown = () => {
    const lL = frame ? 1 : 0, lR = frame ? -1 : 0;
    return (<>
      {/* Hair */}
      {px(4,0,8,2,hair)}{px(3,1,10,1,hair)}{px(3,2,10,2,hair)}
      {/* Face */}
      {px(4,4,8,5,skin)}{px(3,4,1,4,skin)}{px(12,4,1,4,skin)}
      {/* Eyes & Glasses */}
      {px(5,5,2,2,white)}{px(9,5,2,2,white)}
      {px(6,6,1,1,eye)}{px(10,6,1,1,eye)}
      {/* Glasses Frames */}
      {px(4,5,1,3,glasses)}{px(7,5,2,1,glasses)}{px(11,5,1,3,glasses)}
      {px(5,4,2,1,glasses)}{px(9,4,2,1,glasses)}
      {px(5,7,2,1,glasses)}{px(9,7,2,1,glasses)}
      {/* Chin shadow */}
      {px(7,8,2,1,skinShade)}
      {/* Jacket */}
      {px(3,9,10,4,jacket)}{px(2,10,1,3,jacket)}{px(13,10,1,3,jacket)}
      {/* Collar shadow */}
      {px(4,9,8,1,jacketShade)} 
      {/* Inner shirt showing */}
      {px(7,10,2,3,"#dddddd")}
      {/* Hands */}
      {px(1,10,2,3,skin)}{px(13,10,2,3,skin)}
      {/* Pants */}
      {px(4,13,3,2,pants)}{px(9,13,3,2,pants)}
      {/* Shoes */}
      {px(4,15+lL,3,1,shoe)}{px(9,15+lR,3,1,shoe)}
    </>);
  };

  const renderUp = () => {
    const lL = frame ? 1 : 0, lR = frame ? -1 : 0;
    return (<>
      {/* Hair (back of head) */}
      {px(4,0,8,2,hair)}{px(3,1,10,1,hair)}{px(3,2,10,6,hair)}{px(4,7,8,2,hairLight)}
      {/* Jacket */}
      {px(3,9,10,4,jacket)}{px(2,10,1,3,jacket)}{px(13,10,1,3,jacket)}
      {/* Hands */}
      {px(1,10,2,3,skin)}{px(13,10,2,3,skin)}
      {/* Pants */}
      {px(4,13,3,2,pants)}{px(9,13,3,2,pants)}
      {/* Shoes */}
      {px(4,15+lL,3,1,shoe)}{px(9,15+lR,3,1,shoe)}
    </>);
  };

  const renderSide = (flip) => {
    const lo = frame ? 1 : 0;
    return (
      <g transform={flip ? "translate(16,0) scale(-1,1)" : undefined}>
        {/* Hair */}
        {px(5,0,7,2,hair)}{px(4,1,9,1,hair)}{px(4,2,9,2,hair)}{px(3,3,2,3,hair)}
        {/* Face */}
        {px(5,4,7,5,skin)}{px(4,5,1,3,skin)}{px(12,5,1,3,skin)}
        {/* Eyes & Glasses */}
        {px(10,5,2,2,white)}{px(11,6,1,1,eye)}
        {px(9,5,1,3,glasses)}{px(12,5,1,3,glasses)}
        {px(10,4,2,1,glasses)}{px(10,7,2,1,glasses)}
        {/* Chin shadow */}
        {px(10,8,2,1,skinShade)}
        {/* Jacket */}
        {px(4,9,9,4,jacket)}{px(3,10,1,3,jacket)}
        {/* Hands */}
        {px(12,10,2,3,skin)}
        {/* Pants */}
        {px(5,13,3,2,pants)}{px(9,13,3,2,pants)}
        {/* Shoes */}
        {px(5,15,3,1+lo,shoe)}{px(9,15,3,1,shoe)}
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
