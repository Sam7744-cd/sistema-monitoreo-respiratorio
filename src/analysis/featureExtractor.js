// src/analysis/featureExtractor.js
const FFTAnalyzer = require('./fftAnalyzer');
const WaveletAnalyzer = require('./waveletAnalyzer');

/**
 * CLASE FeatureExtractor - Combina FFT + Wavelet para análisis completo
 * 
 * INVESTIGACIÓN: ¿La combinación de técnicas mejora la precisión?
 * HIPÓTESIS: FFT es bueno para "QUÉ frecuencias", Wavelet para "CUÁNDO ocurren"
 * 
 * METODOLOGÍA: Extraer 15+ características diferentes para alimentar
 * un sistema de decisión o mostrar en interfaz médica
 */
class FeatureExtractor {

  /**
   * EXTRAER CARACTERÍSTICAS COMPLETAS - Análisis multimodal
   * 
   * Propósito: Crear un "vector de características" que describe
   * exhaustivamente el sonido respiratorio para:
   * - Clasificación automática
   - Visualización médica
   * - Análisis estadístico
   * 
   * @param {Array} audioData - Muestras de audio
   * @param {Number} sampleRate - Frecuencia de muestreo (Hz)
   * @returns {Object} 15+ características para análisis médico
   */
  static extraerCaracteristicasCompletas(audioData, sampleRate) {
    
    // ANÁLISIS FFT - Dominio frecuencial (QUÉ frecuencias)
    const caracteristicasFFT = FFTAnalyzer.extraerCaracteristicasEspectrales(audioData, sampleRate);
    
    // ANÁLISIS WAVELET - Dominio tiempo-frecuencia (CUÁNDO ocurren)
    const caracteristicasWavelet = WaveletAnalyzer.analizarPatronRespiratorio(audioData);
    
    // ANÁLISIS TEMPORAL - Dominio tiempo (COMO es la forma de onda)
    const caracteristicasTemporales = this.analizarCaracteristicasTemporales(audioData);
    
    // COMBINAR TODAS LAS CARACTERÍSTICAS
    return {
      // METADATOS BÁSICOS
      metadata: {
        duracion: audioData.length / sampleRate,
        muestrasTotales: audioData.length,
        frecuenciaMuestreo: sampleRate
      },
      
      // CARACTERÍSTICAS FFT (10+ métricas)
      espectral: {
        // Energías relativas en bandas médicas
        ratioSibilancias: caracteristicasFFT.ratioSibilancias,    // % en 600-1200 Hz
        ratioRoncus: caracteristicasFFT.ratioRoncus,              // % en 100-300 Hz
        ratioMedio: caracteristicasFFT.ratioMedio,                // % en 300-600 Hz
        
        // Energías absolutas (para normalización)
        energiaSibilancias: caracteristicasFFT.energiaAlta,
        energiaRoncus: caracteristicasFFT.energiaBaja,
        energiaTotal: caracteristicasFFT.energiaTotal,
        
        // Análisis de picos (detección de tonos puros)
        picoPrincipalFrecuencia: caracteristicasFFT.picoPrincipalFrecuencia,
        picoPrincipalMagnitud: caracteristicasFFT.picoPrincipalMagnitud,
        cantidadPicos: caracteristicasFFT.cantidadPicos,
        
        // Para investigación: ¿En qué rango están los picos?
        picosEnZonaSibilancias: caracteristicasFFT.picoPrincipalFrecuencia >= 400 && 
                                caracteristicasFFT.picoPrincipalFrecuencia <= 1200
      },
      
      // CARACTERÍSTICAS WAVELET (5+ métricas)
      temporal: {
        // Eventos agudos (sibilancias)
        totalEventosAgudos: caracteristicasWavelet.metricas.totalEventosAgudos,
        densidadEventosAgudos: caracteristicasWavelet.metricas.densidadAgudos,
        intensidadAgudos: caracteristicasWavelet.metricas.intensidadAgudos,
        
        // Eventos graves (roncus)  
        totalEventosGraves: caracteristicasWavelet.metricas.totalEventosGraves,
        densidadEventosGraves: caracteristicasWavelet.metricas.densidadGraves,
        intensidadGraves: caracteristicasWavelet.metricas.intensidadGraves,
        
        // Diagnóstico sugerido por wavelet
        diagnosticoWavelet: caracteristicasWavelet.diagnosticoSugerido,
        confianzaWavelet: caracteristicasWavelet.confianza
      },
      
      // CARACTERÍSTICAS TEMPORALES (3+ métricas)
      formaOnda: {
        amplitudPromedio: caracteristicasTemporales.amplitudPromedio,
        amplitudMaxima: caracteristicasTemporales.amplitudMaxima,
        crucesPorCero: caracteristicasTemporales.crucesPorCero,
        relacionSenalRuido: caracteristicasTemporales.relacionSenalRuido
      },
      
      // DIAGNÓSTICO COMBINADO (Fusión de técnicas)
      diagnostico: this.combinarDiagnosticos(caracteristicasFFT, caracteristicasWavelet)
    };
  }

  /**
   * ANALIZAR CARACTERÍSTICAS TEMPORALES - Forma de onda original
   * 
   * Propósito: Analizar la señal en su forma cruda (dominio tiempo)
   * Aplicación: Detectar patrones de amplitud, ciclos respiratorios, ruido
   * 
   * @param {Array} audioData - Muestras de audio
   * @returns {Object} Características de la forma de onda
   */
  static analizarCaracteristicasTemporales(audioData) {
    // AMPLITUD PROMEDIO: Volumen general del sonido
    const amplitudPromedio = audioData.reduce((sum, val) => sum + Math.abs(val), 0) / audioData.length;
    
    // AMPLITUD MÁXIMA: Pico más alto (útil para normalización)
    const amplitudMaxima = Math.max(...audioData.map(Math.abs));
    
    // CRUCES POR CERO: Veces que la señal cruza el eje cero
    // INDICADOR: Sonidos agudos tienen más cruces por cero
    let crucesPorCero = 0;
    for (let i = 1; i < audioData.length; i++) {
      if ((audioData[i-1] < 0 && audioData[i] >= 0) || 
          (audioData[i-1] >= 0 && audioData[i] < 0)) {
        crucesPorCero++;
      }
    }
    
    // RELACIÓN SEÑAL/RUIDO (simplificada)
    // Supuesto: La señal respiratoria tiene variación, el ruido es constante
    const relacionSenalRuido = amplitudMaxima / (amplitudPromedio + 0.0001);
    
    return {
      amplitudPromedio,
      amplitudMaxima, 
      crucesPorCero,
      relacionSenalRuido
    };
  }

  /**
   * COMBINAR DIAGNÓSTICOS - Fusión de técnicas FFT + Wavelet
   * 
   * INVESTIGACIÓN: ¿La combinación de técnicas mejora la precisión?
   * ESTRATEGIA: Usar reglas basadas en literatura médica + umbrales empíricos
   * 
   * @param {Object} caracteristicasFFT - Resultados análisis FFT
   * @param {Object} caracteristicasWavelet - Resultados análisis Wavelet
   * @returns {Object} Diagnóstico final con explicación
   */
  static combinarDiagnosticos(caracteristicasFFT, caracteristicasWavelet) {
    // OBTENER EVIDENCIAS DE CADA TÉCNICA
    const evidenciaAsma = this.calcularEvidenciaAsma(caracteristicasFFT, caracteristicasWavelet);
    const evidenciaBronquitis = this.calcularEvidenciaBronquitis(caracteristicasFFT, caracteristicasWavelet);
    const evidenciaNormal = this.calcularEvidenciaNormal(caracteristicasFFT, caracteristicasWavelet);
    
    // DETERMINAR DIAGNÓSTICO FINAL
    let diagnosticoFinal = 'Normal';
    let confianzaFinal = evidenciaNormal;
    let explicacion = 'Patrón respiratorio dentro de parámetros normales';
    
    if (evidenciaAsma > evidenciaNormal && evidenciaAsma > evidenciaBronquitis) {
      diagnosticoFinal = 'Asma';
      confianzaFinal = evidenciaAsma;
      explicacion = 'Presencia de sibilancias en frecuencias agudas con eventos temporales característicos';
    }
    
    if (evidenciaBronquitis > evidenciaNormal && evidenciaBronquitis > evidenciaAsma) {
      diagnosticoFinal = 'Bronquitis';
      confianzaFinal = evidenciaBronquitis;
      explicacion = 'Dominancia de componentes graves y eventos de roncus continuos';
    }
    
    return {
      diagnostico: diagnosticoFinal,
      confianza: Math.min(confianzaFinal, 0.95), // Máximo 95% de confianza
      explicacion: explicacion,
      evidencias: {
        asma: evidenciaAsma,
        bronquitis: evidenciaBronquitis,
        normal: evidenciaNormal
      }
    };
  }

  /**
   * CALCULAR EVIDENCIA DE ASMA - Basado en características de sibilancias
   * 
   * CRITERIOS CLÍNICOS para sibilancias (asma):
   * - Alta energía en 400-1200 Hz
   * - Picos espectrales agudos
   * - Eventos wavelet cortos y repetitivos
   * 
   * @param {Object} fft - Características FFT
   * @param {Object} wavelet - Características Wavelet
   * @returns {Number} Puntuación de evidencia (0-1)
   */
  static calcularEvidenciaAsma(fft, wavelet) {
    let puntuacion = 0;
    
    // EVIDENCIA FFT: Sibilancias = alta energía en agudos
    if (fft.ratioSibilancias > 0.3) puntuacion += 0.3;
    if (fft.picosEnZonaSibilancias) puntuacion += 0.2;
    if (fft.cantidadPicos > 5) puntuacion += 0.1;
    
    // EVIDENCIA WAVELET: Sibilancias = muchos eventos agudos
    if (wavelet.metricas.densidadAgudos > 1.5) puntuacion += 0.2;
    if (wavelet.metricas.totalEventosAgudos > 8) puntuacion += 0.2;
    
    return Math.min(puntuacion, 1.0);
  }

  /**
   * CALCULAR EVIDENCIA DE BRONQUITIS - Basado en características de roncus
   * 
   * CRITERIOS CLÍNICOS para roncus (bronquitis):
   * - Alta energía en 100-300 Hz
   * - Eventos graves continuos
   * - Menos cruces por cero (sonidos graves)
   * 
   * @param {Object} fft - Características FFT
   * @param {Object} wavelet - Características Wavelet  
   * @returns {Number} Puntuación de evidencia (0-1)
   */
  static calcularEvidenciaBronquitis(fft, wavelet) {
    let puntuacion = 0;
    
    // EVIDENCIA FFT: Roncus = alta energía en graves
    if (fft.ratioRoncus > 0.4) puntuacion += 0.3;
    if (fft.energiaRoncus > 0.1) puntuacion += 0.2;
    
    // EVIDENCIA WAVELET: Roncus = eventos graves continuos
    if (wavelet.metricas.densidadGraves > 0.8) puntuacion += 0.3;
    if (wavelet.metricas.intensidadGraves > 0.2) puntuacion += 0.2;
    
    return Math.min(puntuacion, 1.0);
  }

  /**
   * CALCULAR EVIDENCIA DE NORMAL - Ausencia de patrones patológicos
   * 
   * CRITERIOS para respiración normal:
   * - Energía balanceada en todas las bandas
   * - Pocos eventos agudos/graves
   * - Patrón temporal regular
   * 
   * @param {Object} fft - Características FFT
   * @param {Object} wavelet - Características Wavelet
   * @returns {Number} Puntuación de evidencia (0-1)
   */
  static calcularEvidenciaNormal(fft, wavelet) {
    let puntuacion = 0.5; // Punto de partida
    
    // PENALIZAR por evidencias de enfermedad
    if (fft.ratioSibilancias > 0.2) puntuacion -= 0.2;
    if (fft.ratioRoncus > 0.3) puntuacion -= 0.2;
    if (wavelet.metricas.totalEventosAgudos > 5) puntuacion -= 0.1;
    if (wavelet.metricas.totalEventosGraves > 3) puntuacion -= 0.1;
    
    // PREMIAR por balance espectral
    if (fft.ratioMedio > 0.2 && fft.ratioMedio < 0.6) puntuacion += 0.1;
    
    return Math.max(0, Math.min(puntuacion, 1.0));
  }
}

module.exports = FeatureExtractor;