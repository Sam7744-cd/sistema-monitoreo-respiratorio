function analizarRespiracion(data) {
  const ruido = data.ruido ?? 0;
  const rms = data.rms ?? 0;
  const zcr = data.zcr ?? 0;
  const centroid = data.spectral_centroid ?? 0;

  // ASMA → ruido moderado + ZCR alto + centroide medio
  if (ruido < -40 && ruido > -65 && zcr > 120 && centroid > 180) {
    return "Asma";
  }

  // BRONQUITIS → ruido alto o centroide muy bajo
  if (ruido > -35 || centroid < 120) {
    return "Bronquitis";
  }

  return "Normal";
}

module.exports = { analizarRespiracion };
