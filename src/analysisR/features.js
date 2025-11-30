// features.js - Cálculo de características de audio
// Este módulo obtiene métricas acústicas usadas para
// diagnosticar respiración: RMS, ZCR, Centroide Espectral,
// Wheeze Ratio y Roncus Ratio.
// También integra FFT para análisis frecuencial.

const { fft_real } = require("./fft");

// RMS – Root Mean Square
// Mide la energía promedio de la señal.
// Normal - RMS bajo
// Sibilancias o roncus → RMS más alto
function rms(buffer) {
  let sum = 0;
  for (let x of buffer) sum += x * x;
  return Math.sqrt(sum / buffer.length);
}

// ZCR – Zero Crossing Rate
// Indica turbulencia en la respiración:
// Valores altos - respiración más agitada
function zcr(buffer) {
  let cruzes = 0;
  for (let i = 1; i < buffer.length; i++) {
    if ((buffer[i - 1] >= 0 && buffer[i] < 0) ||
        (buffer[i - 1] < 0 && buffer[i] >= 0)) cruzes++;
  }
  return cruzes / buffer.length;
}

// Magnitud espectral = sqrt(real² + imag²)
function magnitud(real, imag) {
  return real.map((r, i) => Math.sqrt(r * r + imag[i] * imag[i]));
}

// Centroide Espectral
// Señal normal - centroide alto
// Bronquitis - centroide muy bajo (<300 Hz)
function spectralCentroid(mag, sampleRate = 16000) {
  let num = 0, den = 0;

  for (let i = 0; i < mag.length; i++) {
    num += i * mag[i];
    den += mag[i];
  }

  if (den === 0) return 0;

  const freqBin = sampleRate / (2 * mag.length);
  return (num / den) * freqBin;
}

// Energía en un rango de frecuencias (útil para Wheeze/Roncus)

function bandEnergy(mag, sampleRate, f1, f2) {
  const n = mag.length;
  const freqPerBin = sampleRate / (2 * n);

  const start = Math.floor(f1 / freqPerBin);
  const end   = Math.floor(f2 / freqPerBin);

  let sum = 0;
  for (let i = start; i <= end && i < n; i++) {
    sum += mag[i];
  }
  return sum;
}
// Wheeze Ratio – sibilancias típicas del asma
// Energía entre 400–1600 Hz
function wheezeRatio(mag, sampleRate = 16000) {
  return bandEnergy(mag, sampleRate, 400, 1600);
}

// Roncus Ratio – ruidos roncos típicos de bronquitis
// Energía entre 100–400 Hz

function roncusRatio(mag, sampleRate = 16000) {
  return bandEnergy(mag, sampleRate, 100, 400);
}

module.exports = {
  rms,
  zcr,
  fft_real,
  magnitud,
  spectralCentroid,
  wheezeRatio,
  roncusRatio,
};
