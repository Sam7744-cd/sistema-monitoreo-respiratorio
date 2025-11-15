const wav = require('node-wav');
const fs = require('fs');
const path = require('path');

class AudioInspector {
    static async inspectAudioFiles() {
        const datasetPath = 'D:\\UIC1\\dastasetKaglee\\Asthma Detection Dataset Version 2';
        
        console.log('\n === INSPECCIÓN DE ARCHIVOS DE AUDIO (OPTIMIZADO) ===\n');

        const categories = ['asthma', 'bronchial', 'healthy'];
        
        for (const category of categories) {
            const categoryPath = path.join(datasetPath, category);
            
            if (!fs.existsSync(categoryPath)) {
                console.log(` Carpeta no encontrada: ${categoryPath}`);
                continue;
            }

            const files = fs.readdirSync(categoryPath).filter(file => 
                file.endsWith('.wav')
            ).slice(0, 3);

            console.log(`\n ${category.toUpperCase()}:`);
            console.log('='.repeat(50));

            for (const file of files) {
                await this.inspectFileOptimized(category, file, categoryPath);
            }
        }
    }

    static async inspectFileOptimized(category, filename, categoryPath) {
        try {
            const filePath = path.join(categoryPath, filename);
            const buffer = fs.readFileSync(filePath);
            const audio = wav.decode(buffer);

            console.log(`\n   ${filename}:`);
            console.log(`     • Tamaño: ${(buffer.length / 1024).toFixed(1)} KB`);
            console.log(`     • Sample Rate: ${audio.sampleRate} Hz`);
            console.log(`     • Canales: ${audio.channelData.length}`);
            console.log(`     • Duración: ${(audio.channelData[0].length / audio.sampleRate).toFixed(2)} seg`);
            console.log(`     • Muestras: ${audio.channelData[0].length}`);
            
            // ANÁLISIS OPTIMIZADO (sin desbordar la pila)
            const samples = audio.channelData[0];
            
            // Calcular máximo de forma optimizada
            let maxSample = 0;
            for (let i = 0; i < samples.length; i += 100) { // Muestrear cada 100 muestras
                const absValue = Math.abs(samples[i]);
                if (absValue > maxSample) maxSample = absValue;
            }
            
            // Calcular promedio de forma optimizada
            let sum = 0;
            for (let i = 0; i < samples.length; i += 100) {
                sum += Math.abs(samples[i]);
            }
            const avgSample = sum / (samples.length / 100);
            
            console.log(`     • Amplitud máxima (sampleada): ${maxSample.toFixed(4)}`);
            console.log(`     • Amplitud promedio (sampleada): ${avgSample.toFixed(4)}`);
            
            // Verificar calidad del audio
            if (maxSample < 0.001) {
                console.log(`     PROBLEMA GRAVE: Audio casi silencioso (max: ${maxSample.toFixed(6)})`);
            } else if (maxSample < 0.01) {
                console.log(`       POSIBLE PROBLEMA: Audio muy silencioso (max: ${maxSample.toFixed(6)})`);
            } else {
                console.log(`      Audio con amplitud normal`);
            }

            // Verificar si el sample rate es razonable para voz
            if (audio.sampleRate > 48000) {
                console.log(`Sample rate muy alto para voz: ${audio.sampleRate}Hz`);
            }

        } catch (error) {
            console.log(` Error inspeccionando ${filename}: ${error.message}`);
        }
    }
}

module.exports = AudioInspector;