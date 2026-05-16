export function drawMortarScale(canvas, angles, xMin = 7.5, xMax = 67.5) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { l: 10, r: 10, t: 8, b: 20 };
    const pw = W - pad.l - pad.r;
    const baseY = H - pad.b;

    // Фон
    ctx.fillStyle = '#151515';
    ctx.fillRect(0, 0, W, H);

    // Базовая линия
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, baseY);
    ctx.lineTo(W - pad.r, baseY);
    ctx.stroke();

    // Деления: шаг 3.75° (15/4)
    const tickStep = 3.75;
    const totalTicks = Math.round((xMax - xMin) / tickStep);
    ctx.strokeStyle = '#666';
    ctx.textAlign = 'center';
    ctx.font = '10px monospace';

    for (let i = 0; i <= totalTicks; i++) {
        const val = xMin + i * tickStep;
        const x = pad.l + (val - xMin) / (xMax - xMin) * pw;
        let h = 4; // маленькая
        let color = '#555';

        if (i % 4 === 2) { h = 16; color = '#888'; } // крупная: 15, 30, 45, 60
        else if (i % 2 === 0) { h = 10; color = '#666'; } // средняя

        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x, baseY - h);
        ctx.stroke();

        if (h === 16) {
            ctx.fillStyle = '#999';
            ctx.fillText(val, x, baseY + 14);
        }
    }

    // Подписи диапазона
    ctx.fillStyle = '#555';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(xMin + '°', pad.l, baseY + 14);
    ctx.textAlign = 'right';
    ctx.fillText(xMax + '°', W - pad.r, baseY + 14);

    // Красные маркеры для найденных углов
    if (!angles || angles.length === 0) return;

    ctx.strokeStyle = '#cc3a2a';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#cc3a2a';

    angles.forEach(ang => {
        if (ang < xMin || ang > xMax) return;
        const x = pad.l + (ang - xMin) / (xMax - xMin) * pw;

        // Вертикальная линия-указатель
        ctx.beginPath();
        ctx.moveTo(x, baseY - 20);
        ctx.lineTo(x, baseY + 4);
        ctx.stroke();

        // Треугольник-наконечник
        ctx.beginPath();
        ctx.moveTo(x, baseY - 24);
        ctx.lineTo(x - 4, baseY - 16);
        ctx.lineTo(x + 4, baseY - 16);
        ctx.closePath();
        ctx.fill();

        // Значение угла над маркером
        ctx.fillStyle = '#ff6b5a';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ang.toFixed(1) + '°', x, baseY - 28);
        ctx.fillStyle = '#cc3a2a';
    });
}