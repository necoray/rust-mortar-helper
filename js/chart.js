export function drawChart(canvas, dataX, dataY, coeffs, xMin = 7.5, xMax = 67.5) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { l: 50, r: 20, t: 20, b: 45 };
    const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;

    let yMin = Infinity, yMax = -Infinity;
    const curve = [];
    for (let i = 0; i <= 100; i++) {
        const x = xMin + (xMax - xMin) * i / 100;
        const y = evalPoly(coeffs, x);
        curve.push({ x, y });
        if (y < yMin) yMin = y; if (y > yMax) yMax = y;
    }
    dataY.forEach(v => { if (v < yMin) yMin = v; if (v > yMax) yMax = v; });
    const rng = yMax - yMin || 1; yMin -= rng * 0.1; yMax += rng * 0.1;

    const cx = x => pad.l + (x - xMin) / (xMax - xMin) * pw;
    const cy = y => pad.t + ph - (y - yMin) / (yMax - yMin) * ph;

    ctx.fillStyle = '#151515'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1;
    const yStep = Math.ceil((yMax - yMin) / 6 / 10) * 10;
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
        ctx.beginPath(); ctx.moveTo(pad.l, cy(y)); ctx.lineTo(pad.l + pw, cy(y)); ctx.stroke();
    }

    // Линейка с кастомными делениями: шаг 3.75° (15/4)
    const tickStep = 3.75;
    const totalTicks = Math.round((xMax - xMin) / tickStep);
    ctx.strokeStyle = '#666';
    for (let i = 0; i <= totalTicks; i++) {
        const val = xMin + i * tickStep;
        const px = cx(val);
        let h = 4; // маленькая
        if (i % 4 === 2) h = 12; // крупная (15, 30, 45, 60)
        else if (i % 2 === 0) h = 8; // средняя (7.5, 22.5, 37.5, 52.5, 67.5)

        ctx.beginPath(); ctx.moveTo(px, pad.t + ph); ctx.lineTo(px, pad.t + ph - h); ctx.stroke();

        if (h === 12) {
            ctx.fillStyle = '#888'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
            ctx.fillText(val, px, pad.t + ph + 18);
        }
    }

    // Кривая
    ctx.strokeStyle = '#cc3a2a'; ctx.lineWidth = 2; ctx.beginPath();
    curve.forEach((p, i) => i === 0 ? ctx.moveTo(cx(p.x), cy(p.y)) : ctx.lineTo(cx(p.x), cy(p.y)));
    ctx.stroke();

    // Точки
    ctx.fillStyle = '#e8b830';
    dataX.forEach((x, i) => {
        ctx.beginPath(); ctx.arc(cx(x), cy(dataY[i]), 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#a88420'; ctx.lineWidth = 1; ctx.stroke();
    });
}

function evalPoly(coeffs, x) {
    let r = 0; for (let i = 0; i < coeffs.length; i++) r += coeffs[i] * Math.pow(x, i); return r;
}