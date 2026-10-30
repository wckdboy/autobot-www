import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JOINTS, finite, clamp, jointAngle, convexHull, supportMargin, balanceModel, footTarget, inverseKinematics } from '../public/tinyrex/models.mjs';

const near = (actual, expected, epsilon = 1e-8) => assert.ok(Math.abs(actual - expected) < epsilon, `${actual} ≈ ${expected}`);

test('shared Tinyrex metadata and navigation describe the current learning lab', async () => {
  const meta = (await readFile(new URL('../src/data/site.ts', import.meta.url), 'utf8')).split('  tinyrex: {')[1];
  assert.match(meta, /18-joint/);
  assert.doesNotMatch(meta, /17 servos|designed from an empty file/i);
  const nav = (await readFile(new URL('../src/data/nav.ts', import.meta.url), 'utf8')).split('  tinyrex: {')[1];
  for (const anchor of ['learn', 'joints', 'balance', 'gait', 'build']) assert.ok(nav.includes(`/#${anchor}`));
  assert.doesNotMatch(nav, /was designed by an AI agent/);
});

test('current design citations pin a public revision, not the historical default branch', async () => {
  const page = await readFile(new URL('../src/views/TinyRexLab.astro', import.meta.url), 'utf8');
  assert.ok(page.includes('a40e994a88fd3abd71caf972dc9267e8a7fef1ad'));
  assert.doesNotMatch(page, /blob\/main\/(?:design|AGENTS|CREDITS)/);
});

test('joint snapshot: 18 unique joints, five per leg, all ranges include zero', () => {
  assert.equal(JOINTS.length, 18);
  assert.equal(new Set(JOINTS.map(j => j.id)).size, 18);
  for (const group of ['Left leg', 'Right leg']) assert.equal(JOINTS.filter(j => j.group === group).length, 5);
  JOINTS.forEach(j => { assert.ok(j.min <= 0 && j.max >= 0); assert.equal(jointAngle(j.id, 0), 0); });
  assert.deepEqual([JOINTS.find(j => j.id === 'neck_pitch').min, JOINTS.find(j => j.id === 'neck_pitch').max], [-77, 18]);
  assert.ok(Object.isFrozen(JOINTS) && Object.isFrozen(JOINTS[0]));
});
test('joint angle clamps against collision sweep, not general servo range', () => {
  assert.equal(jointAngle('left_hip_yaw', -25), -8);
  assert.equal(jointAngle('jaw', -10), 0);
  assert.equal(jointAngle('jaw', 90), 28);
  assert.throws(() => jointAngle('not_a_joint', 0), RangeError);
});
test('numbers accept control strings but reject blank, non-finite and coercible objects', () => {
  assert.equal(finite('12.5'), 12.5);
  for (const bad of ['', ' ', null, undefined, true, [], {}, 'hello', NaN, Infinity, -Infinity]) assert.throws(() => finite(bad), TypeError);
  assert.throws(() => clamp(1, 2, 0), RangeError);
  assert.equal(clamp(500, -20, 20), 20);
});
test('hull removes duplicates, interior points and collinear boundary points', () => {
  const hull = convexHull([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }, { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 0 }]);
  assert.equal(hull.length, 4);
  assert.throws(() => convexHull([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]), RangeError);
});
test('margin measures distance to edges, including corners, independent of winding', () => {
  const polygon = [{ x: -10, y: -10 }, { x: 10, y: -10 }, { x: 10, y: 10 }, { x: -10, y: 10 }];
  near(supportMargin({ x: 0, y: 0 }, polygon).margin, 10);
  assert.equal(supportMargin({ x: 10, y: 0 }, polygon).margin, 0);
  near(supportMargin({ x: 20, y: 20 }, polygon).margin, -Math.sqrt(200));
  near(supportMargin({ x: 0, y: 0 }, [...polygon].reverse()).margin, 10);
});
test('lifting one foot removes its support; shifting over the planted foot restores margin', () => {
  assert.ok(balanceModel().margin > 0);
  assert.ok(balanceModel({ stance: 'left' }).margin < 0);
  near(balanceModel({ stance: 'left', lateral: -35 }).margin, 14);
  near(balanceModel({ stance: 'right', lateral: 35 }).margin, 14);
});
test('width does not increase the forward margin in this rectangular-contact model', () => {
  near(balanceModel({ spread: 70, forward: 20 }).margin, 12.5);
  near(balanceModel({ spread: 120, forward: 20 }).margin, 12.5);
  assert.equal(balanceModel({ forward: 32.5 }).margin, 0);
});
test('balance validates stance and clamps control bounds', () => {
  assert.throws(() => balanceModel({ stance: 'flight' }), RangeError);
  assert.throws(() => balanceModel({ lateral: NaN }), TypeError);
  assert.equal(balanceModel({ lateral: 999 }).com.x, 100);
  assert.equal(balanceModel({ forward: -999 }).com.y, -85);
});
test('foot trajectory: planted stance, lifted swing, periodic and continuous boundaries', () => {
  assert.deepEqual(footTarget(), { x: 25, y: 125, mode: 'Stance' });
  near(footTarget({ phase: 0.31 }).x, 0);
  near(footTarget({ phase: 0.31 }).y, 125);
  near(footTarget({ phase: 0.81 }).y, 100);
  assert.deepEqual(footTarget({ phase: 1 }), footTarget({ phase: 0 }));
  assert.deepEqual(footTarget({ phase: -0.2 }), footTarget({ phase: 0.8 }));
  for (const boundary of [0.62, 1]) {
    const a = footTarget({ phase: boundary - 1e-8 }), b = footTarget({ phase: boundary + 1e-8 });
    near(a.x, b.x, 1e-5); near(a.y, b.y, 1e-5);
  }
});
test('foot inputs are bounded and invalid values do not propagate NaNs', () => {
  assert.throws(() => footTarget({ phase: Infinity }), TypeError);
  assert.throws(() => footTarget({ lift: 'bad' }), TypeError);
  near(footTarget({ stride: 999 }).x, 45);
  near(footTarget({ phase: .81, lift: -99 }).y, 125);
});
test('IK reproduces reachable targets and conserves both link lengths', () => {
  for (const [x, y] of [[0, 125], [25, 125], [-45, 100], [0, 160], [80, 0], [-80, -60]]) {
    const result = inverseKinematics(x, y);
    assert.equal(result.reachable, true);
    near(result.foot.x, x); near(result.foot.y, y);
    near(Math.hypot(result.elbow.x, result.elbow.y), 80);
    near(Math.hypot(result.foot.x - result.elbow.x, result.foot.y - result.elbow.y), 80);
    near(result.hip + result.knee + result.ankle, 0);
  }
});
test('IK clamps unreachable targets and handles folded-leg singularity without NaNs', () => {
  const far = inverseKinematics(0, 175);
  assert.equal(far.reachable, false); near(far.foot.y, 160);
  const close = inverseKinematics(0, 5, 100, 50);
  assert.equal(close.reachable, false); near(Math.hypot(close.foot.x, close.foot.y), 50);
  const folded = inverseKinematics(0, 0);
  for (const key of ['hip', 'knee', 'ankle']) assert.ok(Number.isFinite(folded[key]));
  near(Math.hypot(folded.foot.x, folded.foot.y), 0);
  assert.throws(() => inverseKinematics(NaN, 10), TypeError);
  assert.throws(() => inverseKinematics(0, 10, 0, 80), RangeError);
});
test('all editable gait extremes remain finite, with reachability reported honestly', () => {
  for (const stride of [10, 90]) for (const lift of [0, 50]) for (const height of [100, 175]) for (let i = 0; i <= 100; i++) {
    const target = footTarget({ phase: i / 100, stride, lift, height });
    const ik = inverseKinematics(target.x, target.y);
    assert.ok(Number.isFinite(ik.hip) && Number.isFinite(ik.knee) && Number.isFinite(ik.ankle));
    assert.equal(ik.reachable, Math.hypot(target.x, target.y) <= 160 + 1e-9);
  }
});
