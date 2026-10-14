// A drag ends with onDrop at the finger position; a plain tap selects the item,
// and the next tap on `target` drops it there.
export function makeDraggable(item: HTMLElement, target: Element, onDrop: (x: number, y: number) => void) {
  let sx = 0, sy = 0, moved = false, selected = false;
  item.style.touchAction = 'none';

  const reset = () => {
    item.classList.remove('dragging');
    item.style.transform = '';
  };
  const select = (on: boolean) => {
    selected = on;
    item.classList.toggle('selected', on);
  };

  item.addEventListener('pointerdown', e => {
    item.setPointerCapture(e.pointerId);
    sx = e.clientX; sy = e.clientY; moved = false;
    item.classList.add('dragging');
  });
  item.addEventListener('pointermove', e => {
    if (!item.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    // Small wobbles still count as a tap.
    if (Math.hypot(dx, dy) > 10) moved = true;
    item.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  item.addEventListener('pointerup', e => {
    reset();
    if (moved) {
      select(false);
      onDrop(e.clientX, e.clientY);
    } else {
      select(!selected);
    }
  });
  item.addEventListener('pointercancel', reset);

  target.addEventListener('pointerup', e => {
    if (!selected) return;
    select(false);
    const p = e as PointerEvent;
    onDrop(p.clientX, p.clientY);
  });
}
