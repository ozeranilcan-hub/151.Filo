const holdAnim = {
    playing: true, speed: 1.0, progress: 0, lastTs: 0, rafId: null,
    waypoints: [], cumDist: [], totalDist: 0, inbound: 90, initHeading: 80
};
const HOLD_R = 25, HOLD_TEAR_R = 22, HOLD_LEG = 80;
const hdgNorm = (h) => ((h % 360) + 360) % 360;
const hdgDelta = (from, to) => ((to - from + 540) % 360) - 180;
const turnAmount = (dir, from, to) => (dir > 0 ? hdgNorm(to - from) : hdgNorm(from - to));
const toRad = (d) => d * Math.PI / 180;

function getHoldingEntry(inbound, heading, turnDir) {
    const outbound = normalizeDeg360(inbound + 180);
    const rel = (heading - outbound + 360) % 360;
    const r = turnDir === 'R' ? rel : (360 - rel) % 360;
    if (r > 0 && r <= 110) return 'PARALLEL';
    if (r >= 290 || r === 0) return 'TEARDROP';
    return 'DIRECT';
}

function buildHoldingRoute(entryCode, turnDir, startX, startY, startHdg) {
    const mirror = turnDir === 'L';
    let cur = { x: mirror ? 300 - startX : startX, y: startY, h: hdgNorm(mirror ? -startHdg : startHdg) };
    const pts = [];
    const push = (phase) => pts.push({ x: cur.x, y: cur.y, h: cur.h, phase });
    const line = (len, phase) => {
        if (!(len > 0.01)) return;
        const n = Math.max(1, Math.round(len / 3));
        const dx = Math.sin(toRad(cur.h)), dy = -Math.cos(toRad(cur.h));
        const x0 = cur.x, y0 = cur.y, h = cur.h;
        for (let i = 1; i <= n; i++) {
            cur = { x: x0 + dx * len * i / n, y: y0 + dy * len * i / n, h };
            push(phase);
        }
    };
    const turn = (dir, deg, phase, r = HOLD_R) => {
        if (!(deg > 0.5)) return;
        const h0 = cur.h;
        const cx = cur.x + dir * r * Math.cos(toRad(h0));
        const cy = cur.y + dir * r * Math.sin(toRad(h0));
        const n = Math.max(2, Math.ceil(deg / 4));
        for (let i = 1; i <= n; i++) {
            const h = h0 + dir * deg * i / n;
            cur = { x: cx - dir * r * Math.cos(toRad(h)), y: cy - dir * r * Math.sin(toRad(h)), h: hdgNorm(h) };
            push(phase);
        }
    };
    const rotateTo = (target, phase, r = HOLD_R) => {
        const d = hdgDelta(cur.h, target);
        turn(d >= 0 ? 1 : -1, Math.abs(d), phase, r);
    };

    push("1. FIX'E YAKLAŞMA");
    line(Math.hypot(150 - cur.x, 150 - cur.y), "1. FIX'E YAKLAŞMA");
    cur = { x: 150, y: 150, h: cur.h };
    const hFix = cur.h;

    if (entryCode === 'DIRECT') {
        turn(1, turnAmount(1, hFix, 180), '2. DİREKT: SAĞA DÖNÜŞ');
        line(HOLD_LEG, '2. OUTBOUND BACAĞI');
        const c = Math.cos(toRad(hFix / 2));
        const beta = Math.acos(Math.min(1, c * c)) * 180 / Math.PI;
        turn(1, 180 + beta, '3. INBOUND DÖNÜŞÜ');
        turn(-1, beta, '3. INBOUND DÖNÜŞÜ');
        line(cur.y - 150, '4. INBOUND HATTI');
    } else if (entryCode === 'PARALLEL') {
        rotateTo(210, '2. PARALEL OUTBOUND');
        line(Math.max(0, (cur.x - 3.3 - 132) / Math.sin(toRad(30))), '2. PARALEL OUTBOUND');
        rotateTo(180, '2. PARALEL OUTBOUND');
        line(Math.max(10, HOLD_LEG - (cur.y - 150)), '2. PARALEL OUTBOUND');
        const beta = 40;
        turn(-1, 180 + beta, '3. HOLDİNG TARAFINA SOLA DÖNÜŞ');
        const x0 = 150 + HOLD_R * (1 - Math.cos(toRad(beta)));
        line((cur.x - x0) / Math.sin(toRad(beta)), '3. INBOUND YAKALAMA');
        turn(1, beta, '4. INBOUND HATTI');
        line(cur.y - 150, '4. INBOUND HATTI');
    } else {
        rotateTo(150, '2. 30° TEARDROP BACAĞI', HOLD_TEAR_R);
        const L = 2 * (150 - cur.x + HOLD_TEAR_R * (1 + Math.cos(toRad(30))));
        line(Math.max(8, L), '2. 30° TEARDROP BACAĞI');
        turn(1, 210, '3. SAĞA DÖNÜŞ & INBOUND', HOLD_TEAR_R);
        line(cur.y - 150, '4. INBOUND HATTI');
    }

    if (mirror) pts.forEach(p => { p.x = 300 - p.x; p.h = hdgNorm(-p.h); });
    return pts;
}

function computeHoldingTrajectory(entryCode, turnDir, acX, acY, localHeading) {
    const pts = buildHoldingRoute(entryCode, turnDir, acX, acY, localHeading);
    const cum = [0];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
        total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
        cum.push(total);
    }
    holdAnim.waypoints = pts;
    holdAnim.cumDist = cum;
    holdAnim.totalDist = total;
    const dStr = pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    document.getElementById('holdEntryGuidePath').setAttribute('d', dStr);
}

function updateHoldingHsiVisual(liveWorldHdg, crossTrack) {
    const hdg = normalizeDeg360(liveWorldHdg);
    const crs = normalizeDeg360(holdAnim.inbound);
    const out = normalizeDeg360(crs + 180);
    const hdgStr = formatHeading(hdg) + '°', crsStr = formatHeading(crs) + '°', outStr = formatHeading(out) + '°';

    document.getElementById('holdHsiHdgText').textContent = hdgStr;
    document.getElementById('holdHsiCrsText').textContent = crsStr;
    document.getElementById('holdHsiTopBox').textContent = hdgStr;
    document.getElementById('holdHsiCompassRose').setAttribute('transform', `rotate(${-hdg} 130 142)`);

    const crsRel = (crs - hdg + 540) % 360 - 180;
    document.getElementById('holdHsiCrsPointer').setAttribute('transform', `rotate(${crsRel} 130 142)`);

    const bugRel = (holdAnim.initHeading - hdg + 540) % 360 - 180;
    document.getElementById('holdHsiHdgBug').setAttribute('transform', `rotate(${bugRel} 130 142)`);

    const cdi = document.getElementById('holdHsiCdiBar');
    if (cdi) {
        const dx = Math.max(-40, Math.min(40, -crossTrack * 0.9));
        cdi.setAttribute('transform', `translate(${dx.toFixed(1)} 0)`);
    }

    document.getElementById('holdHsiLiveHdg').textContent = hdgStr;
    document.getElementById('holdHsiLiveCrs').textContent = crsStr;
    document.getElementById('holdHsiLiveOut').textContent = outStr;
}

function renderHoldAnimFrame(distVal) {
    const pts = holdAnim.waypoints, cum = holdAnim.cumDist;
    if (!pts || pts.length < 2) return;
    let lo = 0, hi = cum.length - 2;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (cum[mid] <= distVal) lo = mid; else hi = mid - 1; }
    const idx = lo;
    const segLen = Math.max(0.0001, cum[idx + 1] - cum[idx]);
    const t = Math.max(0, Math.min(1, (distVal - cum[idx]) / segLen));
    const p0 = pts[idx], p1 = pts[idx + 1];
    const curX = p0.x + (p1.x - p0.x) * t, curY = p0.y + (p1.y - p0.y) * t;
    const localDeg = hdgNorm(p0.h + hdgDelta(p0.h, p1.h) * t);

    const acEl = document.getElementById('holdingAircraft');
    if (acEl) acEl.setAttribute('transform', `translate(${curX.toFixed(2)}, ${curY.toFixed(2)}) rotate(${localDeg.toFixed(2)})`);

    let trail = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i <= idx; i++) trail += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
    trail += ` L ${curX.toFixed(1)} ${curY.toFixed(1)}`;
    const trailEl = document.getElementById('holdEntryTrailPath');
    if (trailEl) trailEl.setAttribute('d', trail);

    const ring = document.getElementById('holdFixRing');
    if (ring) {
        const near = Math.hypot(curX - 150, curY - 150) < 9;
        ring.setAttribute('stroke', near ? '#FFB020' : '#FFFFFF');
        ring.setAttribute('r', near ? '8' : '6');
    }
    const badge = document.getElementById('holdAnimPhaseBadge');
    if (badge && p1.phase) badge.textContent = p1.phase;
    updateHoldingHsiVisual(holdAnim.inbound + localDeg, curX - 150);
}

const HOLD_SPEED = 70, HOLD_END_PAUSE = 55;
function stepHoldAnimation(ts) {
    if (!holdAnim.lastTs) holdAnim.lastTs = ts;
    const dt = Math.min(0.1, (ts - holdAnim.lastTs) / 1000);
    holdAnim.lastTs = ts;
    if (holdAnim.playing && holdAnim.totalDist > 0) {
        holdAnim.progress += dt * HOLD_SPEED * holdAnim.speed;
        if (holdAnim.progress > holdAnim.totalDist + HOLD_END_PAUSE) holdAnim.progress = 0;
        renderHoldAnimFrame(Math.min(holdAnim.progress, holdAnim.totalDist));
    }
    if (state.activeTab === 'holding') holdAnim.rafId = requestAnimationFrame(stepHoldAnimation);
}
function startHoldAnimationLoop() { if (holdAnim.rafId) cancelAnimationFrame(holdAnim.rafId); holdAnim.lastTs = 0; holdAnim.rafId = requestAnimationFrame(stepHoldAnimation); }
function stopHoldAnimationLoop() { if (holdAnim.rafId) { cancelAnimationFrame(holdAnim.rafId); holdAnim.rafId = null; } }
function toggleHoldAnimation() {
    holdAnim.playing = !holdAnim.playing; holdAnim.lastTs = 0;
    document.getElementById('holdPlayIcon').textContent = holdAnim.playing ? '⏸' : '▶';
    document.getElementById('holdPlayText').textContent = holdAnim.playing ? 'DURAKLAT' : 'DEVAM ET';
}
function resetHoldAnimation() {
    holdAnim.progress = 0; holdAnim.playing = true; holdAnim.lastTs = 0;
    document.getElementById('holdPlayIcon').textContent = '⏸';
    document.getElementById('holdPlayText').textContent = 'DURAKLAT';
    renderHoldAnimFrame(0);
}
function updateHoldAnimSpeed() { holdAnim.speed = parseFloat(document.getElementById('holdAnimSpeed').value) || 1.0; }

const HOLD_ENTRY_INFO = {
    PARALLEL: { name: 'PARALEL GİRİŞ', desc: (t) => `FIX'i geçip inbound'a paralel (outbound yönünde) uçun, ardından holding tarafına ${t === 'R' ? 'sola' : 'sağa'} dönüp inbound'u kesin.` },
    TEARDROP: { name: 'TEARDROP GİRİŞ', desc: (t) => `FIX'i geçip outbound'dan holding tarafına 30° açıyla uçun, ${t === 'R' ? 'sağa' : 'sola'} dönerek inbound'a girin.` },
    DIRECT:   { name: 'DİREKT GİRİŞ',   desc: (t) => `FIX'i geçtikten sonra doğrudan ${t === 'R' ? 'sağa' : 'sola'} dönerek holding'e girin.` }
};

function renderHoldSectors(turnDir, activeCode, rotationDeg) {
    const g = document.getElementById('holdSectors');
    if (!g) return;
    const SR = 64;
    const base = [
        { code: 'PARALLEL', a: 0,   b: 110, ch: 'P', col: '#A78BFA' },
        { code: 'DIRECT',   a: 110, b: 290, ch: 'D', col: '#34D399' },
        { code: 'TEARDROP', a: 290, b: 360, ch: 'T', col: '#38BDF8' }
    ];
    const pt = (brg, r) => [150 + r * Math.sin(toRad(brg)), 150 - r * Math.cos(toRad(brg))];
    let html = '';
    base.forEach(sec => {
        let a = sec.a, b = sec.b;
        if (turnDir === 'L') { const na = 360 - b, nb = 360 - a; a = na; b = nb; }
        const [x1, y1] = pt(a, SR), [x2, y2] = pt(b, SR);
        const large = (b - a) > 180 ? 1 : 0;
        const active = sec.code === activeCode;
        html += `<path d="M150 150 L${x1.toFixed(1)} ${y1.toFixed(1)} A${SR} ${SR} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${sec.col}" fill-opacity="${active ? 0.22 : 0.05}" stroke="${sec.col}" stroke-opacity="${active ? 0.7 : 0.2}" stroke-width="0.8" stroke-dasharray="3 3"/>`;
        const [lx, ly] = pt((a + b) / 2, SR - 14);
        html += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${-rotationDeg} ${lx.toFixed(1)} ${ly.toFixed(1)})" fill="${sec.col}" fill-opacity="${active ? 1 : 0.55}" font-family="JetBrains Mono, monospace" font-size="9" font-weight="800">${sec.ch}</text>`;
    });
    g.innerHTML = html;
}

function calculateHolding() {
    const rawInb = parseInt(document.getElementById('holdInboundInput').value, 10);
    const rawHdg = parseInt(document.getElementById('holdHeadingInput').value, 10);
    const inbound = normalizeDeg360(isNaN(rawInb) ? 90 : rawInb);
    const heading = normalizeDeg360(isNaN(rawHdg) ? 80 : rawHdg);
    const turnDir = document.getElementById('holdTurnSelect').value;
    holdAnim.inbound = inbound; holdAnim.initHeading = heading;

    const entryCode = getHoldingEntry(inbound, heading, turnDir);
    const info = HOLD_ENTRY_INFO[entryCode];
    document.getElementById('holdEntryResult').textContent = info.name;
    document.getElementById('holdEntryDesc').textContent = info.desc(turnDir);

    const rotationDeg = inbound === 360 ? 0 : inbound;
    document.getElementById('holdGroup').setAttribute('transform', `rotate(${rotationDeg} 150 150)`);
    renderHoldSectors(turnDir, entryCode, rotationDeg);

    const patternPath = turnDir === 'R'
        ? `M 150 230 L 150 150 A ${HOLD_R} ${HOLD_R} 0 0 1 200 150 L 200 230 A ${HOLD_R} ${HOLD_R} 0 0 1 150 230`
        : `M 150 230 L 150 150 A ${HOLD_R} ${HOLD_R} 0 0 0 100 150 L 100 230 A ${HOLD_R} ${HOLD_R} 0 0 0 150 230`;
    document.getElementById('holdPatternPath').setAttribute('d', patternPath);

    const outboundX = turnDir === 'R' ? 200 : 100;
    const outboundLine = document.getElementById('hdgLineOutbound');
    outboundLine.setAttribute('x1', outboundX); outboundLine.setAttribute('x2', outboundX);
    document.getElementById('outboundLabel').setAttribute('x', turnDir === 'R' ? outboundX + 5 : outboundX - 5);
    document.getElementById('outboundLabel').setAttribute('text-anchor', turnDir === 'R' ? 'start' : 'end');

    const localHeading = (heading - inbound + 360) % 360;
    const rad = localHeading * Math.PI / 180;
    const distance = 95;
    const acX = 150 - Math.sin(rad) * distance;
    const acY = 150 + Math.cos(rad) * distance;

    computeHoldingTrajectory(entryCode, turnDir, acX, acY, localHeading);
    holdAnim.progress = 0;
    renderHoldAnimFrame(0);
}
