'use strict';
/* Sztuczna inteligencja – ćwiczenia praktyczne. Czysty JavaScript, bez bibliotek. */

const KEY='ai-cwiczenia-v2';
const state={best:{},tried:{}};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null'); if(s){state.best=s.best||{}; state.tried=s.tried||{}}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
const $=s=>document.querySelector(s);
function h(html){const t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstElementChild}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
let cleanup=null, current='intro';

/* ---------- wspólne elementy ---------- */
function result(body,id,score,msg,again){
  const got=finish(id,score);
  body.innerHTML='';
  const nxt=nextId(id);
  const r=h(`<div class="result"><p class="res-score"><span>${got}</span> / 25 pkt</p><p class="res-msg">${msg}</p><div class="row"><button class="btn alt" data-a="again">Powtórz ćwiczenie</button>${nxt?'<button class="btn" data-a="next">Następne ćwiczenie</button>':'<button class="btn" data-a="lib">Przejdź do zapytań do wypróbowania</button>'}</div></div>`);
  body.append(r);
  r.querySelector('[data-a=again]').onclick=again;
  const n=r.querySelector('[data-a=next],[data-a=lib]'); n.onclick=()=>nxt?openStation(nxt):showLibrary(); n.focus();
}
function finish(id,score){
  score=Math.max(0,Math.min(25,Math.round(score)));
  if(state.best[id]==null||score>state.best[id]) state.best[id]=score;
  save(); renderNav(); return score;
}
function quiz(body,id,qs,{noShuffle=false,intro=''}={}){
  let i=0,ok=0; const list=noShuffle?qs:shuffle(qs);
  const restart=()=>quiz(body,id,qs,{noShuffle,intro});
  function show(){
    const q=list[i]; body.innerHTML='';
    if(intro&&i===0) body.append(h(`<p class="lead">${intro}</p>`));
    body.append(h(`<p class="progress">Pytanie ${i+1} z ${list.length}</p>`));
    if(q.mock) body.append(h(q.mock));
    body.append(h(`<p class="q">${q.q}</p>`));
    const opts=h('<div class="opts"></div>'); body.append(opts);
    const order=q.fixed?q.o.map((t,k)=>k):shuffle(q.o.map((t,k)=>k));
    order.forEach(k=>{
      const b=h(`<button class="opt">${q.o[k]}</button>`);
      b.onclick=()=>{
        const right=k===q.a; if(right) ok++;
        opts.querySelectorAll('button').forEach((x,n)=>{x.disabled=true; if(order[n]===q.a) x.classList.add('right')});
        if(!right) b.classList.add('wrong');
        body.append(h(`<div class="feedback${right?'':' bad'}"><b>${right?'Dobrze.':'Niestety nie.'}</b>${q.why}</div>`));
        const nx=h(`<div class="row"><button class="btn">${i+1<list.length?'Dalej':'Zobacz wynik'}</button></div>`);
        body.append(nx); const nb=nx.querySelector('button'); nb.focus();
        nb.onclick=()=>{i++; if(i<list.length) show(); else result(body,id,ok/list.length*25,`Poprawne odpowiedzi: ${ok} z ${list.length}.`,restart)};
      };
      opts.append(b);
    });
  }
  show();
}
function sortTask(body,id,items,bins,intro,endMsg){
  const restart=()=>sortTask(body,id,items,bins,intro,endMsg);
  const I=shuffle(items); let sel=null,left=I.length,bad=0; const done=[];
  body.innerHTML=`<p class="lead">${intro} Kliknij element, a potem kategorię. Możesz też przeciągnąć element myszką.</p>`;
  const desk=h('<div class="desk sortdesk"></div>'); body.append(desk);
  const bx=h('<div class="folders"></div>'); body.append(bx);
  const hint=h('<p class="hint" aria-live="polite"></p>'); body.append(hint);
  I.forEach((x,k)=>{const b=h(`<button class="file card-item" draggable="true" data-k="${k}">${x.n}</button>`);
    b.onclick=()=>{desk.querySelectorAll('.file').forEach(y=>y.classList.remove('sel')); sel=k; b.classList.add('sel'); hint.textContent='Teraz kliknij kategorię.'};
    b.ondragstart=e=>{e.dataTransfer.setData('text/plain',String(k)); sel=k}; desk.append(b)});
  bins.forEach(([v,n])=>{const b=h(`<button class="folder">${n}<span class="cnt">0</span></button>`); let c=0;
    const drop=k=>{if(k==null){hint.textContent='Najpierw kliknij element.';return} const x=I[k], el=desk.querySelector(`[data-k="${k}"]`); if(!el) return;
      const right=x.v===v; if(!right) bad++;
      el.remove(); c++; b.querySelector('.cnt').textContent=c; left--; sel=null;
      const label=bins.find(z=>z[0]===x.v)[1];
      done.push(`<li class="${right?'':'miss'}"><b>${x.n}</b> — ${label.toLowerCase()}. ${x.why}</li>`);
      hint.textContent=right?'Dobrze.':`Nie. Właściwa kategoria: ${label}. ${x.why}`;
      if(!left) setTimeout(()=>{result(body,id,(I.length-bad)/I.length*25,`Dobre decyzje: ${I.length-bad} z ${I.length}. ${endMsg}`,restart); body.querySelector('.result').append(h(`<ul class="whylist">${done.join('')}</ul>`))},600)};
    b.onclick=()=>drop(sel); b.ondragover=e=>{e.preventDefault(); b.classList.add('over')}; b.ondragleave=()=>b.classList.remove('over');
    b.ondrop=e=>{e.preventDefault(); b.classList.remove('over'); drop(+e.dataTransfer.getData('text/plain'))}; bx.append(b)});
}

/* ---------- 1. Gdzie jest AI ---------- */
const WHERE=[
 {n:'Filtr spamu w poczcie e-mail',v:'t',why:'Uczy się na milionach wiadomości, co jest spamem.'},
 {n:'Podpowiedzi następnego słowa w klawiaturze telefonu',v:'t',why:'Program przewiduje, jakie słowo napiszesz.'},
 {n:'Galeria zdjęć, która sama grupuje zdjęcia według osób',v:'t',why:'Rozpoznawanie twarzy to typowe zastosowanie AI.'},
 {n:'Nawigacja, która omija korki',v:'t',why:'Przewiduje ruch na drogach na podstawie danych od wielu kierowców.'},
 {n:'Propozycje filmów w serwisie z filmami',v:'t',why:'Uczy się na tym, co oglądasz ty i podobne osoby.'},
 {n:'Tłumacz tekstu ze zdjęcia, np. z polskiego na ukraiński',v:'t',why:'Najpierw rozpoznaje tekst na zdjęciu, potem go tłumaczy.'},
 {n:'Kalkulator w telefonie',v:'n',why:'Liczy według stałych zasad matematyki. Niczego się nie uczy.'},
 {n:'Budzik ustawiony na 6:30',v:'n',why:'Wykonuje tylko to, co ustawisz.'},
 {n:'Szukanie słowa na stronie skrótem Ctrl + F',v:'n',why:'Szuka dokładnie tych samych liter. To zwykłe porównywanie tekstu.'},
 {n:'Sumowanie kolumny w Excelu funkcją SUMA',v:'n',why:'Funkcja działa według stałych zasad. AI może jednak pomóc ją napisać.'}
];

/* ---------- 2. Jak działa czat ---------- */
const QHOW=[
 {q:'Jak czat AI tworzy odpowiedź?',o:['Przewiduje kolejne słowa na podstawie tekstów, na których się uczył','Szuka gotowej odpowiedzi w jednej dużej bazie','Przekazuje pytanie człowiekowi, który odpisuje'],a:0,why:'Czat układa odpowiedź słowo po słowie. Wybiera słowa, które najlepiej pasują do pytania.'},
 {q:'Czy czat AI zawsze sprawdza, czy to, co pisze, jest prawdą?',o:['Nie. Może napisać nieprawdę, która brzmi bardzo wiarygodnie','Tak, każdą odpowiedź sprawdza w internecie','Tak, ale tylko w języku angielskim'],a:0,why:'Ładny i pewny tekst nie musi być prawdziwy. Takie zmyślenia nazywamy halucynacjami.'},
 {q:'Zadajesz czatowi dwa razy to samo pytanie. Co się stanie?',o:['Odpowiedzi mogą być trochę inne','Odpowiedź będzie zawsze identyczna','Czat pokaże komunikat o błędzie'],a:0,why:'To normalne. Możesz poprosić o kilka wersji i wybrać najlepszą.'},
 {q:'Pytasz o wydarzenie z zeszłego tygodnia. Czat nie ma dostępu do internetu. Co się stanie?',o:['Może nie znać odpowiedzi albo podać stare informacje','Zawsze zna najnowsze wiadomości','Odpowie poprawnie, ale krócej'],a:0,why:'Czat zna tylko teksty sprzed określonej daty. Niektóre czaty umieją szukać w internecie i wtedy podają źródła.'},
 {q:'Czat podał źródło: tytuł artykułu i link. Co robisz?',o:['Otwieram link i sprawdzam, czy artykuł istnieje','Wierzę, bo czat podał link','Kopiuję link do dokumentu bez sprawdzania'],a:0,why:'Czat potrafi wymyślić tytuł, autora, a nawet link. Źródło trzeba otworzyć.'},
 {q:'Czy czat pamięta twoje wcześniejsze rozmowy?',o:['To zależy od narzędzia i jego ustawień','Tak, zawsze pamięta wszystko','Nie, nigdy niczego nie pamięta'],a:0,why:'Niektóre czaty mają funkcję pamięci, inne nie. Warto sprawdzić ustawienia.'},
 {q:'W czym czat AI pomaga najlepiej?',o:['W pisaniu, poprawianiu, tłumaczeniu i wyjaśnianiu','W podejmowaniu ważnych decyzji za ciebie','W dawaniu pewnych porad prawnych i medycznych'],a:0,why:'AI dobrze pomaga z tekstem. Decyzje i odpowiedzialność zostają po twojej stronie.'}
];

/* ---------- 3. Budowa polecenia ---------- */
const BUILD=[
 {s:'Potrzebujesz ogłoszenia o obowiązkowym szkoleniu BHP dla pracowników biura.',c:[
  ['Zadanie',[['Napisz ogłoszenie o szkoleniu BHP dla pracowników.',1],['Szkolenie BHP.',0],['Co wiesz o BHP?',0]],'Zadanie mówi wprost, co ma powstać. „Co wiesz o BHP?” to inne pytanie.'],
  ['Kontekst',[['Szkolenie jest obowiązkowe. Termin: 12 listopada, 9:00, sala konferencyjna, 3 godziny.',1],['Szkolenie odbędzie się w listopadzie.',0],['Szkolenie jest ważne i wszyscy muszą przyjść.',0]],'Bez daty, godziny i miejsca AI je wymyśli albo zostawi puste miejsce.'],
  ['Forma',[['Najwyżej 5 zdań, uprzejmy ton, na końcu prośba o potwierdzenie obecności.',1],['Napisz ładnie.',0],['Napisz jak najwięcej o BHP.',0]],'Długość i ton oszczędzają czas na poprawki.'],
  ['Rola',[['Piszesz jako pracownik działu kadr do kolegów z biura.',1],['Jesteś ekspertem od wszystkiego.',0],['Jesteś najlepszą sztuczną inteligencją.',0]],'Rola pomaga dobrać styl i słowa. Pochwały dla AI nic nie dają.']]},
 {s:'Chcesz przećwiczyć rozmowę kwalifikacyjną po polsku na stanowisko asystentki biura.',c:[
  ['Zadanie',[['Przeprowadź ze mną próbną rozmowę kwalifikacyjną.',1],['Pomóż mi.',0],['Napisz artykuł o rozmowach kwalifikacyjnych.',0]],'Zadanie musi opisywać to, czego naprawdę potrzebujesz: rozmowę, a nie artykuł.'],
  ['Kontekst',[['Stanowisko: asystentka biura w firmie transportowej. Mam 5 lat doświadczenia z Ukrainy. Mój poziom polskiego: B1.',1],['Szukam pracy w Polsce.',0],['Mam dobre CV.',0]],'Doświadczenie i poziom języka pomogą AI zadać realistyczne pytania.'],
  ['Forma',[['Zadawaj pytania po jednym. Po każdej odpowiedzi popraw moje błędy językowe.',1],['Napisz od razu wszystkie pytania i odpowiedzi.',0],['Odpowiadaj po angielsku.',0]],'Rozmowa krok po kroku jest podobna do prawdziwej. Poprawki pomagają w nauce polskiego.'],
  ['Rola',[['Jesteś życzliwym, ale wymagającym rekruterem.',1],['Jesteś moim kolegą.',0],['Jesteś wyszukiwarką internetową.',0]],'Rekruter zada pytania tak jak prawdziwa osoba w firmie.']]}
];
function buildTask(body,id,SC,endMsg){
  const restart=()=>buildTask(body,id,SC,endMsg); let si=0,pts=0,tot=0;
  function show(){
    const S=SC[si]; body.innerHTML='';
    body.append(h(`<p class="progress">Sytuacja ${si+1} z ${SC.length}</p>`));
    body.append(h(`<p class="q">${S.s}</p>`));
    body.append(h('<p class="lead">Zbuduj polecenie. W każdym wierszu wybierz najlepszy fragment. Na dole zobaczysz całe polecenie.</p>'));
    const pick=Array(S.c.length).fill(null);
    const groups=h('<div class="build"></div>'); body.append(groups);
    const prev=h('<div class="prompt-prev"><p class="pp-l">Twoje polecenie</p><p class="pp-t">…</p></div>'); body.append(prev);
    const upd=()=>{prev.querySelector('.pp-t').textContent=pick.map((p,k)=>p==null?'':S.c[k][1][p][0]).filter(Boolean).join(' ')||'…'};
    S.c.forEach(([label,opts],ci)=>{const g=h(`<fieldset class="bg"><legend>${label}</legend><div class="chips"></div></fieldset>`); const ch=g.querySelector('.chips');
      shuffle(opts.map((_,k)=>k)).forEach(k=>{const b=h(`<button class="chip" aria-pressed="false">${opts[k][0]}</button>`); b._k=k;
        b.onclick=()=>{ch.querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true'); pick[ci]=k; upd()}; ch.append(b)});
      groups.append(g)});
    const ctl=h('<div class="row"><button class="btn">Sprawdź</button></div>'); body.append(ctl);
    const fb=h('<div aria-live="polite"></div>'); body.append(fb);
    ctl.querySelector('button').onclick=()=>{
      if(pick.some(p=>p==null)){fb.innerHTML='<div class="feedback bad"><b>Wybierz fragment w każdym wierszu.</b></div>';return}
      let good=0; const out=[];
      groups.querySelectorAll('fieldset').forEach((g,ci)=>{const ok=S.c[ci][1][pick[ci]][1]===1; if(ok) good++;
        g.querySelectorAll('.chip').forEach(b=>{b.disabled=true; if(S.c[ci][1][b._k][1]) b.classList.add('c-ok'); else if(b._k===pick[ci]) b.classList.add('c-bad')});
        out.push(`<li class="${ok?'':'miss'}"><b>${S.c[ci][0]}:</b> ${S.c[ci][2]}</li>`)});
      pts+=good; tot+=S.c.length; ctl.remove();
      fb.innerHTML=`<div class="feedback${good===S.c.length?'':' bad'}"><b>Dobre wybory: ${good} z ${S.c.length}.</b><ul class="whylist">${out.join('')}</ul></div>`;
      const nx=h(`<div class="row"><button class="btn">${si+1<SC.length?'Następna sytuacja':'Zobacz wynik'}</button></div>`); fb.append(nx);
      const nb=nx.querySelector('button'); nb.focus();
      nb.onclick=()=>{si++; if(si<SC.length) show(); else result(body,id,pts/tot*25,`Dobre wybory: ${pts} z ${tot}. ${endMsg}`,restart)};
    };
  }
  show();
}

/* ---------- 4. Które polecenie lepsze ---------- */
const ab=(a,b)=>`<div class="ab"><div class="abc"><p class="abl">Polecenie A</p><p>${a}</p></div><div class="abc"><p class="abl">Polecenie B</p><p>${b}</p></div></div>`;
const QAB=[
 {mock:ab('„Napisz maila.”','„Napisz krótki mail do klienta. Przeproś za 3 dni opóźnienia w dostawie. Ton uprzejmy, najwyżej 5 zdań.”'),q:'Które polecenie da lepszy wynik?',o:['Polecenie A','Polecenie B'],a:1,fixed:1,why:'B mówi, do kogo, w jakiej sprawie, jakim tonem i jak długo. Po poleceniu A trzeba będzie wszystko poprawiać.'},
 {mock:ab('„Wyjaśnij prostymi słowami, czym jest inflacja. Daj przykład z cenami w sklepie. Najwyżej 4 zdania.”','„Inflacja?”'),q:'Które polecenie da lepszy wynik?',o:['Polecenie A','Polecenie B'],a:0,fixed:1,why:'A określa poziom trudności, przykład i długość odpowiedzi.'},
 {mock:ab('„Zrób plan.”','„Przygotuj plan nauki Excela na 7 dni dla osoby początkującej: 30 minut dziennie, w tabeli z dniem i tematem.”'),q:'Które polecenie da lepszy wynik?',o:['Polecenie A','Polecenie B'],a:1,fixed:1,why:'B podaje cel, poziom, czas i wygląd wyniku.'},
 {mock:ab('„Popraw błędy w tym tekście, ale nie zmieniaj stylu. Pod tekstem wypisz, co zmieniasz.”','„Popraw.”'),q:'Które polecenie da lepszy wynik?',o:['Polecenie A','Polecenie B'],a:0,fixed:1,why:'A chroni twój styl i pokazuje zmiany. Dzięki temu uczysz się na swoich błędach.'},
 {mock:ab('„Post o kwiaciarni.”','„Napisz post na Facebooka: otwarcie kwiaciarni Kwiatek w Bielsku-Białej 15 listopada. 3 zdania, ciepły ton, zaproszenie.”'),q:'Które polecenie da lepszy wynik?',o:['Polecenie A','Polecenie B'],a:1,fixed:1,why:'B podaje fakty, których AI nie może zgadnąć: nazwę, miasto i datę.'},
 {mock:ab('„W kolumnie A mam nazwiska, w B kwoty. Mam polskiego Excela. Podaj formułę, która zsumuje kwoty większe niż 1000 zł.”','„Podaj formułę do Excela.”'),q:'Które polecenie da lepszy wynik?',o:['Polecenie A','Polecenie B'],a:0,fixed:1,why:'A opisuje dane i warunek. Informacja o polskim Excelu sprawi, że AI użyje polskich nazw funkcji.'}
];

/* ---------- 5. Co dopisać ---------- */
const QFIX=[
 {q:'Polecenie: „Napisz moje CV”. AI wymyśliło doświadczenie, którego nie masz. Co dopisać do polecenia?',o:['Swoje prawdziwe doświadczenie, wykształcenie i umiejętności','Słowo „lepiej”','Słowo „proszę”'],a:0,why:'AI nie zna twojego życiorysu. Podaj fakty, ale nie podawaj numeru PESEL, adresu ani numeru paszportu.'},
 {q:'Polecenie: „Streść ten artykuł”. Streszczenie jest prawie tak długie jak artykuł. Co dopisać?',o:['Długość, np. „w 5 punktach”','Prośbę o więcej szczegółów','Nic, trzeba skrócić samodzielnie'],a:0,why:'Gdy podasz długość (5 punktów, 3 zdania), łatwo kontrolujesz wynik.'},
 {q:'Polecenie: „Napisz zaproszenie”. Tekst jest bardzo oficjalny, a chodzi o urodziny kolegi z pracy. Co dopisać?',o:['Okazję i ton: „na urodziny kolegi, swobodnie i wesoło”','Słowo „krócej”','Nazwę firmy'],a:0,why:'Okazja i ton zmieniają styl całego tekstu.'},
 {q:'Polecenie: „Przetłumacz na polski”. Tłumaczenie maila do kontrahenta jest zbyt potoczne. Co dopisać?',o:['Kontekst: „oficjalny mail do kontrahenta, styl biznesowy”','„Przetłumacz lepiej”','„Przetłumacz szybciej”'],a:0,why:'To samo zdanie można przetłumaczyć na kilka sposobów. Kontekst pomaga wybrać właściwy.'},
 {q:'Polecenie: „Jakie są zasady zwolnienia lekarskiego?”. Odpowiedź brzmi pewnie, ale nie wiesz, czy jest aktualna. Co zrobić?',o:['Poprosić o źródła, a potem sprawdzić je na stronie ZUS lub gov.pl','Zapytać „Czy na pewno?” i uwierzyć','Nic nie robić, bo odpowiedź brzmi pewnie'],a:0,why:'Przepisy się zmieniają. Pewny ton nie zastąpi sprawdzenia w oficjalnym źródle.'}
];

/* ---------- 6. Weryfikacja odpowiedzi ---------- */
const ANSWER=[
 ['Pracownik zatrudniony na umowę o pracę ma prawo do płatnego urlopu wypoczynkowego.',0,'To ogólna i prawdziwa informacja.'],
 ['Liczba dni urlopu zależy od stażu pracy: 20 dni przy stażu krótszym niż 10 lat i 26 dni przy stażu co najmniej 10 lat.',2,'To zgadza się z Kodeksem pracy. Liczby zawsze warto sprawdzać, dlatego to zdanie nie daje ani punktów, ani minusów.'],
 ['Te zasady wprowadziła ustawa o urlopach pracowniczych z 12 marca 2023 r.',1,'Taka ustawa nie istnieje. Urlopy reguluje Kodeks pracy. Dokładna data i nazwa brzmią wiarygodnie, ale są zmyślone.'],
 ['Według badania Instytutu Rynku Pracy z 2024 r. aż 37% Polaków nie wykorzystuje całego urlopu.',1,'Dokładny procent i nazwa instytutu bez linku do badania to typowe zmyślenie. Nie cytuj tego bez sprawdzenia.'],
 ['Niewykorzystany urlop przepada po 6 miesiącach.',1,'Nieprawda. Zaległy urlop trzeba wykorzystać do 30 września następnego roku. Prawo do niego przedawnia się dopiero po 3 latach.'],
 ['Warto zaplanować urlop wcześniej i ustalić termin z przełożonym.',0,'Zwykła, rozsądna rada.'],
 ['Szczegóły znajdziesz na stronie www.urlopy-gov.pl/przepisy.',1,'To nie jest strona rządowa. Adresy stron urzędów kończą się na gov.pl, np. www.gov.pl.'],
 ['Jeśli masz wątpliwości, zapytaj w dziale kadr.',0,'Dobra rada. Kadry znają zasady w twojej firmie.']
];
function verifyTask(body,id,ANS,topic,endMsg){
  const restart=()=>verifyTask(body,id,ANS,topic,endMsg);
  const flags=ANS.filter(a=>a[1]===1).length;
  body.innerHTML=`<p class="lead">${topic} Odpowiedź brzmi pewnie, ale ma ${flags} błędy lub zmyślenia. Kliknij zdania, które są nieprawdziwe albo wyglądają na zmyślone. Potem kliknij „Sprawdź”.</p>`;
  const box=h('<div class="chatans"><p class="ca-l">Odpowiedź czatu AI</p><p class="ca-t"></p></div>'); body.append(box);
  const t=box.querySelector('.ca-t');
  ANS.forEach(a=>{const s=h(`<button class="hs" aria-pressed="false">${a[0]}</button>`); s._a=a; s.onclick=()=>s.setAttribute('aria-pressed',String(s.getAttribute('aria-pressed')!=='true')); t.append(s); t.append(document.createTextNode(' '))});
  const ctl=h('<div class="row"><button class="btn">Sprawdź</button></div>'); body.append(ctl);
  ctl.querySelector('button').onclick=()=>{
    let f=0,w=0; const out=[];
    t.querySelectorAll('.hs').forEach(s=>{const on=s.getAttribute('aria-pressed')==='true', a=s._a; s.disabled=true;
      if(a[1]===1){if(on){f++; s.classList.add('hs-ok')} else s.classList.add('hs-miss'); out.push(`<li class="${on?'':'miss'}"><b>${on?'Znalezione':'Pominięte'}:</b> ${a[2]}</li>`)}
      else if(a[1]===0&&on){w++; s.classList.add('hs-bad'); out.push(`<li class="miss"><b>Niepotrzebnie zaznaczone:</b> ${a[2]}</li>`)}
      else if(a[1]===2){out.push(`<li><b>Do sprawdzenia, ale prawdziwe:</b> ${a[2]}</li>`)}});
    ctl.remove();
    result(body,id,(f-0.5*w)/flags*25,`Znalezione błędy: ${f} z ${flags}. Niepotrzebne zaznaczenia: ${w}. ${endMsg}`,restart);
    const r=body.querySelector('.result'); box.style.marginTop='20px'; r.append(box); r.append(h(`<ul class="whylist">${out.join('')}</ul>`));
  };
}

/* ---------- 7. Co można wkleić ---------- */
const PASTE=[
 {n:'Ogólne ogłoszenie o zebraniu zespołu',v:'t',why:'Nie ma tu danych osobowych ani tajemnic firmy.'},
 {n:'Pytanie, jak działa funkcja WYSZUKAJ.PIONOWO w Excelu',v:'t',why:'To pytanie o wiedzę ogólną.'},
 {n:'Nazwy kolumn z arkusza, bez danych',v:'t',why:'Do napisania formuły wystarczą nazwy kolumn.'},
 {n:'Tekst skargi, w którym nazwiska zmienione są na „Klient A” i „Pracownik B”',v:'t',why:'Po usunięciu nazwisk tekst nie zdradza, kogo dotyczy.'},
 {n:'Publiczny artykuł z internetu do streszczenia',v:'t',why:'Ten tekst jest dostępny dla wszystkich.'},
 {n:'Umowa z klientem, z jego danymi i cenami',v:'n',why:'Dane klienta i ceny to informacje poufne.'},
 {n:'Lista pracowników z numerami PESEL',v:'n',why:'Danych osobowych pracowników nie wolno wklejać do zewnętrznych narzędzi.'},
 {n:'Hasło do systemu firmy, „żeby AI pomogło się zalogować”',v:'n',why:'Hasła nie wpisujemy do żadnego czatu.'},
 {n:'Zdjęcie paszportu albo karty pobytu, „żeby AI odczytało dane”',v:'n',why:'Dokumenty tożsamości to bardzo wrażliwe dane.'},
 {n:'Wewnętrzny raport finansowy firmy',v:'n',why:'To informacje poufne. Używaj tylko narzędzi, na które pozwala firma.'}
];

/* ---------- 8. Zastosowania ---------- */
const QUSE=[
 {q:'Dlaczego w pytaniu o formułę warto napisać „mam polskiego Excela”?',o:['AI poda polskie nazwy funkcji i średniki zamiast przecinków','Formuła będzie liczyć szybciej','Bez tego AI nie odpowie na pytanie'],a:0,why:'W polskim Excelu jest np. SUMA.JEŻELI zamiast SUMIF. Formuła w złej wersji nie zadziała.'},
 {q:'AI podało formułę do arkusza. Co robisz dalej?',o:['Sprawdzam ją na kilku wierszach, dla których znam wynik','Kopiuję ją do całego arkusza i wysyłam raport','Nic, bo AI nie myli się w formułach'],a:0,why:'Test na znanych danych szybko pokaże błąd.'},
 {q:'Potrzebujesz streszczenia długiego, publicznego raportu w PDF. Co robisz?',o:['Dodaję plik do czatu, proszę o 5 punktów i sprawdzam liczby w oryginale','Proszę o streszczenie, ale nie dodaję pliku','Przepisuję cały raport ręcznie do czatu'],a:0,why:'Większość czatów przyjmuje pliki. Streszczenie to dobry początek, ale liczby trzeba porównać z oryginałem.'},
 {q:'Tworzysz grafikę na plakat o pikniku firmowym. Co opisać w poleceniu?',o:['Styl, kolory, elementy obrazka i format, np. pionowy','Tylko słowo „plakat”','Postać ze znanej bajki, którą wszyscy lubią'],a:0,why:'Dokładny opis oznacza mniej prób. Postacie z bajek i filmów są chronione prawem autorskim.'},
 {q:'Szukasz informacji o aktualnych przepisach dotyczących zasiłku. Co robisz?',o:['Pytam AI, a potem sprawdzam informacje na gov.pl lub w ZUS','Wierzę AI, bo odpowiedź jest szczegółowa','Pytam tylko znajomych w mediach społecznościowych'],a:0,why:'AI pomoże zrozumieć temat. Ważne są jednak informacje z oficjalnych źródeł.'},
 {q:'AI napisało dobry mail do klienta. Co robisz przed wysłaniem?',o:['Czytam całość i sprawdzam fakty, imiona i daty','Wysyłam od razu','Dopisuję na końcu „tekst napisało AI”'],a:0,why:'Pod mailem podpisujesz się ty. AI mogło pomylić nazwisko albo dopisać coś, czego nie obiecujesz.'},
 {q:'Dostajesz pismo z urzędu i nie rozumiesz go. Co robisz?',o:['Wklejam treść bez danych osobowych i proszę o wyjaśnienie po ukraińsku','Wklejam zdjęcie całego pisma z PESEL-em i adresem','Proszę AI, żeby odpisało urzędowi w moim imieniu'],a:0,why:'Usuń dane osobowe, a AI pomoże zrozumieć treść. Ważne terminy potwierdź w urzędzie.'},
 {q:'Urząd wymaga tłumaczenia dyplomu z ukraińskiego na polski. Czy wystarczy tłumaczenie z AI?',o:['Nie. Urząd zwykle wymaga tłumaczenia od tłumacza przysięgłego','Tak, jeśli tłumaczenie jest poprawne','Tak, jeśli wydrukuję je na papierze firmowym'],a:0,why:'AI pomaga zrozumieć dokumenty. Oficjalne tłumaczenia do urzędu robi tłumacz przysięgły.'}
];

/* ---------- 9. Rozmowa krok po kroku ---------- */
const CHAT1=[
 {ai:'Hej! Chciałam dać znać, że niestety nasze spotkanie w środę musi się przesunąć, bo wypadło mi coś pilnego i naprawdę nie dam rady, sorki za zamieszanie, mam nadzieję, że to nie problem, daj znać, kiedy ci pasuje, bo ja jestem dość elastyczna…',
  o:[['Napisz krócej i bardziej oficjalnie, najwyżej 4 zdania.',1,'Mówisz dokładnie, co nie pasuje: długość i ton.'],['Popraw.',0,'AI nie wie, co poprawić. Może zmienić coś innego.'],['Napisz od nowa.',0,'Dostaniesz nową wersję z tymi samymi problemami.']]},
 {ai:'Dzień dobry, uprzejmie informuję, że spotkanie zaplanowane na środę musi zostać przełożone. Przepraszam za utrudnienia. Będę wdzięczna za informację o dogodnym terminie. Z poważaniem, [imię i nazwisko]',
  o:[['Zaproponuj nowy termin: czwartek, 14:00. Jeśli nie pasuje, poproś o inny.',1,'Klient dostaje konkretną propozycję.'],['Dodaj więcej szczegółów.',0,'Jakich? AI może wymyślić powód przełożenia spotkania.'],['Zmień ton na zabawny.',0,'To oddala cię od celu. Mail ma być oficjalny.']]},
 {ai:'Dzień dobry, uprzejmie informuję, że spotkanie zaplanowane na środę musi zostać przełożone. Czy pasuje Panu czwartek o 14:00? Jeśli nie, proszę o propozycję innego terminu. Przepraszam za utrudnienia. Z poważaniem, [imię i nazwisko]',
  o:[['Podpisz: Olena Melnyk, specjalistka ds. obsługi klienta.',1,'To ostatnia brakująca część maila.'],['Wyślij ten mail.',0,'Czat nie wyśle maila. Kopiujesz tekst i wysyłasz go sama lub sam.'],['Dodaj emotikony.',0,'Emotikony nie pasują do oficjalnej wiadomości.']]}
];
const CHAT1_END='Dzień dobry, uprzejmie informuję, że spotkanie zaplanowane na środę musi zostać przełożone. Czy pasuje Panu czwartek o 14:00? Jeśli nie, proszę o propozycję innego terminu. Przepraszam za utrudnienia. Z poważaniem, Olena Melnyk, specjalistka ds. obsługi klienta';
function chatTask(body,id,cfg){
  const restart=()=>chatTask(body,id,cfg); let i=0,ok=0; const CHAT=cfg.steps;
  body.innerHTML=`<p class="lead">${cfg.lead} Pierwsza wersja od AI jest daleka od celu. W każdym kroku wybierz, co odpisać.</p>`;
  const log=h('<div class="chatlog"></div>'); body.append(log);
  log.append(h(`<div class="msg-u"><p class="who">Ty</p><p>${cfg.first}</p></div>`));
  const area=h('<div></div>'); body.append(area);
  function step(){
    const C=CHAT[i]; log.append(h(`<div class="msg-a"><p class="who">AI</p><p>${C.ai}</p></div>`));
    area.innerHTML=`<p class="q" style="margin-top:16px">Krok ${i+1} z ${CHAT.length}: co odpisujesz?</p>`;
    const opts=h('<div class="opts"></div>'); area.append(opts);
    shuffle(C.o.map((_,k)=>k)).forEach(k=>{const b=h(`<button class="opt">„${C.o[k][0]}”</button>`);
      b.onclick=()=>{const right=C.o[k][1]===1; if(right) ok++;
        opts.querySelectorAll('button').forEach(x=>x.disabled=true); b.classList.add(right?'right':'wrong');
        const best=C.o.find(x=>x[1]===1);
        area.append(h(`<div class="feedback${right?'':' bad'}"><b>${right?'Dobry wybór.':'Lepsza odpowiedź: „'+best[0]+'”'}</b>${C.o[k][2]}</div>`));
        const nx=h('<div class="row"><button class="btn">Dalej</button></div>'); area.append(nx); const nb=nx.querySelector('button'); nb.focus();
        nb.onclick=()=>{log.append(h(`<div class="msg-u"><p class="who">Ty</p><p>${best[0]}</p></div>`)); i++;
          if(i<CHAT.length) step(); else {log.append(h(`<div class="msg-a"><p class="who">AI</p><p>${cfg.end}</p></div>`)); area.innerHTML=''; result(area,id,ok/CHAT.length*25,`Dobre odpowiedzi: ${ok} z ${CHAT.length}. ${cfg.msg}`,restart)}};
      }; opts.append(b)});
  }
  step();
}

/* ---------- Zapytania do wypróbowania ---------- */
const CATS=[['praca','Szukanie pracy'],['firma','W pracy'],['dom','Prywatnie i w urzędzie'],['jezyk','Nauka polskiego']];
const LIB=[
 {cat:'praca',t:'Doświadczenie z Ukrainy w polskim CV',d:'Opis wcześniejszej pracy w krótkich punktach, poprawną polszczyzną.',
  tpl:'Pomóż mi opisać doświadczenie zawodowe do polskiego CV.\nStanowisko: {Stanowisko|księgowa}\nBranża: {Branża|handel}\nCzas pracy: {Czas pracy|5 lat}\nObowiązki: {Obowiązki|wystawianie faktur, rozliczenia z dostawcami, raporty miesięczne}\nNapisz 4 krótkie punkty. Użyj prostego, poprawnego języka polskiego.',
  warn:'Nie wpisuj nazwiska, adresu, numeru PESEL ani numeru paszportu. Sprawdź, czy AI nie dopisało obowiązków, których nie było.',
  next:['Jak nazywa się to stanowisko w polskich ogłoszeniach o pracę?','Sprawdź, czy w tekście nie ma błędów.']},
 {cat:'praca',t:'Polska nazwa twojego zawodu',d:'Słowa, których warto szukać w ogłoszeniach o pracę.',
  tpl:'Na Ukrainie mój zawód to: {Zawód|інженер-технолог}.\nJak nazywa się podobne stanowisko w Polsce? Podaj 3–5 nazw, których mogę szukać w ogłoszeniach o pracę. Krótko wyjaśnij różnice.',
  warn:'Niektóre zawody, np. lekarz, pielęgniarka czy nauczyciel, wymagają w Polsce uznania kwalifikacji. Sprawdź to na gov.pl lub w urzędzie.',
  next:['Jakie umiejętności są najczęściej wymagane na tych stanowiskach?']},
 {cat:'praca',t:'Wyjaśnienie ogłoszenia o pracę',d:'Trudne słowa z ogłoszeń wyjaśnione w twoim języku.',
  tpl:'Wyjaśnij mi {Język odpowiedzi|po ukraińsku}, co oznaczają te określenia z polskiego ogłoszenia o pracę:\n{Określenia|umowa zlecenie, umowa o pracę na okres próbny, B2B, mile widziane, praca zmianowa}',
  warn:'Szczegóły umów, podatków i składek sprawdź w urzędzie pracy lub na gov.pl. Przepisy się zmieniają.',
  next:['Jakie są różnice między umową o pracę a umową zlecenie dla pracownika?']},
 {cat:'praca',t:'List motywacyjny do konkretnej oferty',d:'Krótki list dopasowany do ogłoszenia.',
  tpl:'Napisz krótki list motywacyjny do tej oferty pracy. Najwyżej 150 słów, prosty i uprzejmy język.\nMoje doświadczenie: {Doświadczenie|3 lata pracy jako kasjerka, obsługa klienta, praca w zespole}\nTreść oferty: {Treść oferty|[wklej tutaj treść ogłoszenia]}',
  warn:'Usuń z ogłoszenia imię, nazwisko i telefon osoby z firmy. Dopasuj list do siebie — rekruterzy często rozpoznają ogólne teksty z AI.',
  next:['Skróć list do 100 słów.','Napisz ten list mniej oficjalnie.']},
 {cat:'praca',t:'Trening rozmowy kwalifikacyjnej',d:'Próbna rozmowa po polsku z poprawianiem błędów.',
  tpl:'Jesteś rekruterem. Przeprowadź ze mną próbną rozmowę kwalifikacyjną po polsku.\nStanowisko: {Stanowisko|pracownik magazynu}\nMój poziom polskiego: {Poziom polskiego|B1}\nZadawaj pytania po jednym. Po każdej mojej odpowiedzi popraw błędy językowe i powiedz, co mogę powiedzieć lepiej.',
  warn:'Ćwicz na głos — w wielu aplikacjach czatu można mówić zamiast pisać.',
  next:['Jakie pytania mogę zadać pracodawcy na końcu rozmowy?','Jak odpowiedzieć na pytanie o przerwę w pracy?']},
 {cat:'firma',t:'Sprawdzenie maila do przełożonego',d:'Poprawki językowe z wyjaśnieniem błędów.',
  tpl:'Sprawdź mój mail do przełożonego. Popraw błędy, ale nie zmieniaj sensu. Pod mailem wyjaśnij {Język wyjaśnień|po ukraińsku} najważniejsze błędy.\nMail: {Mail|Dzień dobry, chciałam zapytać czy mogę jutro przyjść na 10 bo mam wizyta w urzędzie. Pozdrawiam}',
  warn:'Nie wklejaj poufnych informacji firmy ani danych klientów.',
  next:['Daj mi 3 podobne zdania do przećwiczenia.']},
 {cat:'firma',t:'Prośba o dzień wolny',d:'Krótka, uprzejma wiadomość do przełożonego.',
  tpl:'Napisz krótką, uprzejmą wiadomość do przełożonego.\nSprawa: {Sprawa|prośba o dzień wolny}\nTermin: {Termin|piątek, 14 listopada}\nPowód: {Powód|wizyta w urzędzie wojewódzkim}\nForma: {Forma|SMS, najwyżej 3 zdania}',
  warn:'Sprawdź datę i dzień tygodnia — AI może je pomylić.',
  next:['Napisz to samo w formie maila.']},
 {cat:'firma',t:'Notatka ze spotkania',d:'Porządkowanie notatek w listę ustaleń i zadań.',
  tpl:'Z moich notatek przygotuj notatkę ze spotkania: najważniejsze ustalenia, zadania z osobami odpowiedzialnymi i terminy. Forma: lista.\nNotatki: {Notatki|zamówienie od piątku, Marta dzwoni do dostawcy, inwentaryzacja 20.11, nowe grafiki do środy}',
  warn:'Wklejaj notatki tylko wtedy, gdy nie ma w nich danych klientów i tajemnic firmy, albo korzystaj z narzędzia zatwierdzonego przez firmę.',
  next:['Napisz z tego krótki mail do zespołu.']},
 {cat:'firma',t:'Formuła w Excelu',d:'Formuła z wyjaśnieniem, krok po kroku.',
  tpl:'Mam polskiego Excela. W kolumnie A są {Kolumna A|daty}, w kolumnie B są {Kolumna B|kwoty}.\nPotrzebuję formuły, która {Co ma zrobić formuła|zsumuje kwoty z marca 2026}.\nWyjaśnij krok po kroku, jak działa.',
  warn:'Przetestuj formułę na kilku wierszach, dla których znasz wynik. Nie wklejaj prawdziwych danych firmy — wystarczą nazwy kolumn.',
  next:['Co zrobić, jeśli formuła pokazuje błąd #NAZWA?']},
 {cat:'firma',t:'Słowniczek do nowej pracy',d:'Najważniejsze słowa z twojej branży po polsku i po ukraińsku.',
  tpl:'Przygotuj tabelę 15 słów i zwrotów przydatnych w pracy.\nMiejsce pracy: {Miejsce pracy|magazyn}\nKolumny: słowo po polsku, tłumaczenie {Język|na ukraiński}, przykładowe zdanie po polsku.',
  warn:'Słowa branżowe sprawdź u współpracowników — AI czasem tłumaczy je zbyt dosłownie.',
  next:['Przygotuj krótki test z tych słów.']},
 {cat:'dom',t:'Pismo z urzędu prostym językiem',d:'Co jest w piśmie, co trzeba zrobić i do kiedy.',
  tpl:'Wyjaśnij mi prostym językiem {Język odpowiedzi|po ukraińsku}, o co chodzi w tym piśmie. Napisz osobno: co mam zrobić i do kiedy.\nPismo: {Treść pisma|[wklej treść pisma bez imienia, nazwiska, adresu i numerów]}',
  warn:'Usuń dane osobowe. AI pomaga zrozumieć pismo, ale terminy i obowiązki potwierdź w urzędzie. Tłumaczenie z AI nie zastąpi tłumacza przysięgłego.',
  next:['Jakie dokumenty mogą być potrzebne w tej sprawie?']},
 {cat:'dom',t:'Wiadomość do wychowawczyni dziecka',d:'Krótka wiadomość do szkoły, np. przez dziennik elektroniczny.',
  tpl:'Napisz krótką, uprzejmą wiadomość do wychowawczyni mojego dziecka.\nSprawa: {Sprawa|dziecko nie będzie w szkole w czwartek, bo ma wizytę u lekarza}\nForma: wiadomość w dzienniku elektronicznym, 2–3 zdania.',
  warn:'Nie podawaj szczegółów o zdrowiu dziecka, jeśli nie są potrzebne.',
  next:['Jak poprosić o spotkanie z wychowawczynią?']},
 {cat:'dom',t:'Wiadomość do właściciela mieszkania',d:'Zgłoszenie usterki albo prośba.',
  tpl:'Napisz uprzejmą wiadomość do właściciela mieszkania.\nSprawa: {Sprawa|od wczoraj nie działa piec gazowy}\nProśba: {Prośba|naprawa w tym tygodniu}\nForma: SMS, 3–4 zdania.',
  warn:'Przy zapachu gazu nie pisz wiadomości — wyjdź z mieszkania i zadzwoń pod numer alarmowy 112 lub pogotowia gazowego 992.',
  next:['Napisz drugą wiadomość, jeśli właściciel nie odpowie przez 3 dni.']},
 {cat:'dom',t:'Przygotowanie do wizyty u lekarza',d:'Objawy opisane po polsku i pytania do lekarza.',
  tpl:'Pomóż mi przygotować się do wizyty u lekarza rodzinnego. Opisz po polsku, prostymi zdaniami, moje objawy:\n{Objawy|od 3 dni boli mnie gardło i mam gorączkę 38 stopni}\nDodaj 3 pytania, które mogę zadać lekarzowi. Nie stawiaj diagnozy.',
  warn:'AI nie zastąpi lekarza. W nagłej sytuacji dzwoń pod numer 112.',
  next:['Jak powiedzieć po polsku, że biorę inne leki?']},
 {cat:'dom',t:'Budżet domowy',d:'Prosta tabela miesięcznych wydatków i pomysły na oszczędności.',
  tpl:'Pomóż mi zaplanować budżet na miesiąc.\nDochód: {Dochód|4500 zł}\nStałe wydatki: {Stałe wydatki|czynsz 2000 zł, prąd i gaz 300 zł, telefon i internet 100 zł, bilet miesięczny 110 zł}\nPrzygotuj prostą tabelę i 3 pomysły na oszczędności.',
  warn:'Nie podawaj numeru konta ani danych do logowania w banku.',
  next:['Zrób z tego tabelę, którą mogę wkleić do Arkuszy Google.']},
 {cat:'jezyk',t:'Scenka po polsku',d:'Rozmowa z codziennego życia z poprawianiem błędów.',
  tpl:'Pomóż mi ćwiczyć polski. Zagrajmy scenkę.\nSytuacja: {Sytuacja|rozmowa z administratorem budynku o zepsutym kranie}\nTwoja rola: {Twoja rola|administrator}\nMój poziom: {Poziom|A2}\nPisz krótkie zdania. Po każdej mojej odpowiedzi popraw błędy.',
  warn:'Ćwicz też na głos. Wiele aplikacji czatu pozwala mówić zamiast pisać.',
  next:['Zagrajmy teraz scenkę w przychodni.']},
 {cat:'jezyk',t:'Poprawa tekstu z wyjaśnieniem',d:'Poprawki i ćwiczenia z twoich błędów.',
  tpl:'Popraw błędy w moim tekście i wyjaśnij je {Język wyjaśnień|po ukraińsku}. Na końcu daj mi 3 podobne zdania do przećwiczenia.\nTekst: {Tekst|Wczoraj ja byłam w sklepie i kupiłam dwa chleby i trzy mleka.}',
  warn:'Zapisuj powtarzające się błędy. Łatwiej będzie je zapamiętać.',
  next:['Wyjaśnij tę zasadę gramatyczną na prostych przykładach.']},
 {cat:'jezyk',t:'Formy grzecznościowe',d:'Kiedy mówić „pan” i „pani”, a kiedy „ty”.',
  tpl:'Wyjaśnij mi {Język wyjaśnień|po ukraińsku}, kiedy w Polsce mówimy do kogoś „pan” lub „pani”, a kiedy „ty”. Podaj przykłady z {Sytuacja|pracy i urzędu}.',
  warn:'W pracy zacznij od formy „pan” i „pani”. Przejdź na „ty”, gdy ktoś to zaproponuje.',
  next:['Jak grzecznie zaproponować przejście na „ty”?']}
];
function fillTpl(tpl,vals){return tpl.replace(/\{([^|}]+)\|([^}]*)\}/g,(m,name)=>vals[name])}
function copyText(text,btn){
  const done=()=>{const o=btn.textContent; btn.textContent='Skopiowano'; setTimeout(()=>btn.textContent=o,1500)};
  const fallback=()=>{const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.append(ta); ta.select(); try{document.execCommand('copy'); done()}catch(e){btn.textContent='Zaznacz tekst i skopiuj ręcznie'} ta.remove()};
  if(navigator.clipboard&&window.isSecureContext) navigator.clipboard.writeText(text).then(done,fallback); else fallback();
}
function showLibrary(filter='all'){
  const p=setPanel('lib');
  p.innerHTML=`<h2>Zapytania do wypróbowania</h2>
  <p class="desc">Gotowe zapytania do prawdziwego czatu AI, np. ChatGPT, Gemini, Copilot albo Claude. Ta część nie jest oceniana.</p>
  <div class="howto"><ol>
    <li>Wybierz zapytanie i zmień teksty w polach na swoje.</li>
    <li>Kliknij „Kopiuj zapytanie” i wklej je do czatu AI.</li>
    <li>Przeczytaj odpowiedź. Jeśli coś nie pasuje, napisz, co zmienić — przykłady są w części „Możesz dopytać”.</li>
    <li>Możesz pisać do AI po ukraińsku i prosić o odpowiedź po polsku albo odwrotnie.</li>
  </ol><p class="howto-w"><b>Zasada:</b> nie wpisuj do czatu numeru PESEL, numeru paszportu, adresu, haseł ani danych klientów.</p></div>
  <div class="filters" role="group" aria-label="Kategorie"></div><div class="libgrid"></div>`;
  const f=p.querySelector('.filters'), g=p.querySelector('.libgrid');
  [['all','Wszystkie'],...CATS].forEach(([k,n])=>{const b=h(`<button class="fbtn" aria-pressed="${k===filter}">${n}</button>`); b.onclick=()=>showLibrary(k); f.append(b)});
  LIB.forEach((x,ix)=>{ if(filter!=='all'&&x.cat!==filter) return;
    const id='lib'+ix; const vals={}; const fields=[];
    x.tpl.replace(/\{([^|}]+)\|([^}]*)\}/g,(m,name,def)=>{if(!(name in vals)){vals[name]=def; fields.push([name,def])} return m});
    const c=h(`<article class="libcard"><p class="lc-cat">${CATS.find(z=>z[0]===x.cat)[1]}</p><h3>${x.t}</h3><p class="lc-d">${x.d}</p><div class="lc-fields"></div><p class="lc-l">Zapytanie</p><pre class="lc-prompt"></pre>
      <div class="row lc-row"><button class="btn lc-copy">Kopiuj zapytanie</button><label class="lc-tried"><input type="checkbox"${state.tried[id]?' checked':''}> Wypróbowane</label></div>
      <p class="lc-warn"><b>Uwaga:</b> ${x.warn}</p>${x.next&&x.next.length?`<p class="lc-l">Możesz dopytać</p><ul class="lc-next">${x.next.map(n=>`<li>„${n}”</li>`).join('')}</ul>`:''}</article>`);
    const fl=c.querySelector('.lc-fields'), pre=c.querySelector('.lc-prompt');
    const upd=()=>{pre.textContent=fillTpl(x.tpl,vals)};
    fields.forEach(([name,def],k)=>{const fid=`${id}-f${k}`; const long=def.length>60;
      const w=h(`<div class="lc-f"><label for="${fid}">${name}</label>${long?`<textarea id="${fid}" rows="3"></textarea>`:`<input id="${fid}" type="text">`}</div>`);
      const inp=w.querySelector('input,textarea'); inp.value=def; inp.oninput=()=>{vals[name]=inp.value; upd()}; fl.append(w)});
    upd();
    c.querySelector('.lc-copy').onclick=e=>copyText(pre.textContent,e.currentTarget);
    c.querySelector('.lc-tried input').onchange=e=>{if(e.target.checked) state.tried[id]=1; else delete state.tried[id]; save(); renderNav()};
    g.append(c)});
  focusPanel();
}

/* ================= CZĘŚĆ 2 ================= */
const mt=(title,body,cls='')=>`<div class="mock ${cls}"><div class="mt">${title}</div><div class="mb">${body}</div></div>`;

/* ---------- 10. AI czy specjalista ---------- */
const WHO=[
 {n:'Poprawienie błędów w mailu do przełożonego',v:'t',why:'Poprawianie tekstu to jedna z najmocniejszych stron AI.'},
 {n:'Pomysły na temat prezentacji',v:'t',why:'AI szybko poda wiele pomysłów. Ty wybierasz najlepszy.'},
 {n:'Streszczenie długiego, publicznego artykułu',v:'t',why:'AI dobrze streszcza. Ważne liczby sprawdź w oryginale.'},
 {n:'Plan nauki polskiego na tydzień',v:'t',why:'AI ułoży plan dopasowany do twojego czasu i poziomu.'},
 {n:'Wyjaśnienie trudnego słowa z ogłoszenia o pracę',v:'t',why:'AI wyjaśni słowo i poda przykład, także po ukraińsku.'},
 {n:'Pytania do przećwiczenia przed rozmową kwalifikacyjną',v:'t',why:'AI może zagrać rekrutera i poprawiać twoje odpowiedzi.'},
 {n:'Decyzja, czy podpisać umowę najmu z wysokimi karami',v:'n',why:'AI może wyjaśnić zapisy umowy. Decyzję warto skonsultować, np. w punkcie nieodpłatnej pomocy prawnej.'},
 {n:'Ocena, co oznacza silny ból w klatce piersiowej',v:'n',why:'To może być nagły stan. Dzwoń pod numer 112 albo idź do lekarza.'},
 {n:'Oficjalne tłumaczenie dyplomu do urzędu',v:'n',why:'Urząd zwykle wymaga tłumaczenia od tłumacza przysięgłego.'},
 {n:'Ostateczne wyliczenie podatku w zeznaniu PIT',v:'n',why:'Sprawdź w e-Urzędzie Skarbowym (podatki.gov.pl) albo u doradcy podatkowego.'}
];

/* ---------- 11. Weryfikacja: Excel ---------- */
const ANSWER2=[
 ['Formuły w Excelu zaczynają się od znaku równości „=”.',0,'To prawda.'],
 ['Funkcja SUMA dodaje liczby z wybranych komórek, np. =SUMA(B2:B10).',0,'To prawda.'],
 ['W polskiej wersji Excela argumenty funkcji oddziela się przecinkami, np. =SUMA(B2,B3).',1,'Nieprawda. W polskiej wersji Excela zwykle używa się średników: =SUMA(B2;B3).'],
 ['Funkcja ŚREDNIA.AUTO liczy średnią i sama pomija komórki z błędami.',1,'Takiej funkcji nie ma. Średnią liczy funkcja ŚREDNIA. To typowe zmyślenie: nazwa brzmi wiarygodnie.'],
 ['Funkcja ZLICZ.JEŻELI liczy komórki, które spełniają warunek, np. ile razy w kolumnie jest słowo „tak”.',0,'To prawda.'],
 ['Dzielenie przez zero daje w polskim Excelu błąd #DZIEL/0!.',2,'To prawda. To zdanie nie daje ani punktów, ani minusów.'],
 ['Plik Excela zapiszesz skrótem Ctrl + Z.',1,'Nieprawda. Ctrl + Z cofa ostatnią zmianę. Plik zapisuje skrót Ctrl + S.'],
 ['Błąd #NAZWA? często oznacza literówkę w nazwie funkcji.',0,'To prawda.']
];

/* ---------- 12. Prywatność w czacie ---------- */
const QPRIV=[
 {q:'Gdzie zwykle znajdziesz opcje prywatności czatu AI?',o:['W ustawieniach konta lub ustawieniach czatu','W koszu przeglądarki','W aplikacji banku'],a:0,why:'W ustawieniach sprawdzisz m.in. historię rozmów, pamięć czatu i wykorzystanie danych.'},
 {q:'W ustawieniach jest opcja dotycząca „ulepszania modelu” albo „trenowania”. Czego zwykle dotyczy?',o:['Tego, czy twoje rozmowy mogą pomóc rozwijać narzędzie','Szybkości odpowiedzi','Języka, w którym czat odpowiada'],a:0,why:'W wielu narzędziach możesz zdecydować, czy twoje rozmowy mogą być używane do rozwoju AI.'},
 {q:'Klikasz „Udostępnij” przy rozmowie z czatem i dostajesz link. Co to zwykle oznacza?',o:['Każda osoba, która dostanie link, może zobaczyć tę rozmowę','Tylko ty możesz otworzyć ten link','Rozmowa zostanie usunięta'],a:0,why:'Zanim wyślesz link, sprawdź, czy w rozmowie nie ma prywatnych informacji.'},
 {q:'Korzystasz z czatu AI na wspólnym komputerze, np. w bibliotece. Co robisz na koniec?',o:['Wylogowuję się z konta','Zamykam tylko kartę przeglądarki','Zostawiam otwarte konto dla innych'],a:0,why:'Bez wylogowania następna osoba może zobaczyć twoje rozmowy.'},
 {q:'Firma daje ci firmowe konto w narzędziu AI. Do czego go używasz?',o:['Do zadań służbowych, zgodnie z zasadami firmy','Do wszystkich spraw, także rodzinnych','Daję login znajomemu, żeby też mógł korzystać'],a:0,why:'Konto firmowe służy do pracy. Firma może mieć zasady dotyczące danych i bezpieczeństwa.'},
 {q:'W rozmowie z czatem przez pomyłkę jest twój numer telefonu. Co możesz zrobić?',o:['Usunąć tę rozmowę z historii i sprawdzić ustawienia pamięci czatu','Nic się nie da zrobić','Udostępnić rozmowę znajomym, żeby ją sprawdzili'],a:0,why:'Usunięcie rozmowy i sprawdzenie pamięci czatu to najlepsze, co możesz zrobić. Następnym razem usuń dane przed wysłaniem.'}
];

/* ---------- 13. Oszustwa z użyciem AI ---------- */
const QSCAM=[
 {mock:mt('Grupa na Facebooku','Praca w Niemczech dla osób z Ukrainy! 800 zł dziennie, bez języka, bez doświadczenia. Wpłać 300 zł za wizę i szkolenie. Kontakt tylko przez Telegram.'),q:'Jak oceniasz to ogłoszenie?',o:['Raczej w porządku','Raczej oszustwo'],a:1,fixed:1,why:'Bardzo wysoka pensja, „bez wymagań”, kontakt tylko przez komunikator i opłata z góry to typowe sygnały. Agencja zatrudnienia nie może brać pieniędzy za samo znalezienie pracy. Przy pracy za granicą może pobrać tylko udokumentowane koszty, np. wizy, i tylko na podstawie umowy. Legalne agencje znajdziesz w rejestrze KRAZ.'},
 {mock:mt('Portal z ofertami pracy','<b>Magazynier, Bielsko-Biała.</b> Umowa o pracę, 5200 zł brutto, praca na dwie zmiany. Pełna nazwa firmy, adres i NIP w ogłoszeniu. Zgłoszenia przez formularz na stronie.'),q:'Jak oceniasz to ogłoszenie?',o:['Raczej w porządku','Raczej oszustwo'],a:0,fixed:1,why:'Konkretne warunki, dane firmy i nikt nie chce pieniędzy. Firmę możesz dodatkowo sprawdzić w rejestrze po numerze NIP.'},
 {mock:mt('Reklama wideo w internecie','Znany prezenter telewizyjny mówi: „Wpłać 1000 zł na tę platformę, a za miesiąc dostaniesz 10 000 zł”.'),q:'Jak oceniasz tę reklamę?',o:['Raczej w porządku','Raczej oszustwo'],a:1,fixed:1,why:'AI potrafi podrobić twarz i głos znanej osoby. Obietnica szybkiego, pewnego zysku to zawsze sygnał ostrzegawczy.'},
 {mock:mt('Połączenie telefoniczne','Głos twojego przełożonego: „Pilnie kup karty podarunkowe za 2000 zł i wyślij mi zdjęcia kodów. Oddam jutro”.'),q:'Jak oceniasz tę prośbę?',o:['Raczej w porządku','Raczej oszustwo'],a:1,fixed:1,why:'Głos można podrobić za pomocą AI. Karty podarunkowe to częsty sposób oszustów na zabranie pieniędzy. Rozłącz się i zadzwoń do przełożonego na znany numer.'},
 {mock:mt('SMS','Dzień dobry, dostaliśmy Pani/Pana CV. Aby dokończyć rekrutację, prosimy zainstalować aplikację z linku i podać dane karty do weryfikacji.'),q:'Jak oceniasz tę wiadomość?',o:['Raczej w porządku','Raczej oszustwo'],a:1,fixed:1,why:'Pracodawca nie potrzebuje danych karty ani aplikacji z linku w SMS-ie. Taka aplikacja może przejąć telefon.'},
 {mock:mt('E-mail','Odpowiedź na twoje zgłoszenie z portalu z ofertami pracy: zaproszenie na rozmowę w siedzibie firmy pod adresem z ogłoszenia. Mail przyszedł z adresu firmy z ogłoszenia. Jest możliwość zmiany terminu.'),q:'Jak oceniasz tę wiadomość?',o:['Raczej w porządku','Raczej oszustwo'],a:0,fixed:1,why:'Adres, firma i ogłoszenie się zgadzają, a nikt nie prosi o pieniądze ani dane. Tak wygląda zwykłe zaproszenie na rozmowę.'}
];

/* ---------- 14. Ton i styl ---------- */
const QTONE=[
 {q:'Piszesz pierwszy mail do urzędu i nie znasz nazwiska urzędnika. Jak zacząć?',o:['„Szanowni Państwo,”','„Cześć,”','„Hej!”'],a:0,why:'„Szanowni Państwo” to bezpieczny początek oficjalnego maila do instytucji.'},
 {q:'Jak zakończyć oficjalny mail?',o:['„Z poważaniem”','„Buziaki”','„Nara”'],a:0,why:'„Z poważaniem” pasuje do oficjalnych wiadomości. W mniej oficjalnych mailach w pracy często pisze się „Pozdrawiam”.'},
 {q:'Rozmawiasz z nowym przełożonym. Jak się do niego zwracasz, dopóki on nie zaproponuje inaczej?',o:['Formą „pan”, np. „Czy mógłby pan…?”','Formą „ty”, np. „Czy możesz…?”','Słowem „kolego”'],a:0,why:'W pracy zaczynamy od form „pan” i „pani”. Na „ty” przechodzimy, gdy ktoś to zaproponuje.'},
 {q:'AI napisało: „Siema, szefie! Jutro mnie nie ma.” Do kogo to pasuje?',o:['Raczej do nikogo w pracy — to zbyt swobodne','Do przełożonego','Do klienta'],a:0,why:'To styl rozmowy z bliskim znajomym. Poproś AI o wersję uprzejmą i oficjalną.'},
 {q:'Którą odpowiedź warto wysłać klientowi?',o:['„Dzień dobry, dziękuję za wiadomość. Odpowiem do piątku.”','„No dobra, odpiszę w piątek.”','„OK.”'],a:0,why:'Klient widzi, że wiadomość dotarła i kiedy dostanie odpowiedź. Ton jest uprzejmy.'},
 {q:'Jak poprosić AI o zmianę tonu?',o:['„Napisz to bardziej uprzejmie i oficjalnie, do przełożonego.”','„Zmień.”','„Lepiej.”'],a:0,why:'Najlepiej podać ton i odbiorcę. Wtedy AI wie, jaki styl wybrać.'}
];

/* ---------- 15. Rozmowa 2: SMS do właściciela ---------- */
const CHAT2=[
 {ai:'Szanowny Panie, z przykrością zawiadamiam, iż w dniu dzisiejszym nastąpiła awaria urządzenia piorącego znajdującego się w wynajmowanym lokalu mieszkalnym, w związku z czym uprzejmie wnoszę o podjęcie stosownych działań naprawczych w możliwie najkrótszym terminie.',
  o:[['Napisz to prościej, jako krótki SMS, najwyżej 3 zdania.',1,'Mówisz, co zmienić: styl, formę i długość.'],['Dodaj więcej szczegółów.',0,'Tekst jest już za długi i zbyt urzędowy.'],['Przetłumacz to na angielski.',0,'Właściciel pisze po polsku. Problemem jest styl, nie język.']]},
 {ai:'Dzień dobry, pralka w mieszkaniu przestała działać. Czy może Pan przysłać kogoś do naprawy? Pozdrawiam',
  o:[['Dodaj, że pralka nie działa od wczoraj i że jestem w domu po 16:00.',1,'Właściciel od razu wie, od kiedy jest problem i kiedy można przyjść.'],['Zrób z tego wiersz.',0,'Wiersz nie pomoże w naprawie pralki.'],['Napisz to bardziej stanowczo, z groźbą.',0,'Groźba psuje relację. Uprzejma prośba działa lepiej.']]},
 {ai:'Dzień dobry, od wczoraj nie działa pralka w mieszkaniu. Czy może Pan przysłać kogoś do naprawy? Jestem w domu codziennie po 16:00. Pozdrawiam',
  o:[['Podpisz: Olena, mieszkanie nr 5.',1,'Właściciel wie, kto pisze, nawet jeśli nie ma zapisanego numeru.'],['Usuń powitanie.',0,'Powitanie jest uprzejme i potrzebne.'],['Dodaj na końcu: „Proszę odpisać natychmiast!”',0,'To brzmi niegrzecznie.']]}
];
const CHAT2_END='Dzień dobry, od wczoraj nie działa pralka w mieszkaniu. Czy może Pan przysłać kogoś do naprawy? Jestem w domu codziennie po 16:00. Pozdrawiam, Olena, mieszkanie nr 5';

/* ---------- 16. Budowa polecenia 2 ---------- */
const BUILD2=[
 {s:'Dostajesz do podpisania pierwszą w Polsce umowę zlecenie i chcesz ją zrozumieć.',c:[
  ['Zadanie',[['Wyjaśnij mi najważniejsze punkty tej umowy.',1],['Czy mam podpisać tę umowę?',0],['Umowa.',0]],'AI może wyjaśnić umowę. Decyzja o podpisaniu należy do ciebie.'],
  ['Kontekst',[['To moja pierwsza umowa w Polsce. Z tekstu usunięte są dane osobowe i nazwa firmy.',1],['Umowa jest długa.',0],['Firma jest z Krakowa.',0]],'AI wie, że ma tłumaczyć od podstaw. Usunięte dane chronią ciebie i firmę.'],
  ['Forma',[['Wyjaśnij punkt po punkcie, prostym językiem, po ukraińsku. Na końcu wypisz pytania do pracodawcy.',1],['Krótko.',0],['Użyj jak najwięcej terminów prawniczych.',0]],'Prosty język i lista pytań pomogą w rozmowie z pracodawcą.'],
  ['Rola',[['Jesteś doradcą, który tłumaczy umowy osobom bez wiedzy prawniczej.',1],['Jesteś moim adwokatem i odpowiadasz za moją decyzję.',0],['Jesteś kalkulatorem.',0]],'AI nie jest adwokatem i nie odpowiada za decyzje. Przy wątpliwościach skorzystaj z nieodpłatnej pomocy prawnej.']]},
 {s:'Chcesz dorabiać korepetycjami z matematyki i potrzebujesz ogłoszenia.',c:[
  ['Zadanie',[['Napisz ogłoszenie o korepetycjach z matematyki.',1],['Matematyka.',0],['Rozwiąż zadanie z matematyki.',0]],'Zadanie musi opisywać to, czego potrzebujesz: ogłoszenie.'],
  ['Kontekst',[['Uczę uczniów szkoły podstawowej. Mam 10 lat doświadczenia jako nauczycielka na Ukrainie. Zajęcia online i w Bielsku-Białej.',1],['Lubię matematykę.',0],['Mam czas po południu.',0]],'Doświadczenie, grupa uczniów i miejsce to informacje, których szukają rodzice.'],
  ['Forma',[['Najwyżej 60 słów, na lokalny portal z ogłoszeniami. Cena: 60 zł za godzinę.',1],['Jak najdłużej.',0],['W formie tabeli z wzorami matematycznymi.',0]],'Krótkie ogłoszenie z ceną szybciej przyciąga uwagę.'],
  ['Rola',[['Piszesz jako doświadczona nauczycielka do rodziców uczniów.',1],['Jesteś kalkulatorem naukowym.',0],['Jesteś uczniem, który nie lubi matematyki.',0]],'Rola pomaga dobrać ton: rzeczowy i budzący zaufanie.']]}
];

/* ---------- 17. Wiarygodne źródła ---------- */
const QSRC=[
 {q:'Gdzie sprawdzisz aktualne przepisy prawa w Polsce?',o:['W Internetowym Systemie Aktów Prawnych: isap.sejm.gov.pl','Na forum internetowym','W komentarzach pod filmem'],a:0,why:'ISAP prowadzi Sejm. Znajdziesz tam oficjalne teksty ustaw.'},
 {q:'Gdzie znajdziesz oferty pracy z urzędów pracy?',o:['Na stronie praca.gov.pl','W losowej grupie w komunikatorze','W reklamie w mediach społecznościowych'],a:0,why:'praca.gov.pl to oficjalny serwis publicznych służb zatrudnienia.'},
 {q:'Jak sprawdzisz, czy agencja zatrudnienia działa legalnie?',o:['W Krajowym Rejestrze Agencji Zatrudnienia (KRAZ)','W opiniach na Telegramie','Na stronie internetowej samej agencji'],a:0,why:'Legalna agencja musi być wpisana do rejestru KRAZ.'},
 {q:'Gdzie sprawdzisz informacje o zasiłkach i składkach?',o:['Na stronie ZUS: zus.pl','W odpowiedzi czatu AI bez źródeł','Na blogu nieznanej osoby'],a:0,why:'ZUS to oficjalne źródło informacji o zasiłkach i składkach.'},
 {q:'AI podało przepis, ale bez źródła. Co robisz najpierw?',o:['Proszę o nazwę ustawy i numer artykułu, a potem sprawdzam je w ISAP','Uznaję, że przepis na pewno istnieje','Proszę AI o dłuższą odpowiedź'],a:0,why:'Dłuższa odpowiedź nie jest bardziej prawdziwa. Liczy się źródło, które możesz sprawdzić.'},
 {q:'Znajomy wysyła zrzut ekranu z odpowiedzią AI o legalizacji pobytu. Co robisz?',o:['Sprawdzam informacje na stronie urzędu wojewódzkiego lub na gov.pl','Wierzę, bo to odpowiedź z AI','Przesyłam zrzut dalej innym znajomym'],a:0,why:'Sprawy pobytu prowadzą urzędy wojewódzkie. Przepisy często się zmieniają, dlatego sprawdzaj je w oficjalnych źródłach.'}
];

/* ---------- 18. Uczciwe korzystanie z AI ---------- */
const QETH=[
 {q:'Czy możesz użyć AI do napisania CV?',o:['Tak, ale wszystkie informacje muszą być prawdziwe i sprawdzone','Nie, to jest zabronione','Tak, AI może dopisać doświadczenie, którego nie masz'],a:0,why:'AI może pomóc z językiem i układem CV. Nieprawdziwe informacje mogą skończyć się utratą pracy.'},
 {q:'Chcesz użyć w prezentacji fragmentu artykułu, który znalazło AI. Co robisz?',o:['Podaję źródło albo piszę treść własnymi słowami','Kopiuję cały artykuł bez źródła','Podpisuję artykuł swoim nazwiskiem'],a:0,why:'Teksty innych osób są chronione prawem autorskim. Podanie źródła to też uczciwość wobec odbiorców.'},
 {q:'Czy wolno zrobić z AI nagranie, w którym znana osoba mówi coś, czego nie powiedziała?',o:['Nie. To wprowadza ludzi w błąd i może naruszać prawo','Tak, jeśli to tylko żart dla znajomych','Tak, jeśli nagranie jest krótkie'],a:0,why:'Takie nagrania (deepfake) mogą komuś zaszkodzić, nawet jeśli miały być żartem.'},
 {q:'Dziecko prosi AI o napisanie całego wypracowania do szkoły. Co jest lepszym pomysłem?',o:['AI pomaga zrozumieć temat i sprawdza tekst, a dziecko pisze samo','AI pisze całe wypracowanie','Dziecko kopiuje tekst z internetu'],a:0,why:'Dziecko uczy się wtedy pisać i myśleć. AI pomaga, ale nie zastępuje nauki.'},
 {q:'Rekruter pyta, czy AI pomagało napisać list motywacyjny. Co odpowiadasz?',o:['Odpowiadam szczerze: treść i fakty są moje, AI pomogło z językiem','Mówię, że nie wiem, co to jest AI','Zaprzeczam, choć to nieprawda'],a:0,why:'Szczera odpowiedź buduje zaufanie. Korzystanie z AI jako pomocy językowej nie jest niczym złym.'},
 {q:'Kto odpowiada za błąd w mailu, który napisało AI?',o:['Osoba, która wysłała mail','Firma, która stworzyła AI','Nikt, bo to błąd komputera'],a:0,why:'Wysyłasz tekst pod swoim imieniem. Dlatego zawsze czytasz go przed wysłaniem.'}
];

/* ---------- lista ćwiczeń ---------- */
const ST=[
 {part:1,id:'gdzie',n:'Gdzie jest sztuczna inteligencja?',m:5,d:'Rozpoznawanie AI w codziennych narzędziach.',run:b=>sortTask(b,'gdzie',WHERE,[['t','Korzysta z AI'],['n','Nie korzysta z AI']],'Które narzędzia korzystają ze sztucznej inteligencji, a które działają według stałych zasad?','AI to programy, które uczą się na przykładach. Dlatego spotykasz je w wielu miejscach.')},
 {part:1,id:'dzialanie',n:'Jak działa czat AI',m:6,d:'Mocne i słabe strony czatów AI.',run:b=>quiz(b,'dzialanie',QHOW)},
 {part:1,id:'budowa',n:'Budowa dobrego polecenia',m:8,d:'Polecenie z czterech części: zadanie, kontekst, forma i rola.',run:b=>buildTask(b,'budowa',BUILD,'Dobre polecenie ma cztery części: zadanie, kontekst, formę i rolę.')},
 {part:1,id:'porownanie',n:'Które polecenie jest lepsze?',m:5,d:'Porównywanie par poleceń.',run:b=>quiz(b,'porownanie',QAB)},
 {part:1,id:'poprawki',n:'Co dopisać do polecenia?',m:5,d:'Poprawianie poleceń, które dały słaby wynik.',run:b=>quiz(b,'poprawki',QFIX)},
 {part:1,id:'weryfikacja',n:'Sprawdzanie odpowiedzi AI',m:7,d:'Szukanie błędów w odpowiedzi, która brzmi wiarygodnie.',run:b=>verifyTask(b,'weryfikacja',ANSWER,'Pytanie do czatu AI dotyczyło urlopu wypoczynkowego.','AI najczęściej zmyśla nazwy, daty, liczby, przepisy i źródła.')},
 {part:1,id:'dane',n:'Co można wkleić do czatu?',m:5,d:'Bezpieczne korzystanie z AI.',run:b=>sortTask(b,'dane',PASTE,[['t','Można wkleić'],['n','Nie wklejać']],'Co możesz bezpiecznie wkleić do ogólnodostępnego czatu AI, a czego nie?','W pracy korzystaj z narzędzi AI, na które pozwala firma.')},
 {part:1,id:'zastosowania',n:'AI w codziennej pracy',m:8,d:'Excel, streszczenia, grafika, przepisy, pisma i tłumaczenia.',run:b=>quiz(b,'zastosowania',QUSE)},
 {part:1,id:'rozmowa',n:'Rozmowa krok po kroku',m:6,d:'Poprawianie tekstu kolejnymi poleceniami.',run:b=>chatTask(b,'rozmowa',{steps:CHAT1,end:CHAT1_END,first:'Napisz maila do klienta, że przekładam spotkanie.',lead:'Cel: krótki, oficjalny mail do klienta. Spotkanie ze środy przenosisz na czwartek, 14:00.',msg:'W trzech krokach powstał mail gotowy do wysłania. Wystarczyło za każdym razem napisać, co dokładnie zmienić.'})},
 {part:2,id:'kto',n:'AI czy specjalista?',m:5,d:'Kiedy AI dobrze pomoże, a kiedy potrzebny jest specjalista.',run:b=>sortTask(b,'kto',WHO,[['t','AI dobrze pomoże'],['n','Potrzebny specjalista lub oficjalne źródło']],'W których sprawach AI dobrze pomoże, a w których potrzebny jest specjalista albo oficjalne źródło?','AI pomaga z tekstem i pomysłami. Decyzje o zdrowiu, prawie i pieniądzach wymagają specjalisty.')},
 {part:2,id:'excel',n:'Sprawdzanie odpowiedzi o Excelu',m:6,d:'Szukanie zmyśleń w odpowiedzi o funkcjach Excela.',run:b=>verifyTask(b,'excel',ANSWER2,'Pytanie do czatu AI dotyczyło podstaw Excela w polskiej wersji.','Przy Excelu sprawdzaj nazwy funkcji i separatory, najlepiej od razu w arkuszu.')},
 {part:2,id:'prywatnosc',n:'Prywatność w czacie AI',m:5,d:'Ustawienia, udostępnianie rozmów i konta firmowe.',run:b=>quiz(b,'prywatnosc',QPRIV)},
 {part:2,id:'oszustwa',n:'Oszustwa z użyciem AI',m:7,d:'Fałszywe oferty pracy, podrobione nagrania i głosy.',run:b=>quiz(b,'oszustwa',QSCAM,{intro:'Zobaczysz sześć ogłoszeń i wiadomości. Wszystkie firmy i sytuacje są wymyślone. Oceń, czy to raczej w porządku, czy raczej oszustwo.'})},
 {part:2,id:'ton',n:'Ton i styl wiadomości',m:5,d:'Oficjalnie czy swobodnie: polskie formy grzecznościowe.',run:b=>quiz(b,'ton',QTONE)},
 {part:2,id:'rozmowa2',n:'Rozmowa krok po kroku: SMS',m:5,d:'Poprawianie wiadomości do właściciela mieszkania.',run:b=>chatTask(b,'rozmowa2',{steps:CHAT2,end:CHAT2_END,first:'Napisz wiadomość do właściciela mieszkania, że zepsuła się pralka.',lead:'Cel: krótki, uprzejmy SMS do właściciela mieszkania o zepsutej pralce.',msg:'Z urzędowego pisma powstał prosty, uprzejmy SMS z ważnymi informacjami.'})},
 {part:2,id:'budowa2',n:'Budowa polecenia: umowa i ogłoszenie',m:8,d:'Polecenia do spraw prywatnych i dodatkowej pracy.',run:b=>buildTask(b,'budowa2',BUILD2,'Przy umowach i pieniądzach AI tłumaczy, ale decyzję podejmujesz ty.')},
 {part:2,id:'zrodla',n:'Wiarygodne źródła',m:5,d:'Gdzie sprawdzać przepisy, oferty pracy i informacje urzędowe.',run:b=>quiz(b,'zrodla',QSRC)},
 {part:2,id:'uczciwosc',n:'Uczciwe korzystanie z AI',m:5,d:'CV, prawa autorskie, deepfake i odpowiedzialność.',run:b=>quiz(b,'uczciwosc',QETH)}
];
function nextId(id){const k=ST.findIndex(s=>s.id===id); return ST[k+1]?ST[k+1].id:null}
function totals(){const v=Object.values(state.best); return {pts:v.reduce((a,b)=>a+b,0), n:v.length}}
function renderNav(){
  const ul=$('#navlist'); ul.innerHTML='';
  ST.forEach((s,k)=>{const sc=state.best[s.id];
    if(k===0||ST[k-1].part!==s.part) ul.append(h(`<li class="navhead">Część ${s.part}: ${s.part===1?'Podstawy':'AI w praktyce'}</li>`));
    const li=h(`<li><button class="nav" data-id="${s.id}"><span class="n">${k+1}. ${s.n}</span><span class="m">ok. ${s.m} min</span><span class="s${sc!=null?' done':''}">${sc!=null?sc+' / 25':'—'}</span></button></li>`);
    const b=li.querySelector('button'); if(current===s.id) b.setAttribute('aria-current','true'); b.onclick=()=>openStation(s.id); ul.append(li)});
  [['intro','#nav-intro'],['lib','#nav-lib'],['sum','#nav-sum']].forEach(([k,sel])=>{const b=$(sel); if(current===k) b.setAttribute('aria-current','true'); else b.removeAttribute('aria-current')});
  $('#lib-count').textContent=`${Object.keys(state.tried).length} z ${LIB.length}`;
  const t=totals(); $('#pts').textContent=`${t.pts} / ${ST.length*25} pkt`; $('#cnt').textContent=`${t.n} z ${ST.length} ćwiczeń`; $('#barfill').style.width=(t.pts/(ST.length*25)*100)+'%';
}
function setPanel(id){if(cleanup){cleanup();cleanup=null} current=id; renderNav(); const p=$('#panel'); p.innerHTML=''; return p}
function focusPanel(){const p=$('#panel'); const t=p.querySelector('h2'); if(t){t.setAttribute('tabindex','-1'); t.focus({preventScroll:true})} if(window.innerWidth<=860) p.scrollIntoView({block:'start'})}
function openStation(id){
  const s=ST.find(x=>x.id===id); const p=setPanel(id);
  p.append(h(`<h2>${s.n}</h2>`)); p.append(h(`<p class="desc">${s.d} Czas: ok. ${s.m} min. Najwyżej 25 pkt.</p>`));
  const body=h('<div></div>'); p.append(body); s.run(body); focusPanel();
}
function showIntro(){
  const p=setPanel('intro');
  p.innerHTML=`<h2>Wprowadzenie</h2>
  <p class="desc">Osiemnaście ćwiczeń o sztucznej inteligencji w dwóch częściach. Każda część trwa około godziny.</p>
  <p><b>Część 1: Podstawy</b> — jak działa AI, jak pisać polecenia, jak sprawdzać odpowiedzi i co można wkleić do czatu.<br><b>Część 2: AI w praktyce</b> — kiedy potrzebny jest specjalista, prywatność, oszustwa z użyciem AI, ton wiadomości, wiarygodne źródła i uczciwe korzystanie z AI.</p>
  <p>Ćwiczenia możesz robić w dowolnej kolejności i powtarzać. Za każde ćwiczenie możesz dostać do 25 punktów, razem 450. Wyniki zapisują się w tej przeglądarce.</p>
  <p>Po ćwiczeniach przejdź do części <b>Zapytania do wypróbowania</b>. Znajdziesz tam gotowe zapytania do prawdziwego czatu AI: do szukania pracy, do pracy, do spraw prywatnych i urzędowych oraz do nauki polskiego.</p>
  <p>Ćwiczenia nie łączą się z żadnym czatem AI. Odpowiedzi czatu to przygotowane przykłady. Nic nie jest wysyłane.</p>
  <div class="row"><button class="btn" id="go">Zacznij pierwsze ćwiczenie</button><button class="btn alt" id="golib">Zapytania do wypróbowania</button></div>
  <details><summary>Informacje dla prowadzącego</summary><ol>
    <li>Część 1 (ok. 60 min): ćwiczenia 1–2 wspólnie, 3–9 samodzielnie. Po ćwiczeniu 6 rozmowa o zmyśleniach AI.</li>
    <li>Część 2 (ok. 60 min): najlepiej na osobnych zajęciach. Po ćwiczeniu 13 warto porozmawiać o fałszywych ofertach pracy, które uczestnicy widzieli.</li>
    <li>Zapytania do wypróbowania (ok. 30–45 min): praca z prawdziwym czatem AI. Każda osoba wybiera 3–4 zapytania ze swojej sytuacji. Uczestnicy potrzebują konta w wybranym czacie AI.</li>
  </ol></details>`;
  p.querySelector('#go').onclick=()=>openStation(ST[0].id); p.querySelector('#golib').onclick=()=>showLibrary(); focusPanel();
}
function showSummary(){
  const p=setPanel('sum'); const t=totals();
  const rows=ST.map((s,k)=>`${k===0||ST[k-1].part!==s.part?`<tr class="sumhead"><td colspan="2">Część ${s.part}: ${s.part===1?'Podstawy':'AI w praktyce'}</td></tr>`:''}<tr><td>${k+1}. ${s.n}</td><td>${state.best[s.id]!=null?state.best[s.id]+' / 25':'nie wykonano'}</td></tr>`).join('');
  p.innerHTML=`<h2>Podsumowanie wyników</h2><p class="desc">Wykonane ćwiczenia: ${t.n} z ${ST.length}. Liczy się najlepszy wynik z każdego ćwiczenia. Wypróbowane zapytania: ${Object.keys(state.tried).length} z ${LIB.length}.</p>
  <table class="sum"><thead><tr><th>Ćwiczenie</th><th>Wynik</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td>Razem</td><td>${t.pts} / ${ST.length*25}</td></tr></tfoot></table>
  <div class="row"><button class="btn alt" id="reset">Wyczyść wyniki</button></div>`;
  let armed=false; const r=p.querySelector('#reset');
  r.onclick=()=>{if(!armed){armed=true; r.textContent='Kliknij jeszcze raz, aby potwierdzić'; setTimeout(()=>{armed=false; r.textContent='Wyczyść wyniki'},4000); return}
    state.best={}; state.tried={}; save(); showSummary()};
  focusPanel();
}
$('#nav-intro').onclick=showIntro; $('#nav-lib').onclick=()=>showLibrary(); $('#nav-sum').onclick=showSummary;
showIntro();
