/* ============================================================
   SZEMFÜLES — képes egyenletek: a sorokból kiderül, mennyit ér egy tárgy, a kérdésnél pedig figyelni kell a részletekre.
   Az ötlet egy DeepSeek-es próbajátékból jön (Sas, 2026-10-22); ott 3 pályán rossz volt a megoldás,
   ezért itt a feladatot a program rakja össze a tárgyak értékeiből, így mindig pontosan egy jó válasz van.
   Trükkök szintenként: 1–10 csak összeadás · 11– a szorzás előbb jön · 26– párok a sorokban (👢👢 = 2 csizma)
   · 46– a kérdésben is más a darabszám · 61– 4 tárgy és kivonás · 81– óratrükk (🕒 = 3, a kérdésben 🕓 = 4).
   Csillag: hiba és súgó nélkül 3, egy hiba vagy egy súgó 2, különben 1; 5 rossz válasz után vége.
   ============================================================ */
const Szemfules = {
  KESZLET: [
    ['👢', '👕', '🧢', '🧦'], ['🍎', '🍌', '🍒', '🍇'], ['🐶', '🐱', '🐭', '🐰'], ['✏️', '📏', '✂️', '📚'],
    ['🍕', '🍔', '🍟', '🥤'], ['🌴', '🍹', '🦀', '🐚'], ['⚽', '🏀', '🎾', '🏐'], ['🔨', '🔧', '🔩', '🧲'],
    ['✈️', '🧳', '🚂', '⛵'], ['🍩', '☕', '🍪', '🧁'], ['🌹', '🌷', '🌻', '🌼'], ['🚗', '🚕', '🚲', '🛵'],
    ['🐴', '🐔', '🐣', '🐷'], ['🎈', '🎁', '🍬', '🎂'], ['💻', '📱', '🎧', '📷']
  ],
  ORA: ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'],   // 1–12 óra
  cfg(n) {
    return {
      db: n > 60 ? 4 : 3,
      max: Math.min(15, 5 + Math.floor(n / 9)),
      szorzas: n > 10,
      parSor: n > 25,
      parKerdes: n > 45,
      kivonas: n > 60,
      ora: n > 80 && n % 2 === 1
    };
  },
  // token: { t: tárgy indexe, k: darab, ora?: óra (1–12) } — az értéke k × a tárgy értéke (az óráé a mutatott óra)
  ertek(tok, ert) { return tok.ora ? tok.ora : tok.k * ert[tok.t]; },
  szamol(tokok, muv, ert) {
    // a × előbb, mint a + és a −
    const v = tokok.map(t => this.ertek(t, ert)), m = [...muv];
    for (let i = 0; i < m.length;) { if (m[i] === '×') { v.splice(i, 2, v[i] * v[i + 1]); m.splice(i, 1); } else i++; }
    return m.reduce((s, o, i) => o === '+' ? s + v[i + 1] : s - v[i + 1], v[0]);
  },
  // a válasz ne szaladjon el (gyerekeknek): ha túl nagy, ugyanarra a szintre egy másik (de mindig ugyanaz a) feladat jön
  plafon: n => Math.min(250, 40 + n * 3),
  feladat(n, proba = 0) {
    const c = this.cfg(n), r = rnd(n * 7919 + 101 + proba * 17), egesz = (a, b) => a + Math.floor(r() * (b - a + 1));
    const kep = this.KESZLET[(n - 1) % this.KESZLET.length].slice(0, c.db);
    const ert = kep.map(() => egesz(2, c.max));
    let oraH = 0;
    if (c.ora) { oraH = egesz(2, 9); ert[0] = oraH; kep[0] = this.ORA[oraH - 1]; }
    const par = () => c.parSor && r() < .6 ? egesz(2, 3) : 1;
    const T = (t, k = 1) => (c.ora && t === 0 ? { t, k: 1, ora: oraH } : { t, k });
    const sorok = [];
    // 1. sor: csak az első tárgy (háromszor vagy kétszer)
    { const k = par(), ism = r() < .7 ? 3 : 2; sorok.push({ tokok: Array.from({ length: ism }, () => T(0, k)), muv: Array(ism - 1).fill('+') }); }
    // további sorok: az előző tárgy + az új (kétszer), vagy kivonás
    for (let i = 1; i < c.db; i++) {
      const k = par(), elozo = T(i - 1, c.ora && i - 1 === 0 ? 1 : par());
      if (c.kivonas && r() < .5 && this.ertek(elozo, ert) > k * ert[i]) sorok.push({ tokok: [elozo, T(i, k)], muv: ['−'] });
      else sorok.push({ tokok: [elozo, T(i, k), T(i, k)], muv: ['+', '+'] });
    }
    sorok.forEach(s => { s.eredmeny = this.szamol(s.tokok, s.muv, ert); });
    // kérdés: minden tárgy egyszer, a szorzás előrébb vágódik
    const qk = () => c.parKerdes && r() < .5 ? egesz(2, 3) : 1;
    const qOra = c.ora ? (oraH + egesz(1, 3) - 1) % 12 + 1 : 0;        // a kérdésben MÁS órát mutat
    const Q = t => (c.ora && t === 0 ? { t, k: 1, ora: qOra } : { t, k: qk() });
    const tokok = kep.map((_, i) => Q(i));
    let muv;
    if (!c.szorzas) muv = Array(c.db - 1).fill('+');
    else {
      const minta = [['+', '×'], ['×', '+'], ['+', '×'], ['×', '−']][Math.floor(r() * 4)];
      muv = c.db === 4 ? [...minta, r() < .5 ? '+' : '−'] : minta;
    }
    let valasz = this.szamol(tokok, muv, ert);
    if (valasz < 0) { muv = muv.map(m => m === '−' ? '+' : m); valasz = this.szamol(tokok, muv, ert); }
    if (valasz > this.plafon(n) && proba < 50) return this.feladat(n, proba + 1);
    return { kep, ert, sorok, kerdes: { tokok, muv }, valasz, ora: c.ora };
  },
  tokHtml(tok, kep) {
    const e = tok.ora ? this.ORA[tok.ora - 1] : kep[tok.t];
    return `<span class="szf-tok${tok.k > 1 ? ' csop' : ''}${tok.ora ? ' ora' : ''}">${e.repeat(tok.k)}</span>`;
  },
  sorHtml(s, kep, jobb) {
    return s.tokok.map((t, i) => this.tokHtml(t, kep) + (i < s.muv.length ? `<b class="szf-op">${s.muv[i]}</b>` : '')).join('') + `<b class="szf-op">=</b><b class="szf-sz">${jobb}</b>`;
  }
};

JATEKOK.push({
  id: 'szemfules', nev: 'Szemfüles', szin: '#1cc6b4', szinD: '#0e8f82',
  leiras: 'Képes egyenletek: mennyit ér a csizma? Figyelj a részletekre!',
  ikon: '🔍',
  cel: n => { const c = Szemfules.cfg(n); return [c.ora ? 'óratrükk' : c.db + ' tárgy', c.szorzas ? 'szorzás előbb' : 'összeadás', c.parKerdes ? 'párok a kérdésben' : c.parSor ? 'párok' : ''].filter(Boolean).join(' · '); },
  duma: { start: ['Számold ki, mennyit ér egy tárgy, aztán a kérdést!', 'Szemfüles legyél: nem mindig ugyanannyi van belőle!', 'Emlékszel? A szorzás előbb jön, mint az összeadás!'],
          nyer: ['Szemfüles vagy, mint egy sas!', 'Ezt kiszúrtad! Ügyes!', 'Pontos! Engem ez elsőre becsapott volna.'],
          veszt: ['Hoppá, most kifogott rajtunk. Nézd meg újra!', 'Ez trükkös volt! Még egyszer?', 'Számold meg a darabokat is!'] },
  indit(ctx, n) {
    const S = Szemfules, f = S.feladat(n), ter = document.getElementById('ter'), kont = document.getElementById('kont');
    let beir = '', hiba = 0, sugo = 0, vege = false;
    const jegyzet = f.kep.map(() => '');
    ter.innerHTML = `<div class="szf">
      <div class="szf-kartya">${f.sorok.map(s => `<div class="szf-sor">${S.sorHtml(s, f.kep, s.eredmeny)}</div>`).join('')}
        <div class="szf-sor kerdes" id="szf-k">${S.sorHtml(f.kerdes, f.kep, '<span id="szf-v">?</span>')}</div></div>
      <div class="szf-jegyzet"><b>📝 Jegyzet</b>${f.kep.map((e, i) => `<label class="szf-j"><span>${e}</span><input data-i="${i}" inputmode="numeric" maxlength="3" placeholder="?"></label>`).join('')}</div>
    </div>`;
    ter.querySelectorAll('.szf-j input').forEach(inp => inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 3); jegyzet[+inp.dataset.i] = inp.value; }));
    kont.innerHTML = `<div class="szf-pad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '⌫', 'OK'].map(b => `<button class="cbtn ${b === 'OK' ? 'pink' : b === '⌫' ? 'blue' : ''}" data-b="${b}">${b}</button>`).join('')}</div>
      <button class="cbtn small" id="szf-sugo">💡 SÚGÓ</button>`;
    const vKi = () => { document.getElementById('szf-v').textContent = beir || '?'; };
    const info = () => ctx.info(`Hibák: ${hiba} / 5${sugo ? ` · súgó: ${sugo}` : ''}`);
    function nyom(b) {
      if (vege) return;
      if (b === '⌫') { beir = beir.slice(0, -1); Hang.vissza(); }
      else if (b === 'OK') return ellenoriz();
      else if (beir.length < 4) { beir = (beir === '0' ? '' : beir) + b; Hang.tesz(); }
      vKi();
    }
    function ellenoriz() {
      if (!beir) return;
      const k = document.getElementById('szf-k');
      if (+beir === f.valasz) {
        vege = true; Hang.jo(); k.classList.add('jo');
        setTimeout(() => ctx.nyert(hiba === 0 && sugo === 0 ? 3 : hiba + sugo <= 1 ? 2 : 1), 500);
        return;
      }
      hiba++; Hang.rossz(); k.classList.remove('rossz'); void k.offsetWidth; k.classList.add('rossz'); beir = ''; vKi(); info();
      if (hiba >= 5) { vege = true; return setTimeout(() => ctx.vesztett(`A jó válasz ${f.valasz} volt. Nézd meg, hol csúszott el!`), 600); }
      ctx.mond(hiba === 1 ? 'Nem ez. Számold meg, hány darab van egy-egy helyen!' : hiba === 2 ? 'Tipp: előbb a szorzás, aztán az összeadás!' : 'Használd a jegyzetet vagy a súgót!', 'hoppa', 'oops');
    }
    kont.querySelectorAll('[data-b]').forEach(g => g.addEventListener('pointerdown', e => { e.preventDefault(); nyom(g.dataset.b); }));
    document.getElementById('szf-sugo').onclick = () => {
      if (vege) return;
      const i = jegyzet.findIndex((v, j) => +v !== f.ert[j]);
      if (i < 0) return ctx.mond('A jegyzeted már jó! Most számold ki a kérdést.', 'vidam');
      sugo++; Hang.sugo(); info();
      const inp = ter.querySelector(`.szf-j input[data-i="${i}"]`); inp.value = jegyzet[i] = String(f.ert[i]); inp.classList.add('sugo');
      ctx.mond(f.ora && i === 0 ? `Az óra annyit ér, ahány órát mutat! Ez ${f.ert[0]}.` : `${f.kep[i]} = ${f.ert[i]}. Nézd meg, melyik sorból jön ki!`, 'gondol');
    };
    ctx.billentyu(e => {
      if (e.target && e.target.tagName === 'INPUT') return;
      if (/^\d$/.test(e.key)) nyom(e.key); else if (e.key === 'Backspace') nyom('⌫'); else if (e.key === 'Enter') nyom('OK');
    });
    info();
    return { stop() { vege = true; } };
  }
});
