import { mortarState } from '../state.js';
import { findAnglesForDistance } from '../math.js';
import { drawMortarScale } from '../ui/mortar-scale.js';

export function initAiming(els) {
    els.aimBtn.addEventListener('click', calculateAngle);

    function calculateAngle() {
        if (!mortarState.calculated || !mortarState.coeffs) {
            return alert('Сначала постройте модель на вкладке характеристик');
        }
        const dist = parseFloat(els.targetDistance.value);
        if (isNaN(dist) || dist <= 0) return alert('Введите корректную дистанцию');

        const angles = findAnglesForDistance(mortarState.coeffs, dist, 7.5, 67.5);
        els.aimResult.classList.remove('hidden');
        els.aimList.innerHTML = '';

        if (angles.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Дистанция вне досягаемости модели';
            els.aimList.appendChild(li);
            drawMortarScale(els.mortarScale, []);
        } else {
            angles.sort((a, b) => a - b);
            angles.forEach(ang => {
                const li = document.createElement('li');
                li.textContent = `${ang}°`;
                els.aimList.appendChild(li);
            });
            drawMortarScale(els.mortarScale, angles);
        }
    }
}