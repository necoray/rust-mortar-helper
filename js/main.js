import { mortarState } from './state.js';
import { initAnalysis, addShotRow } from './features/analysis.js';
import { initAiming } from './features/aiming.js';
import { drawChart } from './chart.js';
import { formatPolynomial, getScatterIntervals, formatInterval } from './math.js';

const DEFAULT_DATA = {
  "v": "1.0",
  "degree": 2,
  "coefficients": [
    23.894477317554443,
    1.987508218277435,
    0.003471400394477493
  ],
  "shots": [
    {
      "angle": 7.5,
      "distance": 42
    },
    {
      "angle": 7.5,
      "distance": 42
    },
    {
      "angle": 7.5,
      "distance": 41
    },
    {
      "angle": 15,
      "distance": 48
    },
    {
      "angle": 15,
      "distance": 50
    },
    {
      "angle": 30,
      "distance": 84
    },
    {
      "angle": 30,
      "distance": 93
    },
    {
      "angle": 45,
      "distance": 114
    },
    {
      "angle": 45,
      "distance": 125
    },
    {
      "angle": 45,
      "distance": 128
    },
    {
      "angle": 60,
      "distance": 143
    },
    {
      "angle": 60,
      "distance": 168
    },
    {
      "angle": 60,
      "distance": 148
    },
    {
      "angle": 67.5,
      "distance": 165
    },
    {
      "angle": 67.5,
      "distance": 198
    },
    {
      "angle": 67.5,
      "distance": 162
    },
    {
      "angle": 15,
      "distance": 52
    },
    {
      "angle": 30,
      "distance": 87
    }
  ],
  "ts": "2026-05-17T13:32:22.926Z"
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
    addShotBtn: document.getElementById('add-shot-btn'),
    scatterInfo: document.getElementById('scatter-info'),
    scatter50: document.getElementById('scatter-50'),
    scatter95: document.getElementById('scatter-95'),
  };

  initAnalysis(els);
  initAiming(els);
  applyDefaultData(els);
});

function updateScatterDisplay(els, angle, distance) {
  const { interval50, interval95 } = getScatterIntervals(angle);
  els.scatter50.textContent = formatInterval(distance, interval50);
  els.scatter95.textContent = formatInterval(distance, interval95);
  els.scatterInfo.classList.remove('hidden');
}

function applyDefaultData(els) {
  mortarState.coeffs = DEFAULT_DATA.coefficients;
  mortarState.degree = DEFAULT_DATA.degree;
  mortarState.calculated = true;

  els.degreeInput.value = DEFAULT_DATA.degree;
  els.shotsContainer.innerHTML = '';
  DEFAULT_DATA.shots.forEach(s => addShotRow(els.shotsContainer, s.angle, s.distance));

  els.polyDisplay.textContent = formatPolynomial(mortarState.coeffs, mortarState.degree);
  els.resultBlock.classList.remove('hidden');
  drawChart(els.chartCanvas, DEFAULT_DATA.shots.map(s => s.angle), DEFAULT_DATA.shots.map(s => s.distance), mortarState.coeffs);

  const sampleAngle = DEFAULT_DATA.shots[0].angle;
  const sampleDist = DEFAULT_DATA.shots[0].distance;
  updateScatterDisplay(els, sampleAngle, sampleDist);
}