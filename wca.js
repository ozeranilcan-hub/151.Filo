function clampDeg(v) { v = Math.round(v); if (isNaN(v)) return 1; if (v === 0) return 360; return Math.max(1, Math.min(360, v)); }
function syncWcaFromSliders(f) {
    if (f === 'hdg') document.getElementById('calcHdgInput').value = formatHeading(document.getElementById('calcHdgSlider').value);
    else if (f === 'windDir') document.getElementById('calcWindDirInput').value = formatHeading(document.getElementById('calcWindDirSlider').value);
    else if (f === 'windSpd') document.getElementById('calcWindSpdInput').value = document.getElementById('calcWindSpdSlider').value;
    else if (f === 'tas') document.getElementById('calcTasInput').value = document.getElementById('calcTasSlider').value;
    recalculateWcaTool();
}
function syncWcaFromInputs(f) {
    if (f === 'hdg') { const v = clampDeg(parseInt(document.getElementById('calcHdgInput').value, 10)); document.getElementById('calcHdgInput').value = formatHeading(v); document.getElementById('calcHdgSlider').value = v; }
    else if (f === 'windDir') { const v = clampDeg(parseInt(document.getElementById('calcWindDirInput').value, 10)); document.getElementById('calcWindDirInput').value = formatHeading(v); document.getElementById('calcWindDirSlider').value = v; }
    else if (f === 'windSpd') { const v = Math.max(0, Math.min(150, parseInt(document.getElementById('calcWindSpdInput').value, 10) || 0)); document.getElementById('calcWindSpdInput').value = v; document.getElementById('calcWindSpdSlider').value = Math.min(100, v); }
    else if (f === 'tas') { const v = Math.max(40, Math.min(600, parseInt(document.getElementById('calcTasInput').value, 10) || 100)); document.getElementById('calcTasInput').value = v; document.getElementById('calcTasSlider').value = Math.min(500, v); }
    recalculateWcaTool();
}
function recalculateWcaTool() {
    const hdg = normalizeDeg360(parseInt(document.getElementById('calcHdgInput').value, 10) || 90);
    const windDir = normalizeDeg360(parseInt(document.getElementById('calcWindDirInput').value, 10) || 140);
    const windSpd = Math.max(0, parseFloat(document.getElementById('calcWindSpdInput').value) || 0);
    const tas = Math.max(30, parseFloat(document.getElementById('calcTasInput').value) || 120);
    const diff = (windDir - hdg + 540) % 360 - 180;
    const rad = (diff * Math.PI) / 180;
    const crosswind = windSpd * Math.sin(rad);
    const headwind = windSpd * Math.cos(rad);
    const ratio = Math.max(-0.99, Math.min(0.99, crosswind / tas));
    const exactWca = (Math.asin(ratio) * 180) / Math.PI;
    const roundedWca = Math.round(exactWca);
    const actualHdg = normalizeDeg360(hdg + roundedWca);
    const gs = Math.max(0, Math.round(tas * Math.cos((exactWca * Math.PI) / 180) - headwind));
    const maxDrift = (60 / tas) * windSpd;
    const absD = Math.abs(diff);
    const acute = absD <= 90 ? absD : 180 - absD;
    let clockText = '0', clockMult = 0;
    if (acute <= 7) { clockText = '0'; clockMult = 0; }
    else if (acute <= 22) { clockText = '1/4'; clockMult = 0.25; }
    else if (acute <= 37) { clockText = '1/2'; clockMult = 0.5; }
    else if (acute <= 52) { clockText = '3/4'; clockMult = 0.75; }
    else if (acute <= 67) { clockText = '7/8'; clockMult = 0.875; }
    else { clockText = '1/1'; clockMult = 1.0; }
    const sign = diff >= 0 ? 1 : -1;
    const mental = Math.round(maxDrift * clockMult) * sign;
    document.getElementById('resWcaDisplay').textContent = roundedWca > 0 ? `+${roundedWca}° R` : (roundedWca < 0 ? `${roundedWca}° L` : '0°');
    document.getElementById('resWcaSideBadge').textContent = Math.abs(diff) < 1 || Math.abs(diff) > 179 ? (Math.abs(diff) < 1 ? 'Tam Baş' : 'Tam Kuyruk') : `${diff > 0 ? 'Sağdan' : 'Soldan'} ${Math.round(Math.abs(diff))}°`;
    document.getElementById('resHdgDisplay').textContent = formatHeading(actualHdg) + '°';
    document.getElementById('resGsDisplay').textContent = `GS: ${gs} kt`;
    const absX = Math.round(Math.abs(crosswind));
    document.getElementById('resCrosswind').textContent = absX === 0 ? '0 kt' : `${absX} kt ${crosswind > 0 ? 'SAĞ' : 'SOL'}`;
    const rHw = Math.round(headwind);
    if (rHw >= 0) {
        document.getElementById('resHeadTailLabel').textContent = 'BAŞ';
        document.getElementById('resHeadTailVal').textContent = `-${rHw} kt`;
        document.getElementById('resHeadTailVal').className = 'font-mono text-sm sm:text-base font-bold text-avionics-amber mt-0.5 tabular-nums';
    } else {
        document.getElementById('resHeadTailLabel').textContent = 'KUYRUK';
        document.getElementById('resHeadTailVal').textContent = `+${Math.abs(rHw)} kt`;
        document.getElementById('resHeadTailVal').className = 'font-mono text-sm sm:text-base font-bold text-avionics-emerald mt-0.5 tabular-nums';
    }
    document.getElementById('resMentalApprox').textContent = mental > 0 ? `+${mental}°` : `${mental}°`;
    document.getElementById('wcaStep1').textContent = `1. Max Drift = (60 ÷ ${tas}) × ${windSpd}kt = ${maxDrift.toFixed(1)}°`;
    document.getElementById('wcaStep2').textContent = `2. Etkin ${Math.round(acute)}° (${clockText}) → WCA ≈ ${mental > 0 ? '+' + mental : mental}°`;
    document.getElementById('wcaStep3').textContent = `3. Yeni HDG = ${formatHeading(hdg)}° ${roundedWca >= 0 ? '+' : '-'} ${Math.abs(roundedWca)}° = ${formatHeading(actualHdg)}°`;
    document.getElementById('wcaHsiHdgText').textContent = formatHeading(actualHdg) + '°';
    document.getElementById('wcaHsiCrsText').textContent = formatHeading(hdg) + '°';
    document.getElementById('wcaHsiTopBox').textContent = formatHeading(actualHdg) + '°';
    document.getElementById('wcaHsiCompassRose').setAttribute('transform', `rotate(${-actualHdg} 130 142)`);
    document.getElementById('wcaHsiCrsPointer').setAttribute('transform', `rotate(${-roundedWca} 130 142)`);
    const rel = (windDir - actualHdg + 540) % 360 - 180;
    document.getElementById('wcaHsiWindArrow').setAttribute('transform', `rotate(${rel} 130 142)`);
}
