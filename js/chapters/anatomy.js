// Chapter 1: what a shoulder is made of. A rigged left shoulder seen from the front: the collarbone
// (clavicle), the shoulder blade (scapula) with its acromion roof and shallow glenoid socket, the
// ball of the upper arm bone (humerus), the deltoid's three parts, the four rotator-cuff muscles and
// the muscles that steer the blade. Layers peel skin, then the deltoid, then all muscle; explode
// pulls the bones and muscles apart.
// Sources: Gray's Anatomy (42nd ed.); OpenStax Anatomy & Physiology 2e, 11.5 ("Muscles of the
// pectoral girdle and upper limbs": deltoid origins on the clavicle, acromion and scapular spine;
// rotator cuff of supraspinatus, infraspinatus, teres minor and subscapularis); AAOS OrthoInfo
// "Rotator cuff tears" (four muscles whose tendons form a covering round the head of the humerus;
// most tears involve the supraspinatus); SkeletonClear's joints chapter (shoulder as a ball and
// socket that lifts 0–180°, its shallow socket trading stability for range).
// "Golf ball on a tee" is the standard teaching image: the glenoid's surface is much smaller than
// the humeral head's (textbooks commonly give roughly a third to a quarter of the head in contact at
// once), and the labrum, capsule, ligaments and cuff muscles hold the ball on.
import { THREE, clamp } from '../kit.js';
import { makeShoulder, NAMES, ABOUT, tint, fitNarrow, compactReadout, inReel } from '../shoulder.js';
import { toast } from '../ui.js';

const GROUPS = {
  all: { label: 'Every part', rows: [['Bones', 'clavicle, scapula, humerus'], ['Joint', 'ball and shallow socket'], ['Deltoid', 'three parts, one muscle'], ['Rotator cuff', 'four small muscles']] },
  delt: { label: 'The deltoid', rows: [['Front part', 'from the collarbone'], ['Side part', 'from the acromion'], ['Rear part', 'from the blade’s spine'], ['All three', 'meet halfway down the humerus']] },
  cuff: { label: 'The rotator cuff', rows: [['Supraspinatus', 'on top: starts the raise'], ['Infraspinatus, teres minor', 'behind: turn the arm out'], ['Subscapularis', 'in front: turns the arm in'], ['Job', 'hold the ball in the socket']] },
  scap: { label: 'Blade movers', rows: [['Upper trapezius', 'lifts and turns the blade'], ['Lower trapezius', 'pulls its inner edge down'], ['Serratus anterior', 'swings it round the ribs'], ['Together', 'tilt the socket up']] },
  bones: { label: 'The bones', rows: [['Clavicle', 'a strut to the breastbone'], ['Scapula', 'floats on the back of the ribs'], ['Glenoid', 'shallow socket: a golf tee'], ['Humerus', 'the ball: a golf ball']] },
};

export default {
  id: 'anatomy',
  short: 'The parts',
  title: 'What a shoulder is made of',
  subtitle: 'Three bones, a shallow socket, a three-part deltoid and the four-muscle rotator cuff.',
  view: { pos: [6.2, 16.2, 10.5], target: [1.3, 14.2, 0] },
  learn: `<p>Your shoulder is three bones. The <b>clavicle</b> (collarbone) is a strut from your breastbone. The <b>scapula</b> (shoulder blade) is a flat triangle that floats on the back of your ribs, held only by muscles. The <b>humerus</b>, your upper arm bone, ends in a round <b>ball</b>.</p>
    <p>The ball sits in the <b>glenoid</b>, a shallow dish on the side of the blade. It is a <b>ball-and-socket joint</b> (see the joints chapter of <a href="/skeletonclear/#joints">SkeletonClear</a>), but the socket is so small that people compare it to a <b>golf ball on a tee</b>. That is why the shoulder moves more than any other joint, and why it can slip out.</p>
    <p>Over the top sits the <b>deltoid</b>, the rounded cap of the shoulder. It is one muscle in three parts: the <b>front</b> part starts on the collarbone, the <b>side</b> part on the bony roof called the <b>acromion</b>, and the <b>rear</b> part on the spine of the blade. All three pull on one spot halfway down the arm.</p>
    <p>Underneath is the <b>rotator cuff</b>: four small muscles, the <b>supraspinatus</b>, <b>infraspinatus</b>, <b>teres minor</b> and <b>subscapularis</b>. Their tendons wrap the ball like a hand round a ball, turning the arm and holding it in the socket. Other muscles, such as the <b>trapezius</b> and <b>serratus anterior</b>, steer the blade itself. How muscle fibres actually pull is <a href="/muscleclear/#sliding">MuscleClear</a>'s story.</p>
    <p class="tip"><b>Try it:</b> pick "Deep" to lift the deltoid off and see the cuff. Then explode the shoulder, and tap any muscle to name it.</p>`,
  terms: [
    { t: 'Clavicle', d: 'The collarbone: a strut from the breastbone to the top of the shoulder.' },
    { t: 'Scapula', d: 'The shoulder blade: a flat triangular bone on the back of the ribs.' },
    { t: 'Glenoid', d: 'The shallow socket on the scapula that the ball of the humerus sits in.' },
    { t: 'Acromion', d: 'The bony roof at the top of the shoulder, part of the scapula.' },
    { t: 'Deltoid', d: 'The shoulder’s cap muscle, with front, side and rear parts.' },
    { t: 'Rotator cuff', d: 'Four small muscles whose tendons wrap the ball, turn the arm and keep it centred.' },
  ],
  defaults: { layer: 1, explode: 0, group: 'all', raise: 0, labels: true },
  controls: [
    { key: 'layer', type: 'seg', label: 'Layer', options: [{ v: 0, label: 'Skin' }, { v: 1, label: 'Muscles' }, { v: 2, label: 'Deep' }, { v: 3, label: 'Bones' }] },
    { key: 'group', type: 'seg', label: 'Show', options: [{ v: 'all', label: 'All' }, { v: 'delt', label: 'Deltoid' }, { v: 'cuff', label: 'Cuff' }, { v: 'scap', label: 'Blade' }, { v: 'bones', label: 'Bones' }] },
    { key: 'explode', type: 'range', label: 'Explode', min: 0, max: 1, step: 0.01, fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'raise', type: 'range', label: 'Raise the arm', min: 0, max: 170, step: 1, ends: ['by your side', 'overhead'], fmt: (v) => Math.round(v) + '°' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  onChange(s, key) { if (key === 'group' && s.group === 'cuff' && s.layer < 2) s.layer = 2; if (key === 'group' && s.group === 'bones') s.layer = 3; if (key === 'group' && (s.group === 'delt' || s.group === 'scap') && s.layer > 1) s.layer = 1; },
  quiz: [
    { q: 'Why is the shoulder compared to a golf ball on a tee?', options: ['It is round and white', 'The ball is big and the socket is small and shallow', 'It is made of plastic', 'It only moves one way'], answer: 1, why: 'The glenoid is a shallow dish much smaller than the ball, so muscles and soft tissue must hold the ball on.' },
    { q: 'Which muscles make up the rotator cuff?', options: ['Biceps, triceps, deltoid, trapezius', 'Supraspinatus, infraspinatus, teres minor, subscapularis', 'Pectorals and lats', 'The three parts of the deltoid'], answer: 1, why: 'Four small muscles from the shoulder blade whose tendons wrap the ball of the humerus.' },
    { q: 'Where does the side (lateral) deltoid start?', options: ['On the breastbone', 'On the acromion, the roof of the shoulder', 'On the elbow', 'On the spine of the neck'], answer: 1, why: 'Front part: collarbone. Side part: acromion. Rear part: the spine of the shoulder blade.' },
  ],
  reel: [
    { ms: 5200, caption: 'Your shoulder is a big ball on a small, shallow socket, like a golf ball on a tee.', set: { layer: 3, explode: 0, group: 'bones', raise: 0, labels: false }, anim: { raise: [0, 100] }, view: { pos: [6.0, 15.1, 13], target: [3.4, 13.6, 0] }, spin: 0.4 },
    { ms: 5200, caption: 'A three-part deltoid caps it, and four rotator cuff muscles hold the ball in place.', set: { layer: 1, explode: 0, group: 'all', raise: 20, labels: false }, anim: { explode: [0, 0.75] }, view: { pos: [5.5, 14.4, 18], target: [2.8, 13.0, 0] }, spin: 0.5 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const sh = makeShoulder(stage); root.add(sh.root);
    stage.pickables.push(...sh.list.map((e) => e.belly), sh.parts.clav, sh.parts.blade, sh.parts.ball, sh.parts.shaft, sh.parts.acrom);
    let layer = 1, raise = 0, t = 0, lastToast = -9;
    const fit = fitNarrow(stage, { pos: [3.6, 14.4, 13], target: [3.4, 12.6, 0] });
    return compactReadout(stage, {
      pick(o) {
        if (t - lastToast < 0.6) return; lastToast = t;
        const e = o.userData.muscle;
        if (e) { toast(`<b>${NAMES[e.k]}</b>. ${ABOUT[e.k].split(': ').slice(1).join(': ') || ABOUT[e.k]}`); return; }
        const part = { clavicle: 'the <b>clavicle</b>, a strut that holds the shoulder out from the chest.', scapula: 'the <b>scapula</b>: it glides over the ribs and carries the socket with it.', humerus: 'the <b>humerus</b>: its ball is much bigger than the shallow socket it sits in.' }[o.userData.part];
        if (o === sh.parts.acrom) toast('The <b>acromion</b>: the roof of the shoulder. The supraspinatus tendon runs underneath it.');
        else if (part) toast('This is ' + part);
      },
      update(dt, s, time) {
        dt = Math.max(0, dt); t = time;
        layer += (s.layer - layer) * Math.min(1, dt * 6);
        raise += (s.raise - raise) * Math.min(1, dt * 5);
        sh.setLayer(Math.round(layer * 10) / 10);
        sh.setExplode(s.explode);
        sh.pose({ elev: raise, plane: 20, rot: raise > 80 ? (raise - 80) * 0.5 : 0, elbow: 8 });
        const pulse = Math.pow(0.5 - 0.5 * Math.cos(time * 2 * Math.PI / 1.8), 2);
        sh.highlight(s.group === 'all' || s.group === 'bones' ? null : (e) => e.grp === s.group);
        sh.list.forEach((e) => { e.act = s.group !== 'all' && e.grp === s.group ? pulse * 0.8 : 0.05; });
        sh.update();
        const narrow = fit();
        const on = s.labels && !inReel() && !narrow && s.explode < 0.5;
        const bones = s.layer >= 3 || s.group === 'bones';
        const which = bones ? ['clav', 'scap', 'acrom', 'hum', 'glen'] : s.group === 'delt' ? ['deltA', 'deltM', 'deltP', 'clav', 'acrom'] : s.group === 'cuff' ? ['supra', 'infra', 'teresMin', 'subscap', 'acrom'] : s.group === 'scap' ? ['trapU', 'trapL', 'serr', 'scap'] : s.layer >= 2 ? ['supra', 'infra', 'subscap', 'trapU', 'serr', 'clav', 'acrom'] : ['deltA', 'deltM', 'deltP', 'trapU', 'serr', 'clav'];
        sh.placeLabels(on, which);
      },
      readout: (s) => {
        const g = GROUPS[s.group];
        return `<div class="big">${g.label}</div>
          ${g.rows.map(([a, b]) => `<div class="row"><span>${a}</span><b>${b}</b></div>`).join('')}
          <small>${s.layer >= 2 ? 'Orange: rotator cuff. Purple: muscles that move the blade. Blue: cartilage of the socket.' : 'Red: the deltoid’s three parts. Orange: the rotator cuff underneath. Tap a muscle to name it.'}</small>`;
      },
    });
  },
};
