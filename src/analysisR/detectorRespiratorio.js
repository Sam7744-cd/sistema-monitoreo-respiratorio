//  Reglas principales de decisión (sin FFT)
function analizarRespiracion(data) {
  const dB = data.ruido ?? -80;           // energía
  const rms = data.rms ?? 0;              // intensidad temporal
  const zcr = data.zcr ?? 0;              // turbulencia de flujo de aire

  // REGLA 1 — BRONQUITIS (muy ruidoso, respiración pesada)
  // Características típicas:
  //  - dB > -40  (ruido profundo)
  //  - RMS alto
  if (dB > -40 || rms > 0.12) {
    return "Bronquitis";
  }


  // REGLA 2 — ASMA (sibilancias suaves)
  //  - dB entre -55 y -40
  //  - ZCR alto -> turbulencia (sibilancia)

  if (dB <= -40 && dB >= -55) {
    if (zcr > 0.10) {
      return "Asma";
    }
    // Si el dB esta en rango de asma pero sin turbulencia.
    return "Asma";
  }

  // REGLA 3 — NORMAL 
  //  - dB < -55
  //  - RMS muy bajo
  return "Normal";
}


module.exports = { analizarRespiracion };
