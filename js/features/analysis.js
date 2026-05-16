import { mortarState } from '../state.js';
import { polynomialRegression } from '../math.js';
import { drawChart } from '../chart.js';

export function initAnalysis(els) {
    els.generateBtn.addEventListener('click', onApply);
    els.calculateBtn.addEventListener('click', calculate);
    els.exportBtn.addEventListener('click', exportData);
    els.importBtn.addEventListener('click', () => els.importFile.click());
    els.importFile.addEventListener('change', importData);
    els.modalConfirm.addEventListener('click', () => { hideModal(els); executeApply(els); });
    els.modalCancel.addEventListener('click', () => hideModal(els));

    generateShotFields(els, parseInt(els.shotsCountInput.value));

    function onApply() {
        if (mortarState.calculated) els.modal.classList.remove('hidden');
        else executeApply(els);
    }

    function executeApply() {
        mortarState.calculated = false;
        mortarState.coeffs = null;
        els.resultBlock.classList.add('hidden');
        els.polyDisplay.textContent = '';
        generateShotFields(els, parseInt(els.shotsCountInput.value));
    }

    function hideModal() { els.modal.classList.add('hidden'); }

    function calculate() {
        const m = parseInt(els.degreeInput.value);
        const angles = [], distances = [];
        const aIn = els.shotsContainer.querySelectorAll('.shot-angle');
        const dIn = els.shotsContainer.querySelectorAll('.shot-distance');

        for (let i = 0; i < aIn.length; i++) {
            const a = parseFloat(aIn[i].value), d = parseFloat(dIn[i].value);
            if (isNaN(a) || isNaN(d)) return alert('Заполните все поля');
            angles.push(a); distances.push(d);
        }
        if (angles.length < m + 1) return alert(`Нужно минимум ${m + 1} точек для степени ${m}`);

        mortarState.coeffs = polynomialRegression(angles, distances, m);
        mortarState.degree = m;
        mortarState.calculated = true;

        els.polyDisplay.textContent = formatPolynomial(mortarState.coeffs, m);
        els.resultBlock.classList.remove('hidden');
        drawChart(els.chartCanvas, angles, distances, mortarState.coeffs);
    }

    function exportData() {
        if (!mortarState.calculated) return alert('Сначала выполните расчёт');
        const shots = Array.from(els.shotsContainer.querySelectorAll('.shot-row')).map(r => ({
            angle: +r.querySelector('.shot-angle').value, distance: +r.querySelector('.shot-distance').value
        }));
        const blob = new Blob([JSON.stringify({ v: '1.0', degree: mortarState.degree, coefficients: mortarState.coeffs, shots, ts: new Date().toISOString() }, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mortar_setup.json'; a.click(); URL.revokeObjectURL(a.href);
    }

    function importData(e) {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = ev => {
            try {
                const d = JSON.parse(ev.target.result);
                if (!d.degree || !d.coefficients || !d.shots) throw 0;
                els.degreeInput.value = d.degree;
                generateShotFields(els, d.shots.length);
                const rows = els.shotsContainer.querySelectorAll('.shot-row');
                d.shots.forEach((s, i) => { rows[i].querySelector('.shot-angle').value = s.angle; rows[i].querySelector('.shot-distance').value = s.distance; });
                mortarState.coeffs = d.coefficients; mortarState.degree = d.degree; mortarState.calculated = true;
                els.polyDisplay.textContent = formatPolynomial(mortarState.coeffs, mortarState.degree);
                els.resultBlock.classList.remove('hidden');
                drawChart(els.chartCanvas, d.shots.map(s=>s.angle), d.shots.map(s=>s.distance), mortarState.coeffs);
            } catch { alert('Ошибка формата файла'); }
        };
        r.readAsText(f); e.target.value = '';
    }
}

function generateShotFields(els, n) {
    if (n < 2) n = 2; if (n > 20) n = 20;
    els.shotsCountInput.value = n;
    els.shotsContainer.innerHTML = '';
    for (let i = 0; i < n; i++) {
        const row = document.createElement('div');
        row.className = 'shot-row';
        row.innerHTML = `<span class="shot-label">Выстрел ${i+1}:</span><input type="number" class="shot-angle" placeholder="Угол" min="7.5" max="67.5"><span class="unit">°</span><input type="number" class="shot-distance" placeholder="Дистанция"><span class="unit">м</span>`;
        els.shotsContainer.appendChild(row);
    }
}

function formatPolynomial(c, deg) {
    const parts = [];
    for (let i = deg; i >= 0; i--) {
        const v = Math.round(c[i] * 100) / 100;
        if (v === 0 && deg > 0) continue;
        parts.push(i === 0 ? v.toFixed(2) : i === 1 ? v.toFixed(2) + '·x' : v.toFixed(2) + '·x^' + i);
    }
    return parts.join(' + ').replace(/\+ -/g, '- ');
}