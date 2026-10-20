/* ============================================================
   AMŐBA — Karcsi ellen. Te vagy az X, te kezdesz.
   1–15: 3×3, 3 egy sorban · 16–55: 7×7 / 9×9, 4 egy sorban · 56–100: 11×11 → 15×15, 5 egy sorban (igazi amőba).
   Karcsi ereje (ero 0…1) szintenként nő; 0-nál sokat téved, 1-nél a legjobb lépést keresi.
   Győzelem 3 csillag, döntetlen 2 csillag (az is továbbenged), vereség: újra.
   ============================================================ */
const Amoba = {
  cfg(n) {
    if (n <= 15) return { N: 3, W: 3, ero: Math.min(1, (n - 1) / 10) };
    if (n <= 55) return { N: n <= 35 ? 7 : 9, W: 4, ero: Math.min(.97, .35 + (n - 16) / 40 * .6) };
    return { N: n <= 75 ? 11 : n <= 90 ? 13 : 15, W: 5, ero: Math.min(.98, .45 + (n - 56) / 44 * .53) };
  },
  ures(N) { return Array.from({ length: N }, () => Array(N).fill(0)); },
  DIR: [[1, 0], [0, 1], [1, 1], [1, -1]],
  // nyerő sor az (i,j) lépés után? visszaadja a cellákat vagy null
  nyer(t, i, j, W) {
    const N = t.length, p = t[j][i];
    for (const [dx, dy] of this.DIR) {
      const sor = [[i, j]];
      for (const s of [1, -1]) { let x = i + dx * s, y = j + dy * s; while (x >= 0 && y >= 0 && x < N && y < N && t[y][x] === p) { sor.push([x, y]); x += dx * s; y += dy * s; } }
      if (sor.length >= W) return sor;
    }
    return null;
  },
  tele(t) { return t.every(s => s.every(v => v)); },
  // egy cella értéke p játékosnak: milyen sort építene ide lépve
  ertek(t, i, j, p, W) {
    const N = t.length; let ossz = 0;
    for (const [dx, dy] of this.DIR) {
      let hossz = 1, nyitott = 0;
      for (const s of [1, -1]) {
        let x = i + dx * s, y = j + dy * s;
        while (x >= 0 && y >= 0 && x < N && y < N && t[y][x] === p) { hossz++; x += dx * s; y += dy * s; }
        if (x >= 0 && y >= 0 && x < N && y < N && t[y][x] === 0) nyitott++;
      }
      if (hossz >= W) ossz += 1e7;
      else if (hossz === W - 1) ossz += nyitott === 2 ? 2e5 : nyitott ? 6e3 : 0;
      else if (hossz === W - 2) ossz += nyitott === 2 ? 4e3 : nyitott ? 300 : 0;
      else if (hossz === W - 3) ossz += nyitott === 2 ? 150 : nyitott ? 20 : 0;
      else ossz += nyitott;
    }
    return ossz;
  },
  jeloltek(t) {
    const N = t.length, j = []; let van = false;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (t[y][x]) { van = true; break; }
    if (!van) return [[N >> 1, N >> 1]];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (t[y][x]) continue;
      let kozel = false;
      for (let dy = -2; dy <= 2 && !kozel; dy++) for (let dx = -2; dx <= 2; dx++) { const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < N && b < N && t[b][a]) { kozel = true; break; } }
      if (kozel) j.push([x, y]);
    }
    return j;
  },
  // 3×3-ra tökéletes minimax
  minimax(t, p, W) {
    let legjobb = null, lv = -Infinity;
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) if (!t[y][x]) {
      t[y][x] = p; const v = -this.mmErtek(t, 3 - p, W, x, y, p); t[y][x] = 0;
      if (v > lv) { lv = v; legjobb = [x, y]; }
    }
    return legjobb;
  },
  mmErtek(t, p, W, lx, ly, utolso) {
    if (this.nyer(t, lx, ly, W)) return utolso === p ? 10 : -10;
    if (this.tele(t)) return 0;
    let lv = -Infinity;
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) if (!t[y][x]) {
      t[y][x] = p; const v = -this.mmErtek(t, 3 - p, W, x, y, p) * .9; t[y][x] = 0; if (v > lv) lv = v;
    }
    return lv;
  },
  // Karcsi lépése (O = 2); r: véletlen-forrás
  lepes(t, cfg, r) {
    const { W, ero } = cfg, jel = this.jeloltek(t);
    if (t.length === 3) {
      if (r() < ero) return this.minimax(t, 2, W);
      // gyenge szinten: ha nyerhet, néha észreveszi; különben véletlen
      for (const [x, y] of jel) { t[y][x] = 2; const ny = this.nyer(t, x, y, W); t[y][x] = 0; if (ny && r() < .5) return [x, y]; }
      return jel[Math.floor(r() * jel.length)];
    }
    const pont = jel.map(([x, y]) => ({ x, y, v: this.ertek(t, x, y, 2, W) * 1.15 + this.ertek(t, x, y, 1, W) }));
    pont.sort((a, b) => b.v - a.v);
    if (pont[0].v >= 1e7) return [pont[0].x, pont[0].y];                    // azonnali győzelem / kényszer-védés
    if (pont[0].v >= 2e5 && r() < .55 + ero * .45) return [pont[0].x, pont[0].y];
    if (r() < ero) return [pont[0].x, pont[0].y];
    const k = pont.slice(0, Math.max(2, Math.round(8 - ero * 6)));
    const v = k[Math.floor(r() * k.length)]; return [v.x, v.y];
  }
};

JATEKOK.push({
  id: 'amoba', nev: 'Amőba', szin: '#ff5d8f', szinD: '#d63a6c',
  leiras: 'Rakj ki egy sort Karcsi előtt! Ő is okosodik ám.',
  ikon: '⭕',
  cel: n => { const c = Amoba.cfg(n); return `${c.N}×${c.N} · ${c.W} egy sorban`; },
  duma: { start: ['Te vagy az X, kezdj! Én a karikákat szeretem.', 'Na, ki rak ki előbb egy sort?', 'Koppints egy mezőre!'],
          nyer: ['Megvertél! Ezt nem mondom el senkinek.', 'Hű, ezt nem láttam jönni!', 'Bajnok! Kérek visszavágót!'],
          veszt: ['Hehe, most én nyertem! De nagyon szoros volt.', 'Figyeld a karikáimat, mindig készülök valamire!', 'Visszavágó? Visszavágó!'] },
  indit(ctx, n) {
    const A = Amoba, cfg = A.cfg(n), N = cfg.N, r = rnd(Date.now());
    const meret = Math.floor(Math.min(ctx.szelesseg, 520) / N) * N, c = meret / N;
    const { cv, x } = ctx.vaszon(meret, meret);
    const t = A.ures(N); let soros = 1, vege = false, gyoztesSor = null, utolso = null, lepesek = 0;
    ctx.info(`${cfg.W} egy sorban · Te: X`);

    function rajz() {
      x.fillStyle = '#fff'; x.fillRect(0, 0, meret, meret);
      x.strokeStyle = '#cfd8f0'; x.lineWidth = 1.5;
      for (let i = 1; i < N; i++) { x.beginPath(); x.moveTo(i * c, 0); x.lineTo(i * c, meret); x.stroke(); x.beginPath(); x.moveTo(0, i * c); x.lineTo(meret, i * c); x.stroke(); }
      x.strokeStyle = INK; x.lineWidth = 4; x.strokeRect(2, 2, meret - 4, meret - 4);
      if (utolso) { x.fillStyle = 'rgba(255,200,46,.35)'; x.fillRect(utolso[0] * c, utolso[1] * c, c, c); }
      if (gyoztesSor) { x.fillStyle = 'rgba(52,199,89,.35)'; for (const [a, b] of gyoztesSor) x.fillRect(a * c, b * c, c, c); }
      const v = Math.max(2.5, c * .12);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const cx = i * c + c / 2, cy = j * c + c / 2, s = c * .3;
        if (t[j][i] === 1) {
          x.lineCap = 'round';
          for (const [lw, col] of [[v + 4, INK], [v, '#2f9bff']]) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.moveTo(cx - s, cy - s); x.lineTo(cx + s, cy + s); x.moveTo(cx + s, cy - s); x.lineTo(cx - s, cy + s); x.stroke(); }
        } else if (t[j][i] === 2) {
          for (const [lw, col] of [[v + 4, INK], [v, '#ff9a1f']]) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.arc(cx, cy, s, 0, 7); x.stroke(); }
        }
      }
    }
    function lep(i, j, p) {
      t[j][i] = p; utolso = [i, j]; lepesek++;
      const sor = A.nyer(t, i, j, cfg.W);
      if (sor) { gyoztesSor = sor; vege = true; rajz(); return p === 1 ? (ctx.nyert(3)) : (Hang.rossz(), ctx.vesztett()); }
      if (A.tele(t)) { vege = true; rajz(); Hang.jo(); return ctx.nyert(2, 'Döntetlen! Karcsi ellen ez is szép teljesítmény.'); }
      return false;
    }
    ctx.koppint(cv, (px, py) => {
      if (vege || soros !== 1) return;
      const i = Math.floor(px / c), j = Math.floor(py / c);
      if (i < 0 || j < 0 || i >= N || j >= N || t[j][i]) return;
      Hang.tesz();
      if (lep(i, j, 1) !== false) return;
      soros = 2; rajz(); ctx.mond(veletlen(['Hmm…', 'Gondolkodom…', 'Ajjaj, várj csak…']), 'gondol');
      setTimeout(() => {
        if (vege) return;
        const [a, b] = A.lepes(t, cfg, r); Hang.vissza();
        if (lep(a, b, 2) === false) { soros = 1; rajz(); ctx.mond(veletlen(['Te jössz!', 'Na, erre mit lépsz?', 'Rajtad a sor!']), 'vidam'); }
      }, 380 + Math.min(500, N * 25));
    });
    rajz();
    return { stop() { vege = true; } };
  }
});
