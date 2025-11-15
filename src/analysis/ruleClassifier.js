// ruleClassifier.js
// Clasificación de sonidos respiratorios usando reglas basadas en umbrales

const thresholds = require('./thresholds.json');         // Carga los umbrales definidos
const AudioProcessor = require('./audioProcessor');      // Procesador para extraer características del audio

// Clasifica según ratios calculados
function classify(features) {
  const ratioW = features.ratioW; // Wheeze (sibilancias)
  const ratioR = features.ratioR; // Roncus

  // Umbrales definidos en thresholds.json
  const thrW = thresholds.rules?.asthma?.ratioW_min ?? 0.18;
  const thrR = thresholds.rules?.bronchitis?.ratioR_min ?? 0.60;

  // Reglas de decisión
  if (ratioW >= thrW) {
    return {
      prediction: 'ASMA',
      confidence: Math.min(1, ratioW / thrW),
      rule: 'ratioW>=thrW'
    };
  }

  if (ratioR >= thrR) {
    return {
      prediction: 'BRONQUITIS',
      confidence: Math.min(1, ratioR / thrR),
      rule: 'ratioR>=thrR'
    };
  }

  return {
    prediction: 'NORMAL',
    confidence: 0.7,
    rule: 'por debajo de umbrales'
  };
}

// Esta función recibe audio en base64 y retorna la clasificación
function analyzeBase64(base64Wav) {
  const features = AudioProcessor.fromBase64Wav(base64Wav); // Extrae características del audio
  const result = classify(features); // Aplica reglas

  return {
    class: result.prediction,
    confidence: result.confidence,
    rule: result.rule,
    features: {
      sampleRate: features.sampleRate,
      ratioW: Number(features.ratioW.toFixed(4)),
      ratioR: Number(features.ratioR.toFixed(4)),
      ratioH: Number(features.ratioH.toFixed(4))
    }
  };
}

module.exports = { classify, analyzeBase64 };
