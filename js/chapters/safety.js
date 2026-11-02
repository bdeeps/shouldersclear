// Chapter 5: keeping shoulders safe. The rig shows common problems; nothing here is a diagnosis.
// Sources (all official or clinical):
//  - NHS "Shoulder pain" (reviewed 2023): causes include tendonitis, bursitis and impingement (pain
//    worse when using the arm) and torn tendons; stay active and move the shoulder gently; shoulder
//    exercises for 6 to 8 weeks; see a GP if pain gets worse or does not improve after 2 weeks; get
//    urgent advice if you cannot move the arm, it has changed shape, or pain followed a fall; it can
//    take 6 months or longer to recover.
//  - AAOS OrthoInfo "Rotator cuff tears": a common cause of shoulder pain and disability in adults;
//    most tears are degenerative (wear over time), some acute (a fall on an outstretched arm, a heavy
//    jerking lift); people over 40 are at greater risk; most involve the supraspinatus; nonsurgical
//    treatment relieves pain and improves function in about 80–85% of patients.
//  - Impingement: the supraspinatus tendon and bursa run under the acromion; Neer (J Bone Joint Surg
//    Am 54:41, 1972) blamed the front of the acromion. The CSAW trial (Beard et al., Lancet 391:329,
//    2018; 313 patients, 32 UK hospitals) found decompression surgery no better than placebo
//    arthroscopy, and NHS England then listed it as a procedure of limited value; exercise is first.
//  - NHS "Dislocated shoulder" (reviewed 2026): go to A&E; do not try to put it back; sling;
//    usually 6 to 12 weeks to recover.
//  - NHS "Frozen shoulder" (reviewed 2024): pain, often worse at night, and stiffness; more likely
//    with diabetes; can take months or years to get better; see a GP. Typical onset 40–60 and about
//    2–5% of people (from encyclopaedia summaries; stated loosely in the text).
//  - Who should get advice first: WHO 2020 and NHS strength guidance; ACSM pre-participation advice
//    (heart disease, high blood pressure, pregnancy, recent injury or surgery).
//  - Anabolic steroids (NHS "Anabolic steroid misuse", reviewed 2026): heart attack and stroke,
//    liver and kidney failure, high blood pressure, blood clots, infertility, aggression and
//    paranoia, stunted growth in teenagers, infections from shared needles; they are addictive.
//    They are prohibited in sport under the WADA Code (class S1), enforced in India by NADA.
//  - Supplements: ICMR-NIN (2024) advises against protein powders for body mass; FSSAI regulates
//    health supplements as foods, which are not medicines.
import { THREE, clamp, lerp, smooth } from '../kit.js';
import { makeShoulder, tint, fitNarrow, compactReadout, inReel } from '../shoulder.js';

const COND = {
  impinge: { label: 'Impingement', title: 'Pinching under the roof', rows: [['What', 'cuff tendon and bursa squeezed under the acromion'], ['Feels like', 'pain lifting the arm, often mid-range'], ['First step', 'rest from the painful move, gentle exercise'], ['Surgery?', 'decompression did no better than placebo (CSAW, 2018)']], small: 'See a GP if it gets worse or is not better after 2 weeks (NHS). Most improve with exercise.' },
  tear: { label: 'Cuff tear', title: 'A torn rotator cuff tendon', rows: [['Most often', 'the supraspinatus'], ['Usually', 'wear over time; sometimes a fall or a jerking lift'], ['Risk', 'higher over 40 (AAOS)'], ['Treatment', '80–85% improve without surgery (AAOS)']], small: 'Weakness lifting the arm, night pain or a sudden pop: see a doctor.' },
  disloc: { label: 'Dislocation', title: 'A dislocated shoulder', rows: [['What', 'the ball comes out of its socket'], ['Do', 'go to A&E; support the arm; ice'], ['Never', 'try to put it back yourself'], ['Recovery', 'usually 6–12 weeks (NHS)']], small: 'The shallow socket that gives the shoulder its range also lets it slip out.' },
  frozen: { label: 'Frozen shoulder', title: 'Frozen shoulder: see a doctor', rows: [['What', 'the joint capsule tightens and thickens'], ['Feels like', 'pain, worse at night, and stiffness'], ['More likely', 'with diabetes; usually ages 40–60'], ['Course', 'months or years; a GP can help (NHS)']], small: 'Do not try to force it with heavy training. Get it checked.' },
  warm: { label: 'Train safely', title: 'Warm up, stay pain-free', rows: [['Warm up', '5–10 min easy movement, light sets'], ['Range', 'work in your pain-free range'], ['Progress', 'add weight slowly; no ego-lifting'], ['Stop', 'on sharp pain, clicking with pain, or numbness']], small: 'Heart disease, high blood pressure, pregnancy, or recent injury or surgery: get medical advice first.' },
};

export default {
  id: 'safety',
  short: 'Keeping it safe',
  title: 'Keeping your shoulders safe',
  subtitle: 'Pinches, tears, dislocations and frozen shoulders, and how to train without pain.',
  view: { pos: [6.8, 16.2, 11.5], target: [1.5, 14.0, 0] },
  learn: `<p>The shoulder's freedom has a price. The cuff tendons run through a narrow gap under the <b>acromion</b>, and the ball sits on a shallow socket. Most shoulder pain is not serious and gets better with time and the right exercise, but some signs need a doctor.</p>
    <p><b>Impingement</b> means the cuff tendon and the cushioning <b>bursa</b> get squeezed under the acromion, so lifting the arm hurts. Rest from the painful move and gentle, progressive exercise usually help. A big UK trial in 2018 (CSAW) found that surgery to shave the acromion did no better than a placebo operation.</p>
    <p><b>Rotator cuff tears</b> are most often in the supraspinatus. Most come from wear over time, which is why they are more common <b>over 40</b>; some come from a fall or a heavy, jerking lift. The American Academy of Orthopaedic Surgeons says <b>80–85%</b> of people improve without surgery. A <b>dislocated shoulder</b> needs <b>A&E</b>: never try to put it back yourself. A <b>frozen shoulder</b>, painful and stiff for months, is more common in middle age and with diabetes. If you think you have one, <b>see a doctor</b> rather than training through it.</p>
    <p><b>Train safely.</b> Warm up with 5–10 minutes of easy movement and light sets. Work in your <b>pain-free range</b>. Add weight slowly and balance pushing with pulling. Stop on sharp pain. See a GP if shoulder pain gets worse or has not improved after 2 weeks (NHS). If you have <b>heart disease</b>, <b>high blood pressure</b>, are <b>pregnant</b>, or have had a recent <b>injury or surgery</b>, take medical advice before starting. Older adults, people with disabilities and beginners can all train; a physiotherapist can adapt the moves.</p>
    <p><b>Steroids and supplements, plainly.</b> Anabolic steroids are <b>harmful and banned</b> in sport (WADA, enforced in India by NADA). The NHS lists heart attack and stroke, liver and kidney damage, high blood pressure, infertility, aggression and stunted growth in teenagers, and they are addictive. Protein powders are not needed: ICMR-NIN advises against them for building muscle, and FSSAI treats supplements as foods, not medicines.</p>
    <p class="tip"><b>Try it:</b> pick each problem and raise the arm. Then pick "Train safely" and set your pain-free range.</p>`,
  terms: [
    { t: 'Impingement', d: 'The cuff tendon and bursa being squeezed under the acromion when the arm lifts.' },
    { t: 'Bursa', d: 'A small fluid-filled cushion that lets tendons slide over bone.' },
    { t: 'Dislocation', d: 'The ball coming fully out of its socket.' },
    { t: 'Frozen shoulder', d: 'A painful, stiff shoulder where the joint capsule tightens; needs a doctor’s advice.' },
    { t: 'Pain-free range', d: 'How far you can move a joint without pain: the range to train in.' },
    { t: 'Anabolic steroids', d: 'Drugs that copy testosterone; harmful, addictive and banned in sport.' },
  ],
  defaults: { cond: 'impinge', elev: 90, range: 150, labels: true },
  controls: [
    { key: 'cond', type: 'seg', label: 'Problem', options: Object.entries(COND).map(([v, c]) => ({ v, label: c.label })) },
    { key: 'elev', type: 'range', label: 'Raise the arm', min: 0, max: 180, step: 1, ends: ['by your side', 'overhead'], fmt: (v) => Math.round(v) + '°' },
    { key: 'range', type: 'range', label: 'Your pain-free range (Train safely)', min: 30, max: 180, step: 5, fmt: (v) => 'up to ' + v + '°' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Your shoulder has popped out of place after a fall. What should you do?', options: ['Push it back in yourself', 'Go to A&E and support the arm', 'Do some lateral raises', 'Ignore it'], answer: 1, why: 'The NHS says a dislocated shoulder needs hospital treatment. Never try to put it back yourself.' },
    { q: 'What did the CSAW trial find about shaving the acromion for impingement pain?', options: ['It cured everyone', 'It did no better than a placebo operation', 'It made pain worse', 'It was never tested'], answer: 1, why: 'Decompression surgery was no better than arthroscopy alone, so exercise and time come first.' },
    { q: 'What are anabolic steroids?', options: ['A safe supplement', 'Harmful, addictive drugs banned in sport', 'A type of protein', 'A warm-up'], answer: 1, why: 'The NHS lists heart, liver, kidney, fertility and mood harms; WADA bans them and NADA enforces that in India.' },
  ],
  reel: [
    { ms: 5000, caption: 'Most shoulder pain settles with time and exercise, but a dislocation always needs a hospital.', set: { cond: 'disloc', elev: 30, labels: false }, anim: { elev: [10, 45] }, view: { pos: [7.0, 15.5, 12], target: [3.0, 14.0, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const sh = makeShoulder(stage); root.add(sh.root);
    sh.foreG.visible = true;
    const red = new THREE.MeshBasicMaterial({ color: 0xff4d5e, transparent: true, opacity: 0.6, depthWrite: false });
    const hot = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 14), red); sh.root.add(hot);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide });
    const capsuleShell = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 16), capMat); sh.root.add(capsuleShell);
    // pain-free range: a green arc, red beyond, round the shoulder in the side plane
    const arcG = new THREE.Group(); sh.root.add(arcG);
    const arcOk = new THREE.Mesh(new THREE.TorusGeometry(7.2, 0.09, 8, 90, Math.PI), new THREE.MeshBasicMaterial({ color: 0x6ee7a8 }));
    const arcNo = new THREE.Mesh(new THREE.TorusGeometry(7.2, 0.09, 8, 90, Math.PI), new THREE.MeshBasicMaterial({ color: 0xff6b6b }));
    arcG.add(arcOk, arcNo);
    const L = (h, c) => tint(stage.label(h, [0, 0, 0], sh.root), c);
    const lbl = { main: L('', 'red'), stop: L('', 'gold') };
    let elev = 90, t = 0;
    const fit = fitNarrow(stage, { pos: [6.0, 16.0, 20], target: [3.0, 14.0, 0] });
    const ACROM_HOME = sh.acrom.material.emissive.getHex();
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const frozen = s.cond === 'frozen';
        const limit = frozen ? 85 : 180;
        const want = Math.min(s.elev, limit);
        elev += (want - elev) * Math.min(1, dt * 5);
        // a frozen shoulder: the ball barely turns, the blade does most of what little moves
        sh.pose({ elev, plane: 20, rot: elev > 80 && !frozen ? (elev - 80) * 0.5 : 0, elbow: 10, scapOverride: frozen ? elev * 0.55 : undefined });
        const gh0 = sh.ghPos();
        if (s.cond === 'disloc') { const k = smooth(clamp(t * 0.8, 0, 1)); sh.humG.position.z += 1.05 * k; sh.humG.position.y -= 0.55 * k; sh.humG.position.x -= 0.2 * k; } else t = Math.min(t, 0);
        sh.setActs({ deltM: 0.4, deltA: 0.3, supra: 0.4, infra: 0.3 });
        sh.highlight(s.cond === 'tear' || s.cond === 'impinge' ? (e) => e.grp === 'cuff' : null);
        sh.setLayer(s.cond === 'tear' || s.cond === 'impinge' || s.cond === 'disloc' ? 2 : 1);
        sh.update();
        const sup = sh.list.find((e) => e.k === 'supra');
        if (s.cond === 'tear') { sup.t2.visible = false; sup.mat.color.setHex(0xff6b6b); }
        const gh = sh.ghPos();
        // the pinch point: just under the acromion, worst through a middle arc of the raise
        const pinch = s.cond === 'impinge' ? smooth((elev - 50) / 25) * (1 - smooth((elev - 120) / 25)) : 0;
        const up = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), sh.st.scap * Math.PI / 180);
        hot.position.copy(gh0).addScaledVector(up, 0.62).add(new THREE.Vector3(0.15, 0, 0));
        hot.visible = s.cond === 'impinge' || s.cond === 'tear';
        red.opacity = s.cond === 'tear' ? 0.45 : 0.15 + 0.6 * pinch;
        hot.scale.setScalar(s.cond === 'tear' ? 0.8 : 0.7 + 0.5 * pinch);
        sh.acrom.material.emissive.setHex(pinch > 0.3 ? 0x661018 : ACROM_HOME);
        capsuleShell.visible = frozen; capsuleShell.position.copy(gh); capMat.opacity = 0.3 + 0.1 * Math.sin(t * 3);
        // arc
        arcG.visible = s.cond === 'warm';
        arcG.position.copy(gh0); arcG.rotation.set(0, 0, -Math.PI / 2);
        const okA = clamp(s.range, 1, 180) * Math.PI / 180;
        arcOk.geometry.dispose(); arcOk.geometry = new THREE.TorusGeometry(7.2, 0.09, 8, 90, okA);
        arcNo.geometry.dispose(); arcNo.geometry = new THREE.TorusGeometry(7.2, 0.09, 8, 90, Math.max(0.001, Math.PI - okA)); arcNo.rotation.z = okA;
        const over = s.cond === 'warm' && elev > s.range;
        const narrow = fit(), on = s.labels && !inReel() && !narrow;
        sh.placeLabels(on && (s.cond === 'tear' || s.cond === 'impinge'), ['supra', 'acrom']);
        const msg = { impinge: pinch > 0.3 ? 'Painful arc: tendon squeezed' : 'Tendon slides freely', tear: 'Torn supraspinatus tendon', disloc: 'Ball out of the socket', frozen: 'Tight capsule: little movement', warm: over ? 'Past your pain-free range' : 'Inside your pain-free range' }[s.cond];
        lbl.main.element.textContent = msg; lbl.main.visible = on || inReel();
        lbl.main.position.copy(gh0).add(new THREE.Vector3(1.8, 2.2, 1.0));
        tint(lbl.main, s.cond === 'warm' && !over ? 'good' : 'red');
        lbl.stop.visible = false;
      },
      readout: (s) => {
        const c = COND[s.cond];
        return `<div class="big">${c.title}</div>
          ${c.rows.map(([a, b]) => `<div class="row"><span>${a}</span><b>${b}</b></div>`).join('')}
          <small>${c.small} Not medical advice.</small>`;
      },
    });
  },
};
