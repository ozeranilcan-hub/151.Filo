const varioState = { mode: 'DESC', qDist: 5, qGs: 90, qAlt: 2000, qAns: 600, qMode: 'DESC', scoreCorrect: 0, scoreTotal: 0, answeredCurrent: false };
function setVarioMode(mode) {
    varioState.mode = mode;
    const btnD = document.getElementById('varioModeDesc'), btnC = document.getElementById('varioModeClimb'), lbl = document.getElementById('varioAltLabel');
    if (mode === 'DESC') {
        btnD.className = 'px-2.5 py-1 rounded-md font-bold bg-avionics-amber text-slate-950';
        btnC.className = 'px-2.5 py-1 rounded-md font-bold'; btnC.style.color = 'var(--text-muted)';
        lbl.textContent = 'ALÇALINACAK İRTİFA';
    } else {
        btnC.className = 'px-2.5 py-1 rounded-md font-bold bg-avionics-emerald text-slate-950';
        btnD.className = 'px-2.5 py-1 rounded-md font-bold'; btnD.style.color = 'var(--text-muted)';
        lbl.textContent = 'TIRMANILACAK İRTİFA';
    }
    recalculateVarioTool();
}
function syncVarioFromSliders(f) {
    if (f === 'dist') document.getElementById('varioDistInput').value = document.getElementById('varioDistSlider').value;
    else if (f === 'gs') document.getElementById('varioGsInput').value = document.getElementById('varioGsSlider').value;
    else if (f === 'alt') document.getElementById('varioAltInput').value = document.getElementById('varioAltSlider').value;
    recalculateVarioTool();
}
function syncVarioFromInputs(f) {
    if (f === 'dist') { const v = Math.max(0.1, Math.min(500, parseFloat(document.getElementById('varioDistInput').value) || 5)); document.getElementById('varioDistSlider').value = Math.min(100, Math.max(1, Math.round(v))); }
    else if (f === 'gs') { const v = Math.max(20, Math.min(700, parseFloat(document.getElementById('varioGsInput').value) || 90)); document.getElementById('varioGsSlider').value = Math.min(500, Math.max(40, Math.round(v))); }
    else if (f === 'alt') { const v = Math.max(50, Math.min(50000, parseFloat(document.getElementById('varioAltInput').value) || 2000)); document.getElementById('varioAltSlider').value = Math.min(20000, Math.max(500, Math.round(v))); }
    recalculateVarioTool();
}
function recalculateVarioTool() {
    const dist = Math.max(0.1, parseFloat(document.getElementById('varioDistInput').value) || 5);
    const gs = Math.max(20, parseFloat(document.getElementById('varioGsInput').value) || 90);
    const alt = Math.max(50, parseFloat(document.getElementById('varioAltInput').value) || 2000);
    const timeMin = (dist / gs) * 60;
    const fpm = Math.round(alt / timeMin);
    const ftPerNm = Math.round(alt / dist);
    const angleDeg = (Math.atan(alt / (dist * 6076.12)) * 180) / Math.PI;
    const mins = Math.floor(timeMin), secs = Math.round((timeMin - mins) * 60);
    const isDesc = varioState.mode === 'DESC';
    const fpmEl = document.getElementById('varioResFpm');
    fpmEl.textContent = (isDesc ? '-' : '+') + fpm;
    fpmEl.className = `font-mono text-3xl sm:text-4xl font-extrabold mt-1 tabular-nums ${isDesc ? 'text-avionics-amber' : 'text-avionics-emerald'}`;
    document.getElementById('varioResTime').textContent = `${mins} dk ${secs} sn`;
    document.getElementById('varioResAngle').textContent = `Açı: ${angleDeg.toFixed(1)}° | ${ftPerNm} ft/NM`;
    document.getElementById('varioStep1').textContent = `1. Süre = (${dist} NM ÷ ${gs} kt) × 60 = ${timeMin.toFixed(2)} dk (${mins} dk ${secs} sn)`;
    document.getElementById('varioStep2').textContent = `2. Varyo = ${alt} ft ÷ ${timeMin.toFixed(2)} dk = ${isDesc ? '-' : '+'}${fpm} ft/dk`;
    const line = document.getElementById('varioProfileGlide'), plane = document.getElementById('varioSvgPlane');
    if (isDesc) {
        line.setAttribute('x1', '45'); line.setAttribute('y1', '25'); line.setAttribute('x2', '315'); line.setAttribute('y2', '90'); line.setAttribute('stroke', '#FFB020');
        plane.setAttribute('transform', 'translate(45, 25) rotate(14)');
    } else {
        line.setAttribute('x1', '45'); line.setAttribute('y1', '90'); line.setAttribute('x2', '315'); line.setAttribute('y2', '25'); line.setAttribute('stroke', '#10B981');
        plane.setAttribute('transform', 'translate(45, 90) rotate(-14)');
    }
    document.getElementById('varioSvgAltText').textContent = `${alt} ft`;
    document.getElementById('varioSvgDistText').textContent = `${dist} NM @ ${gs} kt`;
}
function generateVarioQuiz() {
    const isDA42 = Math.random() < 0.45;
    const acLabel = isDA42 ? 'Diamond DA42' : 'Cessna 172';
    const gs = isDA42 ? (110 + Math.floor(Math.random() * 12) * 5) : (75 + Math.floor(Math.random() * 10) * 5);
    let dist, alt, fpm, mode, attempts = 0;
    do {
        dist = 4 + Math.floor(Math.random() * 15);
        alt = (8 + Math.floor(Math.random() * 38)) * 100;
        fpm = Math.round(alt / ((dist / gs) * 60));
        attempts++;
    } while ((fpm < 300 || fpm > 1050) && attempts < 40);
    mode = Math.random() < 0.7 ? 'DESC' : 'CLIMB';
    varioState.qDist = dist; varioState.qGs = gs; varioState.qAlt = alt; varioState.qMode = mode; varioState.qAns = fpm; varioState.answeredCurrent = false;
    document.getElementById('vqAircraftTag').textContent = acLabel;
    const actionWord = mode === 'DESC' ? 'Alçalmanız' : 'Tırmanmanız';
    document.getElementById('varioQuizPrompt').innerHTML = `<strong>${acLabel}</strong> ile önümüzde <span class="font-mono font-bold text-avionics-cyan">${dist} NM</span> yol var ve <span class="font-mono font-bold text-avionics-amber">${gs} kt</span> yer hızıyla uçuyorsunuz. ${actionWord} gereken irtifa <span class="font-mono font-bold text-avionics-emerald">${alt} ft</span>. Kaç ft/dk varyo tutmalısınız?`;
    document.getElementById('vqDist').textContent = `${dist} NM`; document.getElementById('vqGs').textContent = `${gs} kt`; document.getElementById('vqAlt').textContent = `${alt} ft`;
    document.getElementById('varioQuizInput').value = '';
    const fb = document.getElementById('varioQuizFeedback');
    fb.style.color = 'var(--text-muted)'; fb.textContent = "Cevabınızı yazıp Enter'a basın (±%10 tolerans kabul edilir).";
}
function checkVarioQuiz() {
    if (varioState.answeredCurrent) { generateVarioQuiz(); return; }
    const raw = parseFloat(document.getElementById('varioQuizInput').value);
    if (isNaN(raw)) return;
    const userVal = Math.abs(Math.round(raw)), expected = varioState.qAns, tol = expected * 0.10;
    const isOk = Math.abs(userVal - expected) <= tol;
    const timeMin = (varioState.qDist / varioState.qGs) * 60;
    varioState.answeredCurrent = true; varioState.scoreTotal += 1;
    if (isOk) varioState.scoreCorrect += 1;
    document.getElementById('varioQuizScore').textContent = `Skor: ${varioState.scoreCorrect} / ${varioState.scoreTotal}`;
    const fb = document.getElementById('varioQuizFeedback');
    const sign = varioState.qMode === 'DESC' ? '-' : '+';
    const minOk = Math.round(expected * 0.90), maxOk = Math.round(expected * 1.10);
    if (isOk) {
        fb.style.color = 'var(--emerald)';
        fb.innerHTML = `<strong>DOĞRU!</strong> Tam değer: <strong>${sign}${expected} ft/dk</strong> (Kabul aralığı: ${minOk}–${maxOk} ft/dk | Süre: ${timeMin.toFixed(1)} dk)<br><span class="text-[10px]" style="color:var(--text-muted)">Sonraki soru için Enter</span>`;
    } else {
        fb.style.color = 'var(--crimson)';
        fb.innerHTML = `<strong>HATALI!</strong> Girilen: ${userVal} ft/dk | Doğru: <span style="color:var(--emerald)">${sign}${expected} ft/dk</span> (Aralık: ${minOk}–${maxOk} ft/dk)<br><span class="text-[10px]" style="color:var(--text-muted)">Sonraki soru için Enter</span>`;
    }
}
