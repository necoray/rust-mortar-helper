export function polynomialRegression(x, y, degree) {
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

export function evalPoly(coeffs, x) {
    let r = 0;
    for (let i = 0; i < coeffs.length; i++) r += coeffs[i] * Math.pow(x, i);
    return r;
}

export function findAnglesForDistance(coeffs, targetDist, min = 7.5, max = 67.5) {
    const roots = [];
    const step = 0.05;
    for (let x = min; x < max; x += step) {
        const y1 = evalPoly(coeffs, x) - targetDist;
        const y2 = evalPoly(coeffs, x + step) - targetDist;
        if (y1 * y2 <= 0) {
            let a = x, b = x + step;
            for (let i = 0; i < 60; i++) {
                const m = (a + b) / 2;
                (evalPoly(coeffs, a) - targetDist) * (evalPoly(coeffs, m) - targetDist) <= 0 ? b = m : a = m;
            }
            roots.push(Math.round((a + b) / 2 * 100) / 100);
        }
    }
    return [...new Set(roots.map(r => Math.round(r * 10) / 10))];
}

export function formatPolynomial(c, deg) {
    const parts = [];
    for (let i = deg; i >= 0; i--) {
        const v = Math.round(c[i] * 100) / 100;
        if (v === 0 && deg > 0) continue;
        parts.push(i === 0 ? v.toFixed(2) : i === 1 ? v.toFixed(2) + '·x' : v.toFixed(2) + '·x^' + i);
    }
    return parts.join(' + ').replace(/\+ -/g, '- ');
}

// === Hermite spline для Unity AnimationCurve ===
export function evaluateHermiteCurve(keys, t) {
    // t: нормализованный параметр [0..1] по всему диапазону кривой
    if (!keys || keys.length === 0) return 0;
    if (keys.length === 1) return keys[0].value;
    
    const tStart = keys[0].time;
    const tEnd = keys[keys.length - 1].time;
    const totalDuration = tEnd - tStart;
    if (totalDuration === 0) return keys[0].value;
    
    // Преобразуем глобальный t в абсолютное время
    const absoluteT = tStart + t * totalDuration;
    
    // Находим сегмент [key[i], key[i+1]]
    let i = 0;
    while (i < keys.length - 1 && keys[i + 1].time < absoluteT) i++;
    
    const k0 = keys[i];
    const k1 = keys[i + 1];
    const dt = k1.time - k0.time;
    if (dt === 0) return k0.value;
    
    // Локальный t внутри сегмента
    const localT = (absoluteT - k0.time) / dt;
    
    // Кубический Эрмит: базисные функции
    const t2 = localT * localT;
    const t3 = t2 * localT;
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + localT;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;
    
    // Касательные масштабируются на длину интервала
    const m0 = k0.outTangent * dt;
    const m1 = k1.inTangent * dt;
    
    return h00 * k0.value + h10 * m0 + h01 * k1.value + h11 * m1;
}

// === Расчёт разброса для заданного угла ===
export function calculateScatter(angle, angleMin = 7.5, angleMax = 67.5) {
    // Нормализация угла в [0..1]
    const t = (angle - angleMin) / (angleMax - angleMin);
    const tClamped = Math.max(0, Math.min(1, t));
    
    // Данные кривых из сервера Rust (Unity AnimationCurve)
    const distanceRandomnessCurve = {
        keys: [
            { time: 0, value: 1, inTangent: 0, outTangent: 4, weightedMode: 0, inWeight: 0, outWeight: 0 },
            { time: 1, value: 5, inTangent: 4, outTangent: 0, weightedMode: 0, inWeight: 0, outWeight: 0 }
        ]
    };
    const distanceRandomnessXCurve = {
        keys: [
            { time: 0, value: 1, inTangent: 0, outTangent: 2, weightedMode: 0, inWeight: 0, outWeight: 0 },
            { time: 1, value: 3, inTangent: 2, outTangent: 0, weightedMode: 0, inWeight: 0, outWeight: 0 }
        ]
    };
    const distanceRandomnessZCurve = {
        keys: [
            { time: 0, value: 1, inTangent: 0, outTangent: 9, weightedMode: 0, inWeight: 0, outWeight: 0 },
            { time: 1, value: 10, inTangent: 9, outTangent: 0, weightedMode: 0, inWeight: 0, outWeight: 0 }
        ]
    };
    
    // Интерполяция значений кривых
    const base = evaluateHermiteCurve(distanceRandomnessCurve.keys, tClamped);
    const x = evaluateHermiteCurve(distanceRandomnessXCurve.keys, tClamped);
    const z = evaluateHermiteCurve(distanceRandomnessZCurve.keys, tClamped);
    
    // Суммарный разброс: база * векторная норма компонент
    // Это даёт приблизительный радиус области попадания
    const spread = base * Math.sqrt(x * x + z * z);
    return spread;
}

// === Статистические интервалы разброса ===
// Предполагаем нормальное распределение ошибок вокруг траектории
// scatter — оценённое стандартное отклонение (из кривых Unity)

export function getScatterIntervals(angle, angleMin = 7.5, angleMax = 67.5) {
    const scatter = calculateScatter(angle, angleMin, angleMax);
    
    // Коэффициенты для нормального распределения:
    // 50% интервал: ±0.6745σ (межквартильный диапазон)
    // 95% интервал: ±1.96σ (стандартный доверительный интервал)
    const K_50 = 0.6745;
    const K_95 = 1.96;
    
    return {
        scatter,           // базовый разброс (≈1σ)
        interval50: scatter * K_50,  // половина ширины 50% интервала
        interval95: scatter * K_95   // половина ширины 95% интервала
    };
}

// В math.js, после getScatterIntervals:
export function updateScatterUI(els, angle, distance, angleMin = 7.5, angleMax = 67.5) {
    const { interval50, interval95 } = getScatterIntervals(angle, angleMin, angleMax);
    els.scatter50.textContent = formatInterval(distance, interval50);
    els.scatter95.textContent = formatInterval(distance, interval95);
    els.scatterInfo.classList.remove('hidden');
}

// Форматирование интервала для отображения
export function formatInterval(distance, interval) {
    const min = Math.max(0, distance - interval);
    const max = distance + interval;
    return `${Math.round(min)}–${Math.round(max)} м`;
}

