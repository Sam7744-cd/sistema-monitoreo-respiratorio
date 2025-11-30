// -----------------------------------------
// Análisis determinístico de respiración
// -----------------------------------------

module.exports.analizarRespiracion = (f) => {

  // Seguridad por si falta algún dato
  if (!f) return "Normal";

  // -------------------------
  // 1. Detectar ASMA
  // -------------------------
  if (f.wheeze_ratio >= 0.18) {
    return "Asma";
  }

  // -------------------------
  // 2. Detectar BRONQUITIS
  // -------------------------
  if (f.roncus_ratio >= 0.60) {
    return "Bronquitis";
  }

  // -------------------------
  // 3. Detección por ruido
  // -------------------------
  if (f.ruido <= -60) {
    return "Normal";
  }

  // Caso general
  return "Normal";
};
