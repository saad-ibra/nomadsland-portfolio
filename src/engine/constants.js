/**
 * Core engine constants shared across all scenes.
 * Centralizes tile size, viewport dimensions, and timing values.
 */

// Grid
export const TILE = 32; // pixels per tile

// Viewport (internal resolution before scaling)
export const INTERNAL_W = 384;
export const INTERNAL_H = 288;

// Movement
export const MOVE_COOLDOWN = 140; // ms between grid moves
