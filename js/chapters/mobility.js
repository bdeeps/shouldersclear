// Chapter 2 (centrepiece): the most mobile joint. Raise the arm and the movement is shared: the
// ball turns in the socket (glenohumeral joint) and the whole shoulder blade turns upwards on the
// ribs (scapulothoracic motion), about 2° to 1° over a full raise (rhythm() in shoulder.js, after
// Inman, Saunders & Abbott 1944, J Bone Joint Surg 26:1–30; first described by Codman, 1934; later
// studies agree on the overall split but show the ratio changes along the raise and between people).
// The muscles light up by a simplified activity() pattern; the deltoid's demand is computed from the
// arm's own weight (de Leva 1996) and its moment arm (Ackland et al., J Anat 213:383, 2008).
// Mobility versus stability: the deltoid pulls the arm mostly upwards along the humerus when the arm
// hangs, which would shear the ball up into the acromion; the rotator cuff pulls the ball into the
// socket ("concavity compression") so the deltoid can lift it. With the cuff switched off the model
// lets the ball ride up, the picture seen with large cuff tears (AAOS OrthoInfo "Rotator cuff tears";
// Neer, Craig & Fukuda, J Bone Joint Surg Am 65:1232, 1983, "cuff-tear arthropathy"). The 0.35-unit
// (about 1.5 cm) ride-up is illustrative.
// Range: shoulder flexion and abduction about 0–180° (AAOS, as used in SkeletonClear's joints chapter).
import { THREE, clamp, lerp, smooth, canvasTexture, arrow } from '../kit.js';
import { makeShoulder, rhythm, activity, deltArm, raiseMoment, NAMES, tint, fitNarrow, compactReadout, inReel, board, hud, axes, line, dot } from '../shoulder.js';

function drawRhythm(g, w, h, st) {
  const A = axes(g, w, h, { title: 'Who does the turning?', x0: 0, x1: 180, y0: 0, y1: 130, xt: [0, 60, 120, 180], yt: [0, 60, 120], xl: 'arm raised (°)', yfmt: (v) => v + '°' });
  const gh = [], sc = [];
  for (let e = 0; e <= 180; e += 3) { const r = rhythm(e); gh.push([A.x(e), A.y(r.gh)]); sc.push([A.x(e), A.y(r.scap)]); }
  line(g, gh, '#8ef0ff'); line(g, sc, '#d6a8ff');
  g.font = 'bold 24px sans-serif';
  g.fillStyle = '#8ef0ff'; g.fillText('ball in socket', A.x(118), A.y(rhythm(180).gh) + 44);
  g.fillStyle = '#d6a8ff'; g.fillText('shoulder blade', A.x(112), A.y(rhythm(180).scap) + 40);
  const r = rhythm(st.elev);
  dot(g, A.x(r.elev), A.y(r.gh), '#8ef0ff'); dot(g, A.x(r.elev), A.y(r.scap), '#d6a8ff');
  g.fillStyle = 'rgba(255,255,255,.5)'; g.font = '20px sans-serif'; g.fillText('setting phase', A.x(2), A.y(8) - 4);
}

export default {
  id: 'mobility',
  short: 'The most mobile joint',
  title: 'The most mobile joint in your body',
  subtitle: 'Ball and blade share every raise, and the rotator cuff keeps the ball centred.',
  view: { pos: [9.0, 17.1, 17], target: [1.6, 15.8, 0] },
  learn: `<p>Lift your arm straight up and it swings through about <b>180°</b>. No other joint in your body moves so far. But the ball-and-socket joint does not do it alone.</p>
    <p>For roughly every <b>2°</b> the ball turns in its socket, the whole <b>shoulder blade</b> turns <b>1°</b> upwards on your ribs, carrying the socket with it. Over a full raise that is about <b>120°</b> at the ball and <b>60°</b> at the blade. Doctors call this the <b>scapulohumeral rhythm</b>. It was measured in 1944, and later studies agree on the overall split, though the ratio changes along the way and from person to person. In the first 30° or so the blade barely moves.</p>
    <p>Different muscles take turns. The <b>supraspinatus</b> and the <b>deltoid</b> start the raise together. The deltoid works hardest around 90°, where the arm sticks straight out. Going overhead, the <b>infraspinatus</b> and <b>teres minor</b> turn the arm outwards so the bump on the humerus clears the acromion, while the <b>trapezius</b> and <b>serratus anterior</b> swing the blade round.</p>
    <p>Here is the trade-off. When your arm hangs, the deltoid pulls mostly <b>upwards</b>, along the bone. On its own it would drag the ball up into the roof of the shoulder. The <b>rotator cuff</b> pulls the ball <b>into</b> the socket instead, so the deltoid's pull becomes a turn. <b>Mobility</b> comes from the shallow socket; <b>stability</b> comes from muscles. That is why a strong, healthy cuff matters.</p>
    <p class="tip"><b>Try it:</b> drag the arm from 0° to 180° and watch the blade start to turn after about 30°. Then switch the rotator cuff off and lift again.</p>`,
  terms: [
    { t: 'Scapulohumeral rhythm', d: 'The way an arm raise is shared between the ball-and-socket joint and the turning shoulder blade, about 2:1 overall.' },
    { t: 'Glenohumeral joint', d: 'The ball-and-socket joint between the humerus and the glenoid.' },
    { t: 'Abduction', d: 'Raising the arm out to the side.' },
    { t: 'Flexion', d: 'Raising the arm forwards.' },
    { t: 'External rotation', d: 'Turning the arm outwards about its own length, like opening a door with the back of your hand.' },
    { t: 'Stability', d: 'Keeping the ball centred in its socket while it moves.' },
  ],
  defaults: { elev: 60, plane: 0, cuff: true, auto: false, labels: true },
  onChange(s, key) { if (key === 'elev') s.auto = false; },
  controls: [
    { key: 'elev', type: 'range', label: 'Raise the arm', min: 0, max: 180, step: 1, ends: ['by your side', 'straight up'], fmt: (v) => Math.round(v) + '°' },
    { key: 'plane', type: 'seg', label: 'Direction', options: [{ v: 0, label: 'Out to the side' }, { v: 90, label: 'Forwards' }] },
    { key: 'cuff', type: 'toggle', label: 'Rotator cuff working', hint: 'Switch it off to see why the shallow socket needs it.' },
    { key: 'auto', type: 'toggle', label: 'Raise and lower' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'When you raise your arm all the way up, roughly how is the 180° shared?', options: ['All at the ball and socket', 'About 120° at the ball, 60° by the shoulder blade turning', 'Half and half from the start', 'All by the collarbone'], answer: 1, why: 'Over a full raise the ball turns about 2° for every 1° the blade turns, though the ratio varies along the way.' },
    { q: 'With the arm hanging, which way does the deltoid mostly pull the humerus?', options: ['Into the socket', 'Upwards along the bone, towards the acromion', 'Down towards the elbow', 'It does not pull at all'], answer: 1, why: 'At the start its line of pull runs nearly along the bone, so it would slide the ball up. The cuff pulls the ball into the socket so the pull becomes a turn.' },
    { q: 'Why does the arm turn outwards as it goes overhead?', options: ['To look graceful', 'So the bump on the humerus clears the acromion', 'Because the elbow bends', 'It does not'], answer: 1, why: 'The infraspinatus and teres minor rotate the arm outwards, moving the greater tubercle out of the way of the bony roof.' },
  ],
  reel: [
    { ms: 5600, caption: 'Raise your arm and the shoulder blade turns too: about 1° for every 2° at the ball.', set: { elev: 0, plane: 0, cuff: true, auto: false, labels: false }, anim: { elev: [0, 175] }, view: { pos: [8.5, 17.1, 16], target: [2.6, 16.2, 0] }, spin: 0 },
    { ms: 5200, caption: 'The rotator cuff pulls the ball into its socket so the deltoid can lift instead of slide.', set: { elev: 20, plane: 0, cuff: false, auto: false, labels: false }, anim: { elev: [20, 110] }, view: { pos: [7.5, 16.1, 11], target: [3.4, 15.4, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const sh = makeShoulder(stage); root.add(sh.root);
    sh.foreG.visible = false;
    const st = { elev: 60 };
    const chart = canvasTexture(900, 620, (g, w, h) => drawRhythm(g, w, h, st));
    const cb = board(chart, 6.6, 6.6 * 620 / 900);  root.add(cb);
    // arrows at the ball: deltoid pull (red), cuff squeeze (orange)
    const aD = arrow(0xff8a8a, 2, 0.35, 0.07), aC = arrow(0xffb070, 2, 0.35, 0.07); sh.root.add(aD, aC);
    const pinch = tint(stage.label('Pinched under the acromion', [0, 0, 0], sh.root), 'red');
    const lblBall = tint(stage.label('', [0, 0, 0], sh.root), 'cyan');
    let elev = 60, t = 0, shift = 0, acts = activity(60);
    const fit = fitNarrow(stage, { pos: [6.5, 17.1, 19], target: [3.0, 15.6, 0] });
    const point = (a, from, dir, len) => { a.position.copy(from); a.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()); a.set(len); };
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const target = s.auto ? 90 - 88 * Math.cos(t * 2 * Math.PI / 6) : s.elev;
        elev += (target - elev) * Math.min(1, dt * (s.auto ? 20 : 6));
        if (s.auto) s.elev = Math.round(elev);
        // without the cuff the ball rides up as the deltoid pulls (worst through the middle range)
        const want = s.cuff ? 0 : 0.35 * smooth(elev / 40) * (1 - smooth((elev - 130) / 40));
        shift += (want - shift) * Math.min(1, dt * 5);
        sh.pose({ elev, plane: s.plane, rot: elev > 70 ? Math.min(45, (elev - 70) * 0.5) : 0, elbow: 0, shift });
        acts = activity(elev, 0);
        if (!s.cuff) { acts.supra = acts.infra = acts.teresMin = acts.subscap = 0; }
        if (s.plane === 90) { const a = acts.deltA; acts.deltA = acts.deltM; acts.deltM = a * 0.8; }
        sh.setActs(acts);
        sh.highlight((e) => s.cuff || e.grp !== 'cuff');
        sh.update();
        st.elev = elev; chart.redraw();
        // arrows at the ball
        const gh = sh.ghPos();
        const del = sh.list.find((e) => e.k === 'deltM'), up = del.A.getWorldPosition(new THREE.Vector3()).sub(del.B.getWorldPosition(new THREE.Vector3())).normalize();
        point(aD, gh.clone().add(new THREE.Vector3(0.6, -1.4, 2.0)), up, 0.8 + 1.4 * acts.deltM);
        const into = new THREE.Vector3(-1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), sh.st.scap * Math.PI / 180);
        point(aC, gh.clone().addScaledVector(into, -2.4).add(new THREE.Vector3(0, -1.6, 2.0)), into, s.cuff ? 1.5 : 0.001);
        aC.visible = s.cuff;
        hud(stage, cb, { aspect: cb.geometry.parameters.height / cb.geometry.parameters.width });
        const narrow = fit(), on = s.labels && !inReel() && !narrow;
        const top = Object.entries(acts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k);
        sh.placeLabels(on, top);
        pinch.visible = !s.cuff && shift > 0.2 && !inReel();
        pinch.position.copy(gh).add(new THREE.Vector3(0.8, 1.8, 1.0));
        lblBall.visible = on; lblBall.element.textContent = s.cuff ? 'Ball held centred' : 'Ball riding up';
        lblBall.position.copy(gh).add(new THREE.Vector3(-1.2, -1.3, 1.5));
      },
      readout: (s) => {
        const r = rhythm(elev);
        const top = Object.entries(acts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => NAMES[k].replace('Upper ', 'upper ').replace('Lower ', 'lower ')).join(', ');
        const m = raiseMoment(elev, 0);
        return `<div class="big">Arm up ${Math.round(elev)}°</div>
          <div class="row"><span>Ball turning in the socket</span><b>${Math.round(r.gh)}°</b></div>
          <div class="row"><span>Shoulder blade turning</span><b>${Math.round(r.scap)}°</b></div>
          <div class="row"><span>Ratio so far</span><b>${r.scap < 4 ? 'blade barely moving' : r.ratio.toFixed(1) + ' : 1'}</b></div>
          <div class="row"><span>Working hardest</span><b>${top}</b></div>
          <div class="row"><span>Arm’s own weight turning it down</span><b>${m.total.toFixed(1)} N·m</b></div>
          <small>${s.cuff ? 'Simplified pattern after Inman (1944) and later EMG studies. Arm alone, 65 kg adult; deltoid lever about ' + (deltArm(elev) * 100).toFixed(1) + ' cm.' : 'Cuff off: the deltoid slides the ball up into the roof. Large cuff tears can do this; see chapter 5.'}</small>`;
      },
    });
  },
};
