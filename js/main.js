console.log("[Mortar] main.js загружен");

document.addEventListener('DOMContentLoaded', function () {
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
        modalCancel: document.getElementById('modal-cancel')
    };

    const state = { coeffs: null, degree: 0, calculated: false };

    // Гарантируем скрытие модалки при старте
    els.modal.classList.add('hidden');
    generateShotFields(parseInt(els.shotsCountInput.value));

    els.generateBtn.addEventListener('click', onApply);
    els.calculateBtn.addEventListener('click', calculate);
    els.exportBtn.addEventListener('click', exportData);
    els.importBtn.addEventListener('click', () => els.importFile.click());
    els.importFile.addEventListener('change', importData);
    els.modalConfirm.addEventListener('click', confirmApply);
    els.modalCancel.addEventListener('click', hideModal);

    function onApply() {
        if (state.calculated) {
            els.modal.classList.remove('hidden');
        } else {
            executeApply();
        }
    }

    function confirmApply() {
        hideModal();
        executeApply();
    }

    function hideModal() {
        els.modal.classList.add('hidden');
    }

    function executeApply() {
        state.calculated = false;
        state.coeffs = null;
        els.resultBlock.classList.add('hidden');
        els.polyDisplay.textContent = '';
        generateShotFields(parseInt(els.shotsCountInput.value));
    }

    function generateShotFields(n) {
        if (n < 2) n = 2;
        if (n > 20) n = 20;
        els.shotsCountInput.value = n;
        els.shotsContainer.innerHTML = '';
        for (let i = 0; i < n; i++) {
            const row = document.createElement('div');
            row.className = 'shot-row';
            row.innerHTML = `
                <span class="shot-label">Выстрел ${i + 1}:</span>
                <input type="number" class="shot-angle" placeholder="Угол" min="15" max="60">
                <span class="unit">°</span>
                <input type="number" class="shot-distance" placeholder="Дистанция">
                <span class="unit">м</span>`;
            els.shotsContainer.appendChild(row);
        }
    }

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

        state.coeffs = polynomialRegression(angles, distances, m);
        state.degree = m;
        state.calculated = true;

        els.polyDisplay.textContent = formatPolynomial(state.coeffs, m);
        els.resultBlock.classList.remove('hidden');
        drawChart(angles, distances, state.coeffs);
    }

    function polynomialRegression(x, y, degree) {
        const n = x.length, size = degree + 1;
        const mat = Array.from({ length: size }, () => Array(size).fill(0));
        const rhs = Array(size).fill(0);

        for (let i = 0; i < size; i++) {
            for (let k = 0; k < n; k++) {
                rhs[i] += y[k] * Math.pow(x[k], i);
                for (let j = 0; j < size; j++) mat[i][j] += Math.pow(x[k], i + j);
            }
        }
        return gaussSolve(mat, rhs, size);
    }

    function gaussSolve(mat, rhs, size) {
        const aug = mat.map((r, i) => [...r, rhs[i]]);
        for (let col = 0; col < size; col++) {
            let mx = col;
            for (let r = col + 1; r < size; r++) if (Math.abs(aug[r][col]) > Math.abs(aug[mx][col])) mx = r;
            [aug[col], aug[mx]] = [aug[mx], aug[col]];
            if (Math.abs(aug[col][col]) < 1e-12) continue;
            for (let r = col + 1; r < size; r++) {
                const f = aug[r][col] / aug[col][col];
                for (let j = col; j <= size; j++) aug[r][j] -= f * aug[col][j];
            }
        }
        const sol = Array(size).fill(0);
        for (let i = size - 1; i >= 0; i--) {
            if (Math.abs(aug[i][i]) < 1e-12) continue;
            sol[i] = aug[i][size];
            for (let j = i + 1; j < size; j++) sol[i] -= aug[i][j] * sol[j];
            sol[i] /= aug[i][i];
        }
        return sol;
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

    function drawChart(dx, dy, coeffs) {
        const cv = els.chartCanvas, ctx = cv.getContext('2d');
        const W = cv.width, H = cv.height;
        const pad = { l: 50, r: 20, t: 20, b: 40 };
        const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
        const xMin = 15, xMax = 60;

        let yMin = Infinity, yMax = -Infinity;
        const curve = [];
        for (let i = 0; i <= 100; i++) {
            const x = xMin + (xMax - xMin) * i / 100;
            let y = 0; for (let k = 0; k < coeffs.length; k++) y += coeffs[k] * Math.pow(x, k);
            curve.push({ x, y });
            if (y < yMin) yMin = y; if (y > yMax) yMax = y;
        }
        dy.forEach(v => { if (v < yMin) yMin = v; if (v > yMax) yMax = v; });
        const rng = yMax - yMin || 1; yMin -= rng * 0.1; yMax += rng * 0.1;

        const cx = x => pad.l + (x - xMin) / (xMax - xMin) * pw;
        const cy = y => pad.t + ph - (y - yMin) / (yMax - yMin) * ph;

        ctx.fillStyle = '#151515'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1;
        for (let x = xMin; x <= xMax; x += 5) { ctx.beginPath(); ctx.moveTo(cx(x), pad.t); ctx.lineTo(cx(x), pad.t + ph); ctx.stroke(); }
        const ys = Math.ceil((yMax - yMin) / 6 / 10) * 10;
        for (let y = Math.ceil(yMin / ys) * ys; y <= yMax; y += ys) { ctx.beginPath(); ctx.moveTo(pad.l, cy(y)); ctx.lineTo(pad.l + pw, cy(y)); ctx.stroke(); }

        ctx.fillStyle = '#666'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
        for (let x = xMin; x <= xMax; x += 10) ctx.fillText(x, cx(x), pad.t + ph + 16);
        ctx.textAlign = 'right';
        for (let y = Math.ceil(yMin / ys) * ys; y <= yMax; y += ys) ctx.fillText(Math.round(y), pad.l - 6, cy(y) + 4);

        ctx.fillStyle = '#888'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Угол (°)', pad.l + pw / 2, H - 4);
        ctx.save(); ctx.translate(14, pad.t + ph / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillText('Дистанция (м)', 0, 0); ctx.restore();

        ctx.strokeStyle = '#cc3a2a'; ctx.lineWidth = 2; ctx.beginPath();
        curve.forEach((p, i) => i === 0 ? ctx.moveTo(cx(p.x), cy(p.y)) : ctx.lineTo(cx(p.x), cy(p.y)));
        ctx.stroke();

        ctx.fillStyle = '#e8b830';
        dx.forEach((x, i) => {
            const px = cx(x), py = cy(dy[i]);
            ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#a88420'; ctx.lineWidth = 1; ctx.stroke();
        });
    }

    function exportData() {
        if (!state.calculated) return alert('Сначала выполните расчёт');
        const shots = Array.from(els.shotsContainer.querySelectorAll('.shot-row')).map(r => ({
            angle: +r.querySelector('.shot-angle').value,
            distance: +r.querySelector('.shot-distance').value
        }));
        const blob = new Blob([JSON.stringify({ v: '1.0', degree: state.degree, coefficients: state.coeffs, shots, ts: new Date().toISOString() }, null, 2)], { type: 'application/json' });
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
                generateShotFields(d.shots.length);
                const rows = els.shotsContainer.querySelectorAll('.shot-row');
                d.shots.forEach((s, i) => { rows[i].querySelector('.shot-angle').value = s.angle; rows[i].querySelector('.shot-distance').value = s.distance; });
                state.coeffs = d.coefficients; state.degree = d.degree; state.calculated = true;
                els.polyDisplay.textContent = formatPolynomial(state.coeffs, state.degree);
                els.resultBlock.classList.remove('hidden');
                drawChart(d.shots.map(s => s.angle), d.shots.map(s => s.distance), state.coeffs);
            } catch { alert('Ошибка формата файла'); }
        };
        r.readAsText(f); e.target.value = '';
    }
});