// detectorRespiratorio.js
// Analizador respiratorio determinístico.
// Utiliza características temporales y frecuenciales para
// distinguir entre respiración Normal, Asma o Bronquitis.

const {
  rms,
  zcr,
  fft_real,
  magnitud,
  spectralCentroid,
  wheezeRatio,
  roncusRatio,
} = require("./features");

function analizarRespiracion(data) {

  // Si no viene audio, usar modo ligero
  if (!data.audio_raw) {
    return diagnosticoSinAudio(data);
  }

  // --- MODO COMPLETO (cuando ESP32 envíe audio_raw) ---
  const audio = data.audio_raw;

  if (!audio || audio.length < 128) return "Normal";

  // 1. Normalizar señal de 32 bits a [-1, 1]
  const norm = audio.map(x => x / 2147483648.0);

  // 2. Características temporales
  const r = rms(norm);
  const z = zcr(norm);

  // 3. FFT y magnitud espectral
  const { real, imag } = fft_real(norm);
  const mag = magnitud(real, imag);

  // 4. Métricas frecuenciales
  const centroid = spectralCentroid(mag);
  const wheeze   = wheezeRatio(mag);
  const roncus   = roncusRatio(mag);

  return reglasDiagnostico({ rms: r, zcr: z, centroid, wheeze, roncus });
}

// MODO LIGERO – usando los datos enviados por ESP32

function diagnosticoSinAudio(d) {
  return reglasDiagnostico({
    rms: d.rms,
    zcr: d.zcr,
    centroid: d.spectral_centroid,
    wheeze: d.wheeze_ratio,
    roncus: d.roncus_ratio,
  });
}

// Reglas determinísticas del diagnóstico
function reglasDiagnostico({ rms, zcr, centroid, wheeze, roncus }) {

  // ASMA → mucha energía en wheeze (frecuencia media-alta)
  if (wheeze > 0.45 && wheeze > roncus) {
    return "Asma";
  }

  // BRONQUITIS → energía concentrada en bajas frecuencias
  if (roncus > 0.45 && roncus > wheeze) {
    return "Bronquitis";
  }

  // Umbral adicional basado en centroide (bronquitis grave)
  if (centroid < 320) {
    return "Bronquitis";
  }

  // Si no se detectan patrones → Normal
  return "Normal";
}

module.exports = { analizarRespiracion };
