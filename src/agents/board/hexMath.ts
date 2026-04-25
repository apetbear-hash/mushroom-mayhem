import type { HexCoord } from '../../shared/types';

// Pointy-top axial coordinate system.

export const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function hexNeighbors(coord: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map(d => ({ q: coord.q + d.q, r: coord.r + d.r }));
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (
    Math.abs(a.q - b.q) +
    Math.abs(a.q + a.r - b.q - b.r) +
    Math.abs(a.r - b.r)
  ) / 2;
}

export function hexToId(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

export function idToHex(id: string): HexCoord {
  const [q, r] = id.split(',').map(Number);
  return { q, r };
}

// Axial → pixel (pointy-top). `size` is the circumradius of the hex.
export function hexToPixel(coord: HexCoord, size: number): { x: number; y: number } {
  return {
    x: size * (Math.sqrt(3) * coord.q + (Math.sqrt(3) / 2) * coord.r),
    y: size * (1.5 * coord.r),
  };
}

// Returns the 6 corner pixel positions of a pointy-top hexagon.
export function hexCornerPoints(
  center: { x: number; y: number },
  size: number,
): { x: number; y: number }[] {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return {
      x: center.x + size * Math.cos(angle),
      y: center.y + size * Math.sin(angle),
    };
  });
}

// SVG polygon points string for a hex centred at `center`.
export function hexPolygonPoints(center: { x: number; y: number }, size: number): string {
  return hexCornerPoints(center, size)
    .map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');
}
