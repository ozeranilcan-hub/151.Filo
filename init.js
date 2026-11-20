window.addEventListener('DOMContentLoaded', () => {
    applyTheme('dark');
    const buildRose = (id) => {
        const c = document.getElementById(id);
        if (!c) return;
        let h = '';
        for (let i = 0; i < 360; i += 30) {
            const lbl = i === 0 ? 'N' : (i === 90 ? 'E' : (i === 180 ? 'S' : (i === 270 ? 'W' : i / 10)));
            h += `<text x="130" y="55" fill="#fff" font-size="11" font-family="monospace" text-anchor="middle" transform="rotate(${i} 130 142)">${lbl}</text>`;
            h += `<line x1="130" y1="50" x2="130" y2="46" stroke="#fff" stroke-width="1.5" transform="rotate(${i} 130 142)" />`;
        }
        c.innerHTML = h;
    };
    buildRose('g1000CompassTicks');
    buildRose('wcaHsiCompassTicks');
    buildRose('holdHsiCompassTicks');
    switchTab('home');
    nextQuestion();
    calculateHolding();
    recalculateWcaTool();
    recalculateVarioTool();
    generateVarioQuiz();
    selectMetarSample(0);
    renderMetarQuiz();
    renderRandomAviationFact();
});
