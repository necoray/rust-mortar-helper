import { mortarState } from './state.js';
import { initAnalysis, addShotRow } from './features/analysis.js';
import { initAiming } from './features/aiming.js';
import { drawChart } from './chart.js';
import { formatPolynomial } from './math.js';

const DEFAULT_DATA = {
  "v": "1.0",
  "degree": 2,
  "coefficients": [
    23.83,
    1.92,
    0.01
  ],
  "shots": [
    { "angle": 7.5, "distance": 39 },
    { "angle": 7.5, "distance": 40 },
    { "angle": 7.5, "distance": 37 },
    { "angle": 15, "distance": 49 },
    { "angle": 15, "distance": 50 },
    { "angle": 30, "distance": 94 },
    { "angle": 30, "distance": 98 },
    { "angle": 45, "distance": 130 },
    { "angle": 45, "distance": 132 },
    { "angle": 45, "distance": 120 },
    { "angle": 60, "distance": 145 },
    { "angle": 60, "distance": 160 },
    { "angle": 60, "distance": 140 },
    { "angle": 67.5, "distance": 199 },
    { "angle": 67.5, "distance": 188 },
    { "angle": 67.5, "distance": 197 }
  ],
  "ts": "2026-05-17T00:00:00.000Z"
}

document.addEventListener('DOMContentLoaded', () => {
    mortarState.calculated = false;
    mortarState.coeffs = null;

    const els = {
        shotsContainer: document.getElementById('shots-container'),
        calculateBtn: document.getElementById('calculate-btn'),
        exportBtn: document.getElementById('export-btn'),
        importBtn: document.getElementById('import-btn'),
        importFile: document.getElementById('import-file'),
        resultBlock: document.getElementById('result-block'),
        degreeInput: document.getElementById('degree'),
        chartCanvas: document.getElementById('chart'),
        polyDisplay: document.getElementById('polynomial-display'),
        targetDistance: document.getElementById('target-distance'),
        aimBtn: document.getElementById('aim-btn'),
        aimResult: document.getElementById('aim-result'),
        aimList: document.getElementById('aim-list'),
        mortarScale: document.getElementById('mortar-scale'),
        addShotBtn: document.getElementById('add-shot-btn')
    };

    initAnalysis(els);
    initAiming(els);
    applyDefaultData(els);
});

function applyDefaultData(els) {
    mortarState.coeffs = DEFAULT_DATA.coefficients;
    mortarState.degree = DEFAULT_DATA.degree;
    mortarState.calculated = true;

    els.degreeInput.value = DEFAULT_DATA.degree;
    els.shotsContainer.innerHTML = '';
    DEFAULT_DATA.shots.forEach(s => addShotRow(els.shotsContainer, s.angle, s.distance));

    els.polyDisplay.textContent = formatPolynomial(mortarState.coeffs, mortarState.degree);
    els.resultBlock.classList.remove('hidden');
    drawChart(els.chartCanvas, DEFAULT_DATA.shots.map(s=>s.angle), DEFAULT_DATA.shots.map(s=>s.distance), mortarState.coeffs);
}