// Furniture drawn in its own units (0..w, 0..h); `back` goes behind objects that are "in" it.
export interface Furniture {
  w: number; h: number;
  on: number;      // top surface, fraction of height
  onDx?: number;   // shift "on" sideways (fraction of width), e.g. off the pillow
  onS?: number;    // object scale when on it
  rim?: number;    // opening edge for "in", fraction of height
  back?: string;
  front: string;
}

export const FURNITURE: Record<string, Furniture> = {
  table: { w: 200, h: 140, on: 0,
    front: '<rect x="0" y="0" width="200" height="18" rx="6" fill="#b5763f"/><rect x="6" y="14" width="188" height="8" fill="#8f5a2c"/>' +
      '<rect x="16" y="20" width="14" height="120" rx="3" fill="#8f5a2c"/><rect x="170" y="20" width="14" height="120" rx="3" fill="#8f5a2c"/>' },
  chair: { w: 120, h: 160, on: 66 / 160, onS: 0.7,
    front: '<rect x="14" y="0" width="92" height="68" rx="8" fill="#b5763f"/><rect x="26" y="12" width="68" height="44" rx="5" fill="#c98d52"/>' +
      '<rect x="4" y="66" width="112" height="16" rx="4" fill="#8f5a2c"/><rect x="10" y="82" width="12" height="78" rx="3" fill="#8f5a2c"/>' +
      '<rect x="98" y="82" width="12" height="78" rx="3" fill="#8f5a2c"/>' },
  bed: { w: 200, h: 140, on: 54 / 140, onDx: 0.15,
    front: '<rect x="0" y="0" width="16" height="140" rx="4" fill="#b5763f"/><rect x="184" y="44" width="16" height="96" rx="4" fill="#b5763f"/>' +
      '<rect x="12" y="80" width="176" height="12" fill="#8f5a2c"/><rect x="14" y="54" width="172" height="28" rx="8" fill="#4a8fd6"/>' +
      '<rect x="22" y="40" width="46" height="18" rx="9" fill="#f3f7fb" stroke="#c9d6e3" stroke-width="2"/>' },
  box: { w: 160, h: 120, on: 0.25, rim: 30 / 120,
    back: '<polygon points="10,32 0,4 46,12 54,32" fill="#a8763f"/><polygon points="150,32 160,4 114,12 106,32" fill="#a8763f"/>' +
      '<rect x="10" y="18" width="140" height="16" fill="#7a4f26"/>',
    front: '<rect x="10" y="30" width="140" height="90" rx="3" fill="#c8955b"/><rect x="10" y="30" width="140" height="8" fill="#a8763f"/>' },
  bag: { w: 130, h: 140, on: 0.29, rim: 40 / 140,
    back: '<rect x="12" y="32" width="106" height="16" rx="4" fill="#8e2b28"/>',
    front: '<path d="M38 44 C38 4, 92 4, 92 44" fill="none" stroke="#a83a36" stroke-width="8"/>' +
      '<rect x="5" y="40" width="120" height="100" rx="14" fill="#d9534f"/><rect x="30" y="84" width="70" height="36" rx="8" fill="#c0413d"/>' },
};
