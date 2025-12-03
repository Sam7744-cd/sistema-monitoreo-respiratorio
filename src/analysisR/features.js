const { fft_real } = require("./fft");

// 1. RMS – Root Mean Square
//    Mide la energía promedio de la señal. Respiración intensa - RMS más alto.
function rms(buffer) {
  let sum = 0;
  for (let x of buffer) sum += x * x;
  return Math.sqrt(sum / buffer.length);
}

// 2. ZCR – Zero Crossing Rate
//    Cuenta los cruces por cero → indica turbulencia o respiración agitada.
function zcr(buffer) {
  let cruzes = 0;

  for (let i = 1; i < buffer.length; i++) {
    if (
      (buffer[i - 1] >= 0 && buffer[i] < 0) ||
      (buffer[i - 1] < 0 && buffer[i] >= 0)
    ) {
      cruzes++;
    }
  }
  return cruzes / buffer.length;
}

// 3. Magnitud espectral = sqrt(real² + imag²)
function magnitud(real, imag) {
  return real.map((r, i) => Math.sqrt(r * r + imag[i] * imag[i]));
}

// 4. Centroide Espectral
//    Indica dónde está concentrada la energía:
//  Alto → respiración normal
//  Muy bajo (< 300 Hz) → roncus / bronquitis

function spectralCentroid(mag, sampleRate = 16000) {
  let num = 0,
    den = 0;

  for (let i = 0; i < mag.length; i++) {
    num += i * mag[i];
    den += mag[i];
  }

  if (den === 0) return 0;

  const freqBin = sampleRate / (2 * mag.length);
  return (num / den) * freqBin;
}

// 5. Energía en un rango de frecuencias — usado para Wheeze y Roncus
function bandEnergy(mag, sampleRate, f1, f2) {
  const n = mag.length;
  const freqPerBin = sampleRate / (2 * n);

  const start = Math.floor(f1 / freqPerBin);
  const end = Math.floor(f2 / freqPerBin);

  let sum = 0;
  for (let i = start; i <= end && i < n; i++) {
    sum += mag[i];
  }
  return sum;
}

// 6. Wheeze Ratio (asma)
//    Sibilancias típicas entre 400–1600 Hz
function wheezeRatio(mag, sampleRate = 16000) {
  return bandEnergy(mag, sampleRate, 400, 1600);
}

// 7. Roncus Ratio (bronquitis)
//    Ruidos roncos entre 100–400 Hz
function roncusRatio(mag, sampleRate = 16000) {
  return bandEnergy(mag, sampleRate, 100, 400);
}

// 8. calcularRuido — convierte audio crudo 32-bit a decibeles (dB)
//    IMPORTANTE: Ahora el ESP32 ya no envía dB - el backend lo calcula.
function calcularRuido(buffer) {
  if (!buffer?.length) return 0;

  let sum = 0;

  for (let x of buffer) {
    const norm = x / 2147483648.0; // Conversión entero 32-bit → rango [-1, 1]
    sum += norm * norm;
  }

  const rms = Math.sqrt(sum / buffer.length);

  // dB = 20 * log10(rms)
  const dB = 20 * Math.log10(rms + 0.000001);

  return dB;
}

// Exportar módulos
module.exports = {
  rms,
  zcr,
  fft_real,
  magnitud,
  spectralCentroid,
  wheezeRatio,
  roncusRatio,
  calcularRuido,
};
