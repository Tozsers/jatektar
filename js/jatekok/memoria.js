/* ============================================================
   MEMÓRIA (párkereső) — fordíts fel két kártyát; ha egyformák, ott maradnak.
   Szintenként több pár (3 → 15), később hasonló képek (állatok közt állatok), és 61-től időre.
   Csillag: a próbálkozások száma a párok számához mérve (≤1,6× → 3, ≤2,5× → 2, különben 1).
   ============================================================ */
const Memoria = {
  KESZLET: [
    ['🍎', '🍌', '🍇', '🍓', '🍉', '🍒', '🍍', '🥝', '🍑', '🍋', '🥕', '🌽', '🍄', '🥨', '🍪'],
    ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'],
    ['⚽', '🏀', '🎾', '🏐', '🎱', '🏓', '🥏', '🎳', '🪀', '🛹', '🚲', '🛴', '🏈', '⛸️', '🎯'],
    ['🚗', '🚕', '🚙', '🚌', '🚑', '🚒', '🚓', '🚜', '🏎️', '🚲', '🛵', '🚂', '✈️', '🚀', '⛵']
  ],
  cfg(n) {
    const par = Math.min(15, 3 + Math.floor((n - 1) / 7));
    return { par, keszlet: Math.floor((n - 1) / 25) % 4, ido: n > 60 ? Math.round(par * (9 - (n - 61) / 10)) : 0 };
  },
  pakli(cfg, r) {
    const k = this.KESZLET[cfg.keszlet].slice(0, cfg.par), p = [...k, ...k];
    for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    return p;
  },
  oszlopok(db) { return db <= 6 ? 3 : db <= 12 ? 4 : db <= 20 ? 5 : 6; }
};

JATEKOK.push({
  id: 'memoria', nev: 'Memória', szin: '#2fd0ff', szinD: '#1a8fc0',
  leiras: 'Keresd meg a párokat! Jó memória kell hozzá.',
  ikon: '🃏',
  cel: n => { const c = Memoria.cfg(n); return `${c.par} pár${c.ido ? ` · ${c.ido} mp` : ''}`; },
  duma: { start: ['Fordíts fel két kártyát! Ha egyformák, tiéd a pár.', 'Jegyezd meg, mi hol van! Én már elfelejtettem.', 'Párkeresés! Mint a zoknik után mosás.'],
          nyer: ['Elefántmemória!', 'Minden pár megvan, ügyes!', 'Ezt hogy jegyezted meg?!'],
          veszt: ['Lejárt az idő! De közel voltál.', 'Hajrá, még egyszer!', 'Most már tudod, mi hol van!'] },
  indit(ctx, n) {
    const M = Memoria, cfg = M.cfg(n), r = rnd(Date.now()), p = M.pakli(cfg, r), O = M.oszlopok(p.length), S = Math.ceil(p.length / O);
    const c = Math.floor(Math.min(ctx.szelesseg, 480) / O), W = c * O, H = c * S;
    const { cv, x } = ctx.vaszon(W, H);
    const fel = new Set(), kesz = new Set(); let elso = -1, zar = false, proba = 0, vege = false, kezd = performance.now(), idozito = null;
    const info = () => ctx.info(`Párok: ${kesz.size / 2} / ${cfg.par} · próba: ${proba}${cfg.ido ? ` · ${Math.max(0, Math.ceil(cfg.ido - (performance.now() - kezd) / 1000))} mp` : ''}`);
    function rajz() {
      x.clearRect(0, 0, W, H);
      p.forEach((v, i) => {
        const X = (i % O) * c + 4, Y = Math.floor(i / O) * c + 4, w = c - 8, lat = fel.has(i) || kesz.has(i);
        x.fillStyle = lat ? (kesz.has(i) ? '#c9f7d6' : '#fff') : '#2f9bff'; x.strokeStyle = INK; x.lineWidth = 3;
        x.beginPath(); x.roundRect(X, Y, w, w, 12); x.fill(); x.stroke();
        if (lat) { x.font = `${Math.round(w * .6)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(v, X + w / 2, Y + w / 2 + 2); }
        else { x.fillStyle = 'rgba(255,255,255,.35)'; x.font = `400 ${Math.round(w * .5)}px Bangers, Impact, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', X + w / 2, Y + w / 2 + 2); }
      });
    }
    ctx.koppint(cv, (px, py) => {
      if (vege || zar) return;
      const i = Math.floor(py / c) * O + Math.floor(px / c);
      if (i >= p.length || fel.has(i) || kesz.has(i)) return;
      fel.add(i); Hang.tesz(); rajz();
      if (elso < 0) { elso = i; return; }
      proba++; const a = elso; elso = -1;
      if (p[a] === p[i]) { kesz.add(a); kesz.add(i); fel.clear(); Hang.jo(); rajz(); info();
        if (kesz.size === p.length) { vege = true; clearInterval(idozito); ctx.nyert(proba <= cfg.par * 1.6 ? 3 : proba <= cfg.par * 2.5 ? 2 : 1); }
      } else { zar = true; info(); setTimeout(() => { fel.clear(); zar = false; rajz(); }, 750); }
    });
    if (cfg.ido) idozito = setInterval(() => { if (vege) return; info(); if ((performance.now() - kezd) / 1000 >= cfg.ido) { vege = true; clearInterval(idozito); Hang.rossz(); ctx.vesztett(); } }, 250);
    info(); rajz();
    return { stop() { vege = true; clearInterval(idozito); } };
  }
});
