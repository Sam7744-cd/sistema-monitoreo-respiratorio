function analizarRespiracion(data) {
  const dB = data.ruido;

  if (dB >= -80 && dB <= -75) return "Normal";
  if (dB >= -74 && dB <= -60) return "Bronquitis";
  if (dB >= -59 && dB <= -20) return "Asma";

 
  return analizarPorAudio(data);
}


function analizarPorAudio(data) {
  const audio = data.audio_raw;

  // Si no hay audio - regresar Normal
  if (!audio || audio.length < 128) return "Normal";

  // Normalizar audio 32-bit - [-1, 1]
  const norm = audio.map(x => x / 2147483648.0);

  // ---------- Características básicas ----------
  const r = rms(norm);
  const z = zcr(norm);
  const { real, imag } = fft_real(norm);
  const mag = magnitud(real, imag);

  const centroid = spectralCentroid(mag);
  const wheeze = wheezeRatio(mag);
  const roncus = roncusRatio(mag);

  // ---------- REGLAS RESPALDO ----------
  // Sibilancias - ASMA
  if (wheeze > roncus && centroid > 800) return "Asma";

  // Roncus - BRONQUITIS
  if (roncus > wheeze && centroid < 400) return "Bronquitis";

  return "Normal";
}
//features.js
const {
  rms,
  zcr,
  fft_real,
  magnitud,
  spectralCentroid,
  wheezeRatio,
  roncusRatio
} = require("./features");


// Exportar
module.exports = { analizarRespiracion };
