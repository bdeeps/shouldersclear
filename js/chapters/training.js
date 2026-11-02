// Chapter 4: training the shoulder. Growth in brief (BicepsClear goes deep), push–pull balance,
// sets and reps, form, protein and myths. The board shows the series' shared, labelled growth model:
// ILLUSTRATIVE, NOT A PREDICTION. It encodes these evidence-based shapes:
//  - Weekly volume: Schoenfeld, Ogborn & Krieger (J Sports Sci 35:1073, 2017; 15 studies): each
//    extra weekly set added about 0.37% muscle growth over the studies' length (ES +0.023 per set);
//    higher vs lower volume differed by about 3.9%; 10+ sets vs fewer showed only a trend (P = 0.074).
//    The model adds 0.37% per effective hard set per 10 weeks and stops adding past 20 sets, where
//    evidence is thin.
//  - Load: Schoenfeld, Grgic, Ogborn & Krieger (J Strength Cond Res 31:3508, 2017; 21 studies): with
//    sets taken to failure, low loads (≤60% of one-rep max) and high loads (>60%) gave similar growth;
//    heavy loads gave more one-rep-max strength.
//  - Effort: sets count fully when close to failure (0–2 reps in reserve); the taper for easier sets
//    is an illustrative assumption.
//  - Strength rises faster than size early on (the nervous system learns first: the classic finding
//    of Moritani & deVries, 1979, Am J Phys Med; cited from memory); the model gives a neural part with a
//    ~3-week time constant on top of a size part.
//  - Muscle protein synthesis after a heavy session: +50% at 4 h, +109% at 24 h, back near baseline
//    by about 36 h (MacDougall et al., Can J Appl Physiol 20:480, 1995; six young men).
//  - Protein: ICMR-NIN Dietary Guidelines for Indians (2024) give about 0.83 g per kg body weight a
//    day for adults and advise against protein powders for building body mass; a meta-analysis of
//    49 trials found protein beyond about 1.6 g/kg/day added nothing more (Morton et al., Br J Sports
//    Med 52:376, 2018; FFM +0.30 kg overall with supplements).
//  - WHO (2020) and NHS: muscle-strengthening for all major muscle groups on 2 or more days a week
//    (NHS lists the shoulders among them).
//  - Spot reduction is a myth: 6 weeks of daily ab exercise did not reduce belly fat (Vispute et al.,
//    J Strength Cond Res 25(9), 2011; PMID 21804427). Women and men gained muscle similarly in a meta-analysis
//    (Roberts, Nuckols & Krieger, 2020, PMID 32218059: ES 0.07, not significant).
import { THREE, clamp, lerp, smooth, canvasTexture } from '../kit.js';
import { makeShoulder, tint, fitNarrow, compactReadout, inReel, board, hud, axes, line, dot } from '../shoulder.js';

const effortK = (rir) => (rir <= 2 ? 1 : rir <= 3 ? 0.8 : rir <= 4 ? 0.6 : 0.4);
// The shared weeks model (illustrative). Returns % size and % strength gain at week w.
export function growth(w, sets, rir) {
  const eff = Math.min(20, sets * effortK(rir));
  if (sets <= 0) return { size: 0, strength: 0, neural: 0, eff: 0 };
  const g10 = 1.5 + 0.37 * eff;                                        // % in 10 weeks
  const size = g10 * ((1 - Math.exp(-w / 30)) / (1 - Math.exp(-10 / 30))) * smooth(w / 3);
  const neural = 10 * Math.min(1, eff / 6) * (1 - Math.exp(-w / 3));
  return { size, neural, strength: neural + size * 1.1, eff };
}

const BAL = {
  push: { label: 'Mostly pressing', note: 'Front-heavy: rear deltoid and cuff lag behind', front: 1, rear: 0.25 },
  even: { label: 'Press and pull', note: 'A pull for every press: rows, face pulls, rear-delt work', front: 1, rear: 1 },
  pull: { label: 'Mostly pulling', note: 'Also fine, but the front deltoid gets less work', front: 0.5, rear: 1 },
};

function drawGrowth(g, w, h, st) {
  const max = Math.max(10, Math.ceil(Math.max(growth(24, st.sets, st.rir).strength, 1) / 5) * 5);
  const A = axes(g, w, h, { title: 'Weeks of training (illustrative)', x0: 0, x1: 24, y0: 0, y1: max, xt: [0, 8, 16, 24], yt: [0, max / 2, max], xl: 'weeks', yfmt: (v) => '+' + Math.round(v) + '%' });
  const S = [], Z = [];
  for (let k = 0; k <= 24; k += 0.5) { const r = growth(k, st.sets, st.rir); S.push([A.x(k), A.y(r.strength)]); Z.push([A.x(k), A.y(r.size)]); }
  line(g, S, '#8ef0ff'); line(g, Z, '#ff8a8a');
  g.font = 'bold 24px sans-serif';
  g.fillStyle = '#8ef0ff'; g.fillText('strength', A.x(17), A.y(growth(24, st.sets, st.rir).strength) - 14);
  g.fillStyle = '#ff8a8a'; g.fillText('muscle size', A.x(16), A.y(growth(24, st.sets, st.rir).size) + 36);
  const r = growth(st.w, st.sets, st.rir);
  dot(g, A.x(st.w), A.y(r.strength), '#8ef0ff'); dot(g, A.x(st.w), A.y(r.size), '#ff8a8a');
  g.fillStyle = 'rgba(255,255,255,.5)'; g.font = '20px sans-serif'; g.fillText('A model, not a prediction. Real results vary a lot.', 36, h - 16);
}

export default {
  id: 'training',
  short: 'Training it',
  title: 'Training your shoulders',
  subtitle: 'Hard sets, patience, balance between pressing and pulling, and food rather than powders.',
  view: { pos: [7.0, 15.0, 17], target: [1.2, 13.4, 0] },
  learn: `<p><b>How a muscle grows</b>, in brief (<a href="/bicepsclear/">BicepsClear</a> goes deep): lifting puts <b>tension</b> on muscle fibres, and sets taken close to <b>failure</b> recruit and load the most fibres. Over the next day or so the muscle builds new protein: one study found the rate up by half at 4 hours, doubled at 24 hours and nearly back to normal by about 36 hours. Repeat that for weeks and the fibres thicken. Strength rises first, mostly because your <b>nervous system</b> learns the move; visible size takes <b>weeks to months</b>.</p>
    <p><b>How much?</b> A 2017 review of 15 studies found a <b>dose-response</b>: each extra hard set a week added a little more growth, about 0.37% over a study. Around <b>10 or more hard sets</b> a week per muscle is a common evidence-based target, but that difference was only a trend in the data. Light weights (even about 30% of your best) and heavy ones build similar size if the sets go close to failure; heavier builds more top-end strength. Train the shoulders <b>twice a week</b> or more, as WHO and the NHS advise for every major muscle group.</p>
    <p><b>Balance pushing and pulling.</b> Presses and push-ups (dand) work the front deltoid hard. Add rows, face pulls and rear-delt flies so the rear deltoid and the cuff keep up. Pairing them is common coaching practice, not a measured ratio.</p>
    <p><b>Form cues.</b> Ribs down and no leaning back on presses. Lateral raises to about shoulder height, without shrugging or swinging. Control the lowering. Common faults: too much weight, half reps, and pressing through pain.</p>
    <p><b>Food.</b> ICMR-NIN's 2024 guidelines put adult protein needs at about <b>0.8 g per kg</b> body weight a day and advise <b>against protein powders</b> for building muscle; dal, milk, curd, paneer, eggs, fish, soy and nuts can cover it. A review of 49 trials found more than about 1.6 g/kg added nothing further. Sleep matters too.</p>
    <p><b>Myths.</b> You cannot burn fat from one spot by training it (6 weeks of daily ab work did not shrink belly fat). Women do not become "bulky" by accident; in studies they gain muscle at much the same rate as men. And genetics are real: people respond differently, so compare yourself only with yourself.</p>
    <p class="tip"><b>Try it:</b> set 4 hard sets a week, then 12, and compare the curves. Then make the sets easy (4 reps in reserve) and watch growth slow.</p>`,
  terms: [
    { t: 'Hypertrophy', d: 'Muscle growth: fibres getting thicker.' },
    { t: 'Hard set', d: 'A set taken close to failure, with about 0–3 reps left in reserve.' },
    { t: 'Reps in reserve', d: 'How many more reps you could have done before failing.' },
    { t: 'Progressive overload', d: 'Slowly adding weight, reps or sets as you get stronger.' },
    { t: 'Muscle protein synthesis', d: 'Building new muscle protein, raised for about a day after training.' },
    { t: 'Spot reduction', d: 'The myth that training one area burns the fat over it.' },
  ],
  defaults: { sets: 10, rir: 2, w: 12, play: true, bal: 'even', labels: true },
  onChange(s, key) { if (key === 'w') s.play = false; },
  controls: [
    { key: 'sets', type: 'range', label: 'Hard sets for the shoulders each week', min: 0, max: 24, step: 1, ends: ['0', '24'], fmt: (v) => v + ' sets' },
    { key: 'rir', type: 'range', label: 'Reps left in reserve', min: 0, max: 5, step: 1, ends: ['to failure', 'easy'], fmt: (v) => v + (v === 1 ? ' rep' : ' reps') },
    { key: 'w', type: 'range', label: 'Weeks of training', min: 0, max: 24, step: 0.5, fmt: (v) => Math.round(v) + ' weeks' },
    { key: 'play', type: 'toggle', label: 'Play the weeks' },
    { key: 'bal', type: 'seg', label: 'Your weekly mix', options: Object.entries(BAL).map(([v, b]) => ({ v, label: b.label })), fmt: (v) => BAL[v].note },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'In the first few weeks of training, why does strength rise faster than muscle size?', options: ['Muscles shrink at first', 'The nervous system learns to recruit and coordinate the muscle', 'Bones get longer', 'It is all water'], answer: 1, why: 'Early gains are mostly neural. Visible size follows over weeks to months.' },
    { q: 'What does ICMR-NIN say about protein powders for building muscle?', options: ['Everyone needs them', 'Avoid them; a balanced diet meets protein needs', 'Take 5 g/kg a day', 'Only before bed'], answer: 1, why: 'Its 2024 guidelines advise against protein supplements for body mass and say a proper diet covers about 0.8 g/kg a day.' },
    { q: 'Why add face pulls or rows if you already press a lot?', options: ['They train the same front deltoid', 'They train the rear deltoid and cuff that pressing neglects', 'They burn shoulder fat', 'They are easier'], answer: 1, why: 'Pressing loads the front. Pulling and external rotation keep the rear deltoid and the cuff strong too.' },
  ],
  reel: [
    { ms: 5000, caption: 'Strength comes first as your nerves learn; muscle size follows over weeks and months.', set: { sets: 12, rir: 1, w: 0, play: false, bal: 'even', labels: false }, anim: { w: [0, 24] }, view: { pos: [6.0, 15.5, 15], target: [1.2, 14.0, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const sh = makeShoulder(stage); root.add(sh.root);
    sh.root.rotation.y = 0.55;                       // turn so front and rear deltoid both show
    const st = { sets: 10, rir: 2, w: 12 };
    const chart = canvasTexture(900, 640, (g, w, h) => drawGrowth(g, w, h, st));
    const cb = board(chart, 7.0, 7.0 * 640 / 900);  root.add(cb);
    const lblF = tint(stage.label('', [0, 0, 0], root), 'red'), lblR = tint(stage.label('', [0, 0, 0], root), 'red');
    let w = 12, t = 0, key = '', acc = 0, now = growth(12, 10, 2);
    const fit = fitNarrow(stage, { pos: [5.0, 15.0, 21], target: [2.6, 13.4, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        if (s.play) { w = (w + dt * 3) % 26; s.w = Math.min(24, Math.round(w * 2) / 2); } else w += (s.w - w) * Math.min(1, dt * 6);
        const ww = Math.min(24, w);
        now = growth(ww, s.sets, s.rir);
        // slow lateral raises keep the model alive; deltoid girth grows with the model (×3 so it shows)
        const p = 0.5 - 0.5 * Math.cos(t * 2 * Math.PI / 3.2);
        sh.pose({ elev: lerp(10, 85, p), plane: 25, elbow: 12 });
        const b = BAL[s.bal];
        sh.list.forEach((e) => { if (e.grp === 'delt') e.scale = 1 + 3 * (now.size / 100) * (e.k === 'deltP' ? b.rear : e.k === 'deltA' ? b.front : (b.front + b.rear) / 2); });
        sh.setActs({ deltM: 0.3 + 0.6 * p, deltA: 0.2 + 0.4 * p, supra: 0.5, trapU: 0.2 + 0.3 * p });
        sh.highlight((e) => e.grp !== 'scap');
        sh.update();
        st.sets = s.sets; st.rir = s.rir; st.w = ww;
        const k2 = `${s.sets}|${s.rir}|${ww.toFixed(1)}`;
        acc += dt; if (k2 !== key && acc > 0.05) { key = k2; acc = 0; chart.redraw(); }
        hud(stage, cb, { aspect: cb.geometry.parameters.height / cb.geometry.parameters.width });
        const narrow = fit(), on = s.labels && !inReel() && !narrow;
        sh.placeLabels(on, ['deltA', 'deltP', 'supra']);
        lblF.visible = lblR.visible = false;
      },
      readout: (s) => {
        const neuralShare = now.strength > 0.1 ? Math.round(100 * now.neural / now.strength) : 0;
        return `<div class="big">Week ${Math.round(Math.min(24, w))}: +${now.size.toFixed(1)}% size</div>
          <div class="row"><span>Strength</span><b>+${now.strength.toFixed(0)}% (about ${neuralShare}% of it from the nervous system)</b></div>
          <div class="row"><span>Hard sets counted</span><b>${now.eff.toFixed(0)} a week${s.sets * effortK(s.rir) > 20 ? ' (no extra benefit modelled past 20)' : ''}</b></div>
          <div class="row"><span>Evidence</span><b>about +0.37% per weekly set (Schoenfeld 2017)</b></div>
          <div class="row"><span>Your mix</span><b>${BAL[s.bal].note}</b></div>
          <small>Illustrative model shared by the series, not a prediction. Deltoid growth is drawn three times larger so you can see it.</small>`;
      },
    });
  },
};
