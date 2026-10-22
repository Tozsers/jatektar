/* ============================================================
   KERET — képernyők (játékosok → főoldal → szintek → játék) és a játékoknak adott ctx.
   Egy játék modul: JATEKOK.push({ id, nev, szin, szinD, leiras, ikon, cel(n), duma{start,nyer,veszt}, indit(ctx, n) → {stop} })
   ============================================================ */
const app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const JATEK = id => JATEKOK.find(j => j.id === id);
let futo = null, kulcsok = [], probak = {};

function takarit() {
  if (futo) { try { futo.stop(); } catch (e) { } futo = null; }
  kulcsok.forEach(f => removeEventListener('keydown', f)); kulcsok = [];
  scrollTo(0, 0);
}
const talk = (szoveg, h = 'vidam') => `<div class="talk" id="talk"><div class="mascot">${Kisero.svg(h, (Tar.p() || {}).ruha)}</div><div class="bubble">${esc(szoveg)}</div></div>`;
const nemaGomb = () => `<button class="cbtn small" id="nema" aria-label="Hang ki/be">${Tar.d.nema ? 'NÉMA' : 'HANG'}</button>`;
function nemaBekot() { const b = document.getElementById('nema'); if (b) b.onclick = () => { Tar.frissMent(() => { Tar.d.nema = !Tar.d.nema; }); b.textContent = Tar.d.nema ? 'NÉMA' : 'HANG'; Hang.tesz(); }; }

/* ---------- játékosok ---------- */
function jatekosok() {
  takarit(); Tar.betolt();
  const lista = Object.values(Tar.d.profilok);
  app.innerHTML = `
    <div class="banner"><h1>JÁTÉKTÁR</h1></div>
    ${talk(lista.length ? 'Szia! Ki játszik ma?' : 'Szia! Kocka Karcsi vagyok. Mondd meg a neved, és hogy hányadikos vagy!')}
    <div class="panel">
      ${lista.map(p => `<div class="prow"><button class="pbtn" data-id="${p.id}"><span class="pnev">${esc(p.nev)}</span>
        <span class="psub">${esc((OSZTALYOK.find(o => o[0] === p.osztaly) || [, ''])[1])} · ★ ${Tar.osszCs(p)}</span></button>
        <button class="ptor" data-id="${p.id}" aria-label="${esc(p.nev)} törlése">✕</button></div>`).join('')}
      <form id="ujp" class="ujp" ${lista.length ? 'hidden' : ''}>
        <label>Név<input id="pnev" maxlength="16" placeholder="Például: Bence" autocomplete="off"></label>
        <label>Osztály<select id="posz">${OSZTALYOK.map(o => `<option value="${o[0]}" ${o[0] === '3' ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>
        <button class="cbtn pink">MEHET!</button>
      </form>
      ${lista.length ? '<button class="cbtn blue small" id="ujgomb">+ ÚJ JÁTÉKOS</button>' : ''}
    </div>`;
  app.querySelectorAll('.pbtn').forEach(b => b.onclick = () => { Tar.valaszt(b.dataset.id); Hang.tesz(); fooldal(); });
  app.querySelectorAll('.ptor').forEach(b => b.onclick = () => {
    if (b.dataset.biztos) { Tar.torol(b.dataset.id); Hang.vissza(); return jatekosok(); }
    b.dataset.biztos = 1; b.textContent = 'Biztos?'; b.classList.add('biztos'); setTimeout(() => { if (b.isConnected) { delete b.dataset.biztos; b.textContent = '✕'; b.classList.remove('biztos'); } }, 3000);
  });
  const ug = document.getElementById('ujgomb'); if (ug) ug.onclick = () => { document.getElementById('ujp').hidden = false; ug.remove(); document.getElementById('pnev').focus(); };
  document.getElementById('ujp').onsubmit = e => { e.preventDefault(); const n = document.getElementById('pnev').value.trim(); if (!n) return; Tar.uj(n, document.getElementById('posz').value); Hang.gyoz(); fooldal(); };
}

const BALA_SVG = `<svg class="balasvg" viewBox="0 0 160 90" aria-hidden="true"><ellipse cx="80" cy="86" rx="70" ry="5" fill="rgba(27,27,47,.25)"/>
  <rect x="6" y="14" width="148" height="72" rx="16" fill="#f2cb5e" stroke="#1b1b2f" stroke-width="3.5"/><rect x="12" y="18" width="136" height="14" rx="7" fill="#ffe59a"/>
  <path d="M50 14 L52 86 M110 14 L108 86" stroke="#7a4a2a" stroke-width="4"/>
  <path d="M22 44 l14 -4 M70 58 l16 -3 M124 40 l14 4 M30 70 l12 2 M88 38 l12 -5 M128 68 l12 -2" stroke="#a87a22" stroke-width="2.5" stroke-linecap="round"/></svg>`;

/* ---------- főoldal ---------- */
function fooldal() {
  takarit(); Tar.betolt(); const p = Tar.p(); if (!p) return jatekosok();
  app.innerHTML = `
    <div class="banner"><h1>JÁTÉKTÁR</h1></div>
    <div class="toprow"><button class="cbtn blue small" id="prof">${esc(p.nev)} ▾</button><span class="ossz">★ ${Tar.osszCs()}</span>${nemaGomb()}</div>
    ${talk(veletlen(['Mit játsszunk ma?', 'Válassz egy játékot! Én mindegyikben jó vagyok. Majdnem.', 'Hajrá! Minden szinten csillag jár!']))}
    <button class="cbtn small kisero" id="kisero">Kísérőd: <b>${Kisero.nev()}</b> · csere: ${Kisero.nev(true)}</button>
    <a class="gcard" href="../szamhegy/" style="--c:#ffc82e;--d:#f08a00"><span class="gik">🧮</span><span class="gtx"><b>Számhegy</b><small>Keresztmatek ovistól géniuszig — a profilod ott is megvan!</small></span><span class="gpr">★ ${Object.values(p.csillag || {}).reduce((a, b) => a + b, 0)}</span></a>
    ${JATEKOK.map(j => { const o = Tar.jOssz(j.id); return `<button class="gcard" data-j="${j.id}" style="--c:${j.szin};--d:${j.szinD}">
      <span class="gik">${j.ikon}</span><span class="gtx"><b>${j.nev}</b><small>${esc(j.leiras)}</small></span>
      <span class="gpr">${o.db}/100<br>★ ${o.cs}</span></button>`; }).join('')}
    <div class="bujocska"><button class="bala" id="bala" aria-label="Szalmabála — ki bújt el mögötte?">
      <span class="bujt">${Kisero.svg('vidam', null, true)}<i class="tel">📱</i></span>${BALA_SVG}</button><div class="bubble bbub" id="bbub" hidden></div></div>`;
  document.getElementById('prof').onclick = jatekosok; nemaBekot();
  document.getElementById('kisero').onclick = () => {
    Tar.frissMent(() => { const pr = Tar.p(); pr.kisero = pr.kisero === 'liza' ? 'karcsi' : 'liza'; }); Hang.gyoz();
    fooldal(); Karcsi.mond(document.getElementById('talk'), Kisero.liza() ? 'Szia! Liza vagyok. Mostantól én segítek, ígérem, nem telefonozok közben!' : 'Itt vagyok újra! Kocka Karcsi szolgálatra kész!', 'huu', 'wow');
  };
  // bújócska (a rajzfilmből): a bála mögül néha kikukucskál a másik; ha megböködöd, előbújik
  document.getElementById('bala').onclick = e => {
    const b = e.currentTarget; if (b.classList.contains('elo')) return;
    b.classList.add('elo'); Hang.gyoz();
    const bb = document.getElementById('bbub');
    bb.textContent = Kisero.liza() ? veletlen(['Itt vagyok! Egész nap téged kerestelek, Liza!', 'Most én bújtam el! Írtam is. 😄'])
                                   : veletlen(['Ja, szia! Itt vagyok. Írtam is!', 'Psszt! Itt telefonozok a bála mögött. 📱']);
    bb.hidden = false; bb.classList.remove('pop'); void bb.offsetWidth; bb.classList.add('pop');
    setTimeout(() => { b.classList.remove('elo'); bb.hidden = true; }, 3800);
  };
  app.querySelectorAll('button.gcard').forEach(b => b.onclick = () => { Hang.tesz(); szintek(b.dataset.j); });
}

/* ---------- szintválasztó ---------- */
function szintek(jid) {
  takarit(); const j = JATEK(jid), ny = Tar.nyitott(jid);
  app.innerHTML = `
    <div class="fej"><button class="cbtn small" id="vissza" aria-label="Vissza">◀</button><h2 style="--c:${j.szin}">${j.ikon} ${j.nev.toUpperCase()}</h2>${nemaGomb()}</div>
    ${talk(ny > 1 ? `A ${ny}. szint vár rád!` : j.duma.start[0])}
    ${j.szabad ? `<div class="panel szabad"><b>Szabad játék</b><div class="gsor">${j.szabad().map((s, i) => `<button class="cbtn small" data-s="${i}">${s.nev}</button>`).join('')}</div></div>` : ''}
    <div class="panel"><div class="szgrid">${Array.from({ length: 100 }, (_, i) => { const n = i + 1, c = Tar.jcs(jid, n), zar = n > ny;
      return `<button class="sz ${c ? 'kesz' : ''} ${n === ny ? 'kov' : ''}" data-n="${n}" ${zar ? 'disabled' : ''} style="--c:${j.szin};--d:${j.szinD}">
        <span>${zar ? '🔒' : n}</span><i>${c ? '★'.repeat(c) : ''}</i></button>`; }).join('')}</div></div>`;
  document.getElementById('vissza').onclick = fooldal; nemaBekot();
  app.querySelectorAll('.sz:not([disabled])').forEach(b => b.onclick = () => { Hang.tesz(); jatek(jid, +b.dataset.n); });
  app.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { Hang.tesz(); jatek(jid, 0, j.szabad()[+b.dataset.s]); });
  const kov = app.querySelector('.sz.kov'); if (kov) kov.scrollIntoView({ block: 'center' });
}

/* ---------- játék ---------- */
// n = 0: szabad játék (egyedi beállítás, csillag nem jár)
function jatek(jid, n, egyedi) {
  takarit(); const j = JATEK(jid), kulcs = jid + ':' + n; probak[kulcs] = (probak[kulcs] || 0) + 1;
  app.innerHTML = `
    <div class="fej"><button class="cbtn small" id="vissza" aria-label="Vissza">◀</button><h2 style="--c:${j.szin}">${j.nev.toUpperCase()}<small>${n ? `${n}. szint · ${esc(j.cel(n))}` : `Szabad játék · ${esc(egyedi.nev)}`}</small></h2>${nemaGomb()}</div>
    ${talk(veletlen(j.duma.start))}
    <div class="info" id="info"></div>
    <div class="ter" id="ter"></div>
    <div class="kont" id="kont"></div>`;
  document.getElementById('vissza').onclick = () => szintek(jid); nemaBekot();
  const ter = document.getElementById('ter'), kont = document.getElementById('kont');
  const ctx = {
    szelesseg: Math.min(ter.clientWidth || innerWidth - 32, 560),
    // ennyi CSS-pixel magas lehet a pálya, ha alatta `foglal` px vezérlő is elfér (görgetés nélkül)
    helyMagas: foglal => Math.max(220, innerHeight - ter.getBoundingClientRect().top - foglal - 12),
    probalkozas: () => probak[kulcs],
    info: t => { document.getElementById('info').textContent = t; },
    mond: (t, h = 'vidam', a = '') => Karcsi.mond(document.getElementById('talk'), t, h, a),
    vaszon(w, h) {
      const cv = document.createElement('canvas'), d = devicePixelRatio || 1;
      cv.width = Math.round(w * d); cv.height = Math.round(h * d); cv.style.width = w + 'px'; cv.style.height = h + 'px';
      ter.appendChild(cv); const x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return { cv, x };
    },
    koppint(el, cb) { el.addEventListener('pointerdown', e => { const b = el.getBoundingClientRect(); cb(e.clientX - b.left, e.clientY - b.top); }); },
    // húzás: irányt jelent; folyamatos módban vízszintes húzás közben lépésenként mozgat (tetrisz)
    huzas(el, cb, koppCb, o = {}) {
      let s = null, lepett = 0;
      el.addEventListener('pointerdown', e => { s = { x: e.clientX, y: e.clientY, bx: e.clientX }; lepett = 0; el.setPointerCapture(e.pointerId); });
      el.addEventListener('pointermove', e => {
        if (!s) return;
        if (o.folyamatos) { const dx = e.clientX - s.bx; if (Math.abs(dx) >= o.lepes) { cb(dx > 0 ? 'jobb' : 'bal'); s.bx = e.clientX; lepett++; } return; }
        const dx = e.clientX - s.x, dy = e.clientY - s.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) > 24) { cb(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'jobb' : 'bal') : (dy > 0 ? 'le' : 'fel')); s = { x: e.clientX, y: e.clientY, bx: e.clientX }; lepett++; }
      });
      el.addEventListener('pointerup', e => {
        if (!s) return; const dx = e.clientX - s.x, dy = e.clientY - s.y;
        if (o.folyamatos && dy > 50 && Math.abs(dy) > Math.abs(dx)) cb('le');
        else if (!lepett && Math.hypot(dx, dy) < 12 && koppCb) koppCb();
        s = null;
      });
    },
    iranyGombok(cb) {
      kont.innerHTML = `<div class="dpad"><button class="cbtn" data-d="fel">▲</button><button class="cbtn" data-d="bal">◀</button><button class="cbtn" data-d="le">▼</button><button class="cbtn" data-d="jobb">▶</button></div>`;
      kont.querySelectorAll('button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); cb(b.dataset.d); }));
    },
    gombok(lista) {
      kont.innerHTML = `<div class="gsor">${lista.map(([t], i) => `<button class="cbtn" data-i="${i}">${t}</button>`).join('')}</div>`;
      kont.querySelectorAll('button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); lista[+b.dataset.i][1](); }));
    },
    billentyu(f) { addEventListener('keydown', f); kulcsok.push(f); },
    nyert(cs, uzenet) {
      if (n) Tar.jRogzit(jid, n, cs); Konfetti.lo(); Hang.gyoz();
      vegAblak(j, n, `<div class="stars">${[1, 2, 3].map(i => `<span class="${i <= cs ? 'on' : ''}">★</span>`).join('')}</div>`,
        uzenet || veletlen(j.duma.nyer), 'huu', 'SZUPER!', !!n, egyedi);
    },
    vesztett(uzenet) { vegAblak(j, n, '', uzenet || veletlen(j.duma.veszt), 'hoppa', 'HOPPÁ!', false, egyedi); }
  };
  // a vásznak a képregényes betűkkel rajzolnak: előbb töltődjenek be (különben sima betűvel jelenne meg)
  Promise.all(['400 30px "Lilita One"', '400 30px Bangers'].map(f => document.fonts.load(f))).catch(() => { })
    .then(() => { if (ter.isConnected && !futo) futo = j.indit(ctx, n, egyedi); });
}

function vegAblak(j, n, csillag, szoveg, hangulat, cim, nyert, egyedi) {
  const d = document.createElement('div'); d.className = 'modal';
  d.innerHTML = `<div class="mdoboz"><div class="burst">${cim}</div>${csillag}
    <div class="talk"><div class="mascot wow">${Kisero.svg(hangulat, (Tar.p() || {}).ruha)}</div><div class="bubble">${esc(szoveg)}</div>${nyert ? `<div class="mascot duo">${Kisero.svg('huu', null, true)}</div>` : ''}</div>
    <div class="mgomb"><button class="cbtn small" id="m-ujra">ÚJRA</button><button class="cbtn blue small" id="m-szint">SZINTEK</button>
    ${nyert && n < 100 ? '<button class="cbtn pink" id="m-kov">KÖVETKEZŐ ▶</button>' : ''}</div></div>`;
  app.appendChild(d);
  d.querySelector('#m-ujra').onclick = () => jatek(j.id, n, egyedi);
  d.querySelector('#m-szint').onclick = () => szintek(j.id);
  const k = d.querySelector('#m-kov'); if (k) k.onclick = () => jatek(j.id, n + 1);
}

Tar.betolt(); Tar.p() ? fooldal() : jatekosok();
