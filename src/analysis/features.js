
// Prepara las características de una nueva medición para
// compararlas contra el dataset de respiraciones reales.
module.exports = function extractFeatures(m) {

  // 1) Sanitizar valores numéricos
  const rms = Number(m.rms ?? 0);
  const zcr = Number(m.zcr ?? 0);
  const centroid = Number(m.spectral_centroid ?? 0);
  const ruido = Number(m.ruido ?? 0);

  // 2) Normalizar FFT
  // dataset tiene FFT de tamaño 41
  let fft = Array.isArray(m.audio_fft) ? m.audio_fft.map(Number) : [];

  // Caso A: FFT más larga -> recortamos
  if (fft.length > 41) {
    fft = fft.slice(0, 41);
  }

  // Caso B: FFT más corta - rellenamos con ceros
  if (fft.length < 41) {
    const missing = 41 - fft.length;
    fft = fft.concat(Array(missing).fill(0));
  }

  return {
    rms,
    zcr,
    centroid,
    ruido,
    fft
  };
};
