/* ============================================================
   SZÓKERESŐ — magyar betűkkel: a cs, dz, dzs, gy, ly, ny, sz, ty, zs EGY mezőben van (mint az ábécében).
   1–10: 6×6, csak → és ↓ · 11–30: + átló ↘ · 31–60: + visszafelé (← ↑) és ↗ · 61–100: mind a 8 irány, nagy rács.
   Húzd végig az ujjad a szón. Csillag: súgó nélkül 3, egy súgóval 2, többel 1.
   ============================================================ */
const Szokereso = {
  KETTOS: ['DZS', 'CS', 'DZ', 'GY', 'LY', 'NY', 'SZ', 'TY', 'ZS'],
  betuk(szo) {
    const b = []; let i = 0;
    while (i < szo.length) {
      const k = this.KETTOS.find(d => szo.startsWith(d, i));
      if (k) { b.push(k); i += k.length; } else { b.push(szo[i]); i++; }
    }
    return b;
  },
  // kitöltő betűk a magyar gyakoriság szerint (a kettős betűk ritkábbak, hogy ne legyen túl könnyű kiszúrni őket)
  KITOLTO: 'EEEEEEAAAAAATTTTLLLLNNNNKKKKSSSRRRRIIIIOOOMMMÁÁÁZZÉÉGGDDUUBBVVHHJJÖÖFFPPCÓÍÜŐÚŰ'.split('').concat(['SZ', 'SZ', 'GY', 'GY', 'CS', 'NY', 'LY', 'ZS', 'TY']),
  IRANY: { j: [1, 0], l: [0, 1], jl: [1, 1], b: [-1, 0], f: [0, -1], jf: [1, -1], bf: [-1, -1], bl: [-1, 1] },
  cfg(n) {
    const tema = (n - 1) % SZOTEMAK.length;
    if (n <= 10) return { N: 6, db: 4 + Math.floor((n - 1) / 5), ir: ['j', 'l'], tema };
    if (n <= 30) return { N: n <= 20 ? 7 : 8, db: 5 + Math.floor((n - 11) / 7), ir: ['j', 'l', 'jl'], tema };
    if (n <= 60) return { N: n <= 45 ? 9 : 10, db: 7 + Math.floor((n - 31) / 12), ir: ['j', 'l', 'jl', 'b', 'f', 'jf'], tema };
    return { N: n <= 80 ? 10 : 11, db: 9 + Math.floor((n - 61) / 14), ir: Object.keys(this.IRANY), tema };
  },
  // rács építése: hosszú szavak előbb, átfedés csak egyező betűnél. Visszaad {racs, szavak:[{szo, betuk, cellak}]}
  epit(cfg, r) {
    const N = cfg.N, jelolt = SZOTEMAK[cfg.tema].szavak.filter(s => this.betuk(s).length <= N && this.betuk(s).length >= 2);
    for (let probal = 0; probal < 40; probal++) {
      const kever = [...jelolt].sort(() => r() - .5).slice(0, cfg.db * 2);
      const racs = Array.from({ length: N }, () => Array(N).fill(null)), lett = [];
      for (const szo of kever.sort((a, b) => this.betuk(b).length - this.betuk(a).length)) {
        if (lett.length >= cfg.db) break;
        const b = this.betuk(szo); let ok = false;
        for (let t = 0; t < 250 && !ok; t++) {
          const [dx, dy] = this.IRANY[cfg.ir[Math.floor(r() * cfg.ir.length)]];
          const x0 = Math.floor(r() * N), y0 = Math.floor(r() * N), x1 = x0 + dx * (b.length - 1), y1 = y0 + dy * (b.length - 1);
          if (x1 < 0 || y1 < 0 || x1 >= N || y1 >= N) continue;
          const cellak = b.map((_, i) => [x0 + dx * i, y0 + dy * i]);
          if (cellak.every(([x, y], i) => racs[y][x] === null || racs[y][x] === b[i])) {
            cellak.forEach(([x, y], i) => racs[y][x] = b[i]); lett.push({ szo, betuk: b, cellak }); ok = true;
          }
        }
      }
      if (lett.length >= cfg.db) {
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (racs[y][x] === null) racs[y][x] = this.KITOLTO[Math.floor(r() * this.KITOLTO.length)];
        return { racs, szavak: lett.sort((a, b) => a.szo.localeCompare(b.szo, 'hu')) };
      }
    }
    throw new Error('Szókereső: nem fért el a ' + cfg.db + ' szó');
  },
  // a kijelölt egyenes (start→vég) cellái, ha egyenes vonal (vízszintes, függőleges, átló); különben null
  vonal(a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    if (dx && dy && Math.abs(dx) !== Math.abs(dy)) return null;
    const h = Math.max(Math.abs(dx), Math.abs(dy)), sx = Math.sign(dx), sy = Math.sign(dy);
    return Array.from({ length: h + 1 }, (_, i) => [a[0] + sx * i, a[1] + sy * i]);
  },
  egyezik(cellak, sz) {
    const k = JSON.stringify(cellak), v = JSON.stringify([...cellak].reverse()), s = JSON.stringify(sz.cellak);
    return k === s || v === s;
  }
};

JATEKOK.push({
  id: 'szokereso', nev: 'Szókereső', szin: '#7ed957', szinD: '#4fae2c',
  leiras: 'Keresd meg a magyar szavakat a betűk között!',
  ikon: '🔤',
  cel: n => { const c = Szokereso.cfg(n); return `${SZOTEMAK[c.tema].nev} · ${c.db} szó · ${c.N}×${c.N}`; },
  duma: { start: ['Húzd végig az ujjad a szón, az elejétől a végéig!', 'A cs, gy, ny, sz egy kockában lakik, mint az ábécében!', 'Betűvadászat! Én a K betűt szeretem a legjobban.'],
          nyer: ['Minden szó megvan! Te egy két lábon járó szótár vagy!', 'Betűbajnok!', 'Ennyi szót én sem tudtam!'],
          veszt: ['Semmi baj!', 'Próbáld újra!', 'Majd legközelebb!'] },
  indit(ctx, n) {
    const S = Szokereso, cfg = S.cfg(n), r = rnd(7000 + n), { racs, szavak } = S.epit(cfg, r), N = cfg.N, tema = SZOTEMAK[cfg.tema];
    const meret = Math.floor(Math.min(ctx.szelesseg, 480, ctx.helyMagas(150)) / N) * N, c = meret / N;
    const { cv, x } = ctx.vaszon(meret, meret);
    const SZINEK = ['#ffc82e', '#7ed957', '#2fd0ff', '#ff9a1f', '#a98bff', '#ff5d8f', '#34c759', '#2f9bff'];
    const talalt = new Map(); let huz = null, sugok = 0, sugoCella = null, vege = false;
    const lista = document.createElement('div'); lista.className = 'szolista';
    const frissLista = () => {
      lista.innerHTML = `<b>${tema.ikon} ${tema.nev}</b>` + szavak.map((s, i) => `<span class="${talalt.has(i) ? 'meg' : ''}">${s.szo}</span>`).join('');
      ctx.info(`Megvan: ${talalt.size} / ${szavak.length}`);
    };
    function rajz() {
      x.fillStyle = '#fffdf3'; x.fillRect(0, 0, meret, meret);
      // megtalált szavak sávjai
      for (const [i, sz] of talalt) savKep(sz.cellak, SZINEK[i % SZINEK.length], 1);
      if (huz && huz.cellak) savKep(huz.cellak, '#ff5d8f', .55);
      if (sugoCella) { x.strokeStyle = '#ff4d4d'; x.lineWidth = 4; x.beginPath(); x.arc(sugoCella[0] * c + c / 2, sugoCella[1] * c + c / 2, c * .44, 0, 7); x.stroke(); }
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = INK;
      for (let y = 0; y < N; y++) for (let xx = 0; xx < N; xx++) {
        const b = racs[y][xx];
        x.font = `400 ${Math.round(c * (b.length === 1 ? .56 : b.length === 2 ? .44 : .34))}px "Lilita One", "Arial Black", sans-serif`;
        x.fillText(b, xx * c + c / 2, y * c + c / 2 + 1);
      }
      x.strokeStyle = INK; x.lineWidth = 4; x.strokeRect(2, 2, meret - 4, meret - 4);
    }
    function savKep(cellak, szin, alfa) {
      const a = cellak[0], b = cellak[cellak.length - 1];
      x.globalAlpha = alfa; x.strokeStyle = szin; x.lineCap = 'round'; x.lineWidth = c * .78;
      x.beginPath(); x.moveTo(a[0] * c + c / 2, a[1] * c + c / 2); x.lineTo(b[0] * c + c / 2, b[1] * c + c / 2); x.stroke(); x.globalAlpha = 1;
    }
    const cella = e => { const bx = cv.getBoundingClientRect(); return [Math.min(N - 1, Math.max(0, Math.floor((e.clientX - bx.left) / c))), Math.min(N - 1, Math.max(0, Math.floor((e.clientY - bx.top) / c)))]; };
    cv.addEventListener('pointerdown', e => { if (vege) return; cv.setPointerCapture(e.pointerId); const p = cella(e); huz = { a: p, cellak: [p] }; Hang.tik(); rajz(); });
    cv.addEventListener('pointermove', e => { if (!huz) return; const v = S.vonal(huz.a, cella(e)); if (v && v.length !== huz.cellak.length) { huz.cellak = v; Hang.tik(); } if (v) huz.cellak = v; rajz(); });
    cv.addEventListener('pointerup', () => {
      if (!huz) return; const cs = huz.cellak; huz = null;
      const i = szavak.findIndex((sz, k) => !talalt.has(k) && S.egyezik(cs, sz));
      if (i >= 0) {
        talalt.set(i, szavak[i]); sugoCella = null; Hang.jo(); frissLista();
        ctx.mond(veletlen([`${szavak[i].szo}! Megvan!`, `Szuper, ${szavak[i].szo.toLowerCase()}!`, 'Ez az!', `Igen, ${szavak[i].szo}!`]), 'huu', 'wow');
        if (talalt.size === szavak.length) { vege = true; rajz(); return ctx.nyert(sugok === 0 ? 3 : sugok === 1 ? 2 : 1); }
      } else if (cs.length > 1) { Hang.rossz(); ctx.mond(veletlen(['Ez nem szó… vagy csak én nem ismerem?', 'Hmm, ez nincs a listán.', 'Közel jársz!']), 'gondol'); }
      rajz();
    });
    ctx.gombok([['SÚGÓ', () => {
      if (vege) return; const i = szavak.findIndex((_, k) => !talalt.has(k)); if (i < 0) return;
      sugok++; sugoCella = szavak[i].cellak[0]; Hang.sugo(); ctx.mond(`Itt kezdődik az egyik szó, a piros karika jelzi!`, 'gondol'); rajz();
    }]]);
    document.getElementById('kont').prepend(lista);
    frissLista(); rajz();
    return { stop() { vege = true; } };
  }
});
