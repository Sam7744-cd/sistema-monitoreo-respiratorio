function analizarRespiracion(data) {
  const dB = data.ruido;
  //clasificacion

  //  BRONQUITIS (más fuerte)
  if (dB >= -80 && dB <= -60) return "Bronquitis";

  //  ASMA (medio)
  if (dB >= -59 && dB <= -40) return "Asma";

  //  NORMAL (suave)
  if (dB >= -39 && dB <= -20) return "Normal";

  // Si está fuera de rango (raro), analizar por audio
  return analizarPorAudio(data);
}

function analizarPorAudio(data) {
  const audio = data.audio_raw;
  if (!audio || audio.length < 128) return "Normal";

  const norm = audio.map(x => x / 2147483648.0);

  const r = rms(norm);
  const z = zcr(norm);
  const { real, imag } = fft_real(norm);
  const mag = magnitud(real, imag);

  const centroid = spectralCentroid(mag);
  const wheeze = wheezeRatio(mag);
  const roncus = roncusRatio(mag);

  // Respaldo por patrones
  if (roncus > wheeze && centroid < 400) return "Bronquitis";
  if (wheeze > roncus && centroid > 800) return "Asma";

  return "Normal";
}


const {
  rms,
  zcr,
  fft_real,
  magnitud,
  spectralCentroid,
  wheezeRatio,
  roncusRatio
} = require("./features");

module.exports = { analizarRespiracion };
