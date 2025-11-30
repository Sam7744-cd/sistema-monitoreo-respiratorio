//  detectorRespiratorio.js
const {
  rms,
  zcr,
  fft_real,
  magnitud,
  spectralCentroid,
  wheezeRatio,
  roncusRatio,
} = require("./features");


//  FUNCIÓN PRINCIPAL – ANALIZAR RESPIRACIÓN
function analizarRespiracion(data) {

  //  Si NO existe audio_raw - usar modo ligero basado en métricas
  if (!data.audio_raw) {
    return diagnosticoSinAudio(data);
  }

  //  MODO COMPLETO (cuando el ESP32 envíe audio crudo)
  const audio = data.audio_raw;

  if (!audio || audio.length < 128) return "Normal";

  // 1. Normalizar señal 32-bit → [-1, 1]
  const norm = audio.map(x => x / 2147483648.0);

  // 2. Características temporales
  const r = rms(norm);
  const z = zcr(norm);

  // 3. FFT
  const { real, imag } = fft_real(norm);

  // 4. Magnitud espectral
  const mag = magnitud(real, imag);

  // 5. Características frecuenciales
  const centroid = spectralCentroid(mag);
  const wheeze = wheezeRatio(mag);
  const roncus = roncusRatio(mag);

  // 6. Clasificación determinística
  return reglasDiagnostico({ rms: r, zcr: z, centroid, wheeze, roncus });
}

//  MODO LIGERO - cuando ESP32 envía solo parámetros y NO audio_raw
function diagnosticoSinAudio(d) {
  return reglasDiagnostico({
    rms: d.rms,
    zcr: d.zcr,
    centroid: d.spectral_centroid,
    wheeze: d.wheeze_ratio,
    roncus: d.roncus_ratio,
  });
}

function reglasDiagnostico({ rms, zcr, centroid, wheeze, roncus }) {

  // ASMA - Wheeze dominante en frecuencias medias-altas
  if (wheeze > 0.45 && wheeze > roncus) {
    return "Asma";
  }

  // BRONQUITIS - energía fuerte en bajas frecuencias (roncus)
  if (roncus > 0.45 && roncus > wheeze) {
    return "Bronquitis";
  }

  // BRONQUITIS (criterio alterno) - centroide muy bajo
  if (centroid < 320) {
    return "Bronquitis";
  }

  // Ningún patrón - respiración normal
  return "Normal";
}

//  Exportar
module.exports = { analizarRespiracion };
