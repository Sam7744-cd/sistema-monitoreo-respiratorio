// Script para convertir archivos .wav a formato estándar (mono, 44.1kHz, 16-bit PCM)
// Este proceso lo uso para normalizar los audios antes de analizarlos

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

// Ruta de la carpeta donde están los audios originales (.wav)
const carpetaEntrada = './dataset/originales';

// Ruta de salida donde se guardarán los audios convertidos
const carpetaSalida = './dataset/convertidos';

// Verifico si la carpeta de salida existe, y si no, la creo
if (!fs.existsSync(carpetaSalida)) {
  fs.mkdirSync(carpetaSalida, { recursive: true });
}

// Leo todos los archivos de la carpeta de entrada
fs.readdir(carpetaEntrada, (err, archivos) => {
  if (err) return console.error('Error leyendo carpeta:', err);

  archivos
    // Filtro solo los archivos con extensión .wav
    .filter(nombre => path.extname(nombre).toLowerCase() === '.wav')
    .forEach(nombre => {
      const rutaEntrada = path.join(carpetaEntrada, nombre);
      const rutaSalida = path.join(carpetaSalida, nombre);

      // Convierto cada archivo con ffmpeg a mono, 44.1kHz, 16-bit PCM
      ffmpeg(rutaEntrada)
        .outputOptions([
          '-ac 1',           // Canal mono (1 canal)
          '-ar 44100',       // Frecuencia de muestreo de 44.1kHz
          '-sample_fmt s16'  // Formato de muestra: 16 bits
        ])
        .on('end', () => {
          console.log(`Convertido: ${nombre}`);
        })
        .on('error', err => {
          console.error(`Error con ${nombre}:`, err.message);
        })
        .save(rutaSalida);
    });
});
