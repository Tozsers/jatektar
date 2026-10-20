/* ============================================================
   KIRAKÓ (tologatós) — tedd sorba a számokat. 1–30: 3×3 · 31–70: 4×4 · 71–100: 5×5.
   A keverés a kirakott állásból véletlen, szabályos tologatásokkal készül → mindig megoldható.
   Csillag: a keverés hosszához mérve (≤1,3× → 3, ≤2,2× → 2, különben 1).
   ============================================================ */
const Kirako = {
  cfg(n) {
    if (n <= 30) return { N: 3, kever: 6 + Math.round((n - 1) * 1.3) };
    if (n <= 70) return { N: 4, kever: 30 + Math.round((n - 31) * 2.4) };
    return { N: 5, kever: 90 + Math.round((n - 71) * 5.5) };
  },
  kesz(N) { const t = Array.from({ length: N * N }, (_, i) => i + 1); t[N * N - 1] = 0; return t; },
  szomszed(N, i) { const x = i % N, y = Math.floor(i / N), s = []; if (x > 0) s.push(i - 1); if (x < N - 1) s.push(i + 1); if (y > 0) s.push(i - N); if (y < N - 1) s.push(i + N); return s; },
  kever(N, db, r) {
    const t = this.kesz(N); let u = N * N - 1, elozo = -1;
    for (let k = 0; k < db; k++) {
      const s = this.szomszed(N, u).filter(i => i !== elozo), v = s[Math.floor(r() * s.length)];
      t[u] = t[v]; t[v] = 0; elozo = u; u = v;
    }
    if (this.kirakva(t)) return this.kever(N, db + 1, r);
    return t;
  },
  kirakva(t) { for (let i = 0; i < t.length - 1; i++) if (t[i] !== i + 1) return false; return true; },
  // koppintás az i-edik mezőre: ha egy sorban/oszlopban van az üressel, az egész sor odacsúszik. Visszaadja a lépésszámot.
  tol(t, N, i) {
    const u = t.indexOf(0), ux = u % N, uy = Math.floor(u / N), x = i % N, y = Math.floor(i / N);
    if (i === u || (x !== ux && y !== uy)) return 0;
    const lep = x === ux ? (y > uy ? N : -N) : (x > ux ? 1 : -1);
    let db = 0, p = u;
    while (p !== i) { t[p] = t[p + lep]; t[p + lep] = 0; p += lep; db++; }
    return db;
  }
};

JATEKOK.push({
  id: 'kirako', nev: 'Kirakó', szin: '#ff9a1f', szinD: '#d9700a',
  leiras: 'Tologasd sorba a számokat, 1-től kezdve!',
  ikon: '🧩',
  cel: n => { const c = Kirako.cfg(n); return `${c.N}×${c.N} · ${c.kever} keverés`; },
  duma: { start: ['Koppints egy számra az üres hely mellett!', 'Sorba rendezés! Mint a zoknik a fiókban. Elvileg.', 'Fentről lefelé, balról jobbra, és kész!'],
          nyer: ['Rend a lelke mindennek!', 'Minden a helyén, mint egy múzeumban!', 'Kirakóbajnok!'],
          veszt: ['Semmi baj!', 'Próbáld újra!', 'Majd legközelebb!'] },
  indit(ctx, n) {
    const K = Kirako, cfg = K.cfg(n), N = cfg.N, r = rnd(5000 + n);
    const t = K.kever(N, cfg.kever, r);
    const meret = Math.floor(Math.min(ctx.szelesseg, 440) / N) * N, c = meret / N;
    const { cv, x } = ctx.vaszon(meret, meret);
    const SZIN = [['#2f9bff', '#1a6fd1'], ['#34c759', '#1f9a40'], ['#ff9a1f', '#d9700a'], ['#a98bff', '#7a5ce0'], ['#ff5d8f', '#d63a6c']];
    let lepes = 0, vege = false;
    ctx.info(`Lépés: 0 · cél: ${Math.round(cfg.kever * 1.3)} alatt 3★`);
    function rajz() {
      x.fillStyle = '#fff6dd'; x.fillRect(0, 0, meret, meret);
      t.forEach((v, i) => {
        if (!v) return;
        const X = (i % N) * c + 3, Y = Math.floor(i / N) * c + 3, w = c - 6, sor = Math.floor((v - 1) / N), [a, d] = SZIN[sor % SZIN.length];
        const helyen = v === i + 1;
        x.fillStyle = d; x.beginPath(); x.roundRect(X, Y + 3, w, w - 3, 12); x.fill();
        x.fillStyle = a; x.strokeStyle = INK; x.lineWidth = 3; x.beginPath(); x.roundRect(X, Y, w, w - 4, 12); x.fill(); x.stroke();
        x.fillStyle = 'rgba(255,255,255,.28)'; x.beginPath(); x.roundRect(X + 3, Y + 3, w - 6, (w - 4) * .38, 9); x.fill();
        x.font = `400 ${Math.round(c * .48)}px "Lilita One", "Arial Black", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.lineWidth = 5; x.strokeStyle = INK; x.strokeText(v, X + w / 2, Y + w / 2); x.fillStyle = '#fff'; x.fillText(v, X + w / 2, Y + w / 2);
        if (helyen) { x.fillStyle = '#ffc82e'; x.beginPath(); x.arc(X + w - 9, Y + 9, 5, 0, 7); x.fill(); x.lineWidth = 1.5; x.stroke(); }
      });
      x.strokeStyle = INK; x.lineWidth = 4; x.strokeRect(2, 2, meret - 4, meret - 4);
    }
    ctx.koppint(cv, (px, py) => {
      if (vege) return;
      const i = Math.floor(py / c) * N + Math.floor(px / c), db = K.tol(t, N, i);
      if (!db) return;
      lepes += db; Hang.tesz(); ctx.info(`Lépés: ${lepes} · cél: ${Math.round(cfg.kever * 1.3)} alatt 3★`); rajz();
      if (K.kirakva(t)) { vege = true; ctx.nyert(lepes <= cfg.kever * 1.3 ? 3 : lepes <= cfg.kever * 2.2 ? 2 : 1); }
    });
    rajz();
    return { stop() { vege = true; } };
  }
});
