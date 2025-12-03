const {
  rms,
  zcr,
  fft_real,
  magnitud,
  spectralCentroid,
  wheezeRatio,
  roncusRatio
} = require("./features");

function analizarRespiracion(data) {
  const dB = data.ruido;

  if (dB >= -80 && dB <= -60) return "Bronquitis";
  if (dB >= -59 && dB <= -40) return "Asma";
  if (dB >= -39 && dB <= -20) return "Normal";

  // Si dB cae fuera del rango (raro) - usar análisis espectral
  return analizarPorAudio(data);
}

function analizarPorAudio(data) {
  const audio = data.audio_raw;

  // Si no hay audio válido - Normal por seguridad
  if (!audio || audio.length < 128) return "Normal";

  // Normalizar PCM 32-bit - [-1, 1]
  const norm = audio.map(x => x / 2147483648.0);

  // -------- Características básicas --------
  const r = rms(norm);
  const z = zcr(norm);

  const { real, imag } = fft_real(norm);
  const mag = magnitud(real, imag);

  const centroid = spectralCentroid(mag);
  const wheeze = wheezeRatio(mag);
  const roncus = roncusRatio(mag);

  // ---------- REGLAS DE RESPALDO ----------
  // ASMA: energía media-alta + sibilancias
  if (wheeze > roncus && centroid > 800) return "Asma";

  // BRONQUITIS: energía baja + roncus
  if (roncus > wheeze && centroid < 400) return "Bronquitis";

  // Si nada coincide → respiración normal
  return "Normal";
}

module.exports = { analizarRespiracion };
