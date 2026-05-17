import { mortarState } from '../state.js';
import { polynomialRegression, formatPolynomial } from '../math.js';
import { drawChart } from '../chart.js';
import { updateScatterUI } from '../math.js';

export function initAnalysis(els) {
    els.calculateBtn.addEventListener('click', () => calculate(els));
    els.exportBtn.addEventListener('click', () => exportData(els));
    els.importBtn.addEventListener('click', () => els.importFile.click());
    els.importFile.addEventListener('change', (e) => importData(e, els));
    els.addShotBtn.addEventListener('click', () => addShotRow(els.shotsContainer));

    // Делегирование удаления
    els.shotsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-shot-btn')) {
            e.target.closest('.shot-row').remove();
        }
    });

    // Стартовые 3 строки
    for (let i = 0; i < 3; i++) addShotRow(els.shotsContainer);
}

export function addShotRow(container, angle = '', dist = '') {
    const row = document.createElement('div');
    row.className = 'shot-row';
    row.innerHTML = `
        <input type="number" class="shot-angle" placeholder="Угол" min="7.5" max="67.5" value="${angle}">
        <span class="unit">°</span>
        <input type="number" class="shot-distance" placeholder="Дистанция" value="${dist}">
        <span class="unit">м</span>
        <button type="button" class="delete-shot-btn">×</button>
    `;
    container.appendChild(row);
}

function calculate(els) {
    const m = parseInt(els.degreeInput.value);
    const rows = els.shotsContainer.querySelectorAll('.shot-row');
    const angles = [], distances = [];

    for (const row of rows) {
        const a = parseFloat(row.querySelector('.shot-angle').value);
        const d = parseFloat(row.querySelector('.shot-distance').value);
        if (isNaN(a) || isNaN(d)) return alert('Заполните все поля выстрелов');
        angles.push(a); distances.push(d);
    }

    if (angles.length < m + 1) return alert(`Нужно минимум ${m + 1} точек для степени ${m}`);

    mortarState.coeffs = polynomialRegression(angles, distances, m);
    mortarState.degree = m;
    mortarState.calculated = true;

    els.polyDisplay.textContent = formatPolynomial(mortarState.coeffs, m);
    els.resultBlock.classList.remove('hidden');
    drawChart(els.chartCanvas, angles, distances, mortarState.coeffs);

    if (angles.length > 0) {
    // Берём последний введённый угол для оценки разброса
    const lastAngle = angles[angles.length - 1];
    const lastDist = distances[distances.length - 1];
    updateScatterUI(els, lastAngle, lastDist);
}
}

function exportData(els) {
    if (!mortarState.calculated) return alert('Сначала выполните расчёт');
    const shots = Array.from(els.shotsContainer.querySelectorAll('.shot-row')).map(r => ({
        angle: +r.querySelector('.shot-angle').value, 
        distance: +r.querySelector('.shot-distance').value
    }));
    const blob = new Blob([JSON.stringify({ 
        v: '1.0', 
        degree: mortarState.degree, 
        coefficients: mortarState.coeffs, 
        shots, 
        ts: new Date().toISOString() 
    }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(blob); 
    a.download = 'mortar_setup.json'; 
    a.click(); 
    URL.revokeObjectURL(a.href);
}

function importData(e, els) {
    const f = e.target.files[0]; 
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
        try {
            const d = JSON.parse(ev.target.result);
            if (!d.degree || !d.coefficients || !d.shots) throw 0;
            els.degreeInput.value = d.degree;
            els.shotsContainer.innerHTML = '';
            d.shots.forEach(s => addShotRow(els.shotsContainer, s.angle, s.distance));
            mortarState.coeffs = d.coefficients; 
            mortarState.degree = d.degree; 
            mortarState.calculated = true;
            els.polyDisplay.textContent = formatPolynomial(mortarState.coeffs, mortarState.degree);
            els.resultBlock.classList.remove('hidden');
            drawChart(els.chartCanvas, d.shots.map(s=>s.angle), d.shots.map(s=>s.distance), mortarState.coeffs);
        } catch { alert('Ошибка формата файла'); }
    };
    r.readAsText(f); 
    e.target.value = '';
}