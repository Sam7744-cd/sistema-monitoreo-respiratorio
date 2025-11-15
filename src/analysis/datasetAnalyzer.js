const AudioProcessor = require('./audioProcessor');
const fs = require('fs');
const path = require('path');

class DatasetAnalyzer {
    static async analyzeDataset() {
        const datasetPath = 'D:\\UIC1\\dastasetKaglee\\Asthma Detection Dataset Version 2';
        
        console.log('\n === ANÁLISIS CLARO POR CATEGORÍA ===\n');

        // Analizar cada categoría POR SEPARADO
        await this.analyzeCategory('ASMA', path.join(datasetPath, 'asthma'));
        await this.analyzeCategory('BRONQUITIS', path.join(datasetPath, 'bronchial'));
        await this.analyzeCategory('NORMAL', path.join(datasetPath, 'healthy'));
    }

    static async analyzeCategory(categoryName, categoryPath) {
        console.log(`\n ${categoryName}:`);
        console.log('='.repeat(50));

        if (!fs.existsSync(categoryPath)) {
            console.log(` Carpeta no encontrada: ${categoryPath}`);
            return;
        }

        const files = fs.readdirSync(categoryPath).filter(file => 
            file.endsWith('.wav')
        ).slice(0, 5); // Solo 5 archivos para claridad

        let highFreqScores = [];
        let lowFreqScores = [];
        let centroids = [];

        for (const file of files) {
            try {
                const filePath = path.join(categoryPath, file);
                const audioData = AudioProcessor.loadWavFile(filePath);
                
                if (!audioData) continue;

                const features = AudioProcessor.extractFeatures(audioData.samples, audioData.sampleRate);
                const diagnosis = AudioProcessor.classifyRespiratoryDisease(features);
                
                highFreqScores.push(features.highFreqScore);
                lowFreqScores.push(features.lowFreqScore);
                centroids.push(features.spectralCentroid);

                console.log(`   ${file}:`);
                console.log(`     DIAGNÓSTICO: ${diagnosis.prediction}`);
                console.log(`     Confianza: ${(diagnosis.confidence * 100).toFixed(1)}%`);
                console.log(`     Alta Frecuencia: ${features.highFreqScore.toFixed(3)}`);
                console.log(`     Baja Frecuencia: ${features.lowFreqScore.toFixed(3)}`);
                console.log(`     Centroide: ${features.spectralCentroid.toFixed(0)} Hz`);
                console.log(`     ---`);

            } catch (error) {
                console.log(`Error en ${file}: ${error.message}`);
            }
        }

        // Resumen de la categoría
        if (highFreqScores.length > 0) {
            const avgHighFreq = highFreqScores.reduce((a, b) => a + b) / highFreqScores.length;
            const avgLowFreq = lowFreqScores.reduce((a, b) => a + b) / lowFreqScores.length;
            const avgCentroid = centroids.reduce((a, b) => a + b) / centroids.length;
            
            console.log(`\n RESUMEN ${categoryName}:`);
            console.log(`   • Alta Frecuencia promedio: ${avgHighFreq.toFixed(3)}`);
            console.log(`   • Baja Frecuencia promedio: ${avgLowFreq.toFixed(3)}`);
            console.log(`   • Centroide promedio: ${avgCentroid.toFixed(0)} Hz`);
            console.log(''); // línea en blanco para separar
        }
    }
}

module.exports = DatasetAnalyzer;