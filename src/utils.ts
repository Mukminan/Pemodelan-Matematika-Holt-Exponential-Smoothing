export function calculateDES(y: number[], a: number, b: number, n_forecast = 12) {
    let n = y.length;
    let L = new Array(n).fill(0);
    let T = new Array(n).fill(0);
    let F = new Array(n + n_forecast).fill(null);

    if (n === 0) return { L: [], T: [], F: [] };

    L[0] = y[0];
    T[0] = n > 1 ? y[1] - y[0] : 0;
    F[0] = null;

    for (let i = 1; i < n; i++) {
        L[i] = a * y[i] + (1 - a) * (L[i - 1] + T[i - 1]);
        T[i] = b * (L[i] - L[i - 1]) + (1 - b) * T[i - 1];
        F[i] = L[i - 1] + T[i - 1];
    }

    if (n > 0) {
        for (let m = 1; m <= n_forecast; m++) {
            F[n + m - 1] = L[n - 1] + (m * T[n - 1]);
        }
    }

    return { L, T, F };
}

export function getMAPE(actual: number[], forecast: (number | null)[]) {
    let sum = 0;
    let n = 0;
    for (let i = 1; i < actual.length; i++) {
        if (forecast[i] !== null && forecast[i] !== undefined && actual[i] !== 0) {
            sum += Math.abs((actual[i] - (forecast[i] as number)) / actual[i]);
            n++;
        }
    }
    return n > 0 ? (sum / n) * 100 : 0;
}

export function findBestParams(wasteData: number[]) {
    let bestA = 0.1, bestB = 0.1, minMAPE = Infinity;
    
    // Grid search with step 0.05
    for (let a = 0.01; a < 1; a += 0.05) {
        for (let b = 0.01; b < 1; b += 0.05) {
            let res = calculateDES(wasteData, a, b, 0);
            let mape = getMAPE(wasteData, res.F);
            if (mape < minMAPE) {
                minMAPE = mape;
                bestA = a;
                bestB = b;
            }
        }
    }

    return { bestA, bestB };
}
