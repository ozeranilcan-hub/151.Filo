const IS_FINE_POINTER = window.matchMedia('(pointer: fine)').matches;
const state = {
    activeTab: 'home', theme: 'dark',
    currentTarget: 74, userInput: '', awaitingNextAfterError: false,
    timerInterval: null, questionStartTime: 0, correctTimeout: null
};

const TABS = ['home', 'reciprocal', 'holding', 'wca', 'vario', 'metar'];
function switchTab(tab) {
    state.activeTab = tab;
    TABS.forEach(t => {
        const btn = document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1));
        const view = document.getElementById('view' + t.charAt(0).toUpperCase() + t.slice(1));
        if (!btn || !view) return;
        if (t === tab) { btn.classList.add('tab-active'); btn.classList.remove('tab-inactive'); view.classList.remove('hidden'); }
        else { btn.classList.remove('tab-active'); btn.classList.add('tab-inactive'); view.classList.add('hidden'); }
    });
    if (tab === 'reciprocal') { focusHiddenInput(); if (!state.awaitingNextAfterError && state.userInput.length < 3) startQuestionTimer(); }
    else { if (state.timerInterval) clearInterval(state.timerInterval); }
    if (tab === 'holding') {
        calculateHolding();
        startHoldAnimationLoop();
    } else {
        stopHoldAnimationLoop();
    }
    if (tab === 'wca') recalculateWcaTool();
    if (tab === 'vario') recalculateVarioTool();
    if (tab === 'metar') decodeMetarInput();
}

function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.getElementById('themeIconDark').classList.toggle('hidden', theme === 'light');
    document.getElementById('themeIconLight').classList.toggle('hidden', theme === 'dark');
}
function toggleTheme() { applyTheme(state.theme === 'dark' ? 'light' : 'dark'); }
