/* ============================================================
   KÍGYÓ — egyél meg N almát. Szintenként gyorsabb, több alma, később falak és akadályok.
   1–20: a pálya széle átjárható (átbújsz a túloldalra), 21-től fal.
   ============================================================ */
const Kigyo = {
  M: 15,
  cfg(n){
    const r = rnd(1000 + n), M = this.M;
    const akad = [];
    const db = n <= 10 ? 0 : Math.min(28, Math.floor((n - 10) / 3) * 2);
    const tilos = (x, y) => y === 7 && x >= 2 && x <= 9;   // a kezdő sor maradjon szabad
    let probal = 0;
    while (akad.length < db && probal++ < 500) {
      const x = 1 + Math.floor(r() * (M - 2)), y = 1 + Math.floor(r() * (M - 2));
      if (!tilos(x, y) && !akad.some(a => a[0] === x && a[1] === y)) akad.push([x, y]);
    }
    return {
      seb: Math.max(85, Math.round(260 - n * 1.75)),     // ms / lépés
      cel: Math.min(30, 5 + Math.floor(n / 4)),          // almák száma
      fal: n > 20, akad
    };
  },
  // egy lépés tiszta logikája (tesztelhető): visszaad {k, ujAlma, vege}
  lep(k, irany, cfg, alma, M = this.M) {
    const fej = k[0];
    let x = fej[0] + irany[0], y = fej[1] + irany[1];
    if (cfg.fal) { if (x < 0 || y < 0 || x >= M || y >= M) return { vege: true }; }
    else { x = (x + M) % M; y = (y + M) % M; }
    const eszik = alma && x === alma[0] && y === alma[1];
    const test = eszik ? k : k.slice(0, -1);
    if (test.some(s => s[0] === x && s[1] === y)) return { vege: true };
    if (cfg.akad.some(a => a[0] === x && a[1] === y)) return { vege: true };
    return { k: [[x, y], ...test], eszik };
  },
  ujAlma(k, cfg, r, M = this.M) {
    for (let i = 0; i < 2000; i++) {
      const x = Math.floor(r() * M), y = Math.floor(r() * M);
      if (!k.some(s => s[0] === x && s[1] === y) && !cfg.akad.some(a => a[0] === x && a[1] === y)) return [x, y];
    }
    return null;
  }
};

JATEKOK.push({
  id: 'kigyo', nev: 'Kígyó', szin: '#34c759', szinD: '#1f9a40',
  leiras: 'Egyél almát, de a saját farkadba ne harapj!',
  ikon: '🐍',
  cel: n => { const c = Kigyo.cfg(n); return `${c.cel} alma${c.fal ? ' · fal' : ''}${c.akad.length ? ' · akadályok' : ''}`; },
  duma: { start: ['Húzd az ujjad arra, amerre menni akarsz!', 'Almát eszünk. Kígyó-módra. Sok almát.', 'Vigyázz a farkadra, harapós!'],
          nyer: ['Tele a pocak! Szép munka!', 'Ez a kígyó most egy hétig nem eszik.', 'Sssszuper voltál!'],
          veszt: ['Au! Ez fájt neki.', 'Hoppá, kanyarodni is kell néha!', 'Még egyszer, most menni fog!'] },
  indit(ctx, n) {
    const K = Kigyo, M = K.M, cfg = K.cfg(n), r = rnd(Date.now());
    const meret = Math.floor(Math.min(ctx.szelesseg, 520, ctx.helyMagas(150)) / M) * M, c = meret / M;
    const { cv, x } = ctx.vaszon(meret, meret);
    let k = [[5, 7], [4, 7], [3, 7]], ir = [1, 0], kovIr = [1, 0], alma = K.ujAlma(k, cfg, r), evett = 0, fut = true, ido = 0, elozo = 0;
    ctx.info(`Alma: 0 / ${cfg.cel}`);

    function rajz() {
      x.fillStyle = '#eafbe0'; x.fillRect(0, 0, meret, meret);
      x.fillStyle = '#d7f3c6';
      for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) if ((i + j) % 2) x.fillRect(i * c, j * c, c, c);
      if (cfg.fal) { x.strokeStyle = INK; x.lineWidth = 6; x.strokeRect(3, 3, meret - 6, meret - 6); }
      for (const a of cfg.akad) blokk(a[0], a[1], '#9aa0a8', '#6b6c78');
      if (alma) {
        const ax = alma[0] * c + c / 2, ay = alma[1] * c + c / 2;
        x.fillStyle = '#ff4d4d'; x.strokeStyle = INK; x.lineWidth = 2.5;
        x.beginPath(); x.arc(ax, ay + 1, c * .38, 0, 7); x.fill(); x.stroke();
        x.strokeStyle = '#1f9a40'; x.lineWidth = 3; x.beginPath(); x.moveTo(ax, ay - c * .3); x.lineTo(ax + c * .15, ay - c * .48); x.stroke();
      }
      k.forEach((s, i) => blokk(s[0], s[1], i === 0 ? '#2f9bff' : (i % 2 ? '#34c759' : '#2fb84f'), i === 0 ? '#1a6fd1' : '#1f9a40'));
      // szemek a fejen, a haladási irányba nézve
      const f = k[0], fx = f[0] * c + c / 2, fy = f[1] * c + c / 2, ox = ir[0] * c * .16, oy = ir[1] * c * .16;
      for (const s of [-1, 1]) {
        const px = fx + ox + (ir[1] ? s * c * .18 : 0), py = fy + oy + (ir[0] ? s * c * .18 : 0);
        x.fillStyle = '#fff'; x.beginPath(); x.arc(px, py, c * .13, 0, 7); x.fill();
        x.fillStyle = INK; x.beginPath(); x.arc(px + ir[0] * 2, py + ir[1] * 2, c * .06, 0, 7); x.fill();
      }
    }
    function blokk(i, j, szin, szinD) {
      const p = 2, X = i * c + p, Y = j * c + p, W = c - 2 * p;
      x.fillStyle = szinD; x.beginPath(); x.roundRect(X, Y + 2, W, W, 6); x.fill();
      x.fillStyle = szin; x.strokeStyle = INK; x.lineWidth = 2; x.beginPath(); x.roundRect(X, Y, W, W - 2, 6); x.fill(); x.stroke();
    }
    function irany(d) {
      const t = { fel: [0, -1], le: [0, 1], bal: [-1, 0], jobb: [1, 0] }[d];
      if (t && !(t[0] === -ir[0] && t[1] === -ir[1])) kovIr = t;
    }
    function ciklus(t) {
      if (!fut) return;
      if (!elozo) elozo = t;
      ido += t - elozo; elozo = t;
      if (ido >= cfg.seb) {
        ido = 0; ir = kovIr;
        const e = K.lep(k, ir, cfg, alma);
        if (e.vege) { fut = false; Hang.rossz(); rajz(); return ctx.vesztett(); }
        k = e.k;
        if (e.eszik) {
          evett++; Hang.tesz(); ctx.info(`Alma: ${evett} / ${cfg.cel}`);
          if (evett >= cfg.cel) { fut = false; rajz(); return ctx.nyert(ctx.probalkozas() <= 1 ? 3 : ctx.probalkozas() <= 3 ? 2 : 1); }
          alma = K.ujAlma(k, cfg, r);
        }
      }
      rajz(); requestAnimationFrame(ciklus);
    }
    ctx.huzas(cv, irany);
    ctx.iranyGombok(irany);
    ctx.billentyu(e => { const m = { ArrowUp: 'fel', ArrowDown: 'le', ArrowLeft: 'bal', ArrowRight: 'jobb' }[e.key]; if (m) { e.preventDefault(); irany(m); } });
    rajz(); requestAnimationFrame(ciklus);
    return { stop() { fut = false; } };
  }
});
