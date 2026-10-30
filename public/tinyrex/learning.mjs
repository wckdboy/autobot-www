import { JOINTS, jointAngle, balanceModel, footTarget, inverseKinematics, GAIT_DEFAULTS } from './models.mjs';

// Entire state is ephemeral. No fetch, analytics, storage, eval or hardware APIs.
const root = document.querySelector('.tinyrex-learning');
const $ = (selector, scope = root) => scope.querySelector(selector);
const $$ = (selector, scope = root) => [...scope.querySelectorAll(selector)];
const text = (selector, value) => { $(selector).textContent = value; };
const attr = (element, attributes) => Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
const svg = (tag, attributes) => {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  attr(element, attributes);
  return element;
};
const degrees = radians => Math.round(radians * 180 / Math.PI);

if (root) {
  let selected = JOINTS.find(j => j.id === 'left_hip_pitch');
  const angle = $('#joint-angle');
  const axisNames = { pitch: 'Pitch / forward & back', roll: 'Roll / side to side', yaw: 'Yaw / left & right' };
  function drawJoint() {
    const value = jointAngle(selected.id, angle.value);
    angle.value = String(value);
    text('#joint-angle-value', `${value}°`);
    attr($('[data-axis-link]'), { transform: `rotate(${value} 120 112)` });
  }
  function selectJoint(id) {
    selected = JOINTS.find(j => j.id === id);
    if (!selected) return;
    $$('[data-joint]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.joint === id)));
    $$('[data-joint-marker]').forEach(marker => marker.classList.toggle('is-selected', marker.dataset.jointMarker === id));
    text('[data-joint-name]', selected.label);
    text('[data-joint-axis]', axisNames[selected.axis]);
    text('[data-joint-description]', selected.description);
    text('[data-joint-min]', `${selected.min}°`);
    text('[data-joint-max]', `${selected.max}°`);
    attr(angle, { min: selected.min, max: selected.max, 'aria-label': `${selected.label} angle` });
    angle.value = '0';
    drawJoint();
  }
  $$('[data-joint]').forEach(button => button.addEventListener('click', () => selectJoint(button.dataset.joint)));
  angle.addEventListener('input', drawJoint);
  $('[data-joint-reset]').addEventListener('click', () => { angle.value = '0'; drawJoint(); });
  selectJoint(selected.id);

  const stance = $('#balance-stance'), spread = $('#balance-spread'), lateral = $('#balance-lateral'), forward = $('#balance-forward');
  const balancePoint = p => [250 + p.x * 1.6, 190 - p.y * 1.6];
  const pointString = (points, project) => points.map(p => project(p).join(',')).join(' ');
  function drawBalance() {
    const model = balanceModel({ stance: stance.value, spread: spread.value, lateral: lateral.value, forward: forward.value });
    text('[data-spread-value]', `${spread.value} mm`);
    text('[data-lateral-value]', `${lateral.value} mm`);
    text('[data-forward-value]', `${forward.value} mm`);
    attr($('[data-support-polygon]'), { points: pointString(model.hull, balancePoint) });
    $('[data-balance-feet]').replaceChildren(...model.feet.map(foot => svg('polygon', {
      points: pointString(foot.points, balancePoint), class: `rex-footprint${foot.active ? ' is-active' : ''}`,
    })));
    const [x, y] = balancePoint(model.com), [nx, ny] = balancePoint(model.nearest);
    attr($('[data-com-dot]'), { transform: `translate(${x} ${y})` });
    attr($('[data-margin-line]'), { x1: x, y1: y, x2: nx, y2: ny });
    const status = model.margin === 0 ? 'On the edge' : model.margin > 0 ? 'Inside' : 'Outside';
    text('[data-balance-status]', status);
    text('[data-balance-margin]', `${model.margin > 0 ? '+' : ''}${model.margin.toFixed(1)} mm`);
    $('[data-balance-status]').dataset.state = model.margin <= 0 ? 'edge' : 'inside';
  }
  [stance, spread, lateral, forward].forEach(input => input.addEventListener('input', drawBalance));
  $('[data-balance-reset]').addEventListener('click', () => {
    stance.value = 'double'; spread.value = '70'; lateral.value = '0'; forward.value = '0'; drawBalance();
  });
  $('[data-balance-challenge]').addEventListener('click', () => {
    stance.value = 'left'; spread.value = '70'; lateral.value = '0'; forward.value = '0'; drawBalance();
  });
  drawBalance();

  const inputs = Object.fromEntries(['phase', 'stride', 'lift', 'height'].map(key => [key, $(`#gait-${key}`)]));
  const play = $('[data-gait-play]');
  let playing = false, frame = 0, lastTime = null;
  const gaitPoint = p => [250 + p.x * 1.65, 62 + p.y * 1.65];
  const readGait = () => Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, Number(input.value) / (key === 'phase' ? 100 : 1)]));
  function drawGait() {
    const state = readGait();
    const target = footTarget(state);
    const result = inverseKinematics(target.x, target.y);
    const hip = gaitPoint({ x: 0, y: 0 }), knee = gaitPoint(result.elbow), foot = gaitPoint(result.foot), desired = gaitPoint(target);
    const path = Array.from({ length: 101 }, (_, index) => gaitPoint(footTarget({ ...state, phase: index / 100 })));
    attr($('[data-gait-path]'), { d: path.map((p, i) => `${i ? 'L' : 'M'}${p.join(' ')}`).join(' ') });
    attr($('[data-gait-floor]'), { d: `M40 ${gaitPoint({ x: 0, y: state.height })[1]}H460` });
    attr($('[data-gait-leg]'), { d: `M${hip.join(' ')}L${knee.join(' ')}L${foot.join(' ')}` });
    attr($('[data-gait-foot]'), { d: `M${foot[0] - 15} ${foot[1]}h43` });
    $('[data-gait-joints]').replaceChildren(...[hip, knee, foot].map(([cx, cy]) => svg('circle', { cx, cy, r: 7 })));
    attr($('[data-gait-target]'), { cx: desired[0], cy: desired[1] });
    text('[data-phase-value]', `${Math.round(state.phase * 100)}%`);
    for (const key of ['stride', 'lift', 'height']) text(`[data-${key}-value]`, `${state[key]} mm`);
    text('[data-gait-mode]', target.mode);
    text('[data-gait-angles]', `${degrees(result.hip)}° / ${degrees(result.knee)}° / ${degrees(result.ankle)}°`);
    const reach = result.reachable ? 'Target reachable in this two-link model.' : 'Out of reach — drawn leg clamped; dot shows requested target.';
    // Do not repeatedly announce every animation frame to assistive technology.
    if ($('[data-gait-reach]').textContent !== reach) text('[data-gait-reach]', reach);
    $('[data-gait-reach]').dataset.reachable = String(result.reachable);
  }
  function setPlaying(value) {
    playing = value;
    play.textContent = value ? 'Pause cycle' : 'Play cycle';
    play.setAttribute('aria-pressed', String(value));
    cancelAnimationFrame(frame);
    lastTime = null;
    if (value) frame = requestAnimationFrame(animate);
  }
  function animate(time) {
    if (!playing) return;
    if (lastTime !== null) inputs.phase.value = String((Number(inputs.phase.value) + Math.min(time - lastTime, 100) * 0.05) % 100);
    lastTime = time;
    drawGait();
    frame = requestAnimationFrame(animate);
  }
  play.addEventListener('click', () => setPlaying(!playing));
  Object.values(inputs).forEach(input => input.addEventListener('input', () => { setPlaying(false); drawGait(); }));
  $('[data-gait-reset]').addEventListener('click', () => {
    setPlaying(false);
    for (const [key, value] of Object.entries(GAIT_DEFAULTS)) inputs[key].value = String(value);
    drawGait();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) setPlaying(false); });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotion.addEventListener('change', () => setPlaying(false));
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) setPlaying(false);
  }).observe($('[data-gait-lab]'));
  drawGait();

  $$('[data-quiz]').forEach(form => {
    const feedback = $('.rex-quiz-feedback', form);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const choice = $('input:checked', form);
      if (!choice) { feedback.textContent = 'Choose an answer first.'; return; }
      const correct = choice.value === form.dataset.answer;
      feedback.textContent = `${correct ? 'Correct.' : 'Not quite. Try the instrument again.'} ${form.dataset.explanation}`;
      feedback.dataset.correct = String(correct);
    });
    form.addEventListener('reset', () => {
      feedback.textContent = 'Choose an answer, then check it. No score is stored.';
      delete feedback.dataset.correct;
    });
  });
}
