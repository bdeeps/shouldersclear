// Chapter 3 (centrepiece): pressing and raising. Five ways to load the shoulder, each posed on the
// same rig, with the shoulder moment worked out from where the masses actually are in 3D:
//   moment = g × Σ (mass × its horizontal distance from the shoulder), for gravity loads;
//   moment = |r × F| for a cable (face pull).
// Masses: the arm's segments (de Leva 1996: upper arm 2.71%, forearm 1.62%, hand 0.61% of body
// mass, centres at 57.7% and 45.7% of each segment) plus the weight at the grip. The model's arm is
// 61.5 cm shoulder to grip; the "arm length" control scales every lever by L / 61.5 cm.
// Lateral raise: the lever is L sin(angle), so the moment peaks with the arm level (90°). A 5 kg
// dumbbell at 63 cm is about 31 N·m from the weight plus about 10 N·m from a 65 kg adult's own arm.
// "Deltoid pull if it worked alone" divides by the middle deltoid's moment arm (deltArm(), Ackland
// et al., J Anat 213:383, 2008: about 2.9 cm near 90°); in life the anterior deltoid, supraspinatus
// and others share it, so it is an upper bound for one muscle and shows the order of magnitude.
// Overhead press: with the forearm vertical only the upper arm's reach is a lever, so the moment is
// biggest at the bottom and near zero at lockout; the triceps straightens the elbow (TricepsClear).
// Rear-delt fly: bent over about 80°, the arm swings out sideways; same sine law about a different axis.
// Face pull: a cable at about face height pulls the hands forwards; the rear deltoid, infraspinatus,
// teres minor and middle and lower trapezius pull them back and turn the arms outwards.
// Gada (mace) swinging: the weight sits on a long handle, so the mace has its own lever: a 10 kg gada
// with its centre of mass about 0.75 m from the hand (an illustrative figure for a traditional
// exercise gada; real ones vary widely) twists the hand and shoulder with up to 10 × 9.81 × 0.75
// ≈ 74 N·m, where a 10 kg dumbbell in the same hand adds none of its own.
import { THREE, clamp, lerp, smooth, canvasTexture } from '../kit.js';
import { makeShoulder, raiseMoment, pressMoment, deltArm, SEG, tint, fitNarrow, compactReadout, inReel, board, hud, axes, line, dot, dumbbell, gada, setBeam, K } from '../shoulder.js';

const DEG = Math.PI / 180, ARM_M = 0.615;
const EX = {
  lateral: { label: 'Lateral raise', what: 'Side deltoid', from: 'out to the side', view: { pos: [6.5, 17.1, 19], target: [2.8, 14.2, 0] },
    cue: 'Lead with the elbows, raise to about shoulder height, lower slowly. Shrugging or swinging means it is too heavy.' },
  press: { label: 'Overhead press', what: 'Front and side deltoid, triceps, upper trapezius, serratus', from: 'shoulder to lockout', view: { pos: [7.5, 20.1, 22], target: [2.6, 18.0, 0] },
    cue: 'Ribs down, glutes tight, press up and slightly back so the weight ends over the shoulder. Do not lean back to cheat.' },
  rear: { label: 'Rear-delt fly', what: 'Rear deltoid, infraspinatus, middle trapezius, rhomboids', from: 'arms down to out wide', view: { pos: [9.0, 17.0, 32], target: [1.0, 12.5, 6.0] },
    cue: 'Hinge forward with a flat back, slight bend in the elbows, sweep the arms out wide. Light weights work.' },
  face: { label: 'Face pull', what: 'Rear deltoid, external rotators, middle and lower trapezius', from: 'arms forward to hands by the ears', view: { pos: [11.0, 17.1, 17], target: [2.6, 14.6, 3.0] },
    cue: 'Rope at face height, pull towards your eyes with elbows high, then turn your hands back (external rotation).' },
  gada: { label: 'Gada swing', what: 'Whole shoulder girdle, grip, forearm, core', from: 'mace up to behind the back', view: { pos: [13.0, 19.0, 25], target: [0.2, 17.5, 0] },
    cue: 'Start light. Keep the handle close and swing it smoothly round behind the back and over the shoulder, never jerking.' },
};

// Pose for each exercise at rep position p (0 = start, 1 = end of the lift).
function poseOf(ex, p) {
  switch (ex) {
    case 'lateral': return { elev: lerp(8, 90, p), plane: 25, rot: 0, elbow: 12 };
    case 'press': { const e = lerp(88, 172, p); return { elev: e, plane: 20, rot: 90, elbow: clamp(180 - e, 4, 95) }; }
    case 'rear': return { elev: 90, plane: lerp(88, 5, p), rot: -10, elbow: 15 };
    case 'face': return { elev: lerp(88, 95, p), plane: lerp(80, 12, p), rot: lerp(0, 85, smooth(p)), elbow: lerp(8, 105, p) };
    case 'gada': return { elev: 168, plane: 80, rot: 0, elbow: lerp(10, 125, Math.sin(p * Math.PI * 0.5)) };
  }
  return { elev: 0 };
}

function drawChart(g, w, h, st) {
  if (!st.curve.length || (st.ex !== 'face' && st.ex !== 'gada' && !st.curveLoad.length)) { g.clearRect(0, 0, w, h); return; }
  if (st.ex === 'face') {
    const A = axes(g, w, h, { title: 'Cable pull through the rep', x0: 0, x1: 1, y0: 0, y1: Math.max(60, st.maxF), xt: [], yt: [0, Math.round(Math.max(60, st.maxF) / 2), Math.round(Math.max(60, st.maxF))], xl: 'start → end', yfmt: (v) => v + ' N·m' });
    line(g, st.curve.map(([x, y]) => [A.x(x), A.y(y)]), '#ffb070'); dot(g, A.x(st.p), A.y(st.M));
    return;
  }
  const gada = st.ex === 'gada';
  const xs = gada ? [0, 90, 180] : st.ex === 'press' ? [90, 135, 180] : [0, 45, 90];
  const max = Math.max(20, Math.ceil(Math.max(...st.curve.map((c) => c[1])) / 10) * 10);
  const A = axes(g, w, h, { title: gada ? 'The mace’s own twist on your hand' : 'Shoulder moment through the rep', x0: xs[0], x1: xs[2], y0: 0, y1: max, xt: xs, yt: [0, max / 2, max], xl: gada ? 'mace angle from upright (°)' : st.ex === 'press' ? 'arm raised (°)' : st.ex === 'rear' ? 'arm swung out (°)' : 'arm raised (°)', yfmt: (v) => Math.round(v) + ' N·m' });
  line(g, st.curve.map(([x, y]) => [A.x(x), A.y(y)]), gada ? '#ffd166' : '#ff8a8a');
  if (!gada) line(g, st.curveLoad.map(([x, y]) => [A.x(x), A.y(y)]), 'rgba(255,209,102,.7)', 3);
  g.font = '22px sans-serif';
  if (!gada) { g.fillStyle = '#ffd166'; g.fillText('from the weight', A.x(xs[0]) + 12, A.y(st.curveLoad.at(-1)[1] * 0.5 + st.curveLoad[Math.floor(st.curveLoad.length / 2)][1] * 0.5) - 18); }
  dot(g, A.x(clamp(st.x, xs[0], xs[2])), A.y(st.M));
}

export default {
  id: 'pressing',
  short: 'Pressing and raising',
  title: 'Pressing, raising and swinging',
  subtitle: 'Why a light dumbbell feels heavy out to the side, and why a mace trains the shoulder differently.',
  view: EX.lateral.view,
  learn: `<p>The shoulder is a lever. What makes a weight hard is not just how heavy it is but <b>how far it sits sideways from the joint</b>. That turning effect is the <b>moment</b>, or torque: weight × horizontal distance (<a href="/torqueclear/">TorqueClear</a> explains it).</p>
    <p>In a <b>lateral raise</b> the dumbbell is at the end of a straight arm. The moment grows as the arm rises and peaks when the arm is <b>level</b>, at 90°. A 5 kg dumbbell 63 cm out makes about <b>31 N·m</b>, and your own arm adds about 10 N·m more. The side deltoid grips the humerus only about <b>3 cm</b> from the joint's centre, so on its own it would have to pull more than 1,000 N. Bend your elbow and the lever, and the moment, shrink.</p>
    <p>In an <b>overhead press</b> your forearm stays upright, so only the upper arm's reach is a lever. It is hardest at the bottom and easy at lockout, where the weight sits right over the joint. The press also needs the <b>triceps</b> (<a href="/tricepsclear/">TricepsClear</a>) and the muscles that swing the blade.</p>
    <p>The <b>rear deltoid</b> is easy to miss because most pushing works the front. <b>Rear-delt flies</b> and <b>face pulls</b> train it, and face pulls also work the cuff muscles that turn the arm out. The upper back's big pullers are <a href="/backclear/">BackClear</a>'s story.</p>
    <p>India has its own shoulder tools. In the <b>akhara</b>, wrestlers swing the <b>gada</b>, a heavy mace, and the <b>jodi</b>, a pair of wooden clubs. Because the weight sits at the end of a long handle, the tool has its own lever. Swing it behind your back and it twists your hand and shoulder far harder than a dumbbell of the same mass, and in every direction, which trains grip, the cuff and control as well as strength.</p>
    <p class="tip"><b>Try it:</b> on the lateral raise, set 5 kg, then shorten the arm length (like bending the elbow) and watch the moment fall. Then try the gada and compare.</p>`,
  terms: [
    { t: 'Moment (torque)', d: 'The turning effect of a force: force × its distance from the pivot, in newton-metres (N·m).' },
    { t: 'Moment arm', d: 'The shortest distance from the joint to the line of a force.' },
    { t: 'Lateral raise', d: 'Lifting dumbbells out to the sides to shoulder height; trains the side deltoid.' },
    { t: 'Overhead press', d: 'Pushing a weight from the shoulders to straight overhead.' },
    { t: 'Face pull', d: 'Pulling a rope towards the face with high elbows and turning the hands back.' },
    { t: 'Gada and jodi', d: 'The Indian mace and the pair of wooden clubs swung in akharas for strength.' },
  ],
  defaults: { ex: 'lateral', kg: 5, L: 63, body: 65, p: 0.5, reps: true, labels: true },
  onChange(s, key) { if (key === 'p') s.reps = false; if (key === 'ex') { if (s.ex === 'gada' && s.kg < 4) s.kg = 6; if (s.ex !== 'gada' && s.kg > 12 && s.ex !== 'press' && s.ex !== 'face') s.kg = 5; } },
  controls: [
    { key: 'ex', type: 'seg', label: 'Exercise', options: Object.entries(EX).map(([v, e]) => ({ v, label: e.label })), fmt: (v) => EX[v].what },
    { key: 'kg', type: 'range', label: 'Weight (dumbbell, cable or mace)', min: 0, max: 20, step: 0.5, ends: ['0 kg', '20 kg'], fmt: (v) => v + ' kg' },
    { key: 'L', type: 'range', label: 'Arm length, shoulder to grip', min: 45, max: 75, step: 1, ends: ['short', 'long'], fmt: (v) => v + ' cm', hint: 'Bending the elbow shortens the lever in the same way.' },
    { key: 'body', type: 'range', label: 'Body mass (sets the arm’s own weight)', min: 35, max: 110, step: 1, fmt: (v) => v + ' kg' },
    { key: 'p', type: 'range', label: 'Position in the rep', min: 0, max: 1, step: 0.01, ends: ['start', 'top'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'reps', type: 'toggle', label: 'Do reps' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'In a lateral raise, where is the dumbbell hardest to hold?', options: ['At the bottom', 'With the arm level, at about 90°', 'Overhead', 'It is the same everywhere'], answer: 1, why: 'The moment is weight × horizontal distance, L sin(angle), which is biggest when the arm sticks straight out.' },
    { q: 'Why does a 5 kg mace on a long handle feel much harder to swing than a 5 kg dumbbell?', options: ['Wood is heavier', 'Its weight sits far from the hand, so it has its own big lever', 'It is not harder', 'Maces are always 20 kg'], answer: 1, why: 'The dumbbell’s weight is in your hand. The mace’s is about three-quarters of a metre away, so it twists your hand and shoulder hard.' },
    { q: 'Which exercise trains the rear deltoid and the muscles that turn the arm outwards?', options: ['Overhead press', 'Face pull', 'Front raise', 'Bench press'], answer: 1, why: 'The face pull pulls the arms back with elbows high and then turns the hands back: rear deltoid, infraspinatus, teres minor and the trapezius.' },
  ],
  reel: [
    { ms: 5200, caption: 'A 5 kg dumbbell held out to the side twists your shoulder with about 40 N·m.', set: { ex: 'lateral', kg: 5, L: 63, body: 65, reps: false, p: 0.05, labels: false }, anim: { p: [0.05, 1] }, view: { pos: [6.0, 16.6, 15.5], target: [3.0, 14.6, 0] }, spin: 0 },
    { ms: 5000, caption: 'Swing a mace behind your back and its long handle makes the same mass far harder.', set: { ex: 'gada', kg: 8, L: 63, body: 65, reps: true, labels: false }, view: { pos: [9.0, 20.1, 17], target: [2.0, 17.6, -0.5] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const sh = makeShoulder(stage); root.add(sh.root);
    const db = dumbbell(); root.add(db);
    const mace = gada(15, 1.25); root.add(mace);           // 0.75 m handle, head about 12 cm across
    // cable machine for face pulls: a post in front with a pulley at face height
    const postM = new THREE.MeshStandardMaterial({ color: 0x59606e, metalness: 0.5, roughness: 0.5 });
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 16, 0.5), postM); post.position.set(3.0, 8, 15); root.add(post);
    const pulley = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.1, 10, 24), postM); pulley.position.set(3.0, 14.6, 14.6); root.add(pulley);
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 8), new THREE.MeshStandardMaterial({ color: 0x222831 })); root.add(cable);
    const PUL = new THREE.Vector3(3.0, 14.6, 14.6);
    const st = { ex: 'lateral', curve: [], curveLoad: [], x: 0, M: 0, p: 0, maxF: 60 };
    const chart = canvasTexture(900, 620, (g, w, h) => drawChart(g, w, h, st));
    const cb = board(chart, 6.6, 6.6 * 620 / 900); root.add(cb);
    const lblM = tint(stage.label('', [0, 0, 0], root), 'gold');
    const BOARD = { lateral: [-1.4, 10.4, 6.5], press: [-2.2, 13.6, 6.5], rear: [-3.0, 6.6, 12.0], face: [-2.2, 11.0, 7.5], gada: [-2.6, 13.0, 6.5] };
    let p = 0.5, t = 0, prevEx = '', key = '', acc = 0, phase = 0, res = { M: 0, load: 0, arm: 0, lever: 0, F: 0 };
    const fit = fitNarrow(stage, { pos: [5.5, 17.1, 24], target: [3.0, 15.6, 0] });
    const wp = (o) => o.getWorldPosition(new THREE.Vector3());
    const elbowObj = new THREE.Object3D(); sh.foreG.add(elbowObj);

    // Moment about the shoulder from gravity, using the real 3D positions (world y is up).
    function gravityMoment(s, extra) {
      const S = wp(sh.humG), E = wp(elbowObj), G = wp(sh.grip), sc = (s.L / 100) / ARM_M / K;   // model units → metres
      const hd = (P) => Math.hypot(P.x - S.x, P.z - S.z) * sc;
      const up = S.clone().lerp(E, SEG.upCom), fo = E.clone().lerp(G, 0.36);
      const arm = SEG.g * s.body * (SEG.up * hd(up) + SEG.fore * hd(fo) + SEG.hand * hd(G));
      const load = SEG.g * (extra ? extra.kg * hd(extra.at) : s.kg * hd(G));
      return { arm, load, M: arm + load, lever: hd(G) };
    }

    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const ex = EX[s.ex];
        if (s.ex !== prevEx) { prevEx = s.ex; if (!stage.moved && !inReel()) stage.setView(ex.view.pos, ex.view.target, 0.9); }
        // reps: about 3 s up and down (gada: a continuous circle)
        if (s.reps) { phase += dt / 3.2; s.p = Math.round((s.ex === 'gada' ? phase % 1 : 0.5 - 0.5 * Math.cos(phase * 2 * Math.PI)) * 100) / 100; }
        const target = s.reps ? (s.ex === 'gada' ? phase % 1 : 0.5 - 0.5 * Math.cos(phase * 2 * Math.PI)) : s.p;
        p = s.reps ? target : p + (target - p) * Math.min(1, dt * 6);
        sh.root.rotation.x = approachAngle(sh.root.rotation.x, s.ex === 'rear' ? 80 * DEG : 0, dt);
        sh.root.position.set(0, s.ex === 'rear' ? 15 : 4.6, s.ex === 'rear' ? -1.5 : 0);
        sh.legs.forEach((l) => { l.visible = s.ex !== 'rear'; });
        const gp = s.ex === 'gada' ? Math.sin(p * Math.PI) : p;
        sh.pose(poseOf(s.ex, gp));
        sh.update();
        const G = wp(sh.grip);
        // props
        db.visible = s.ex !== 'gada' && s.ex !== 'face'; mace.visible = s.ex === 'gada';
        post.visible = pulley.visible = cable.visible = s.ex === 'face';
        db.setKg(db.visible ? s.kg : 0); db.position.copy(G);
        db.rotation.set(0, s.ex === 'press' ? 0 : Math.PI / 2, 0);
        let M, F = 0, xval, extra = null;
        if (s.ex === 'gada') {
          // the mace circles the hand: angle psi from pointing straight up, round behind the back
          const psi = p * 2 * Math.PI;
          const dir = new THREE.Vector3(0, Math.cos(psi), -Math.sin(psi));
          mace.position.copy(G); mace.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          const comAt = G.clone().addScaledVector(dir, 0.75 * K * ((s.L / 100) / ARM_M));
          extra = { kg: s.kg, at: comAt };
          const r = gravityMoment(s, extra);
          const own = SEG.g * s.kg * 0.75 * Math.abs(Math.sin(psi));
          res = { ...r, own }; M = own; xval = (psi / DEG) % 360 > 180 ? 360 - (psi / DEG) % 360 : (psi / DEG) % 360;
        } else if (s.ex === 'face') {
          setBeam(cable, G, PUL);
          const S = wp(sh.humG), sc = (s.L / 100) / ARM_M / K, r = G.clone().sub(S).multiplyScalar(sc), u = PUL.clone().sub(G).normalize();
          F = s.kg * SEG.g;
          const Mc = r.clone().cross(u.multiplyScalar(F)).length();
          const g0 = gravityMoment({ ...s, kg: 0 });
          res = { M: Mc, load: Mc, arm: g0.arm, lever: Mc / Math.max(1, F), F }; M = Mc; xval = p;
        } else {
          res = gravityMoment(s); M = res.M;
          xval = s.ex === 'rear' ? poseOf('rear', p).plane : sh.st.elev;
          if (s.ex === 'rear') xval = 90 - xval;
        }
        st.ex = s.ex; st.M = M; st.x = xval; st.p = p;
        // chart curves (analytic, from the same formulas), redrawn when settings change
        const k2 = `${s.ex}|${s.kg}|${s.L}|${s.body}`;
        if (k2 !== key) {
          key = k2; const L = s.L / 100; st.curve = []; st.curveLoad = [];
          if (s.ex === 'lateral' || s.ex === 'rear') for (let a = 0; a <= 90; a += 3) { const m = raiseMoment(a, s.kg, L * 0.985, s.body); st.curve.push([a, m.total]); st.curveLoad.push([a, m.load]); }
          if (s.ex === 'press') for (let a = 90; a <= 180; a += 3) { const m = pressMoment(a, s.kg, L, s.body); st.curve.push([a, m.total]); st.curveLoad.push([a, m.load]); }
          if (s.ex === 'gada') for (let a = 0; a <= 180; a += 3) st.curve.push([a, SEG.g * s.kg * 0.75 * (L / 0.63) * Math.sin(a * DEG)]);
          if (s.ex === 'face') { st.curve = []; st.maxF = 0; }
        }
        if (s.ex === 'face') { const i = Math.round(p * 40); st.curve[i] = [i / 40, M]; st.curve = st.curve.filter(Boolean); st.maxF = Math.max(st.maxF, M); }
        acc += dt; if (acc > 0.05) { acc = 0; chart.redraw(); }
        // board: beside the body, facing the camera's side
        hud(stage, cb, { aspect: 620 / 900 });
        const narrow = fit(), on = s.labels && !inReel() && !narrow;
        sh.setActs(actsFor(s.ex, p));
        sh.placeLabels(on, s.ex === 'face' || s.ex === 'rear' ? ['deltP', 'infra', 'trapL'] : s.ex === 'gada' ? ['deltA', 'serr', 'trapU'] : ['deltA', 'deltM', 'supra']);
        lblM.visible = on; lblM.position.copy(G).add(new THREE.Vector3(0.6, 1.6, 0.8));
        lblM.element.textContent = s.ex === 'gada' ? `Mace twists the hand ${Math.round(M)} N·m` : `${Math.round(M)} N·m at the shoulder`;
      },
      readout: (s) => {
        const ex = EX[s.ex];
        if (s.ex === 'gada') {
          return `<div class="big">Mace twist ${Math.round(res.own)} N·m</div>
            <div class="row"><span>Mace</span><b>${s.kg} kg, centre about ${Math.round(75 * s.L / 63)} cm from the hand</b></div>
            <div class="row"><span>Same mass as a dumbbell</span><b>0 N·m of its own twist</b></div>
            <div class="row"><span>Shoulder moment now</span><b>${Math.round(res.M)} N·m</b></div>
            <div class="row"><span>Works</span><b>${ex.what}</b></div>
            <small>${ex.cue} Mace length and balance vary; 75 cm is illustrative.</small>`;
        }
        if (s.ex === 'face') {
          return `<div class="big">Cable ${Math.round(res.F)} N · ${Math.round(res.M)} N·m</div>
            <div class="row"><span>Stack weight</span><b>${s.kg} kg</b></div>
            <div class="row"><span>Pull line from the shoulder</span><b>${(res.lever * 100).toFixed(0)} cm</b></div>
            <div class="row"><span>Works</span><b>${ex.what}</b></div>
            <small>${ex.cue}</small>`;
        }
        const elev = s.ex === 'rear' ? 90 : sh.st.elev, r = deltArm(s.ex === 'rear' ? 90 - poseOf('rear', p).plane : elev);
        return `<div class="big">${Math.round(res.M)} N·m at the shoulder</div>
          <div class="row"><span>From the ${s.kg} kg weight</span><b>${res.load.toFixed(1)} N·m</b></div>
          <div class="row"><span>From your own arm (${(s.body * (SEG.up + SEG.fore + SEG.hand)).toFixed(1)} kg)</span><b>${res.arm.toFixed(1)} N·m</b></div>
          <div class="row"><span>Weight’s sideways distance</span><b>${(res.lever * 100).toFixed(0)} cm</b></div>
          ${s.ex === 'rear' ? '' : `<div class="row"><span>Side deltoid pull if it worked alone</span><b>${Math.round(res.M / r)} N (lever ${(r * 100).toFixed(1)} cm)</b></div>`}
          <div class="row"><span>Works</span><b>${ex.what}</b></div>
          <small>${ex.cue}</small>`;
      },
    });
  },
};

function approachAngle(v, target, dt) { return v + (target - v) * Math.min(1, dt * 4 + (inReel() ? 1 : 0)); }

// Which muscles light up (illustrative), by exercise and rep position.
function actsFor(ex, p) {
  const z = { deltA: 0.1, deltM: 0.1, deltP: 0.1, supra: 0.2, infra: 0.2, teresMin: 0.2, subscap: 0.2, trapU: 0.1, trapL: 0.1, serr: 0.1 };
  if (ex === 'lateral') return { ...z, deltM: 0.3 + 0.7 * p, deltA: 0.2 + 0.5 * p, supra: 0.6, trapU: 0.2 + 0.4 * p };
  if (ex === 'press') return { ...z, deltA: 0.9 - 0.4 * p, deltM: 0.7 - 0.3 * p, trapU: 0.3 + 0.5 * p, serr: 0.3 + 0.6 * p, supra: 0.5, infra: 0.4 };
  if (ex === 'rear') return { ...z, deltP: 0.3 + 0.7 * p, infra: 0.3 + 0.5 * p, teresMin: 0.3 + 0.4 * p, trapL: 0.3 + 0.4 * p };
  if (ex === 'face') return { ...z, deltP: 0.4 + 0.5 * p, infra: 0.3 + 0.7 * p, teresMin: 0.3 + 0.6 * p, trapL: 0.3 + 0.6 * p, trapU: 0.3 };
  if (ex === 'gada') { const w = Math.abs(Math.sin(p * 2 * Math.PI)); return { ...z, deltA: 0.4 + 0.5 * w, deltM: 0.4, deltP: 0.3 + 0.5 * w, supra: 0.5, infra: 0.4 + 0.5 * w, subscap: 0.4 + 0.4 * w, trapU: 0.6, serr: 0.7, trapL: 0.5 }; }
  return z;
}
