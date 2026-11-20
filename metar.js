const METAR_SAMPLES = [
    'METAR LTBD 191450Z 25011KT CAVOK 19/06 Q1018 NOSIG=',
    'METAR LTFM 191520Z 03022G34KT 6000 -SHRA FEW018 SCT030CB BKN080 11/08 Q1009 TEMPO 3000 TSRA=',
    'METAR LTAC 190550Z 00000KT 0400 R03R/0750N FG VV002 02/02 Q1024 BECMG 1500 BR=',
    'METAR LTBA 191620Z 21018G28KT 180V250 2500 +TSRA BKN012 OVC025CB 14/13 Q1004 RETS=',
    'TAF LTAI 191100Z 1912/2018 19012KT 9999 SCT035 TEMPO 1914/1920 22018G28KT 4000 SHRA BKN020CB=',
    'METAR LTBJ 191350Z VRB04KT 9999 FEW040 SCT100 21/05 Q1015 NOSIG='
];

const METAR_QUIZ_BANK = [
    {
        raw: 'METAR LTFM 191520Z 03022G34KT 6000 -SHRA FEW018 SCT030CB BKN080 11/08 Q1009=',
        q: 'Bu METAR raporunda BKN (Broken) bulut tabanı kaç feet AGL seviyesindedir?',
        options: ['800 ft', '3.000 ft', '8.000 ft', '1.800 ft'],
        correct: 2,
        exp: 'Bulut yükseklikleri yüzler cinsinden (×100 ft) verilir: BKN080 = 8.000 ft AGL.'
    },
    {
        raw: 'METAR LTAC 190550Z 00000KT 0400 R03R/0750N FG VV002 02/02 Q1024=',
        q: 'Rapordaki "0400" ve "VV002" ifadeleri ne anlama gelir?',
        options: ['Görüş 4000 m, tavan 2000 ft', 'Hakim görüş 400 m, dikey görüş (Vertical Visibility) 200 ft', 'Rüzgar 040°, görüş 2 NM', 'Görüş 400 ft, tavan 200 m'],
        correct: 1,
        exp: '4 haneli görüş metre cinsindendir (0400 = 400 m). VV002 ise gökyüzü kapalıyken dikey görüşün 200 ft olduğunu belirtir.'
    },
    {
        raw: 'METAR LTBA 191620Z 21018G28KT 180V250 2500 +TSRA BKN012 OVC025CB 14/13 Q1004=',
        q: 'Raporda rüzgar bilgisi nasıl yorumlanmalıdır?',
        options: ['210° yönünden 18 kt, hamlesi (gust) 28 kt; yönü 180° ile 250° arasında değişken', '180° yönünden 25 kt sabit rüzgar', '210° yönünden 28 kt, hamlesi 18 kt', 'Değişken yönlü 18 kt rüzgar'],
        correct: 0,
        exp: '21018G28KT = 210°’den 18 kt, maksimum hamle (G) 28 kt; 180V250 ise rüzgar yönünün 180°–250° arasında 60° veya daha fazla değiştiğini gösterir.'
    },
    {
        raw: 'TAF LTAI 191100Z 1912/2018 19012KT 9999 SCT035 TEMPO 1914/1920 4000 SHRA BKN020CB=',
        q: 'Bu TAF raporunun geçerlilik süresi hangi gün ve saatler (UTC) arasındadır?',
        options: ['Ayın 19’u 11:00Z – 12:00Z', 'Ayın 19’u 12:00Z – Ayın 20’si 18:00Z', 'Ayın 19’u 14:00Z – 20:00Z', 'Ayın 19’u 12:00Z – 18:00Z'],
        correct: 1,
        exp: '1912/2018 grubu raporun ayın 19’u saat 12:00 UTC’den ayın 20’si saat 18:00 UTC’ye kadar (30 saat) geçerli olduğunu belirtir.'
    },
    {
        raw: 'METAR LTBD 191450Z 25011KT CAVOK 19/06 Q1018 NOSIG=',
        q: 'CAVOK kelimesinin geçerli olabilmesi için hakim görüş en az kaç olmalıdır?',
        options: ['5 km ve üzeri', '8 km ve üzeri', '10 km (9999) ve üzeri, 5000 ft/MSA altında bulut yok, belirgin hadise yok', 'Sadece bulut olmaması yeterlidir'],
        correct: 2,
        exp: 'CAVOK: Görüş ≥ 10 km, 5000 ft (veya en yüksek MSA) altında bulut yok, CB/TCU yok ve belirgin hava hadisesi yok demektir.'
    }
];

let metarQuizIdx = 0;
let metarScoreOk = 0;
let metarScoreTot = 0;
let metarQuizAnswered = false;

function selectMetarSample(idx) {
    const inp = document.getElementById('metarRawInput');
    if (inp) {
        inp.value = METAR_SAMPLES[idx] || METAR_SAMPLES[0];
        decodeMetarInput();
    }
}

function loadRandomMetarSample() {
    const idx = Math.floor(Math.random() * METAR_SAMPLES.length);
    selectMetarSample(idx);
}

function decodeMetarInput() {
    const raw = (document.getElementById('metarRawInput').value || '').trim().toUpperCase().replace(/=$/, '');
    const grid = document.getElementById('metarDecodedGrid');
    if (!grid) return;

    if (!raw) {
        grid.innerHTML = '<div class="col-span-2 text-xs font-mono p-4 rounded-xl border" style="background-color:var(--bg); border-color:var(--border); color:var(--text-muted);">Çözümlemek için yukarıya bir METAR veya TAF metni girin.</div>';
        return;
    }

    const tokens = raw.split(/\s+/);
    const type = tokens[0] === 'TAF' ? 'TAF (Meydan Tahmini)' : 'METAR (Gözlem Raporu)';
    const icao = tokens.find(t => /^[A-Z]{4}$/.test(t) && t !== 'METAR' && t !== 'AUTO' && t !== 'COR' && t !== 'CAVOK' && t !== 'NOSIG' && t !== 'TEMPO' && t !== 'BECMG') || '—';
    const timeTok = tokens.find(t => /^\d{6}Z$/.test(t));
    const validTok = tokens.find(t => /^\d{4}\/\d{4}$/.test(t));
    const windTok = tokens.find(t => /^(VRB|\d{3})\d{2}(G\d{2})?(KT|MPS)$/.test(t));
    const varWindTok = tokens.find(t => /^\d{3}V\d{3}$/.test(t));
    const isCavok = tokens.includes('CAVOK');
    const visTok = isCavok ? 'CAVOK' : tokens.find(t => /^\d{4}$/.test(t));
    const clouds = tokens.filter(t => /^(FEW|SCT|BKN|OVC|VV)\d{3}(CB|TCU)?$/.test(t));
    const tempTok = tokens.find(t => /^(M?\d{2})\/(M?\d{2})$/.test(t));
    const qnhTok = tokens.find(t => /^[QA]\d{4}$/.test(t));
    const wxTokens = tokens.filter(t => /^(\+|-|VC)?(TS|SH|FZ|BL|DR|MI|BC|PR)?(RA|SN|DZ|GR|GS|PL|SG|IC|FG|BR|HZ|DU|SA|FU|SQ|FC|DS|SS)+$/.test(t));
    const trends = tokens.filter(t => /^(NOSIG|TEMPO|BECMG|FM\d{6}|PROB\d{2})$/.test(t));

    let timeDesc = 'Belirtilmemiş';
    if (timeTok) {
        timeDesc = `Ayın ${timeTok.slice(0,2)}. günü, saat ${timeTok.slice(2,4)}:${timeTok.slice(4,6)} UTC`;
        if (validTok) timeDesc += ` | Geçerlilik: ${validTok.slice(0,2)}/${validTok.slice(2,4)}Z → ${validTok.slice(5,7)}/${validTok.slice(7,9)}Z`;
    }

    let windDesc = 'Belirtilmemiş';
    if (windTok) {
        const m = windTok.match(/^(VRB|\d{3})(\d{2})(G(\d{2}))?(KT|MPS)$/);
        if (m) {
            if (m[1] === '000' && m[2] === '00') windDesc = 'Sakin (Calm — 000/00 kt)';
            else {
                const dirStr = m[1] === 'VRB' ? 'Değişken (VRB)' : `${m[1]}° yönünden`;
                windDesc = `${dirStr} ${parseInt(m[2], 10)} ${m[5]}`;
                if (m[4]) windDesc += `, hamle (Gust) ${parseInt(m[4], 10)} ${m[5]}`;
                if (varWindTok) windDesc += ` (${varWindTok.replace('V', '°–')}° değişken)`;
            }
        }
    }

    let visDesc = 'Belirtilmemiş';
    if (isCavok) visDesc = 'CAVOK (≥ 10 km görüş, 5000 ft altı bulut yok, belirgin hadise yok)';
    else if (visTok === '9999') visDesc = '10 km ve üzeri (9999)';
    else if (visTok) visDesc = `${parseInt(visTok, 10)} metre`;

    const wxMap = { RA:'Yağmur', SN:'Kar', DZ:'Çisenti', TS:'Oraj (Thunderstorm)', SH:'Sağanak', FG:'Sis (<1000m)', BR:'Pus (1000–5000m)', HZ:'Toz/Pus (Haze)', GR:'Dolu', FZ:'Dondurucu' };
    let wxDesc = isCavok ? 'Belirgin hava hadisesi yok (NSW)' : 'Belirgin hadise raporlanmamış';
    if (wxTokens.length > 0) {
        wxDesc = wxTokens.map(w => {
            let prefix = w.startsWith('+') ? 'Şiddetli ' : (w.startsWith('-') ? 'Hafif ' : (w.startsWith('VC') ? 'Civarda ' : ''));
            const core = w.replace(/^(\+|-|VC)/, '');
            const parts = core.match(/.{1,2}/g) || [core];
            return `${w} (${prefix}${parts.map(p => wxMap[p] || p).join(' + ')})`;
        }).join(', ');
    }

    const covMap = { FEW:'Az (1–2 okta)', SCT:'Parçalı (3–4 okta)', BKN:'Çok bulutlu / Tavan (5–7 okta)', OVC:'Kapalı / Tavan (8 okta)', VV:'Dikey Görüş' };
    let cloudDesc = isCavok ? '5000 ft altında bulut yok' : 'Bulut bilgisi yok / NSC';
    if (clouds.length > 0) {
        cloudDesc = clouds.map(c => {
            const cm = c.match(/^(FEW|SCT|BKN|OVC|VV)(\d{3})(CB|TCU)?$/);
            if (!cm) return c;
            const ft = parseInt(cm[2], 10) * 100;
            const extra = cm[3] ? ` [${cm[3]}]` : '';
            return `${covMap[cm[1]]} @ ${ft.toLocaleString('tr-TR')} ft${extra}`;
        }).join(' | ');
    }

    let tempDesc = '—';
    if (tempTok) {
        const parseT = (s) => s.startsWith('M') ? `-${parseInt(s.slice(1), 10)}°C` : `${parseInt(s, 10)}°C`;
        const [t1, t2] = tempTok.split('/');
        tempDesc = `Sıcaklık: ${parseT(t1)} | Çiğ Noktası (Dewpoint): ${parseT(t2)}`;
    }

    let qnhDesc = '—';
    if (qnhTok) {
        qnhDesc = qnhTok.startsWith('Q') ? `${qnhTok.slice(1)} hPa (mb)` : `${(parseInt(qnhTok.slice(1), 10) / 100).toFixed(2)} inHg`;
    }

    const cards = [
        { title: 'MEYDAN & ZAMAN', val: `${icao} — ${type}`, sub: timeDesc, color: 'text-avionics-cyan' },
        { title: 'RÜZGAR (WIND)', val: windTok || '—', sub: windDesc, color: 'text-avionics-amber' },
        { title: 'GÖRÜŞ & HAVA HADİSESİ', val: visDesc, sub: wxDesc, color: 'text-sky-400' },
        { title: 'BULUTLAR & TAVAN', val: clouds.length ? clouds.join(' ') : (isCavok ? 'CAVOK' : '—'), sub: cloudDesc, color: 'text-avionics-magenta' },
        { title: 'SICAKLIK / ÇİĞ NOKTASI', val: tempTok || '—', sub: tempDesc, color: 'text-avionics-emerald' },
        { title: 'BASINÇ (QNH) & TREND', val: qnhTok || '—', sub: `${qnhDesc} | Trend: ${trends.length ? trends.join(', ') : 'Yok'}`, color: 'text-avionics-cyan' }
    ];

    grid.innerHTML = cards.map(c => `
        <div class="rounded-xl p-3.5 border" style="background-color:var(--bg); border-color:var(--border);">
            <div class="font-mono text-[10px] font-bold tracking-wider uppercase ${c.color}">${c.title}</div>
            <div class="font-mono text-xs sm:text-sm font-bold mt-1" style="color:var(--text);">${c.val}</div>
            <div class="text-[11px] mt-1 leading-snug" style="color:var(--text-muted);">${c.sub}</div>
        </div>
    `).join('');
}

function renderMetarQuiz() {
    const item = METAR_QUIZ_BANK[metarQuizIdx];
    metarQuizAnswered = false;
    document.getElementById('metarQuizRaw').textContent = item.raw;
    document.getElementById('metarQuizQuestion').textContent = item.q;
    const optsEl = document.getElementById('metarQuizOptions');
    optsEl.innerHTML = item.options.map((opt, i) => `
        <button onclick="answerMetarQuiz(${i})" id="mqOpt_${i}" class="w-full text-left px-4 py-2.5 rounded-xl border font-mono text-xs font-semibold transition-colors hover:border-sky-400" style="background-color:var(--bg); border-color:var(--border); color:var(--text);">
            ${String.fromCharCode(65 + i)}) ${opt}
        </button>
    `).join('');
    const fb = document.getElementById('metarQuizFeedback');
    fb.style.color = 'var(--text-muted)';
    fb.textContent = 'Doğru şıkkı seçin.';
}

function answerMetarQuiz(choice) {
    if (metarQuizAnswered) return;
    metarQuizAnswered = true;
    const item = METAR_QUIZ_BANK[metarQuizIdx];
    const isOk = choice === item.correct;
    metarScoreTot += 1;
    if (isOk) metarScoreOk += 1;
    document.getElementById('metarQuizScore').textContent = `Skor: ${metarScoreOk} / ${metarScoreTot}`;

    item.options.forEach((_, i) => {
        const btn = document.getElementById(`mqOpt_${i}`);
        if (!btn) return;
        if (i === item.correct) {
            btn.style.borderColor = 'var(--emerald)';
            btn.style.color = 'var(--emerald)';
        } else if (i === choice && !isOk) {
            btn.style.borderColor = 'var(--crimson)';
            btn.style.color = 'var(--crimson)';
        }
    });

    const fb = document.getElementById('metarQuizFeedback');
    fb.style.color = isOk ? 'var(--emerald)' : 'var(--crimson)';
    fb.innerHTML = `<span><strong>${isOk ? 'DOĞRU!' : 'YANLIŞ!'}</strong> ${item.exp}</span>`;
}

function nextMetarQuiz() {
    metarQuizIdx = (metarQuizIdx + 1) % METAR_QUIZ_BANK.length;
    renderMetarQuiz();
}
