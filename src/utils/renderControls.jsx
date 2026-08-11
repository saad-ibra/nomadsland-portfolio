/**
 * Renders dialogue text with styled keycap badges for control keywords.
 * Control words (SPACE, WASD, ESC, ENTER, arrow keys) get wrapped in
 * 3D keycap-styled spans that pulse subtly to draw attention.
 *
 * @param {string} text - The dialogue text to process
 * @param {object} kcStyle - CSS style object for the keycap badges
 * @returns {Array} Array of strings and React elements
 */
export function renderControlText(text, kcStyle) {
  if (!text) return text;
  const parts = text.split(/(SPACE|WASD|ESC|ENTER|arrow keys)/gi);
  return parts.map((part, i) =>
    /^(SPACE|WASD|ESC|ENTER|arrow keys)$/i.test(part)
      ? <span key={i} style={kcStyle}>{part.toUpperCase()}</span>
      : part
  );
}

/** CSS keyframes for dialogue box animations */
export const DIALOG_KEYFRAMES = `
  @keyframes dialogSlideIn {
    from { transform: translateY(-10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes keycapGlow {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.4); }
  }
`;
