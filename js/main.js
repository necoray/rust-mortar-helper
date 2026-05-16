(function () {
    const shotsContainer = document.getElementById('shots-container');
    const generateBtn = document.getElementById('generate-fields');
    const calculateBtn = document.getElementById('calculate-btn');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const resultBlock = document.getElementById('result-block');
    const degreeInput = document.getElementById('degree');
    const shotsCountInput = document.getElementById('shots-count');
    const chartCanvas = document.getElementById('chart');
    const polyDisplay = document.getElementById('polynomial-display');
    const warningModal = document.getElementById('warning-modal');
    const modalConfirm = document.getElementById('modal-confirm');
    const modalCancel = document.getElementById('modal-cancel');

    let currentCoeffs = null;
    let currentDegree = 0;

    generateShotFields(parseInt(shotsCountInput.value));

    generateBtn.addEventListener('click', handleApply);
    calculateBtn.addEventListener('click', calculate);
    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importData);
    modalConfirm.addEventListener('click', confirmApply);
    modalCancel.addEventListener('click', () => warningModal.classList.add('hidden'));

    function handleApply() {
        if (!resultBlock.classList.contains('hidden')) {
            warningModal.classList.remove('hidden');
        } else {
            executeApply();
        }
    }

    function confirmApply() {
        warningModal.classList.add('hidden');
        executeApply();
    }

    function executeApply() {
        clearResults();
        generateShotFields(parseInt(shotsCountInput.value));
    }

    function clearResults() {
        resultBlock.classList.add('hidden');
        currentCoeffs = null;
        polyDisplay.textContent = '';
    }

    function generateShotFields(n) {
        if (n < 2) n = 2;
        if (n > 20) n = 20;
        shotsCountInput.value = n;
        shotsContainer.innerHTML = '';

        for (let i = 0; i < n; i++) {
            const row = document.createElement('div');
            row.className = 'shot-row';
            row.innerHTML =
                '<span class="shot-label">Выстрел ' + (i + 1) + ':</span>' +
                '<input type="number" class="shot-angle" placeholder="Угол" min="15" max="60">' +
                '<span class="unit">°</span>' +
                '<input type="number" class="shot-distance" placeholder="Дистанция">' +
                '<span class="unit">м</span>';
            shotsContainer.appendChild(row);
        }
    }

    function calculate() {
        const m = parseInt(degreeInput.value);
        const angleInputs = shotsContainer.querySelectorAll('.shot-angle');
        const distInputs = shotsContainer.querySelectorAll('.shot-distance');

        const angles = [];
        const distances = [];

        for (let i = 0; i < angleInputs.length; i++) {
            const a = parseFloat(angleInputs[i].value);
            const d = parseFloat(distInputs[i].value);
            if (isNaN(a) || isNaN(d)) return;
            angles.push(a);
            distances.push(d);
        }

        if (angles.length < m + 1) {
            alert('Необходимо минимум ' + (m + 1) + ' точек для многочлена степени ' + m);
            return;
        }

        const coeffs = polynomialRegression(angles, distances, m);
        currentCoeffs = coeffs;
        currentDegree = m;

        polyDisplay.textContent = formatPolynomial(coeffs, m);
        resultBlock.classList.remove('hidden');
        drawChart(angles, distances, coeffs, m);
    }

    function polynomialRegression(x, y, degree) {
        const n = x.length;
        const size = degree + 1;
        const matrix = [];
        const rhs = [];

        for (let i = 0; i < size; i++) {
            matrix[i] = [];
            rhs[i] = 0;
            for (let j = 0; j < size; j++) {
                matrix[i][j] = 0;
            }
            for (let k = 0; k < n; k++) {
                rhs[i] += y[k] * Math.pow(x[k], i);
            }
        }

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                for (let k = 0; k < n; k++) {
                    matrix[i][j] += Math.pow(x[k], i + j);
                }
            }
        }

        return gaussSolve(matrix, rhs, size);
    }

    function gaussSolve(matrix, rhs, size) {
        const aug = [];
        for (let i = 0; i < size; i++) {
            aug[i] = [];
            for (let j = 0; j < size; j++) {
                aug[i][j] = matrix[i][j];
            }
            aug[i][size] = rhs[i];
        }

        for (let col = 0; col < size; col++) {
            let maxRow = col;
            for (let row = col + 1; row < size; row++) {
                if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
                    maxRow = row;
                }
            }
            const tmp = aug[col];
            aug[col] = aug[maxRow];
            aug[maxRow] = tmp;

            if (Math.abs(aug[col][col]) < 1e-12) continue;

            for (let row = col + 1; row < size; row++) {
                const factor = aug[row][col] / aug[col][col];
                for (let j = col; j <= size; j++) {
                    aug[row][j] -= factor * aug[col][j];
                }
            }
        }

        const solution = new Array(size).fill(0);
        for (let i = size - 1; i >= 0; i--) {
            if (Math.abs(aug[i][i]) < 1e-12) continue;
            solution[i] = aug[i][size];
            for (let j = i + 1; j < size; j++) {
                solution[i] -= aug[i][j] * solution[j];
            }
            solution[i] /= aug[i][i];
        }

        return solution;
    }

    function formatPolynomial(coeffs, degree) {
        let parts = [];
        for (let i = degree; i >= 0; i--) {
            const c = Math.round(coeffs[i] * 100) / 100;
            if (c === 0 && degree > 0) continue;
            if (i === 0) parts.push(c.toFixed(2));
            else if (i === 1) parts.push(c.toFixed(2) + '·x');
            else parts.push(c.toFixed(2) + '·x^' + i);
        }
        return parts.join(' + ').replace(/\+ -/g, '- ');
    }

    function drawChart(dataX, dataY, coeffs, degree) {
        const canvas = chartCanvas;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        const pad = { left: 50, right: 20, top: 20, bottom: 40 };
        const plotW = W - pad.left - pad.right;
        const plotH = H - pad.top - pad.bottom;

        const xMin = 15, xMax = 60;
        let yMin = Infinity, yMax = -Infinity;
        for (const v of dataY) { if (v < yMin) yMin = v; if (v > yMax) yMax = v; }

        const steps = 100;
        const curvePoints = [];
        for (let i = 0; i <= steps; i++) {
            const x = xMin + (xMax - xMin) * i / steps;
            const y = evalPoly(coeffs, x);
            curvePoints.push({ x, y });
            if (y < yMin) yMin = y;
            if (y > yMax) yMax = y;
        }

        const yRange = yMax - yMin || 1;
        yMin -= yRange * 0.1; yMax += yRange * 0.1;

        function toCanvasX(x) { return pad.left + (x - xMin) / (xMax - xMin) * plotW; }
        function toCanvasY(y) { return pad.top + plotH - (y - yMin) / (yMax - yMin) * plotH; }

        ctx.fillStyle = '#151515';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1;
        for (let x = xMin; x <= xMax; x += 5) {
            ctx.beginPath(); ctx.moveTo(toCanvasX(x), pad.top); ctx.lineTo(toCanvasX(x), pad.top + plotH); ctx.stroke();
        }
        const yStep = Math.ceil((yMax - yMin) / 6 / 10) * 10;
        for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
            ctx.beginPath(); ctx.moveTo(pad.left, toCanvasY(y)); ctx.lineTo(pad.left + plotW, toCanvasY(y)); ctx.stroke();
        }

        ctx.fillStyle = '#666'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
        for (let x = xMin; x <= xMax; x += 10) ctx.fillText(x, toCanvasX(x), pad.top + plotH + 16);
        ctx.textAlign = 'right';
        for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) ctx.fillText(Math.round(y), pad.left - 6, toCanvasY(y) + 4);

        ctx.fillStyle = '#888'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Угол (°)', pad.left + plotW / 2, H - 4);
        ctx.save(); ctx.translate(14, pad.top + plotH / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillText('Дистанция (м)', 0, 0); ctx.restore();

        ctx.strokeStyle = '#cc3a2a'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < curvePoints.length; i++) {
            const cx = toCanvasX(curvePoints[i].x), cy = toCanvasY(curvePoints[i].y);
            i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
        }
        ctx.stroke();

        ctx.fillStyle = '#e8b830';
        for (let i = 0; i < dataX.length; i++) {
            const cx = toCanvasX(dataX[i]), cy = toCanvasY(dataY[i]);
            ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#a88420'; ctx.lineWidth = 1; ctx.stroke();
        }
    }

    function evalPoly(coeffs, x) {
        let result = 0;
        for (let i = 0; i < coeffs.length; i++) result += coeffs[i] * Math.pow(x, i);
        return result;
    }

    // Экспорт текущего состояния в JSON
    function exportData() {
        if (!currentCoeffs) {
            alert('Сначала выполните расчёт');
            return;
        }
        const shots = Array.from(shotsContainer.querySelectorAll('.shot-row')).map(row => ({
            angle: parseFloat(row.querySelector('.shot-angle').value),
            distance: parseFloat(row.querySelector('.shot-distance').value)
        }));

        const payload = {
            version: '1.0',
            degree: currentDegree,
            coefficients: currentCoeffs,
            shots: shots,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mortar_setup.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    // Импорт из JSON файла
    function importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (ev) {
            try {
                const data = JSON.parse(ev.target.result);
                if (!data.degree || !data.coefficients || !data.shots) throw new Error('Invalid format');

                degreeInput.value = data.degree;
                generateShotFields(data.shots.length);
                const rows = shotsContainer.querySelectorAll('.shot-row');
                data.shots.forEach((shot, i) => {
                    rows[i].querySelector('.shot-angle').value = shot.angle;
                    rows[i].querySelector('.shot-distance').value = shot.distance;
                });

                currentCoeffs = data.coefficients;
                currentDegree = data.degree;
                polyDisplay.textContent = formatPolynomial(currentCoeffs, currentDegree);
                resultBlock.classList.remove('hidden');
                drawChart(data.shots.map(s => s.angle), data.shots.map(s => s.distance), currentCoeffs, currentDegree);
            } catch (err) {
                alert('Ошибка: неверный формат файла');
                console.error(err);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }
})();