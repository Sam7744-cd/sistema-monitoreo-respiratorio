// Clasificador respiratorio basado en distancia mínima (KNN-1)
// Utiliza el dataset real almacenado en dataset.json
const path = require("path");
const dataset = require("./dataset/dataset.json");
const extractFeatures = require("./features");


// Distancia Euclidiana entre dos vectores numéricos
function distanceArray(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// Distancia total entre dos muestras respiratorias
// Combina: rms, zcr, centroid, ruido y FFT completa
function distanceFeatures(a, b) {
  let sum = 0;

  // 1) valores escalares
  sum += (a.rms - b.rms) ** 2;
  sum += (a.zcr - b.zcr) ** 2;
  sum += (a.centroid - b.centroid) ** 2;
  sum += (a.ruido - b.ruido) ** 2;

  // 2) distancia FFT
  sum += distanceArray(a.fft, b.fft);

  return Math.sqrt(sum);
}

// CLASIFICADOR PRINCIPAL
function classify(newMeasurement) {
  const f = extractFeatures(newMeasurement);

  let best = null;

  for (const sample of dataset) {
    const d = distanceFeatures(f, sample);
    if (!best || d < best.distance) {
      best = {
        distance: d,
        label: sample.label
      };
    }
  }

  return best.label;
}

module.exports = { classify };
