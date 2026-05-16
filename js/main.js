import { mortarState } from './state.js';
import { initAnalysis } from './features/analysis.js';
import { initAiming } from './features/aiming.js';
import { drawChart } from './chart.js';
import { formatPolynomial } from './math.js';

const DEFAULT_DATA = {
    v: "1.0",
    degree: 2,
    coefficients: [33.20634920634936, 3.2285714285714167, -0.013403880070546575],
    shots: [
        { angle: 7.5, distance: 57 }, { angle: 7.5, distance: 56 }, { angle: 7.5, distance: 57 },
        { angle: 30, distance: 119 }, { angle: 30, distance: 127 }, { angle: 30, distance: 108 },
        { angle: 60, distance: 177 }, { angle: 60, distance: 169 }, { angle: 60, distance: 190 }
    ],
    ts: "2026-05-16T21:14:05.546Z"
};

document.addEventListener('DOMContentLoaded', () => {
    mortarState.calculated = false;
    mortarState.coeffs = null;

    const els = {
        shotsContainer: document.getElementById('shots-container'),
        generateBtn: document.getElementById('generate-fields'),
        calculateBtn: document.getElementById('calculate-btn'),
        exportBtn: document.getElementById('export-btn'),
        importBtn: document.getElementById('import-btn'),
        importFile: document.getElementById('import-file'),
        resultBlock: document.getElementById('result-block'),
        degreeInput: document.getElementById('degree'),
        shotsCountInput: document.getElementById('shots-count'),
        chartCanvas: document.getElementById('chart'),
        polyDisplay: document.getElementById('polynomial-display'),
        modal: document.getElementById('warning-modal'),
        modalConfirm: document.getElementById('modal-confirm'),
        modalCancel: document.getElementById('modal-cancel'),
        targetDistance: document.getElementById('target-distance'),
        aimBtn: document.getElementById('aim-btn'),
        aimResult: document.getElementById('aim-result'),
        aimList: document.getElementById('aim-list'),
        mortarScale: document.getElementById('mortar-scale'),
    };

    els.modal.classList.add('hidden');

    initAnalysis(els);
    initAiming(els);

    // Автозагрузка дефолтных данных
    applyDefaultData(els);
});

function applyDefaultData(els) {
    mortarState.coeffs = DEFAULT_DATA.coefficients;
    mortarState.degree = DEFAULT_DATA.degree;
    mortarState.calculated = true;

    els.degreeInput.value = DEFAULT_DATA.degree;
    const n = DEFAULT_DATA.shots.length;
    els.shotsCountInput.value = n;
    els.shotsContainer.innerHTML = '';

    for (let i = 0; i < n; i++) {
        const row = document.createElement('div');
        row.className = 'shot-row';
        row.innerHTML = `<span class="shot-label">Выстрел ${i + 1}:</span><input type="number" class="shot-angle" placeholder="Угол" min="7.5" max="67.5"><span class="unit">°</span><input type="number" class="shot-distance" placeholder="Дистанция"><span class="unit">м</span>`;
        els.shotsContainer.appendChild(row);
    }

    const rows = els.shotsContainer.querySelectorAll('.shot-row');
    DEFAULT_DATA.shots.forEach((s, i) => {
        if (rows[i]) {
            rows[i].querySelector('.shot-angle').value = s.angle;
            rows[i].querySelector('.shot-distance').value = s.distance;
        }
    });

    els.polyDisplay.textContent = formatPolynomial(mortarState.coeffs, mortarState.degree);
    els.resultBlock.classList.remove('hidden');
    drawChart(els.chartCanvas, DEFAULT_DATA.shots.map(s => s.angle), DEFAULT_DATA.shots.map(s => s.distance), mortarState.coeffs);
}