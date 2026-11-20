function normalizeDeg360(d) { let x = Math.round(d) % 360; if (x <= 0) x += 360; return x; }
function formatHeading(n) { return String(normalizeDeg360(n)).padStart(3, '0'); }
function getReciprocal(v) { const x = normalizeDeg360(v); let r = x <= 180 ? x + 180 : x - 180; return r === 0 ? 360 : r; }

function renderTargetAndSlots() {
    document.getElementById('targetDisplay').textContent = formatHeading(state.currentTarget) + '°';
    const slots = document.getElementById('digitSlots');
    let html = '';
    for (let i = 0; i < 3; i++) {
        const ch = state.userInput[i];
        if (ch !== undefined) html += `<span class="w-9 h-12 flex items-center justify-center border-b-2 border-avionics-cyan" style="color:var(--text)">${ch}</span>`;
        else if (i === state.userInput.length) html += `<span class="w-9 h-12 flex items-center justify-center relative"><span class="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 h-0.5 bg-avionics-cyan"></span><span class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-avionics-cyan caret-blink"></span></span>`;
        else html += `<span class="w-9 h-12 flex items-center justify-center border-b-2 border-slate-800 text-slate-600">•</span>`;
    }
    slots.innerHTML = html;
}
function updateReciprocalHSI() {
    const deg = state.currentTarget;
    const recip = getReciprocal(deg);
    const hdgStr = formatHeading(deg) + '°';
    const recStr = formatHeading(recip) + '°';
    const rose = document.getElementById('g1000CompassRose');
    if (rose) rose.setAttribute('transform', `rotate(${-deg} 130 142)`);
    document.getElementById('g1000TopHdgBoxText').textContent = hdgStr;
    document.getElementById('g1000HdgCorner').textContent = hdgStr;
    document.getElementById('g1000RecipCorner').textContent = recStr;
}
function handleDigit(digit) {
    if (state.activeTab !== 'reciprocal' || !/^[0-9]$/.test(digit) || state.correctTimeout) return;
    if (state.awaitingNextAfterError) {
        state.awaitingNextAfterError = false; state.userInput = '';
        document.getElementById('feedbackIncorrect').classList.add('hidden');
        document.getElementById('feedbackDefault').classList.remove('hidden');
        startQuestionTimer();
    }
    if (state.userInput.length >= 3) return;
    state.userInput += digit;
    renderTargetAndSlots();
    if (state.userInput.length === 3) evaluateAnswer();
}
function handleBackspace() {
    if (state.activeTab !== 'reciprocal' || state.awaitingNextAfterError || state.correctTimeout || state.userInput.length === 0) return;
    state.userInput = state.userInput.slice(0, -1);
    renderTargetAndSlots();
}
function evaluateAnswer() {
    stopQuestionTimer();
    const entered = parseInt(state.userInput, 10);
    const expected = getReciprocal(state.currentTarget);
    const isCorrect = (entered === expected);
    document.getElementById('feedbackDefault').classList.add('hidden');
    if (isCorrect) {
        document.getElementById('feedbackIncorrect').classList.add('hidden');
        document.getElementById('feedbackCorrect').classList.remove('hidden');
        document.getElementById('feedbackCorrect').classList.add('flex');
        document.getElementById('correctMsgTitle').textContent = `DOĞRU! ${formatHeading(state.currentTarget)}° → ${formatHeading(expected)}°`;
        state.correctTimeout = setTimeout(nextQuestion, 900);
    } else {
        state.awaitingNextAfterError = true;
        document.getElementById('feedbackCorrect').classList.add('hidden');
        document.getElementById('feedbackIncorrect').classList.remove('hidden');
        const cur = formatHeading(state.currentTarget);
        const hint = state.currentTarget <= 180
            ? `İpucu: ${cur} + 200 − 20 = ${formatHeading(expected)}° (yüzler +2, onlar −2)`
            : `İpucu: ${cur} − 200 + 20 = ${formatHeading(expected)}° (yüzler −2, onlar +2)`;
        document.getElementById('incorrectSummary').innerHTML = `Girilen: <span class="text-avionics-crimson">${state.userInput}°</span> | Doğru: <span class="text-avionics-emerald">${formatHeading(expected)}°</span><br><span class="text-[10px] mt-1 block" style="color:var(--text-muted)">${hint}</span>`;
    }
}
function nextQuestion() {
    if (state.correctTimeout) { clearTimeout(state.correctTimeout); state.correctTimeout = null; }
    state.awaitingNextAfterError = false; state.userInput = '';
    let next;
    do { next = Math.floor(Math.random() * 360) + 1; } while (next === state.currentTarget);
    state.currentTarget = next;
    document.getElementById('feedbackIncorrect').classList.add('hidden');
    document.getElementById('feedbackCorrect').classList.add('hidden');
    document.getElementById('feedbackCorrect').classList.remove('flex');
    document.getElementById('feedbackDefault').classList.remove('hidden');
    renderTargetAndSlots(); updateReciprocalHSI();
    if (state.activeTab === 'reciprocal') startQuestionTimer();
    else if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
}
function focusHiddenInput() {
    if (state.activeTab !== 'reciprocal' || !IS_FINE_POINTER) return;
    const inp = document.getElementById('hiddenNumberInput');
    if (inp && document.activeElement !== inp) inp.focus({ preventScroll: true });
}
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (state.activeTab === 'reciprocal') {
        if (e.key >= '0' && e.key <= '9') { e.preventDefault(); handleDigit(e.key); }
        else if (e.key === 'Backspace') { e.preventDefault(); handleBackspace(); }
        else if (e.key === 'Enter') { e.preventDefault(); nextQuestion(); }
    }
});
function startQuestionTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.questionStartTime = performance.now();
    document.getElementById('liveTimerDisplay').textContent = '0.0s';
    state.timerInterval = setInterval(() => {
        const sec = (performance.now() - state.questionStartTime) / 1000;
        document.getElementById('liveTimerDisplay').textContent = sec.toFixed(1) + 's';
    }, 100);
}
function stopQuestionTimer() {
    if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
    return (performance.now() - state.questionStartTime) / 1000;
}
function toggleHSI() {
    const hsi = document.getElementById('hsiContainer');
    const btn = document.getElementById('hsiToggleBtn');
    const dot = document.getElementById('hsiDot');
    if (hsi.classList.contains('hidden')) {
        hsi.classList.remove('hidden'); hsi.classList.add('flex');
        btn.classList.add('border-avionics-cyan/50', 'text-avionics-cyan');
        dot.classList.replace('bg-slate-600', 'bg-avionics-cyan');
    } else {
        hsi.classList.add('hidden'); hsi.classList.remove('flex');
        btn.classList.remove('border-avionics-cyan/50', 'text-avionics-cyan');
        dot.classList.replace('bg-avionics-cyan', 'bg-slate-600');
    }
}
