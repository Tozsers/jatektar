/* ============================================================
   KÖZÖS ALAP — Karcsi Játéktára
   A profilok UGYANABBAN a tárban vannak, mint a Számhegyé ('szamhegy-v2', azonos eredet: tozsers.github.io),
   így egy gyerek egy profillal játszik mindenben. A játékok csillagai a profil `jatek` mezőjébe kerülnek:
   p.jatek = { kigyo: { "1": 3, "2": 2 }, ... }. A Számhegy ezt a mezőt nem ismeri, de megőrzi.
   ============================================================ */
const OSZTALYOK = [
  ['ovoda','Óvoda','ovi'], ['1','1. osztály','also'], ['2','2. osztály','also'], ['3','3. osztály','felso'],
  ['4','4. osztály','felso'], ['5','5. osztály','profi'], ['6','6. osztály','profi'], ['7','7. osztály','zseni'],
  ['8','8. osztály','e1'], ['kozep','Középiskola','genius'], ['felnott','Felnőtt','genius']
];
const ajanlott = osz => (OSZTALYOK.find(o=>o[0]===osz)||[])[2] || 'felso';

const Tar = {
  k:'szamhegy-v2',
  d:{profilok:{}, aktiv:null, nema:false},
  betolt(){ try{ const x=JSON.parse(localStorage.getItem(this.k)); if(x) this.d={...this.d,...x}; }catch(e){} },
  ment(){ try{ localStorage.setItem(this.k, JSON.stringify(this.d)); }catch(e){} },
  // mentés előtt újraolvassuk, hogy egy másik lapon nyitott Számhegy változásait ne írjuk felül
  frissMent(fn){ this.betolt(); fn(); this.ment(); },
  uj(nev, osztaly){
    const id='p'+Date.now().toString(36)+Math.floor(Math.random()*1e4);
    this.frissMent(()=>{ this.d.profilok[id]={id, nev, osztaly, csillag:{}, ruha:null, utolso:ajanlott(osztaly),
      napi:{utolso:null, sorozat:0, legjobb:0, kesz:{}}, gyors:{}, jatek:{}}; this.d.aktiv=id; });
    return this.d.profilok[id];
  },
  torol(id){ this.frissMent(()=>{ delete this.d.profilok[id]; if(this.d.aktiv===id) this.d.aktiv=Object.keys(this.d.profilok)[0]||null; }); },
  valaszt(id){ this.frissMent(()=>{ this.d.aktiv=id; }); },
  p(){ return this.d.profilok[this.d.aktiv] || null; },
  jcs(jid, n, pr=this.p()){ return pr && pr.jatek && pr.jatek[jid] ? (pr.jatek[jid][n]||0) : 0; },
  jRogzit(jid, n, cs){
    let uj=false;
    this.frissMent(()=>{ const pr=this.p(); if(!pr) return; pr.jatek=pr.jatek||{}; const t=pr.jatek[jid]=pr.jatek[jid]||{};
      if(cs>(t[n]||0)){ t[n]=cs; uj=true; } });
    return uj;
  },
  jOssz(jid, pr=this.p()){ let db=0,cs=0; const t=pr&&pr.jatek&&pr.jatek[jid]; if(t) for(const k in t){ db++; cs+=t[k]; } return {db,cs}; },
  // a Számhegy csillagai + napi + minden játék
  osszCs(pr=this.p()){ if(!pr) return 0; let s=0; for(const k in pr.csillag||{}) s+=pr.csillag[k];
    for(const k in (pr.napi&&pr.napi.kesz)||{}) s+=pr.napi.kesz[k];
    for(const j in pr.jatek||{}) for(const k in pr.jatek[j]) s+=pr.jatek[j][k]; return s; },
  // a legmagasabb nyitott szint: az eddigi legjobb teljesített + 1
  nyitott(jid){ const t=(this.p()&&this.p().jatek&&this.p().jatek[jid])||{}; let m=0; for(const k in t) if(t[k]>0) m=Math.max(m,+k); return Math.min(100,m+1); }
};

/* seedelt véletlen: ugyanaz a szint mindig ugyanaz (akadályok, keverés) */
function rnd(seed){ let s=(seed>>>0)||1; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }

const Hang = {
  ctx:null,
  t(freqs, dur=.09, type='square', gap=.07, vol=.06){
    if(Tar.d.nema) return;
    try{
      this.ctx = this.ctx || new (window.AudioContext||window.webkitAudioContext)();
      const c=this.ctx, now=c.currentTime;
      freqs.forEach((f,i)=>{ const o=c.createOscillator(), g=c.createGain(); o.type=type; o.frequency.value=f;
        g.gain.setValueAtTime(vol, now+i*gap); g.gain.exponentialRampToValueAtTime(.0001, now+i*gap+dur);
        o.connect(g).connect(c.destination); o.start(now+i*gap); o.stop(now+i*gap+dur+.02); });
    }catch(e){}
  },
  tesz(){ this.t([660],.06,'triangle',0,.08); },
  vissza(){ this.t([420],.06,'triangle',0,.07); },
  jo(){ this.t([523,659,784],.12,'square',.08,.05); },
  rossz(){ this.t([300,220],.16,'sawtooth',.12,.05); },
  sugo(){ this.t([880,1175],.1,'sine',.09,.08); },
  gyoz(){ this.t([523,659,784,1047,784,1047],.16,'square',.11,.05); },
  tik(){ this.t([1200],.03,'square',0,.03); }
};

const Konfetti = (()=>{
  let cv=null, ctx=null, parts=[], fut=false;
  const szinek=['#2f9bff','#ff9a1f','#ff5d8f','#ffc82e','#a98bff','#34c759'];
  function lo(){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    cv=cv||document.getElementById('conf'); ctx=ctx||cv.getContext('2d');
    cv.width=innerWidth*devicePixelRatio; cv.height=innerHeight*devicePixelRatio;
    for(let i=0;i<140;i++) parts.push({x:innerWidth/2+(Math.random()-.5)*120,y:innerHeight*.35,vx:(Math.random()-.5)*12,vy:-Math.random()*13-4,
      s:6+Math.random()*7,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:szinek[i%szinek.length],l:1});
    if(!fut){ fut=true; requestAnimationFrame(lep); }
  }
  function lep(){
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); ctx.clearRect(0,0,innerWidth,innerHeight);
    parts.forEach(p=>{ p.vy+=.35; p.vx*=.99; p.x+=p.vx; p.y+=p.vy; p.r+=p.vr; p.l-=.006;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r); ctx.fillStyle=p.c; ctx.strokeStyle='#1b1b2f'; ctx.lineWidth=1.5;
      ctx.fillRect(-p.s/2,-p.s/3,p.s,p.s*.66); ctx.strokeRect(-p.s/2,-p.s/3,p.s,p.s*.66); ctx.restore(); });
    parts=parts.filter(p=>p.l>0 && p.y<innerHeight+40);
    if(parts.length) requestAnimationFrame(lep); else { fut=false; ctx.clearRect(0,0,innerWidth,innerHeight); }
  }
  return {lo};
})();

/* ============================================================
   KOCKA KARCSI + GARDRÓB
   RUHAK: kell = ennyi összes csillagnál nyílik. hatul: a test mögé, elol: a test elé rajzolt SVG (80×90-es rajzlap).
   ============================================================ */
const INK='#1b1b2f';
const RUHAK = [
  {id:'sapka', nev:'Baseball-sapka', kell:10,
    elol:`<path d="M10 18 Q12 0 40 0 Q68 0 70 18 Z" fill="#ff4d4d" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M40 16 L80 14 Q82 20 70 21 L40 20 Z" fill="#d63a3a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="40" cy="1" r="3" fill="#fff" stroke="${INK}" stroke-width="2"/>`},
  {id:'szemuveg', nev:'Napszemüveg', kell:25,
    elol:`<rect x="15" y="27" width="25" height="17" rx="7" fill="${INK}"/><rect x="42" y="27" width="25" height="17" rx="7" fill="${INK}"/><path d="M38 33 H44" stroke="${INK}" stroke-width="3"/><path d="M19 31 L26 31" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".8"/><path d="M46 31 L53 31" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>`},
  {id:'bajusz', nev:'Bajusz', kell:45,
    elol:`<path d="M20 50 Q30 41 40 48 Q50 41 60 50 Q52 55 40 51 Q28 55 20 50 Z" fill="#6b3f1d" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`},
  {id:'csokor', nev:'Csokornyakkendő', kell:70,
    elol:`<path d="M27 70 L40 77 L27 84 Z M53 70 L40 77 L53 84 Z" fill="#ff5d8f" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="40" cy="77" r="4" fill="#d63a6c" stroke="${INK}" stroke-width="2.5"/>`},
  {id:'kopeny', nev:'Szuperhős-köpeny', kell:100,
    hatul:`<path d="M10 22 Q-8 58 0 90 L40 80 L80 90 Q88 58 70 22 Z" fill="#ff4d4d" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`,
    elol:`<path d="M26 66 L40 74 L54 66" fill="none" stroke="#ffc82e" stroke-width="5" stroke-linecap="round"/>`},
  {id:'korona', nev:'Korona', kell:150,
    elol:`<path d="M16 14 L20 -6 L30 6 L40 -10 L50 6 L60 -6 L64 14 Z" fill="#ffc82e" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="40" cy="5" r="3.5" fill="#ff5d8f" stroke="${INK}" stroke-width="2"/><circle cx="26" cy="9" r="2.5" fill="#2f9bff" stroke="${INK}" stroke-width="1.5"/><circle cx="54" cy="9" r="2.5" fill="#34c759" stroke="${INK}" stroke-width="1.5"/>`},
  {id:'einstein', nev:'Einstein-frizura', kell:220,
    hatul:`<path d="M0 30 Q-6 14 8 12 Q4 -4 20 2 Q22 -12 36 -2 Q44 -14 54 -2 Q66 -10 66 4 Q84 2 76 18 Q90 26 80 36 L80 26 Q40 2 0 26 Z" fill="#f4f4f4" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
    elol:`<path d="M20 50 Q30 42 40 48 Q50 42 60 50 Q54 58 40 52 Q26 58 20 50 Z" fill="#f4f4f4" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`},
  {id:'csako', nev:'Csákó', kell:Infinity, rejtett:true,
    elol:`<path d="M14 12 L40 -6 L66 12 Z" fill="#ffc82e" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="40" cy="-7" r="4" fill="#ff5d8f" stroke="${INK}" stroke-width="2.5"/>`}
];
const RUHA = id => RUHAK.find(r=>r.id===id);

const Karcsi = {
  // liza = true: Liza, Karcsi barátnője (a „Liza, merre vagy?” rajzfilmből) — rózsaszín, copfos, masnis, szempillás
  svg(hangulat='vidam', ruhaId=null, liza=false){
    const ru = ruhaId ? RUHA(ruhaId) : null;
    const [test, also] = liza ? ['#ff7eb6', '#d9488a'] : ['#2f9bff', '#1a6fd1'];
    const copf = liza ? `<path d="M10 22 Q-8 18 -6 36 Q-5 50 6 46 Q2 36 12 30 Z M70 22 Q88 18 86 36 Q85 50 74 46 Q78 36 68 30 Z" fill="#8a5230" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="8" cy="23" r="4" fill="#ff5d9e" stroke="${INK}" stroke-width="2"/><circle cx="72" cy="23" r="4" fill="#ff5d9e" stroke="${INK}" stroke-width="2"/>` : '';
    const frufru = liza ? `<path d="M10 20 Q16 6 30 12 Q40 4 50 12 Q64 6 70 20 Q58 16 50 19 Q40 13 30 19 Q20 16 10 20 Z" fill="#8a5230" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>` : '';
    const masni = liza && !(ru && ru.elol) ? `<path d="M56 6 L45 -1 L45 13 Z M56 6 L67 -1 L67 13 Z" fill="#ff5d9e" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="56" cy="6" r="3.2" fill="#e2476e" stroke="${INK}" stroke-width="2"/>` : '';
    const pilla = liza ? `<path d="M19 31 L14 28 M20 27 L16 22 M61 31 L66 28 M60 27 L64 22" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>` : '';
    const szaj = {
      vidam:`<path d="M27 52 Q40 63 53 52" fill="#7a1f3a" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M33 56 Q40 60 47 56" fill="#ff8fab"/>`,
      hoppa:`<ellipse cx="40" cy="55" rx="6" ry="7" fill="#7a1f3a" stroke="${INK}" stroke-width="3"/>`,
      gondol:`<path d="M30 55 L50 52" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
      huu:`<path d="M26 50 Q40 70 54 50 Z" fill="#7a1f3a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M32 57 Q40 63 48 57" fill="#ff8fab"/>`
    }[hangulat];
    const szemoldok = hangulat==='hoppa' ? `<path d="M20 22 L33 27 M60 22 L47 27" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`
                     : hangulat==='gondol' ? `<path d="M20 25 L33 23 M47 21 L60 25" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`
                     : `<path d="M21 22 Q27 17 33 22 M47 22 Q53 17 59 22" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
    const g = hangulat==='gondol';
    return `<svg viewBox="0 -12 80 102" aria-hidden="true"><g class="body">
      <ellipse cx="40" cy="86" rx="24" ry="4" fill="rgba(27,27,47,.25)"/>
      ${ru&&ru.hatul||''}${copf}
      <path d="M14 74 L10 84 M66 74 L70 84" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <rect x="6" y="10" width="68" height="66" rx="14" fill="${test}" stroke="${INK}" stroke-width="3.5"/>
      <rect x="6" y="10" width="68" height="25" rx="14" fill="rgba(255,255,255,.28)"/>
      <path d="M9 68 Q40 78 71 68" stroke="${also}" stroke-width="5" fill="none"/>
      ${frufru}${szemoldok}${pilla}
      <circle cx="28" cy="36" r="9" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="52" cy="36" r="9" fill="#fff" stroke="${INK}" stroke-width="3"/>
      <circle cx="${g?31:29}" cy="${g?33:37}" r="4" fill="${INK}"/><circle cx="${g?55:53}" cy="${g?33:37}" r="4" fill="${INK}"/>
      <circle cx="30" cy="35" r="1.4" fill="#fff"/><circle cx="54" cy="35" r="1.4" fill="#fff"/>
      <g class="lid"><rect x="18" y="26" width="20" height="20" rx="9" fill="${test}"/><rect x="42" y="26" width="20" height="20" rx="9" fill="${test}"/></g>
      <circle cx="17" cy="50" r="4.5" fill="#ff8fab" opacity=".7"/><circle cx="63" cy="50" r="4.5" fill="#ff8fab" opacity=".7"/>
      ${szaj}
      ${ru&&ru.elol||''}${masni}
    </g></svg>`;
  },
  mond(el, szoveg, hangulat='vidam', anim=''){
    if(!el) return;
    const m=el.querySelector('.mascot'), b=el.querySelector('.bubble');
    m.innerHTML=Kisero.svg(hangulat, (Tar.p()||{}).ruha); m.className='mascot '+anim;
    b.textContent=szoveg; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  }
};
// a játékos kísérője: Karcsi (alap) vagy Liza — profilonként (p.kisero), a Számhegy nem nyúl hozzá
const Kisero = {
  liza(){ return (Tar.p()||{}).kisero === 'liza'; },
  nev(masik=false){ return this.liza() !== masik ? 'Liza' : 'Karcsi'; },
  svg(hangulat='vidam', ruhaId=null, masik=false){ return Karcsi.svg(hangulat, masik ? null : ruhaId, this.liza() !== masik); }
};
const veletlen = t => t[Math.floor(Math.random()*t.length)];
