// ShouldersClear's shared models: a rigged left shoulder (clavicle, scapula, humerus, forearm)
// with its muscles re-aimed every frame, the scapulohumeral rhythm that splits an arm raise between
// the ball-and-socket joint and the shoulder blade, and the lever maths for presses and raises.
//
// Orientation: we face the person (anterior view), so their LEFT shoulder is on YOUR RIGHT.
// Axes: +x = the person's left (lateral for this shoulder), +y = up, +z = forwards (towards you).
// One model unit is 5 cm. The upper body floats with its waist near the floor grid.
//
// Anatomy follows standard references (Gray's Anatomy, 42nd ed.; Moore, Clinically Oriented
// Anatomy, 8th ed.; OpenStax Anatomy & Physiology 2e, ch. 9 and 11; AAOS OrthoInfo "Rotator cuff
// tears": four muscles whose tendons cover the head of the humerus). Shapes are simplified.
import { THREE, clamp, lerp, smooth } from './kit.js';

export const RED = 0xd4424e, TENDON = 0xf1ead8, BONE = 0xe8e2d0, CUFF = 0xe8863e, SCAPM = 0xb06ad0, GOLD = 0xffd166;
export const K = 20;
export const LIFT = 4.6;                 // the rig is built with the waist at y≈1; this lifts it so the feet meet the floor                      // model units per metre (1 unit = 5 cm)
const DEG = Math.PI / 180;

// ---------------------------------------------------------------- scapulohumeral rhythm
// Inman, Saunders & Abbott (J Bone Joint Surg 26:1–30, 1944; first described by Codman, 1934):
// over a full raise the arm moves about 2° at the ball-and-socket (glenohumeral) joint for every 1°
// the shoulder blade rotates upwards, so 180° of elevation is roughly 120° + 60°. In the first
// ~30° (the "setting phase") the scapula moves little and inconsistently. Later studies agree on
// the overall split but find the ratio varies along the raise, between people, planes and loads
// (e.g. reviews giving 2.3:1 overall with a range of about 1:1 to far higher in early elevation).
// This model: scapula 0.1° per degree for the first 30°, then 0.38° per degree, giving 60° of
// scapular upward rotation and 120° glenohumeral at 180°: an overall 2:1, as Inman described.
export function rhythm(elev) {
  const e = clamp(elev, 0, 180);
  const scap = e < 30 ? e * 0.1 : 3 + (e - 30) * 0.38;
  return { elev: e, scap, gh: e - scap, ratio: scap > 0.5 ? (e - scap) / scap : Infinity };
}
// The collarbone lifts as the blade turns (Inman et al. 1944 report up to about 30–36° at the
// sternoclavicular joint, mostly in the first 90°). Illustrative: a quarter of the scapula's turn.
export const clavElev = (scap) => scap * 0.25;

// ---------------------------------------------------------------- the arm as a lever
// Segment masses and centres of mass (de Leva, J Biomech 29:1223, 1996, adjusting Zatsiorsky's
// data; men's values, women's are within a few per cent): upper arm 2.71% of body mass with its
// centre 57.7% of the way to the elbow; forearm 1.62%, centre 45.7% of the way to the wrist; hand
// 0.61%, taken at the grip. Proportions for a shoulder-to-grip length L: upper arm 0.476 L,
// forearm 0.413 L, grip at L (a 1.75 m adult has L ≈ 0.63 m: upper arm 30 cm, grip 33 cm beyond
// the elbow, the same numbers MuscleClear uses).
export const SEG = { up: 0.0271, fore: 0.0162, hand: 0.0061, upCom: 0.577, foreCom: 0.457, upL: 0.476, foreL: 0.413, g: 9.81 };

// Middle deltoid abduction moment arm (Ackland, Pak, Richardson & Pandy, "Moment arms of the
// muscles crossing the anatomical shoulder", J Anat 213:383, 2008, eight cadaver shoulders,
// coronal-plane abduction): about 8 mm with the arm by the side, rising to a peak of about 29 mm
// near 86°; the anterior deltoid peaks later (about 30 mm at 120°) and the supraspinatus is best at
// the start (about 23–27 mm near 0–10°, falling to 6–10 mm by 120°). Beyond 86° the model holds the
// middle deltoid near its peak (an assumption: the paper's table gives only peaks and minima).
export function deltArm(elev) {
  const e = clamp(elev, 0, 180);
  if (e <= 86) return 0.0083 + 0.0208 * Math.sin((Math.PI / 2) * clamp((e - 2.5) / 83.5, 0, 1));
  return 0.0291 - 0.00004 * (e - 86);
}
export const supraArm = (elev) => lerp(0.025, 0.008, clamp(elev / 120, 0, 1));

// Shoulder moment (N·m) for a straight-ish arm raised `elev` degrees from hanging, against gravity,
// holding `kg` at the grip. Body upright: the lever is the horizontal distance, L sin(elev).
export function raiseMoment(elev, kg, L = 0.63, body = 65) {
  const s = Math.sin(clamp(elev, 0, 180) * DEG), g = SEG.g;
  const arm = body * (SEG.up * SEG.upCom * SEG.upL + SEG.fore * (SEG.upL + SEG.foreCom * SEG.foreL) + SEG.hand) * L;
  const load = kg * L;
  return { arm: g * arm * s, load: g * load * s, total: g * (arm + load) * s, lever: L * s, armKg: body * (SEG.up + SEG.fore + SEG.hand) };
}
// Overhead press with the forearm vertical: only the upper arm's horizontal reach (0.476 L sin θ)
// is a lever for the hand, forearm and weight; the upper arm's own centre adds a little.
export function pressMoment(elev, kg, L = 0.63, body = 65) {
  const s = Math.sin(clamp(elev, 0, 180) * DEG), g = SEG.g, up = SEG.upL * L;
  const arm = body * (SEG.up * SEG.upCom * up + (SEG.fore + SEG.hand) * up);
  return { arm: g * arm * s, load: g * kg * up * s, total: g * (arm + kg * up) * s, lever: up * s };
}

// A simplified picture of which muscles work during a raise in the side (frontal) plane, after
// Inman et al. 1944 and later EMG work: the supraspinatus works from the very start along with the
// deltoid; the deltoid's demand follows the moment ÷ its moment arm; the infraspinatus and teres
// minor turn the arm outwards as it goes overhead so the bump on the humerus clears the acromion;
// the upper and lower trapezius and serratus anterior rotate the blade upwards. 0–1, illustrative.
export function activity(elev, kg = 0, L = 0.63) {
  const e = clamp(elev, 0, 180);
  const m = raiseMoment(e, kg, L).total / Math.max(0.006, deltArm(e));
  const m0 = raiseMoment(90, kg, L).total / deltArm(90);
  const d = clamp(0.12 + 0.88 * m / m0, 0, 1);
  const up = smooth((e - 40) / 100);
  return {
    deltM: d, deltA: clamp(d * 0.75, 0, 1), deltP: clamp(d * 0.25, 0, 1),
    supra: clamp(0.85 - 0.35 * smooth(e / 120) + 0.1 * kg / 10, 0, 1),
    infra: clamp(0.3 + 0.55 * smooth((e - 60) / 80), 0, 1), teresMin: clamp(0.25 + 0.5 * smooth((e - 60) / 80), 0, 1),
    subscap: clamp(0.3 + 0.25 * Math.sin(e * DEG), 0, 1),
    trapU: clamp(0.1 + 0.8 * smooth((e - 20) / 120), 0, 1), trapL: clamp(0.05 + 0.85 * up, 0, 1), serr: clamp(0.1 + 0.85 * up, 0, 1),
  };
}

// ---------------------------------------------------------------- label and board helpers
const TINT = { red: '#ff8a8a', gold: '#ffd166', cyan: '#8ef0ff', good: '#6ee7a8', pink: '#ff9fc0', purple: '#d6a8ff', blue: '#9db4ff', white: '#e8eef8', orange: '#ffb070' };
export function tint(l, cls) { const c = TINT[cls]; if (c) { l.element.style.borderColor = c; l.element.style.color = c; } return l; }
export const inReel = () => document.body.classList.contains('gb-reel');
export function fitNarrow(stage, view) {
  let done = false;
  return () => {
    const narrow = stage.host.clientWidth < 560;
    if (narrow && !done && !stage.moved && !inReel()) { stage.setView(view.pos, view.target, 0.01); done = true; }
    return narrow;
  };
}
export function compactReadout(stage, api) {
  const full = api.readout;
  if (!full) return api;
  api.readout = (s) => {
    const html = full(s);
    if (stage.host.clientWidth >= 560 || !html) return html;
    let rows = 0;
    return html.replace(/<small>[\s\S]*?<\/small>/g, '').replace(/<div class="row">[\s\S]*?<\/div>/g, (m) => (++rows <= 2 ? m : ''));
  };
  return api;
}
export function board(ct, w, h) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: ct.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide, depthWrite: false }));
}
export function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export function panel(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.88)'; rrect(g, 0, 0, w, h, 20); g.fill(); }
// Draws axes on a board and returns x(), y() mappers.
export function axes(g, w, h, { title, x0, x1, y0, y1, xt = [], yt = [], xl = '', yfmt = (v) => v, L0 = 110, R0 = w - 36, T0 = 92, B0 = h - 72 }) {
  panel(g, w, h);
  const x = (v) => L0 + ((v - x0) / (x1 - x0)) * (R0 - L0), y = (v) => B0 - ((v - y0) / (y1 - y0)) * (B0 - T0);
  g.fillStyle = '#e8eef8'; g.font = 'bold 30px sans-serif'; g.fillText(title, 36, 52);
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1; g.beginPath(); g.moveTo(L0, T0 - 10); g.lineTo(L0, B0); g.lineTo(R0, B0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '22px sans-serif';
  xt.forEach((v) => g.fillText(String(v), x(v) - 14, B0 + 32));
  if (xl) g.fillText(xl, R0 - g.measureText(xl).width, B0 + 62);
  yt.forEach((v) => g.fillText(yfmt(v), 14, y(v) + 8));
  return { x, y, L0, R0, T0, B0 };
}
export function line(g, pts, color, width = 5) { g.strokeStyle = color; g.lineWidth = width; g.beginPath(); pts.forEach(([X, Y], i) => (i ? g.lineTo(X, Y) : g.moveTo(X, Y))); g.stroke(); g.lineWidth = 1; }
export function dot(g, X, Y, c = '#ffffff', r = 11) { g.fillStyle = c; g.beginPath(); g.arc(X, Y, r, 0, 7); g.fill(); }

// ---------------------------------------------------------------- geometry helpers
export const V = (p) => (p.isVector3 ? p.clone() : new THREE.Vector3(...p));
export function capsule(a, b, r, mat) {
  const A = V(a), B = V(b), len = A.distanceTo(B);
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len), 8, 20), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return m;
}
export function blob(r, pos, mat, seg = 32) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)), mat);
  m.scale.set(...r); m.position.set(...pos);
  return m;
}
const SPINDLE = (() => {
  const pts = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new THREE.Vector2(0.03 + Math.pow(Math.sin(Math.PI * t), 0.75), t - 0.5)); }
  const g = new THREE.LatheGeometry(pts, 28); g.computeVertexNormals(); return g;
})();
export const spindleGeo = () => SPINDLE;
export function aim(m, A, B, r, out = [0, 0, 1], flat = 1) {
  const a = V(A), b = V(B), y = b.clone().sub(a), len = Math.max(0.001, y.length()); y.normalize();
  let z = V(out); z.sub(y.clone().multiplyScalar(z.dot(y)));
  if (z.lengthSq() < 1e-6) z = new THREE.Vector3(1, 0, 0).cross(y);
  z.normalize();
  const x = new THREE.Vector3().crossVectors(y, z);
  m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.scale.set(r, len, r * flat);
  return m;
}
export function setBeam(b, A, B) {
  const d = B.clone().sub(A), L = d.length();
  b.position.copy(A).addScaledVector(d, 0.5);
  if (L > 1e-5) b.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.multiplyScalar(1 / L));
  b.scale.set(1, Math.max(0.001, L), 1);
}
function grainTexture(base = '#c24552') {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 40; i++) { const x = (Math.sin(i * 127.1 + 311.7) * 43758.5453 % 1 + 1) % 1 * 128; g.fillStyle = i % 2 ? 'rgba(255,190,170,.28)' : 'rgba(70,10,20,.35)'; g.fillRect(x, 0, 1 + (i % 3), 256); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---------------------------------------------------------------- the rig
// Rest positions (body frame, left shoulder).
export const P = {
  sc: [0.55, 10.3, 1.35],           // sternoclavicular joint (collarbone meets breastbone)
  ac: [3.4, 10.8, -0.15],           // acromioclavicular joint
  gh: [3.75, 9.9, 0.05],            // centre of the humeral head (ball)
  headR: 0.5,                       // humeral head radius: about 2.5 cm
};
const HUM = 6.0, FORE = 5.2, GRIP = 6.3;   // humerus 30 cm; elbow to grip 31.5 cm

// Muscles: key, name, frame of origin (C clavicle, S scapula, T thorax), origin, frame of insertion
// (H humerus), insertion; half-width; bulge (units) and the side it bulges towards.
const MUS = [
  { k: 'deltA', name: 'Front deltoid', grp: 'delt', col: 0xe0525e, of: 'C', o: [2.75, 10.72, 0.55], i: [0.28, -2.75, 0.18], r: 0.72, bulge: 0.55, flat: 0.42 },
  { k: 'deltM', name: 'Side deltoid', grp: 'delt', col: 0xd4424e, of: 'S', o: [3.95, 10.78, -0.05], i: [0.34, -2.8, 0.05], r: 0.78, bulge: 0.62, flat: 0.42 },
  { k: 'deltP', name: 'Rear deltoid', grp: 'delt', col: 0xb8394a, of: 'S', o: [3.0, 10.45, -1.15], i: [0.28, -2.75, -0.1], r: 0.72, bulge: 0.55, flat: 0.42 },
  { k: 'supra', name: 'Supraspinatus', grp: 'cuff', col: CUFF, of: 'S', o: [2.0, 10.35, -2.0], i: [0.1, 0.48, 0.0], r: 0.26, bulge: 0.12, flat: 0.8, dir: [0, 1, 0] },
  { k: 'infra', name: 'Infraspinatus', grp: 'cuff', col: 0xd9772f, of: 'S', o: [2.15, 8.75, -2.35], i: [0.38, 0.1, -0.32], r: 0.42, bulge: 0.15, flat: 0.45, dir: [0, 0, -1] },
  { k: 'teresMin', name: 'Teres minor', grp: 'cuff', col: 0xc96a28, of: 'S', o: [2.75, 8.05, -2.0], i: [0.32, -0.3, -0.3], r: 0.2, bulge: 0.1, flat: 0.8, dir: [0, 0, -1] },
  { k: 'subscap', name: 'Subscapularis', grp: 'cuff', col: 0xf0a060, of: 'S', o: [2.0, 8.9, -1.75], i: [0.05, -0.25, 0.42], r: 0.36, bulge: 0.1, flat: 0.45, dir: [0, 0, 1] },
  { k: 'trapU', name: 'Upper trapezius', grp: 'scap', col: SCAPM, of: 'T', o: [0.35, 12.7, -1.0], i2: 'S', i: [3.1, 10.85, -0.6], r: 0.36, bulge: 0.35, flat: 0.45, dir: [0, 1, -0.3] },
  { k: 'trapL', name: 'Lower trapezius', grp: 'scap', col: 0x9a5cc0, of: 'T', o: [0.3, 6.1, -2.55], i2: 'S', i: [1.6, 9.75, -2.45], r: 0.36, bulge: 0.2, flat: 0.4, dir: [0, 0, -1] },
  { k: 'serr', name: 'Serratus anterior', grp: 'scap', col: 0xc48ae0, of: 'T', o: [3.35, 7.3, 0.6], i2: 'S', i: [2.05, 7.25, -2.15], r: 0.36, bulge: 0.55, flat: 0.4, dir: [1, 0, 0] },
];
export const NAMES = Object.fromEntries(MUS.map((m) => [m.k, m.name]));
export const ABOUT = {
  deltA: 'Front (anterior) deltoid: from the outer third of the collarbone. Lifts the arm forwards and helps press overhead.',
  deltM: 'Side (lateral) deltoid: from the acromion. The main lifter in a side raise; gives the shoulder its width.',
  deltP: 'Rear (posterior) deltoid: from the spine of the shoulder blade. Pulls the arm back: rows, rear-delt flies, face pulls.',
  supra: 'Supraspinatus: rotator cuff. Runs under the acromion to the top of the humerus; starts the side raise with the deltoid. The tendon most often torn.',
  infra: 'Infraspinatus: rotator cuff. Covers the back of the blade and turns the arm outwards (external rotation).',
  teresMin: 'Teres minor: rotator cuff. A small partner of the infraspinatus; turns the arm outwards.',
  subscap: 'Subscapularis: rotator cuff. Lies on the front of the blade, against the ribs, and turns the arm inwards. The biggest cuff muscle.',
  trapU: 'Upper trapezius: lifts and rotates the shoulder blade upwards as the arm goes overhead.',
  trapL: 'Lower trapezius: pulls the inner end of the blade down, helping it rotate upwards and tilt back.',
  serr: 'Serratus anterior: wraps round the ribs to the blade. Holds the blade flat and swings it round as you reach up.',
};

export function makeShoulder(stage, opts = {}) {
  const o = { labels: true, otherArm: true, ...opts };
  const root = new THREE.Group();
  root.position.y = LIFT;                 // stand the figure on the floor grid
  const std = (x) => new THREE.MeshStandardMaterial({ roughness: 0.55, ...x });
  const skinMat = std({ color: 0xd9a47e, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, roughness: 0.65 });
  const boneMat = std({ color: 0xd6cdb6, roughness: 0.75, transparent: true, opacity: 1 });
  const ghostBone = std({ color: BONE, transparent: true, opacity: 0.09, depthWrite: false });
  const cartMat = std({ color: 0x9fd8ff, roughness: 0.2, transparent: true, opacity: 0.85, emissive: 0x2a5a7a, emissiveIntensity: 0.4 });
  const tMat = std({ color: TENDON, roughness: 0.4, emissive: 0x3a3428, emissiveIntensity: 0.3, transparent: true, opacity: 1 });

  // ---- thorax (fixed), ghosted
  const thorax = new THREE.Group(); root.add(thorax);
  const TOR = [[11.0, 0.05], [10.9, 1.2], [10.5, 2.9], [9.6, 3.35], [8.0, 3.2], [6.0, 2.9], [4.0, 2.6], [2.2, 2.75], [1.0, 2.9], [0.6, 0.05]];
  const tg = new THREE.LatheGeometry(TOR.map(([y, r]) => new THREE.Vector2(r, y)), 48); tg.scale(1, 1, 0.62); tg.computeVertexNormals();
  const torso = new THREE.Mesh(tg, skinMat); thorax.add(torso);
  const neck = capsule([0, 10.8, -0.2], [0, 12.6, -0.1], 1.0, skinMat); thorax.add(neck);
  const head = blob([1.7, 2.1, 1.9], [0, 14.4, 0.1], skinMat); thorax.add(head);
  const legs = [-1, 1].map((sx) => capsule([sx * 1.15, 1.4, 0], [sx * 1.25, -4.6, 0.1], 1.25, skinMat));   // legs, cropped at the floor
  legs.forEach((l) => thorax.add(l));
  for (let k = 0; k < 8; k++) {                                       // ribs
    const y = 9.7 - k * 0.72, R = 2.95 - Math.abs(k - 3) * 0.12;
    const rib = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 40), ghostBone);
    rib.rotation.x = Math.PI / 2 + 0.22; rib.scale.set(R, R * 0.6, 1); rib.position.set(0, y, -0.1); thorax.add(rib);
  }
  thorax.add(capsule([0, 10.2, 1.62], [0, 7.2, 1.75], 0.16, ghostBone));        // sternum
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 11.5, 12), ghostBone); spine.position.set(0, 6.5, -2.0); thorax.add(spine);
  // the other (right) shoulder: a ghost, hanging still
  if (o.otherArm) {
    thorax.add(capsule([-0.55, 10.3, 1.35], [-3.4, 10.8, -0.15], 0.14, ghostBone));
    thorax.add(capsule([-3.75, 9.9, 0.05], [-4.1, 3.95, 0.1], 0.24, ghostBone), blob([0.5, 0.5, 0.5], [-3.75, 9.9, 0.05], ghostBone));
    thorax.add(capsule([-3.95, 9.6, 0], [-4.3, 3.9, 0.1], 0.95, skinMat), capsule([-4.3, 3.6, 0.1], [-4.45, -1.2, 0.5], 0.7, skinMat));
    const sc = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-1.6, 10.6), new THREE.Vector2(-2.0, 7.0), new THREE.Vector2(-3.2, 9.6)])), ghostBone);
    sc.position.z = -2.25; thorax.add(sc);
  }

  // ---- collarbone frame: pivots at the sternoclavicular joint
  const clavG = new THREE.Group(); clavG.position.set(...P.sc); root.add(clavG);
  const rel = (p, base) => [p[0] - base[0], p[1] - base[1], p[2] - base[2]];
  const clav = capsule([0, 0, 0], rel(P.ac, P.sc), 0.16, boneMat); clavG.add(clav);
  clav.userData.part = 'clavicle';
  const clavHome = clav.position.clone();
  // ---- scapula frame: pivots at the AC joint (nested in the clavicle frame)
  const scapG = new THREE.Group(); scapG.position.set(...rel(P.ac, P.sc)); clavG.add(scapG);
  const S = (p) => rel(p, P.ac);
  const scap = new THREE.Group(); scapG.add(scap);
  const blade = new THREE.Shape([new THREE.Vector2(1.55, 10.6), new THREE.Vector2(1.45, 9.6), new THREE.Vector2(2.0, 7.0), new THREE.Vector2(2.7, 8.0), new THREE.Vector2(3.15, 9.45), new THREE.Vector2(2.9, 10.35)].map((v) => new THREE.Vector2(v.x - P.ac[0], v.y - P.ac[1])));
  const bladeG = new THREE.ExtrudeGeometry(blade, { depth: 0.12, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.04, bevelSegments: 1 });
  const bladeM = new THREE.Mesh(bladeG, boneMat); bladeM.position.z = -2.3 - P.ac[2]; bladeM.rotation.y = -0.18; scap.add(bladeM);
  const spineS = capsule(S([1.5, 9.95, -2.3]), S([3.3, 10.65, -0.9]), 0.11, boneMat); scap.add(spineS);    // spine of the scapula
  const acrom = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.24, 1.0), boneMat.clone()); acrom.position.set(...S([3.82, 10.72, -0.15])); acrom.rotation.y = 0.15; scap.add(acrom);   // acromion: the roof over the ball
  const neckS = capsule(S([3.0, 9.75, -0.9]), S([3.15, 9.9, -0.05]), 0.25, boneMat); scap.add(neckS);
  const corac = capsule(S([3.05, 10.15, -0.4]), S([3.15, 10.05, 0.95]), 0.11, boneMat); scap.add(corac);       // coracoid
  // glenoid: a shallow dish (about a third of a ball) facing out, with its rim of cartilage (labrum)
  const glen = new THREE.Mesh(new THREE.SphereGeometry(0.56, 32, 12, 0, Math.PI * 2, 0, 0.62), cartMat);
  glen.rotation.z = Math.PI / 2; glen.position.set(...S([3.75 - 0.0, 9.9, 0.05])); glen.scale.set(1, 1, 1.25); scap.add(glen);
  const labrum = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.05, 8, 32), cartMat); labrum.rotation.y = Math.PI / 2; labrum.position.set(...S([3.3, 9.9, 0.05])); labrum.scale.set(1, 1.25, 1); scap.add(labrum);
  [bladeM, spineS, acrom, neckS, corac].forEach((m) => { m.userData.part = 'scapula'; });

  // ---- humerus frame: centred on the ball, nested in the scapula frame
  const humG = new THREE.Group(); humG.position.set(...S(P.gh)); scapG.add(humG);
  const hum = new THREE.Group(); humG.add(hum);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(P.headR, 32, 20), std({ color: 0xf3eedd, roughness: 0.25, transparent: true, opacity: 1, emissive: 0x2a2a1e, emissiveIntensity: 0.2 }));
  hum.add(ball);
  const shaft = capsule([0.12, -0.3, 0], [0.05, -HUM + 0.25, 0], 0.22, boneMat); hum.add(shaft);
  const tuber = blob([0.28, 0.3, 0.3], [0.42, -0.05, 0.02], boneMat); hum.add(tuber);               // greater tubercle
  const condyle = blob([0.55, 0.25, 0.3], [0.05, -HUM, 0], boneMat); hum.add(condyle);
  [ball, shaft, tuber, condyle].forEach((m) => { m.userData.part = 'humerus'; });
  const upSkin = capsule([0.15, 0, 0], [0.05, -HUM, 0], 0.95, skinMat); hum.add(upSkin);
  // forearm frame at the elbow
  const foreG = new THREE.Group(); foreG.position.set(0.05, -HUM, 0); hum.add(foreG);
  foreG.add(capsule([0.12, -0.2, 0.05], [0.18, -FORE, 0.08], 0.13, boneMat), capsule([-0.12, -0.2, -0.05], [-0.1, -FORE, 0], 0.13, boneMat));
  const foreSkin = capsule([0, 0, 0], [0.05, -FORE, 0.05], 0.72, skinMat); foreG.add(foreSkin);
  const hand = blob([0.3, 0.75, 0.55], [0.05, -GRIP + 0.1, 0.1], std({ color: 0xd9a47e, transparent: true, opacity: 0.4, depthWrite: false })); foreG.add(hand);
  const grip = new THREE.Object3D(); grip.position.set(0.05, -GRIP, 0.1); foreG.add(grip);

  // ---- anchors and muscles
  const grain = grainTexture();
  const frames = { T: thorax, C: clavG, S: scap, H: hum };
  const bases = { T: [0, 0, 0], C: P.sc, S: P.ac, H: [0, 0, 0] };
  const anchor = (f, p) => { const a = new THREE.Object3D(); a.position.set(...(f === 'H' ? p : rel(p, bases[f]))); frames[f].add(a); return a; };
  const musG = new THREE.Group(); root.add(musG);
  const list = MUS.map((m) => {
    const mat = std({ color: 0xffffff, map: grain, emissive: m.col, emissiveIntensity: 0.12, transparent: true, opacity: 1 });
    mat.color.setHex(m.col).lerp(new THREE.Color(0xffffff), 0.35);
    const belly = new THREE.Mesh(SPINDLE, mat), t1 = capsule([0, 0, 0], [0, 1, 0], 0.06, tMat), t2 = capsule([0, 0, 0], [0, 1, 0], 0.07, tMat);
    // tendons: use a unit cylinder so setBeam can scale them
    [t1, t2].forEach((t) => { t.geometry.dispose(); t.geometry = new THREE.CylinderGeometry(0.06, 0.06, 1, 10); });
    musG.add(belly, t1, t2);
    const e = { ...m, mat, belly, t1, t2, A: anchor(m.of, m.o), B: anchor(m.i2 || 'H', m.i), act: 0, scale: 1, base: new THREE.Color(m.col).lerp(new THREE.Color(0xffffff), 0.35) };
    belly.userData.muscle = e;
    return e;
  });

  // ---- labels
  const labels = {};
  const L = (k, html, cls) => { labels[k] = tint(stage.label(html, [0, 0, 0], root), cls); return labels[k]; };
  if (o.labels) {
    L('deltA', 'Front deltoid', 'red'); L('deltM', 'Side deltoid', 'red'); L('deltP', 'Rear deltoid', 'red');
    L('supra', 'Supraspinatus', 'orange'); L('infra', 'Infraspinatus', 'orange'); L('subscap', 'Subscapularis', 'orange'); L('teresMin', 'Teres minor', 'orange');
    L('trapU', 'Upper trapezius', 'purple'); L('serr', 'Serratus anterior', 'purple'); L('trapL', 'Lower trapezius', 'purple');
    L('clav', 'Clavicle (collarbone)', 'white'); L('scap', 'Scapula (shoulder blade)', 'white'); L('acrom', 'Acromion', 'white'); L('hum', 'Humerus', 'white'); L('glen', 'Glenoid: the shallow socket', 'cyan');
  }

  // ---- state
  const st = { elev: 0, plane: 0, rot: 0, elbow: 8, shift: 0, explode: 0, layer: 1, scap: 0, gh: 0, clav: 0, override: null };
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), q = new THREE.Quaternion(), down = new THREE.Vector3(0, -1, 0);
  const local = (obj, out) => { obj.getWorldPosition(out); return root.worldToLocal(out); };
  const ghLocal = new THREE.Vector3();
  const OUT = { clav: new THREE.Vector3(0, 0.6, 1), scap: new THREE.Vector3(-0.3, 0, -1), hum: new THREE.Vector3(1, -0.2, 0.2) };
  let hidden = new Set();

  const api = {
    root, list, labels, thorax, legs, clavG, scapG, humG, hum, foreG, grip, ball, acrom, glen, skinMat, st,
    parts: { clav, blade: bladeM, acrom, ball, shaft, tuber },
    // Pose: elev = humeral elevation from hanging (deg), plane = 0 for a side raise (frontal plane),
    // 90 for a forward raise; rot = rotation about the humerus (+ = outwards); elbow = bend (deg).
    pose(p) {
      Object.assign(st, p);
      const r = rhythm(st.elev); st.scap = st.scapOverride ?? r.scap; st.gh = st.elev - st.scap; st.clav = clavElev(st.scap);
      clavG.rotation.z = st.clav * DEG;
      scapG.rotation.z = (st.scap - st.clav) * DEG;
      const e = st.elev * DEG, ph = st.plane * DEG;
      // arm direction in the body frame, then undo the blade's turn to get it in the scapula frame
      v1.set(Math.sin(e) * Math.cos(ph), -Math.cos(e), Math.sin(e) * Math.sin(ph));
      v1.applyAxisAngle(new THREE.Vector3(0, 0, 1), -st.scap * DEG);
      q.setFromUnitVectors(down, v1.normalize());
      humG.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), st.rot * DEG));
      foreG.rotation.set(-st.elbow * DEG, 0, 0);
      // head shift (units) along the scapula's +y: a head riding up when the cuff does not hold it
      humG.position.set(...S(P.gh)); humG.position.y += st.shift;
    },
    setExplode(k) { st.explode = clamp(k, 0, 1); },
    // layer: 0 skin, 1 muscles, 2 deep (deltoid hidden to show the cuff), 3 bones only
    setLayer(k) { st.layer = k; },
    hide(keys) { hidden = new Set(keys); },
    setAct(k, a) { const e = list.find((m) => m.k === k); if (e) e.act = clamp(a, 0, 1); },
    setActs(map) { list.forEach((e) => { e.act = clamp(map[e.k] ?? 0, 0, 1); }); },
    highlight(fn) { list.forEach((e) => { e.hi = fn ? fn(e) : true; }); },
    grow(k) { list.forEach((e) => { if (e.grp === 'delt') e.scale = k; }); },
    ghPos() { return local(humG, ghLocal).clone(); },
    gripPos() { return local(grip, new THREE.Vector3()); },
    worldOf(obj) { return local(obj, new THREE.Vector3()); },
    update() {
      root.updateMatrixWorld(true);
      const ex = smooth(st.explode);
      const L1 = st.layer;
      const skinOp = L1 < 0.5 ? 0.55 : 0.1;
      skinMat.opacity = skinOp; skinMat.depthWrite = skinOp > 0.5;
      const showMus = L1 < 2.5;
      // explode: bones apart, muscles outwards from the ball
      clav.position.copy(clavHome).add(v3.set(0, 0.7, 1.0).multiplyScalar(ex));
      scap.position.set(0, 0, -1.6 * ex);
      hum.position.set(1.8 * ex, -0.4 * ex, 0);
      const gh = local(humG, ghLocal);
      list.forEach((e) => {
        const vis = showMus && !hidden.has(e.k) && !(L1 > 1.5 && e.grp === 'delt');
        e.belly.visible = e.t1.visible = e.t2.visible = vis;
        if (!vis) return;
        const A = local(e.A, v1), B = local(e.B, v2);
        // humerus insertions move with the exploded humerus; others with the blade
        const d = B.clone().sub(A), len = d.length();
        let n;
        if (e.dir) n = new THREE.Vector3(...e.dir);
        else n = A.clone().lerp(B, 0.4).sub(gh);          // deltoid bulges away from the ball
        n.sub(d.clone().multiplyScalar(n.dot(d) / (len * len))).normalize();
        const push = (e.grp === 'delt' ? 1.6 : e.grp === 'cuff' ? 0.6 : 1.0) * ex;
        const off = n.clone().multiplyScalar(e.bulge + push);
        const tail = e.grp === 'delt' ? 0.92 : e.grp === 'cuff' ? 0.74 : 0.86;
        const a = A.clone().addScaledVector(d, 0.08).add(off), b = A.clone().addScaledVector(d, tail).addScaledVector(n, e.bulge * 0.35 + push);
        const width = e.r * (1 + 0.1 * e.act) * (e.scale || 1);
        aim(e.belly, a, b, width, n.toArray(), e.flat);
        setBeam(e.t1, A, a); setBeam(e.t2, b, B);
        const on = e.hi !== false;
        e.mat.color.copy(on ? e.base : new THREE.Color(0x6a5a5e));
        e.mat.emissiveIntensity = on ? 0.1 + 0.75 * e.act : 0.02;
        e.mat.opacity = on ? 1 : 0.35; e.mat.depthWrite = on;
        e.t1.visible = e.t2.visible = on;
        e.mid = a.clone().lerp(b, 0.5);
        e.n = n;
      });
      return gh;
    },
    // Place the anatomy labels by each muscle's belly (call after update()).
    placeLabels(on, which) {
      const show = (k) => on && (!which || which.includes(k));
      list.forEach((e) => {
        const l = labels[e.k]; if (!l) return;
        l.visible = show(e.k) && e.belly.visible;
        if (e.mid) l.position.copy(e.mid).addScaledVector(e.n, 1.0 + (e.grp === 'delt' ? 0.4 : 0.2));
      });
      const gh = local(humG, new THREE.Vector3());
      if (labels.clav) { labels.clav.visible = show('clav'); labels.clav.position.copy(local(clav, new THREE.Vector3())).add(new THREE.Vector3(-1.4, 0.9, 0.8)); }
      if (labels.scap) { labels.scap.visible = show('scap'); labels.scap.position.copy(local(bladeM, new THREE.Vector3())).add(new THREE.Vector3(-1.6, -2.4, 0)); }
      if (labels.acrom) { labels.acrom.visible = show('acrom'); labels.acrom.position.copy(local(acrom, new THREE.Vector3())).add(new THREE.Vector3(0.6, 1.0, 0.3)); }
      if (labels.hum) { labels.hum.visible = show('hum'); labels.hum.position.copy(local(condyle, new THREE.Vector3())).lerp(gh, 0.45).add(new THREE.Vector3(1.4, 0, 0.4)); }
      if (labels.glen) { labels.glen.visible = show('glen'); labels.glen.position.copy(gh).add(new THREE.Vector3(-0.9, -1.2, 1.4)); }
    },
  };
  api.pose({ elev: 0 });
  api.update();
  return api;
}

// Generic props: a dumbbell along the local X axis whose plates grow with the mass.
export function dumbbell() {
  const g = new THREE.Group();
  const plateM = new THREE.MeshStandardMaterial({ color: 0x3a3f4a, metalness: 0.6, roughness: 0.35 });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 12), new THREE.MeshStandardMaterial({ color: 0xb9bec8, metalness: 0.9, roughness: 0.3 }));
  bar.rotation.z = Math.PI / 2; g.add(bar);
  const plates = [-1, 1].map((sz) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.28, 28), plateM); p.rotation.z = Math.PI / 2; p.position.x = sz * 0.82; g.add(p); return p; });
  g.setKg = (kg) => { const r = 0.32 + 0.065 * Math.sqrt(Math.max(0, kg)) * 2; plates.forEach((p) => p.scale.set(r, 1, r)); g.visible = kg > 0; };
  return g;
}
// A gada (mace): a wooden handle with a heavy round head. Long axis along local +Y from the grip.
export function gada(len = 5.0, headR = 1.0) {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a32, roughness: 0.75 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 28, 18), new THREE.MeshStandardMaterial({ color: 0x9a6a3a, roughness: 0.6, metalness: 0.1 }));
  head.position.y = len; head.scale.set(1, 1.1, 1); g.add(head);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, len, 14), wood); handle.position.y = len / 2; g.add(handle);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), wood); g.add(knob);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 14), wood); tip.position.y = len + headR * 1.05; g.add(tip);
  return g;
}
// A jodi (Indian club, mudgar): a long, widening wooden club. Long axis along local +Y.
export function club(len = 3.2, r = 0.5, color = 0x8a5a32) {
  const pts = [[0, 0.12], [0.3, 0.14], [0.45, 0.16], [0.6, 0.2], [0.75, 0.32], [0.88, 0.45], [0.96, 0.42], [1.0, 0.15], [1.0, 0.0]];
  const g = new THREE.LatheGeometry(pts.map(([t, rr]) => new THREE.Vector2(rr * r / 0.45, t * len)), 28);
  g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.7 }));
}

// Keep a chart board in a fixed spot of the view (fractions of the half-width and half-height,
// e.g. nx = -0.5, ny = -0.45 for lower left), facing the camera, `frac` of the view's width wide.
// On phone-width stages it moves to the bottom centre.
export function hud(stage, mesh, { nx = -0.52, ny = -0.42, frac = 0.42, aspect = 0.69, dist = 12 } = {}) {
  const cam = stage.camera, narrow = stage.host.clientWidth < 560;
  const hh = Math.tan((cam.fov * Math.PI) / 360) * dist, hw = hh * cam.aspect;
  const W = Math.min(hw * 2 * (narrow ? 0.72 : frac), hh * 2 * (narrow ? 0.33 : 0.62) / aspect);
  const x = narrow ? 0 : nx * hw, y = narrow ? -hh + W * aspect / 2 + hh * 0.06 : ny * hh;
  const fwd = new THREE.Vector3(), up = cam.up.clone(), right = new THREE.Vector3();
  cam.getWorldDirection(fwd); right.crossVectors(fwd, up).normalize(); up.crossVectors(right, fwd).normalize();
  const p = cam.position.clone().addScaledVector(fwd, dist).addScaledVector(right, x).addScaledVector(up, y);
  if (mesh.parent) mesh.parent.worldToLocal(p);
  mesh.position.copy(p);
  mesh.quaternion.copy(cam.quaternion);
  mesh.scale.set(W / mesh.geometry.parameters.width, W / mesh.geometry.parameters.width, 1);
  mesh.renderOrder = 10; mesh.material.depthTest = false;
}
