// View-only similarity transform. Artwork coordinates never change.
export function pinchView(start, now, view) {
  const distance = (p) => Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y);
  const angle = (p) => Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x);
  const center = (p) => ({
    x: (p[0].x + p[1].x) / 2,
    y: (p[0].y + p[1].y) / 2,
  });
  const a = center(start),
    b = center(now);
  const zoom = Math.max(
    0.3,
    Math.min(24, (view.zoom * distance(now)) / Math.max(1, distance(start))),
  );
  const ratio = zoom / view.zoom,
    delta = angle(now) - angle(start);
  const x = view.pan.x - a.x,
    y = view.pan.y - a.y;
  return {
    zoom,
    angle:
      ((((view.angle + (delta * 180) / Math.PI + 180) % 360) + 360) % 360) -
      180,
    pan: {
      x: b.x + ratio * (x * Math.cos(delta) - y * Math.sin(delta)),
      y: b.y + ratio * (x * Math.sin(delta) + y * Math.cos(delta)),
    },
  };
}
