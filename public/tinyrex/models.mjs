/** First-party teaching math. No controller, physical calibration or network access.
 * Joint ranges: native design/blender/joint_limits.json, snapshot 2026-10-30.
 * All other dimensions are illustrative, not extracted from Tinyrex CAD.
 */
const joint = (id, label, group, axis, min, max, point, description) =>
  Object.freeze({ id, label, group, axis, min, max, point: Object.freeze(point), description });
export const JOINTS = Object.freeze([
  joint('left_hip_yaw', 'Left hip yaw', 'Left leg', 'yaw', -8, 28, [180, 213], 'Turns the left leg around its hip yaw axis.'),
  joint('left_hip_roll', 'Left hip roll', 'Left leg', 'roll', -12, 13, [160, 232], 'Tilts the left leg sideways at the hip.'),
  joint('left_hip_pitch', 'Left hip pitch', 'Left leg', 'pitch', -90, 53, [187, 249], 'Swings the leg forward and back at the body.'),
  joint('left_knee', 'Left knee', 'Left leg', 'pitch', -90, 40, [174, 283], 'Changes the bend between the left upper and lower leg.'),
  joint('left_ankle', 'Left ankle', 'Left leg', 'pitch', -60, 89, [205, 326], 'Changes the foot angle relative to the lower leg.'),
  joint('neck_pitch', 'Neck pitch', 'Head & neck', 'pitch', -77, 18, [271, 144], 'Tilts the neck relative to the body.'),
  joint('head_pitch', 'Head pitch', 'Head & neck', 'pitch', -45, 90, [274, 112], 'Nods the head relative to the neck.'),
  joint('head_yaw', 'Head yaw', 'Head & neck', 'yaw', -170, 169, [297, 84], 'Turns the head left and right.'),
  joint('head_roll', 'Head roll', 'Head & neck', 'roll', -19, 19, [327, 58], 'Tilts the head from side to side.'),
  joint('right_hip_yaw', 'Right hip yaw', 'Right leg', 'yaw', -28, 8, [273, 215], 'Turns the right leg; mirrored axes can reverse angle signs.'),
  joint('right_hip_roll', 'Right hip roll', 'Right leg', 'roll', -13, 12, [299, 235], 'Tilts the right leg sideways at the hip.'),
  joint('right_hip_pitch', 'Right hip pitch', 'Right leg', 'pitch', -53, 89, [272, 250], 'Swings the right leg forward and back at the body.'),
  joint('right_knee', 'Right knee', 'Right leg', 'pitch', -40, 89, [284, 282], 'Changes the bend between the right upper and lower leg.'),
  joint('right_ankle', 'Right ankle', 'Right leg', 'pitch', -90, 60, [278, 325], 'Changes the right foot angle relative to the lower leg.'),
  joint('tail_yaw', 'Tail yaw', 'Expression', 'yaw', -40, 40, [142, 202], 'Swings the tail sideways. Moving mass can change balance.'),
  joint('jaw', 'Jaw', 'Expression', 'pitch', 0, 28, [338, 139], 'Opens the jaw; this joint has no negative model range.'),
  joint('l_shoulder', 'Left shoulder', 'Expression', 'pitch', -74, 25, [204, 188], 'Rotates the left arm at the shoulder. The elbow is fixed.'),
  joint('r_shoulder', 'Right shoulder', 'Expression', 'pitch', -25, 74, [309, 187], 'Rotates the right arm at the shoulder. The elbow is fixed.'),
]);

export function finite(value) {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') throw new TypeError('A finite number is required');
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError('A finite number is required');
  return number;
}
export function clamp(value, min, max) {
  const n = finite(value), lo = finite(min), hi = finite(max);
  if (lo > hi) throw new RangeError('Inverted bounds');
  return Math.max(lo, Math.min(hi, n));
}
export function jointAngle(id, value) {
  const selected = JOINTS.find(j => j.id === id);
  if (!selected) throw new RangeError('Unknown joint');
  return clamp(value, selected.min, selected.max);
}

const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
export function convexHull(points) {
  const sorted = points.map(p => ({ x: finite(p.x), y: finite(p.y) }))
    .sort((a, b) => a.x - b.x || a.y - b.y)
    .filter((p, i, all) => !i || p.x !== all[i - 1].x || p.y !== all[i - 1].y);
  if (sorted.length < 3) throw new RangeError('At least three unique points required');
  const lower = [], upper = [];
  for (const p of sorted) {
    while (lower.length > 1 && cross(lower.at(-2), lower.at(-1), p) <= 0) lower.pop();
    lower.push(p);
  }
  for (const p of sorted.toReversed()) {
    while (upper.length > 1 && cross(upper.at(-2), upper.at(-1), p) <= 0) upper.pop();
    upper.push(p);
  }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  if (hull.length < 3) throw new RangeError('Polygon must have area');
  return hull;
}

/** Signed Euclidean distance to the closest boundary of a convex polygon. */
export function supportMargin(point, polygon) {
  const p = { x: finite(point.x), y: finite(point.y) };
  const hull = convexHull(polygon);
  let inside = true, distance = Infinity, nearest;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i], b = hull[(i + 1) % hull.length];
    if (cross(a, b, p) < -1e-9) inside = false;
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy), 0, 1);
    const q = { x: a.x + t * dx, y: a.y + t * dy };
    const d = Math.hypot(p.x - q.x, p.y - q.y);
    if (d < distance) { distance = d; nearest = q; }
  }
  return { margin: distance < 1e-9 ? 0 : (inside ? distance : -distance), nearest, hull };
}

export function balanceModel({ stance = 'double', spread = 70, lateral = 0, forward = 0 } = {}) {
  if (!['double', 'left', 'right'].includes(stance)) throw new RangeError('Unknown stance');
  const spacing = clamp(spread, 35, 120);
  const com = { x: clamp(lateral, -100, 100), y: clamp(forward, -85, 85) };
  const feet = [-1, 1].map(side => {
    const x = side * spacing / 2;
    return { side: side === -1 ? 'left' : 'right', active: stance === 'double' || stance === (side === -1 ? 'left' : 'right'),
      points: [{ x: x - 14, y: -32.5 }, { x: x + 14, y: -32.5 }, { x: x + 14, y: 32.5 }, { x: x - 14, y: 32.5 }] };
  });
  return { com, feet, ...supportMargin(com, feet.filter(f => f.active).flatMap(f => f.points)) };
}

export const GAIT_DEFAULTS = Object.freeze({ phase: 0, stride: 50, lift: 25, height: 125 });
export function footTarget({ phase = 0, stride = 50, lift = 25, height = 125 } = {}) {
  const p = ((finite(phase) % 1) + 1) % 1;
  const length = clamp(stride, 10, 90), rise = clamp(lift, 0, 50), h = clamp(height, 100, 175);
  const stance = p < 0.62;
  const t = stance ? p / 0.62 : (p - 0.62) / 0.38;
  return { x: stance ? length * (0.5 - t) : length * (t - 0.5), y: h - (stance ? 0 : rise * Math.sin(Math.PI * t)), mode: stance ? 'Stance' : 'Swing' };
}

/** Downward-positive y; positive bend branch. Clamp only the geometric reach. */
export function inverseKinematics(xValue, yValue, aValue = 80, bValue = 80) {
  const x = finite(xValue), y = finite(yValue), a = finite(aValue), b = finite(bValue);
  if (a <= 0 || b <= 0) throw new RangeError('Link lengths must be positive');
  const distance = Math.hypot(x, y);
  const min = Math.abs(a - b), max = a + b;
  const reachable = distance >= min - 1e-9 && distance <= max + 1e-9;
  const d = clamp(distance, min, max);
  const direction = Math.atan2(x, y);
  const knee = Math.acos(clamp((d * d - a * a - b * b) / (2 * a * b), -1, 1));
  const hip = direction - Math.atan2(b * Math.sin(knee), a + b * Math.cos(knee));
  const elbow = { x: a * Math.sin(hip), y: a * Math.cos(hip) };
  const foot = { x: elbow.x + b * Math.sin(hip + knee), y: elbow.y + b * Math.cos(hip + knee) };
  return { hip, knee, ankle: -hip - knee, elbow, foot, reachable };
}
