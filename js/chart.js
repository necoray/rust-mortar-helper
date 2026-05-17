import { calculateScatter } from './math.js';

export function drawChart(canvas, dataX, dataY, coeffs, xMin = 7.5, xMax = 67.5) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { l: 50, r: 20, t: 20, b: 45 };
    const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;

    // Расчёт основной кривой и границ разброса
    let yMin = Infinity, yMax = -Infinity;
    const curve = [], scatterUpper = [], scatterLower = [];
    
    for (let i = 0; i <= 100; i++) {
        const x = xMin + (xMax - xMin) * i / 100;
        const y = evalPoly(coeffs, x);
        curve.push({ x, y });
        
        // === Расчёт разброса (новое) ===
        const spread = calculateScatter(x, xMin, xMax);
        scatterUpper.push({ x, y: y + spread });
        scatterLower.push({ x, y: y - spread });
        
        if (y < yMin) yMin = y; if (y > yMax) yMax = y;
        if (y + spread > yMax) yMax = y + spread;
        if (y - spread < yMin) yMin = y - spread;
    }
    dataY.forEach(v => { if (v < yMin) yMin = v; if (v > yMax) yMax = v; });
    
    const rng = yMax - yMin || 1; yMin -= rng * 0.1; yMax += rng * 0.1;

    const cx = x => pad.l + (x - xMin) / (xMax - xMin) * pw;
    const cy = y => pad.t + ph - (y - yMin) / (yMax - yMin) * ph;

    // Фон и сетка
    ctx.fillStyle = '#151515'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1;
    const yStep = Math.ceil((yMax - yMin) / 6 / 10) * 10;
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
        ctx.beginPath(); ctx.moveTo(pad.l, cy(y)); ctx.lineTo(pad.l + pw, cy(y)); ctx.stroke();
    }

    // Линейка углов (шаг 3.75°)
    const tickStep = 3.75;
    const totalTicks = Math.round((xMax - xMin) / tickStep);
    ctx.strokeStyle = '#666';
    for (let i = 0; i <= totalTicks; i++) {
        const val = xMin + i * tickStep;
        const px = cx(val);
        let h = 4;
        if (i % 4 === 2) h = 12;
        else if (i % 2 === 0) h = 8;
        ctx.beginPath(); ctx.moveTo(px, pad.t + ph); ctx.lineTo(px, pad.t + ph - h); ctx.stroke();
        if (h === 12) {
            ctx.fillStyle = '#888'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
            ctx.fillText(val, px, pad.t + ph + 18);
        }
    }

    // === Зона разброса (синяя, полупрозрачная) ===
    ctx.fillStyle = 'rgba(70, 130, 200, 0.25)';
    ctx.beginPath();
    // Верхняя граница
    scatterUpper.forEach((p, i) => {
        i === 0 ? ctx.moveTo(cx(p.x), cy(p.y)) : ctx.lineTo(cx(p.x), cy(p.y));
    });
    // Нижняя граница (в обратном порядке для замыкания пути)
    for (let i = scatterLower.length - 1; i >= 0; i--) {
        const p = scatterLower[i];
        ctx.lineTo(cx(p.x), cy(p.y));
    }
    ctx.closePath();
    ctx.fill();

    // Основная кривая (красная)
    ctx.strokeStyle = '#cc3a2a'; ctx.lineWidth = 2; ctx.beginPath();
    curve.forEach((p, i) => i === 0 ? ctx.moveTo(cx(p.x), cy(p.y)) : ctx.lineTo(cx(p.x), cy(p.y)));
    ctx.stroke();

    // Точки данных (жёлтые)
    ctx.fillStyle = '#e8b830';
    dataX.forEach((x, i) => {
        ctx.beginPath(); ctx.arc(cx(x), cy(dataY[i]), 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#a88420'; ctx.lineWidth = 1; ctx.stroke();
    });
}

function evalPoly(coeffs, x) {
    let r = 0; for (let i = 0; i < coeffs.length; i++) r += coeffs[i] * Math.pow(x, i); return r;
}