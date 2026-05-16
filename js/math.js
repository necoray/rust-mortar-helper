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