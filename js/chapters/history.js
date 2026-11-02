// Chapter 6: shoulder training through history, from the akhara to the physiotherapy clinic. Five
// plinths: the gada, the jodi (mudgar), the mallakhamb pole, the light "Indian clubs" of Victorian
// Britain, and the elastic band and light dumbbell of modern rehabilitation. The full timeline,
// with sources, is in history.json.
// Sources: Wikipedia "Gada (mace)" (Hanuman's weapon, worshipped by wrestlers; gada and mudgar
// swung in north Indian akharas for grip and shoulder endurance; the Great Gama's gada use);
// Wikipedia "Indian club" (mudgar in the Arthashastra, attributed to the 4th century BCE; Manasollasa,
// 12th century; traditional clubs up to about 35 kg, the British army's about 2 kg; Olympic events
// in 1904 and 1932); B. N. Goswamy, "When Indian mugdars were a sensation in US and UK", The Tribune,
// 2021 (clubs reached England in the second quarter of the 19th century; Donald Walker's British
// Manly Exercises, 1834, believed the earliest book on club swinging; British army use from about
// 1850, "one reads"; Sim Kehoe's The Indian Club Exercise, New York, 1866); Wikipedia "Mallakhamba"
// (Manasollasa, 1135 CE; Balambhatta Dada Deodhar, teacher of Peshwa Baji Rao II; Berlin 1936
// demonstration; Madhya Pradesh state sport on 9 April 2013; first World Championship, Mumbai,
// 2019); Codman, The Shoulder (1934); Inman, Saunders & Abbott 1944; Neer 1972; CSAW (Lancet 2018).
import { THREE, clamp, lerp, smooth } from '../kit.js';
import { tint, fitNarrow, compactReadout, inReel, gada, club, dumbbell } from '../shoulder.js';

const ITEMS = {
  gada: { label: 'Gada', title: 'The gada: Hanuman’s mace', x: -8, rows: [['Story', 'the weapon of Hanuman, the wrestlers’ deity'], ['In the akhara', 'swung behind the back and round the head'], ['Trains', 'grip, forearms, the whole shoulder girdle'], ['Famous user', 'the Great Gama, by reports']], small: 'Epics such as the Mahabharata describe mace fighters like Bhima. Dates of the texts are long debated.' },
  jodi: { label: 'Jodi', title: 'Jodi and mudgar: India’s clubs', x: -4, rows: [['Earliest mention', 'the Arthashastra (attributed, 4th century BCE)'], ['Also in', 'the Manasollasa, 12th century'], ['Weight', 'traditional clubs up to about 35 kg'], ['Today', 'still swung in pairs in akharas']], small: 'Persian wrestlers swing similar clubs, called meel; the two traditions are related.' },
  mallakhamb: { label: 'Mallakhamb', title: 'Mallakhamb: the wrestler’s pole', x: 0, rows: [['First described', 'Manasollasa, 1135 CE'], ['Revived', 'by Balambhatta Dada Deodhar, early 1800s (attributed)'], ['Abroad', 'shown at the Berlin Olympics, 1936'], ['Now', 'Madhya Pradesh state sport (2013); world championship 2019']], small: 'Hanging, climbing and twisting on the pole loads the shoulders through their whole range.' },
  clubs: { label: 'Indian clubs', title: 'Indian clubs reach Britain', x: 4, rows: [['How', 'seen in India, taken to England in the 1800s'], ['First book', 'Donald Walker, 1834 (believed the earliest)'], ['Army', 'light clubs of about 2 kg, from about 1850'], ['Olympics', 'club swinging in 1904 and 1932']], small: 'The British renamed mudgars “Indian clubs” and, historians argue, stripped away their meaning.' },
  rehab: { label: 'Rehab', title: 'From surgery to exercise', x: 8, rows: [['1934', 'Codman’s book The Shoulder'], ['1944', 'Inman measures the 2:1 rhythm'], ['1972', 'Neer blames the acromion for impingement'], ['2018', 'CSAW: decompression no better than placebo']], small: 'Today most shoulder pain is treated first with progressive exercise, often with bands and light weights.' },
};

export default {
  id: 'history',
  short: 'From akhara to clinic',
  title: 'Maces, clubs and a 2:1 rhythm',
  subtitle: 'How India swung its way to strong shoulders, and how medicine learned what the joint needs.',
  view: { pos: [0, 10.5, 21], target: [0, 6.2, 0] },
  learn: `<p>Long before gyms, Indian wrestlers built their shoulders in the <b>akhara</b>. The <b>gada</b>, a heavy mace, is the weapon of <b>Hanuman</b>, whom wrestlers worship for his strength. Swung behind the back and round the head, it loads the shoulder in every direction. The Great <b>Gama Pehlwan</b> was known for it.</p>
    <p>The <b>jodi</b> or <b>mudgar</b> is a pair of wooden clubs. A text attributed to the 4th century BCE, the <b>Arthashastra</b>, mentions them, and the 12th-century <b>Manasollasa</b> describes exercises with them, as well as <b>mallakhamb</b>, gymnastics on a wooden pole that is now Madhya Pradesh's state sport.</p>
    <p>In the 19th century British soldiers and officials saw club swinging in India and took it home. A book in 1834 is believed to be the first on it in English, the army adopted much lighter clubs, about 2 kg instead of up to 35 kg, and "Indian clubs" spread to the USA and even the 1904 and 1932 Olympics.</p>
    <p>Medicine caught up slowly. Ernest <b>Codman</b>'s 1934 book <i>The Shoulder</i> and Verne <b>Inman</b>'s 1944 measurements showed how ball and blade share a raise. In 1972 Charles <b>Neer</b> blamed the acromion for impingement, and shaving it became common surgery, until the 2018 <b>CSAW</b> trial found it worked no better than a placebo operation. Today the first treatment is usually what the akhara knew: steady, progressive exercise.</p>
    <p class="tip"><b>Try it:</b> pick each object to see it swing and read its story. The full timeline is in this box's History page.</p>`,
  terms: [
    { t: 'Akhara', d: 'A traditional Indian wrestling school and training ground.' },
    { t: 'Gada', d: 'A mace: a heavy head on a handle, swung for strength.' },
    { t: 'Jodi, mudgar', d: 'Pairs of wooden clubs swung in Indian training; the source of “Indian clubs”.' },
    { t: 'Mallakhamb', d: 'Gymnastics and wrestling drills on a wooden pole or rope.' },
    { t: 'Placebo surgery', d: 'An operation that skips the key step, used to test whether that step really helps.' },
  ],
  defaults: { item: 'gada', labels: true },
  controls: [
    { key: 'item', type: 'seg', label: 'Object', options: Object.entries(ITEMS).map(([v, it]) => ({ v, label: it.label })) },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Whose weapon is the gada, swung in Indian akharas?', options: ['Arjuna’s', 'Hanuman’s', 'Ravana’s', 'Shiva’s'], answer: 1, why: 'Hanuman carries the gada, and wrestlers worship him for his strength.' },
    { q: 'How did “Indian clubs” reach Britain?', options: ['From Persian traders in 1066', 'British soldiers and officials saw them in India in the 1800s and took them home', 'They were invented in London', 'Through the 1904 Olympics'], answer: 1, why: 'Club swinging travelled to England in the 19th century; the army adopted much lighter clubs.' },
    { q: 'What did the 2018 CSAW trial show?', options: ['Shaving the acromion works far better than exercise', 'Decompression surgery did no better than a placebo operation', 'Clubs cause injuries', 'The shoulder rhythm is 3:1'], answer: 1, why: 'Patients improved about as much with arthroscopy alone, so the shaving itself was not what helped.' },
  ],
  reel: [
    { ms: 5000, caption: 'Indian wrestlers built shoulders with the gada and jodi long before gyms.', set: { item: 'gada', labels: false }, view: { pos: [-3.5, 7.5, 12], target: [-5.0, 3.6, 0] }, spin: 0.4 },
    { ms: 4600, caption: 'In the 1800s British soldiers took the clubs home, and Indian clubs went global.', set: { item: 'clubs', labels: false }, view: { pos: [5.0, 7.0, 11.5], target: [3.8, 3.4, 0] }, spin: 0.4 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const plinthM = new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.6, metalness: 0.2 });
    const objs = {};
    const labels = {};
    for (const [k, it] of Object.entries(ITEMS)) {
      const g = new THREE.Group(); g.position.x = it.x; root.add(g);
      const pl = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.6, 32), plinthM); pl.position.y = 0.3; g.add(pl);
      const piv = new THREE.Group(); piv.position.y = 1.2; g.add(piv);
      if (k === 'gada') { const m = gada(5.0, 1.2); m.scale.setScalar(0.9); piv.add(m); }
      if (k === 'jodi') { [-0.7, 0.7].forEach((dx) => { const c = club(5.2, 0.75, 0x7a4a26); c.position.x = dx; piv.add(c); }); }
      if (k === 'mallakhamb') { const pts = [[0, 0.5], [3, 0.42], [6.5, 0.32], [7.2, 0.2], [7.6, 0.3], [7.9, 0.0]]; const lg = new THREE.LatheGeometry(pts.map(([y, r]) => new THREE.Vector2(r, y)), 24); lg.computeVertexNormals(); piv.add(new THREE.Mesh(lg, new THREE.MeshStandardMaterial({ color: 0xa8743e, roughness: 0.6 }))); }
      if (k === 'clubs') { [-0.6, 0.6].forEach((dx, i) => { const c = club(3.0, 0.42, i ? 0x2d4f8a : 0x8a2d3a); c.position.x = dx; piv.add(c); }); }
      if (k === 'rehab') {
        const band = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.1, 10, 40), new THREE.MeshStandardMaterial({ color: 0x46c28a, roughness: 0.5 })); band.position.y = 2.6; band.scale.set(0.8, 1.6, 1); piv.add(band);
        const db = dumbbell(); db.setKg(2); db.position.y = 0.6; db.scale.setScalar(0.8); piv.add(db);
      }
      objs[k] = { g, piv, it };
      labels[k] = tint(stage.label(it.label, [it.x, -0.6, 1.8], root), 'gold');
    }
    const fit = fitNarrow(stage, { pos: [0, 10, 30], target: [0, 4.6, 0] });
    let t = 0;
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        for (const [k, o] of Object.entries(objs)) {
          const on = k === s.item;
          const lift = o.g.userData.lift = lerp(o.g.userData.lift || 0, on ? 1 : 0, Math.min(1, dt * 4));
          o.g.position.y = lift * 0.8;
          o.g.scale.setScalar(1 + 0.12 * lift);
          // the chosen object swings (clubs and mace in arcs; the pole turns; the band stretches)
          const sw = Math.sin(t * 2.2) * lift;
          if (k === 'gada' || k === 'clubs' || k === 'jodi') { o.piv.rotation.z = sw * 0.5; o.piv.rotation.y = t * 0.6 * lift; }
          if (k === 'mallakhamb') o.piv.rotation.y = t * 0.8 * lift;
          if (k === 'rehab') o.piv.children[0].scale.set(0.8, 1.6 + 0.4 * sw, 1);
          labels[k].element.style.opacity = on ? '1' : '0.55';
        }
        const narrow = fit(), on = s.labels && !inReel();
        Object.values(labels).forEach((l) => { l.visible = on && !narrow; });
      },
      readout: (s) => {
        const it = ITEMS[s.item];
        return `<div class="big">${it.title}</div>
          ${it.rows.map(([a, b]) => `<div class="row"><span>${a}</span><b>${b}</b></div>`).join('')}
          <small>${it.small}</small>`;
      },
    });
  },
};
