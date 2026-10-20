/* ============================================================
   TETRISZ — tüntess el N sort. Szintenként gyorsabb esés, több sor; 31-től „szemét” sorokkal indul.
   Csillag: minél alacsonyabb a halom a végén, annál több (3: alsó harmad, 2: középső, 1: felső).
   ============================================================ */
const Tetris = {
  W: 10, H: 20,
  ALAK: {
    I: { c: '#2fd0ff', d: '#1a8fc0', m: [[0, 1], [1, 1], [2, 1], [3, 1]] },
    O: { c: '#ffc82e', d: '#f08a00', m: [[1, 0], [2, 0], [1, 1], [2, 1]] },
    T: { c: '#a98bff', d: '#7a5ce0', m: [[1, 0], [0, 1], [1, 1], [2, 1]] },
    S: { c: '#34c759', d: '#1f9a40', m: [[1, 0], [2, 0], [0, 1], [1, 1]] },
    Z: { c: '#ff4d4d', d: '#c62828', m: [[0, 0], [1, 0], [1, 1], [2, 1]] },
    J: { c: '#2f9bff', d: '#1a6fd1', m: [[0, 0], [0, 1], [1, 1], [2, 1]] },
    L: { c: '#ff9a1f', d: '#d9700a', m: [[2, 0], [0, 1], [1, 1], [2, 1]] }
  },
  cfg(n) {
    return {
      esik: Math.max(95, Math.round(820 - n * 7.2)),          // ms / sor
      cel: Math.min(25, 3 + Math.floor(n / 5)),
      szemet: n > 30 ? Math.min(7, 1 + Math.floor((n - 31) / 10)) : 0
    };
  },
  ures() { return Array.from({ length: this.H }, () => Array(this.W).fill(null)); },
  szemet(t, db, r) {
    for (let k = 0; k < db; k++) {
      const lyuk = Math.floor(r() * this.W), sor = Array(this.W).fill('G').map((v, i) => i === lyuk ? null : v);
      t.shift(); t.push(sor);
    }
  },
  // óramutató szerinti forgatás a saját dobozában (I: 4×4, a többi 3×3; az O nem forog)
  forgat(m, alak) {
    if (alak === 'O') return m;
    const s = alak === 'I' ? 4 : 3;
    return m.map(([x, y]) => [s - 1 - y, x]);
  },
  utkozik(t, m, ox, oy) {
    return m.some(([x, y]) => { const a = x + ox, b = y + oy; return a < 0 || a >= this.W || b >= this.H || (b >= 0 && t[b][a]); });
  },
  rogzit(t, m, ox, oy, alak) { for (const [x, y] of m) if (y + oy >= 0) t[y + oy][x + ox] = alak; },
  torol(t) {
    let db = 0;
    for (let y = this.H - 1; y >= 0; y--) if (t[y].every(v => v)) { t.splice(y, 1); t.unshift(Array(this.W).fill(null)); db++; y++; }
    return db;
  },
  magas(t) { for (let y = 0; y < this.H; y++) if (t[y].some(v => v)) return this.H - y; return 0; },
  zsak(r) { const z = Object.keys(this.ALAK); for (let i = z.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [z[i], z[j]] = [z[j], z[i]]; } return z; }
};

JATEKOK.push({
  id: 'tetris', nev: 'Tetrisz', szin: '#a98bff', szinD: '#7a5ce0',
  leiras: 'Pakold sorba a kockákat, és tüntesd el a sorokat!',
  ikon: '🧱',
  cel: n => { const c = Tetris.cfg(n); return `${c.cel} sor${c.szemet ? ` · ${c.szemet} szemét sor` : ''}`; },
  duma: { start: ['Koppints: forgat. Húzd oldalra: mozgat. Húzd le: leejt!', 'Kockarakás! A kedvencem, hiszen kocka vagyok.', 'Lyukat ne hagyj, mert az ott marad!'],
          nyer: ['Rend van, mint egy gyógyszertárban!', 'Ez aztán a pakolás!', 'Sorok eltüntetve, főnök!'],
          veszt: ['Hoppá, megtelt a doboz!', 'Túl magasra nőtt a torony. Lapítsunk!', 'Semmi baj, újrapakoljuk!'] },
  indit(ctx, n) {
    const T = Tetris, cfg = T.cfg(n), r = rnd(Date.now());
    const c = Math.floor(Math.min(ctx.szelesseg * .72, 380, (innerHeight - 330) / 2) / T.W * 2) / 2 | 0 || 16;
    const BW = c * T.W, BH = c * T.H, OLD = Math.max(70, c * 4.2);
    const { cv, x } = ctx.vaszon(BW + OLD + 10, BH);
    const t = T.ures(); T.szemet(t, cfg.szemet, r);
    let zsak = [], akt, kov = null, ox, oy, m, fut = true, ido = 0, elozo = 0, sorok = 0;
    const huz = () => { if (!zsak.length) zsak = T.zsak(r); return zsak.pop(); };
    function uj() {
      akt = kov || huz(); kov = huz(); m = T.ALAK[akt].m.map(p => [...p]); ox = 3; oy = -1;
      if (T.utkozik(t, m, ox, oy + 1)) { fut = false; rajz(); Hang.rossz(); ctx.vesztett(); return false; }
      return true;
    }
    ctx.info(`Sor: 0 / ${cfg.cel}`);

    function cella(i, j, alak, alfa = 1) {
      const a = alak === 'G' ? { c: '#9aa0a8', d: '#6b6c78' } : T.ALAK[alak];
      x.globalAlpha = alfa; const X = i * c + 1, Y = j * c + 1, w = c - 2;
      x.fillStyle = a.d; x.fillRect(X, Y, w, w);
      x.fillStyle = a.c; x.fillRect(X, Y, w, w - 3);
      x.fillStyle = 'rgba(255,255,255,.3)'; x.fillRect(X, Y, w, w * .35);
      x.strokeStyle = INK; x.lineWidth = 1.5; x.strokeRect(X, Y, w, w); x.globalAlpha = 1;
    }
    function rajz() {
      x.fillStyle = '#1e2240'; x.fillRect(0, 0, BW, BH);
      x.strokeStyle = 'rgba(255,255,255,.06)'; x.lineWidth = 1;
      for (let i = 1; i < T.W; i++) { x.beginPath(); x.moveTo(i * c, 0); x.lineTo(i * c, BH); x.stroke(); }
      for (let j = 0; j < T.H; j++) for (let i = 0; i < T.W; i++) if (t[j][i]) cella(i, j, t[j][i]);
      if (fut && m) {
        let gy = oy; while (!T.utkozik(t, m, ox, gy + 1)) gy++;
        for (const [a, b] of m) if (b + gy >= 0) cella(a + ox, b + gy, akt, .25);
        for (const [a, b] of m) if (b + oy >= 0) cella(a + ox, b + oy, akt);
      }
      x.strokeStyle = INK; x.lineWidth = 4; x.strokeRect(2, 2, BW - 4, BH - 4);
      // jobb oldal: következő elem + sorok
      const sx = BW + 10;
      x.fillStyle = '#fff'; x.strokeStyle = INK; x.lineWidth = 3; x.beginPath(); x.roundRect(sx, 0, OLD, OLD * 1.05, 12); x.fill(); x.stroke();
      x.fillStyle = INK; x.font = `900 ${Math.round(OLD * .16)}px Nunito, sans-serif`; x.textAlign = 'center'; x.fillText('KÖVETKEZŐ', sx + OLD / 2, OLD * .22);
      if (kov) { const kc = OLD / 5.2, km = T.ALAK[kov].m, sz = T.ALAK[kov];
        for (const [a, b] of km) { const X = sx + OLD / 2 + (a - 2) * kc, Y = OLD * .38 + b * kc; x.fillStyle = sz.c; x.fillRect(X, Y, kc - 2, kc - 2); x.strokeStyle = INK; x.lineWidth = 1.5; x.strokeRect(X, Y, kc - 2, kc - 2); } }
      x.fillStyle = '#fff'; x.beginPath(); x.roundRect(sx, OLD * 1.2, OLD, OLD * .8, 12); x.fill(); x.stroke();
      x.fillStyle = INK; x.fillText('SOROK', sx + OLD / 2, OLD * 1.4);
      x.font = `400 ${Math.round(OLD * .34)}px Bangers, Impact, sans-serif`; x.fillText(`${sorok}/${cfg.cel}`, sx + OLD / 2, OLD * 1.85);
    }
    function mozdit(dx) { if (fut && !T.utkozik(t, m, ox + dx, oy)) { ox += dx; Hang.tik(); rajz(); } }
    function forgat() {
      if (!fut) return; const f = T.forgat(m, akt);
      for (const eltol of [0, -1, 1, -2, 2]) if (!T.utkozik(t, f, ox + eltol, oy)) { m = f; ox += eltol; Hang.tik(); rajz(); return; }
    }
    function le() { if (!fut) return; if (!T.utkozik(t, m, ox, oy + 1)) { oy++; return true; } leszall(); return false; }
    function ejt() { if (!fut) return; while (!T.utkozik(t, m, ox, oy + 1)) oy++; leszall(); }
    function leszall() {
      if (oy < 0 && m.some(([, b]) => b + oy < 0)) { fut = false; rajz(); Hang.rossz(); return ctx.vesztett(); }
      T.rogzit(t, m, ox, oy, akt); const db = T.torol(t);
      if (db) { sorok += db; Hang.jo(); ctx.info(`Sor: ${Math.min(sorok, cfg.cel)} / ${cfg.cel}`); } else Hang.tesz();
      if (sorok >= cfg.cel) {
        fut = false; rajz(); const h = T.magas(t) / T.H;
        return ctx.nyert(h <= 1 / 3 ? 3 : h <= 2 / 3 ? 2 : 1);
      }
      if (uj()) rajz();
    }
    function ciklus(tm) {
      if (!fut) return; if (!elozo) elozo = tm; ido += tm - elozo; elozo = tm;
      if (ido >= cfg.esik) { ido = 0; le(); }
      if (fut) { rajz(); requestAnimationFrame(ciklus); }
    }
    ctx.huzas(cv, d => d === 'bal' ? mozdit(-1) : d === 'jobb' ? mozdit(1) : d === 'le' ? ejt() : forgat(), forgat, { folyamatos: true, lepes: c });
    ctx.gombok([['◀', () => mozdit(-1)], ['⟳', forgat], ['▼', () => { le(); rajz(); }], ['⤓', ejt], ['▶', () => mozdit(1)]]);
    ctx.billentyu(e => {
      const f = { ArrowLeft: () => mozdit(-1), ArrowRight: () => mozdit(1), ArrowUp: forgat, ArrowDown: () => { le(); rajz(); }, ' ': ejt }[e.key];
      if (f) { e.preventDefault(); f(); }
    });
    if (uj()) { rajz(); requestAnimationFrame(ciklus); }
    return { stop() { fut = false; } };
  }
});
