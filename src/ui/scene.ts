import type { Word } from '../core/content';
import { FURNITURE } from './furniture';

export type Pos = 'in' | 'on' | 'under' | 'behind' | 'front' | 'next';

const NS = 'http://www.w3.org/2000/svg';
const W = 400, H = 300, FLOOR = 255, OBJ = 80;

type Layer = 'far' | 'inside' | 'near';
interface Anchor { x: number; y: number; s: number; layer: Layer }

const originX = (w: number) => (W - w) / 2 - 40;

function anchor(refId: string, pos: Pos): Anchor {
  const f = FURNITURE[refId];
  const x0 = originX(f.w), top = FLOOR - f.h, cx = x0 + f.w / 2;
  switch (pos) {
    case 'on': {
      const s = f.onS ?? 0.85;
      return { x: cx + (f.onDx ?? 0) * f.w, y: top + f.h * f.on - OBJ * s * 0.45, s, layer: 'near' };
    }
    case 'under':  return { x: cx, y: FLOOR - OBJ * 0.55 * 0.5, s: 0.55, layer: 'far' };
    case 'in':     return { x: cx, y: top + f.h * (f.rim ?? 0) - OBJ * 0.85 * 0.12, s: 0.85, layer: 'inside' };
    case 'behind': return { x: cx + f.w * 0.3, y: top - OBJ * 0.8 * 0.3, s: 0.8, layer: 'far' };
    case 'front':  return { x: cx - f.w * 0.3, y: FLOOR + 12 - OBJ * 1.05 * 0.45, s: 1.05, layer: 'near' };
    case 'next':   return { x: x0 + f.w + OBJ * 0.75, y: FLOOR - OBJ * 0.45, s: 1, layer: 'near' };
  }
}

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

// Emoji are drawn as text; pictures starting with "/" are image files.
function pic(src: string, cx: number, cy: number, w: number, h: number): SVGElement {
  if (src.startsWith('/')) {
    return svgEl('image', { href: import.meta.env.BASE_URL + src.slice(1),
      x: cx - w / 2, y: cy - h / 2, width: w, height: h, preserveAspectRatio: 'none' });
  }
  const t = svgEl('text', { x: cx, y: cy, 'font-size': h, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
  t.textContent = src;
  return t;
}

export interface Scene {
  svg: SVGSVGElement;
  place(pos: Pos | null): void;
  nearest(clientX: number, clientY: number, allowed: Pos[]): { pos: Pos; dist: number };
}

export function buildScene(obj: Word, ref: Word): Scene {
  const f = FURNITURE[ref.id];
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'scene' });
  svg.append(svgEl('rect', { x: 0, y: FLOOR, width: W, height: H - FLOOR, fill: '#e8e1d3' }));
  const art = (markup = '') => {
    const g = svgEl('g', { transform: `translate(${originX(f.w)} ${FLOOR - f.h})` });
    g.innerHTML = markup;
    return g;
  };
  const layers: Record<Layer, SVGGElement> = { far: svgEl('g', {}), inside: svgEl('g', {}), near: svgEl('g', {}) };
  svg.append(layers.far, art(f.back), layers.inside, art(f.front), layers.near);
  const objEl = pic(obj.pic, 0, 0, OBJ, OBJ);

  function place(pos: Pos | null) {
    objEl.remove();
    if (!pos) return;
    const a = anchor(ref.id, pos);
    objEl.setAttribute('transform', `translate(${a.x} ${a.y}) scale(${a.s})`);
    layers[a.layer].append(objEl);
  }

  function nearest(clientX: number, clientY: number, allowed: Pos[]) {
    const p = new DOMPoint(clientX, clientY).matrixTransform(svg.getScreenCTM()!.inverse());
    let best = { pos: allowed[0], dist: Infinity };
    for (const pos of allowed) {
      const a = anchor(ref.id, pos);
      const dist = Math.hypot(a.x - p.x, a.y - p.y);
      if (dist < best.dist) best = { pos, dist };
    }
    return best;
  }

  return { svg, place, nearest };
}
