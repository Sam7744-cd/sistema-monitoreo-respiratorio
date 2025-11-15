const AudioProcessor = require('./audioProcessor');
const fs = require('fs');
const path = require('path');

class DatasetProcessor {
    static async processDataset() {
        const datasetPath = 'D:\\UIC1\\dastasetKaglee\\Asthma Detection Dataset Version 2';
        const results = {
            asthma: [],
            bronchial: [], 
            healthy: []
        };

        // Procesar cada categoría
        for (const category of ['asthma', 'bronchial', 'healthy']) {
            const categoryPath = path.join(datasetPath, category);
            
            if (!fs.existsSync(categoryPath)) {
                console.log(` Carpeta no encontrada: ${categoryPath}`);
                continue;
            }

            const files = fs.readdirSync(categoryPath).filter(file => 
                file.endsWith('.wav')
            ).slice(0, 5); // Probar solo 5 archivos por categoría

            console.log(` Procesando ${files.length} archivos de ${category}...`);

            for (const file of files) {
                try {
                    const filePath = path.join(categoryPath, file);
                    const result = await AudioProcessor.processAudioFile(filePath);
                    
                    results[category].push({
                        file,
                        diagnosis: result.diagnosis,
                        features: result.features
                    });

                    console.log(` ${category}/${file}: ${result.diagnosis.prediction}`);
                } catch (error) {
                    console.log(` Error en ${category}/${file}:`, error.message);
                }
            }
        }

        return results;
    }
}

module.exports = DatasetProcessor;