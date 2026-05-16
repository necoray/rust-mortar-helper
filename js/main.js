import { mortarState } from './state.js';
import { initAnalysis } from './features/analysis.js';
import { initAiming } from './features/aiming.js';

document.addEventListener('DOMContentLoaded', () => {
    // Гарантируем начальное состояние
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
        aimList: document.getElementById('aim-list')
    };

    els.modal.classList.add('hidden');

    initAnalysis(els);
    initAiming(els);
});