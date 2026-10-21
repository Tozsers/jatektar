/* ============================================================
   MAJONG (pasziánsz) — vegyél le két egyforma, SZABAD követ. Szabad: nincs rajta kő, és balról VAGY jobbról nincs mellette.
   Mindig megoldható: a teli kupacon szimuláljuk a levételt (mindig két szabad követ véve), és ezek a párok kapják ugyanazt a képet.
   Elakadásnál KEVERÉS (a maradék kövekre újra megoldható kiosztás), SÚGÓ mutat egy párt. Csillag: segítség nélkül 3, 1–2 segítséggel 2, többel 1.
   Koordináták fél-kő egységben: egy kő 2×2 fél-egység, z a réteg.
   ============================================================ */
const Majong = {
  KEPEK: ['🍎', '🍌', '🍇', '🍓', '🍉', '🍒', '🍍', '🥝', '🍑', '🍋', '🥕', '🌽', '🍄', '🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵', '🐔', '🦁', '🐯', '🐮', '🐷', '⚽', '🏀', '🎈', '🎁', '🚗', '🚀', '⭐', '🌈', '🌻', '❄️'],
  // alakzatok: alap téglalap rétegenként kisebbedve; néhány formánál fél-kő eltolás vagy lyuk
  alakzat(n) {
    const r = rnd(9000 + n), t = [];
    const add = (x, y, z) => t.push([x, y, z]);
    const fajta = n <= 6 ? 0 : [0, 1, 2, 3, 4][(n - 7) % 5];
    // fokozatos növekedés: szélesség 3→8, magasság 3→5, rétegek 2→4
    const W = 3 + Math.floor((n - 1) / 18), H = 3 + Math.floor((n - 1) / 40), L = Math.min(4, 2 + Math.floor((n - 1) / 30));
    if (fajta === 0 || fajta === 1) {                               // piramis (1: fél-kővel eltolt felső rétegek)
      for (let z = 0; z < L; z++) { const w = W - z, h = H - z; if (w < 1 || h < 1) break;
        const ox = z + (fajta === 1 && z % 2 ? 1 : 0), oy = z;   // 1: fél-kővel eltolt rétegek
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) add((x * 2) + ox, (y * 2) + oy, z); }
    } else if (fajta === 2) {                                        // híd: két torony és köztük alacsony sor
      for (let y = 0; y < H; y++) for (let x = 0; x < W + 2; x++) add(x * 2, y * 2, 0);
      for (let z = 1; z < L; z++) for (let y = z - 1; y < H - z + 1; y++) { add(0, y * 2 + 1, z); add((W + 1) * 2, y * 2 + 1, z); add(2, y * 2 + 1, z); add(W * 2, y * 2 + 1, z); }
    } else if (fajta === 3) {                                        // kereszt
      const k = Math.floor(W / 2);
      for (let y = 0; y < H + 2; y++) for (let x = 0; x < W + 1; x++) if (x === k || y === Math.floor((H + 1) / 2) || (Math.abs(x - k) <= 1 && Math.abs(y - (H + 1) / 2) <= 1.5)) add(x * 2, y * 2, 0);
      for (let z = 1; z < L; z++) for (let d = -1; d <= 1; d++) add(k * 2, (Math.floor((H + 1) / 2) + d) * 2, z);
    } else {                                                         // gyűrű dupla fallal
      for (let y = 0; y < H + 1; y++) for (let x = 0; x < W + 1; x++) if (x === 0 || y === 0 || x === W || y === H) { add(x * 2, y * 2, 0); if ((x + y) % 2 === 0 && L > 2) add(x * 2, y * 2, 1); }
      for (let y = 1; y < H; y++) for (let x = 1; x < W; x++) if (r() < .5) add(x * 2, y * 2, 0);
    }
    // egyedi pozíciók, páros darabszám
    const kulcs = new Set(), egyedi = t.filter(p => { const k = p.join(','); if (kulcs.has(k)) return false; kulcs.add(k); return true; });
    // ami „lebeg” (nincs alatta kő), azt kivesszük
    const allo = egyedi.filter(p => p[2] === 0 || egyedi.some(q => q[2] === p[2] - 1 && Math.abs(q[0] - p[0]) < 2 && Math.abs(q[1] - p[1]) < 2));
    if (allo.length % 2) allo.sort((a, b) => b[2] - a[2] || b[1] - a[1]).shift();
    return allo;
  },
  // szabad-e az i. kő (aktív: élő kövek indexei)
  szabad(kovek, i, el) {
    const [x, y, z] = kovek[i].p;
    let bal = false, jobb = false;
    for (let j = 0; j < kovek.length; j++) {
      if (j === i || !el[j]) continue; const [a, b, c] = kovek[j].p;
      if (c === z + 1 && Math.abs(a - x) < 2 && Math.abs(b - y) < 2) return false;
      if (c === z && Math.abs(b - y) < 2) { if (a === x - 2) bal = true; if (a === x + 2) jobb = true; }
    }
    return !(bal && jobb);
  },
  // megoldható kiosztás az élő kövekre a megadott képpárokkal (képek tömbje, minden kép párban)
  kioszt(kovek, el, kepParok, r) {
    for (let probal = 0; probal < 300; probal++) {
      const elo = el.slice(), sorrend = [];
      while (true) {
        const sz = []; for (let i = 0; i < kovek.length; i++) if (elo[i] && this.szabad(kovek, i, elo)) sz.push(i);
        if (sz.length < 2) break;
        const a = sz.splice(Math.floor(r() * sz.length), 1)[0], b = sz[Math.floor(r() * sz.length)];
        elo[a] = elo[b] = false; sorrend.push([a, b]);
      }
      if (elo.some(v => v)) continue;
      const parok = [...kepParok].sort(() => r() - .5);
      sorrend.forEach(([a, b], i) => { kovek[a].k = kovek[b].k = parok[i]; });
      return true;
    }
    return false;
  },
  cfg(n) { const kepDb = Math.min(this.KEPEK.length, 6 + Math.floor(n / 4)); return { kepDb }; },
  lehet(kovek, el) {   // van-e levehető pár
    const sz = []; for (let i = 0; i < kovek.length; i++) if (el[i] && this.szabad(kovek, i, el)) sz.push(i);
    for (let a = 0; a < sz.length; a++) for (let b = a + 1; b < sz.length; b++) if (kovek[sz[a]].k === kovek[sz[b]].k) return [sz[a], sz[b]];
    return null;
  }
};

JATEKOK.push({
  id: 'majong', nev: 'Majong', szin: '#ffc82e', szinD: '#f08a00',
  leiras: 'Vegyél le két egyforma szabad követ, amíg el nem fogynak!',
  ikon: '🀄',
  cel: n => `${Majong.alakzat(n).length} kő · ${Majong.cfg(n).kepDb} kép`,
  duma: { start: ['Csak a szabad kő vehető le: amin nincs semmi, és oldalt van helye.', 'Két egyforma, és puff, eltűnnek!', 'Felülről lefelé érdemes bontani!'],
          nyer: ['Eltűnt a kupac! Majongmester!', 'Tiszta asztal! Szép munka!', 'Ezt nagyon ügyesen bontottad!'],
          veszt: ['Semmi baj!', 'Próbáld újra!', 'Majd legközelebb!'] },
  indit(ctx, n) {
    const M = Majong, r = rnd(Date.now()), pos = M.alakzat(n), cfg = M.cfg(n);
    const kovek = pos.map(p => ({ p, k: null })), el = kovek.map(() => true);
    const kepek = M.KEPEK.slice(0, cfg.kepDb), parok = Array.from({ length: kovek.length / 2 }, (_, i) => kepek[i % kepek.length]);
    M.kioszt(kovek, el, parok, r);
    const maxX = Math.max(...pos.map(p => p[0])) + 2, maxY = Math.max(...pos.map(p => p[1])) + 2, maxZ = Math.max(...pos.map(p => p[2]));
    const melyseg = 5, fel = Math.min((ctx.szelesseg - maxZ * melyseg - 8) / maxX, (ctx.helyMagas(80) - maxZ * melyseg - 8) / (maxY * 1.25));
    const kw = fel * 2, kh = fel * 2 * 1.25, W = Math.ceil(maxX * fel + maxZ * melyseg + 8), H = Math.ceil(maxY * fel * 1.25 + maxZ * melyseg + 8);
    const { cv, x } = ctx.vaszon(W, H);
    let kijelolt = -1, segit = 0, vege = false, sugoPar = null;
    const hely = i => { const [a, b, z] = kovek[i].p; return [4 + a * fel + (maxZ - z) * melyseg, 4 + b * fel * 1.25 + (maxZ - z) * melyseg]; };
    const elo = () => el.filter(v => v).length;
    ctx.info(`Kövek: ${elo()}`);
    function rajz() {
      x.clearRect(0, 0, W, H);
      const sorr = kovek.map((_, i) => i).filter(i => el[i]).sort((a, b) => kovek[a].p[2] - kovek[b].p[2] || kovek[a].p[1] - kovek[b].p[1] || kovek[b].p[0] - kovek[a].p[0]);
      for (const i of sorr) {
        const [X, Y] = hely(i), szab = M.szabad(kovek, i, el);
        x.fillStyle = '#d9b77a'; x.strokeStyle = INK; x.lineWidth = 2;
        x.beginPath(); x.roundRect(X + melyseg, Y + melyseg, kw - 2, kh - 2, 7); x.fill(); x.stroke();   // oldallap
        x.fillStyle = i === kijelolt ? '#fff3a0' : (sugoPar && sugoPar.includes(i)) ? '#c9f7d6' : szab ? '#fffaf0' : '#efe6d6';
        x.beginPath(); x.roundRect(X, Y, kw - 2, kh - 2, 7); x.fill(); x.stroke();
        x.font = `${Math.round(kw * .62)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.globalAlpha = szab ? 1 : .55; x.fillText(kovek[i].k, X + kw / 2 - 1, Y + kh / 2); x.globalAlpha = 1;
        if (i === kijelolt) { x.strokeStyle = '#ff5d8f'; x.lineWidth = 4; x.beginPath(); x.roundRect(X, Y, kw - 2, kh - 2, 7); x.stroke(); }
      }
    }
    function talal(px, py) {   // a legfelső kő a pontban
      let leg = -1;
      for (let i = 0; i < kovek.length; i++) { if (!el[i]) continue; const [X, Y] = hely(i);
        if (px >= X && px <= X + kw && py >= Y && py <= Y + kh && (leg < 0 || kovek[i].p[2] > kovek[leg].p[2])) leg = i; }
      return leg;
    }
    function ellenoriz() {
      if (!elo()) { vege = true; return ctx.nyert(segit === 0 ? 3 : segit <= 2 ? 2 : 1); }
      if (!M.lehet(kovek, el)) { ctx.mond('Elakadtunk! Nyomd meg a KEVERÉS gombot, és újrarendezem a köveket.', 'hoppa', 'oops'); }
    }
    ctx.koppint(cv, (px, py) => {
      if (vege) return; const i = talal(px, py); if (i < 0) return;
      if (!M.szabad(kovek, i, el)) { Hang.rossz(); ctx.mond(veletlen(['Ez a kő még be van szorulva!', 'Előbb a szomszédját vagy a tetejét kell levenni.', 'Ez nem szabad, keress másikat!']), 'gondol'); return; }
      if (kijelolt === i) { kijelolt = -1; Hang.vissza(); return rajz(); }
      if (kijelolt >= 0 && kovek[kijelolt].k === kovek[i].k) {
        el[kijelolt] = el[i] = false; kijelolt = -1; sugoPar = null; Hang.jo(); ctx.info(`Kövek: ${elo()}`); rajz(); return ellenoriz();
      }
      kijelolt = i; Hang.tesz(); rajz();
    });
    ctx.gombok([
      ['SÚGÓ', () => { if (vege) return; const p = M.lehet(kovek, el); if (!p) return ctx.mond('Nincs levehető pár, keverjünk!', 'hoppa'); segit++; sugoPar = p; Hang.sugo(); rajz(); }],
      ['KEVERÉS', () => {
        if (vege) return; const maradek = kovek.filter((_, i) => el[i]).map(k => k.k), parAzon = [];
        const db = {}; for (const k of maradek) db[k] = (db[k] || 0) + 1; for (const k in db) for (let t = 0; t < db[k] / 2; t++) parAzon.push(k);
        if (M.kioszt(kovek, el, parAzon, r)) { segit++; kijelolt = -1; sugoPar = null; Hang.sugo(); ctx.mond('Összekevertem! Most már van lépés.', 'vidam'); rajz(); }
      }]
    ]);
    rajz();
    return { stop() { vege = true; } };
  }
});
