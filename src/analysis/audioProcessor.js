const fs = require('fs');
const wav = require('node-wav');
const fftAnalyzer = require('./fftAnalyzer');
const thresholds = require('./thresholds.json');

class AudioProcessor {
  //  Cargar archivo WAV desde disco
  static loadWavFile(filePath) {
    const buffer = fs.readFileSync(filePath);
    const result = wav.decode(buffer);

    if (!result.channelData || !result.channelData[0]) {
      throw new Error('No se pudo decodificar el archivo WAV');
    }

    const samples = result.channelData[0];
    const sampleRate = result.sampleRate;

    return {
      samples,
      sampleRate
    };
  }

  //  Extraer características desde muestras
  static extractFeatures(samples, sampleRate) {
    return fftAnalyzer.analyzeFFT(samples, sampleRate, thresholds.bands);
  }

  //  NUEVO: Decodificar desde base64 (para uso en analyzeBase64)
  static fromBase64Wav(b64) {
  const buffer = Buffer.from(b64, 'base64');
  const decoded = wav.decode(buffer);
  const samples = decoded.channelData[0]; // Solo primer canal
  const sampleRate = decoded.sampleRate;

  const features = fftAnalyzer.extraerCaracteristicasEspectrales(samples, sampleRate);

  // Empaquetamos solo lo necesario para RuleClassifier
  return {
    sampleRate,
    ratioW: Number(features.ratioSibilancias || 0),
    ratioR: Number(features.ratioRoncus || 0),
    ratioH: Number(features.ratioMedio || 0)
  };
}

}

module.exports = AudioProcessor;
