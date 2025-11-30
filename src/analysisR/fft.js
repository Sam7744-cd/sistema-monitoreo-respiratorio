// fft.js - Implementación de FFT (Transformada Rápida de Fourier)

// Este archivo implementa una FFT radix-2 clásica SIN usar librerías.
// La FFT transforma una señal temporal en el dominio frecuencial,
// permitiéndonos analizar qué frecuencias están presentes en la respiración.

function fft_real(signal) {
  const N = signal.length;

  // Caso base
  if (N <= 1) return signal;


  // 1. La FFT radix-2 necesita tamaño potencia de 2
 
  if ((N & (N - 1)) !== 0) {
    throw new Error("FFT requiere tamaño potencia de 2");
  }

  // 2. Crear arrays para parte real e imaginaria

  let real = signal.slice();
  let imag = new Array(N).fill(0);


  // 3. Reordenamiento bit-reversal
  // Permite que la FFT procese los datos en el orden correcto

  let j = 0;
  for (let i = 1; i < N; i++) {
    let bit = N >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j |= bit;

    if (i < j) {
      // Intercambio de posiciones
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }

  // -----------------------------------------
  // 4. Etapas principales de la FFT
  // -----------------------------------------
  for (let len = 2; len <= N; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wlenReal = Math.cos(ang);
    const wlenImag = Math.sin(ang);

    for (let i = 0; i < N; i += len) {
      let wReal = 1;
      let wImag = 0;

      // Mariposas FFT
      for (let j = 0; j < len / 2; j++) {
        // Valores actuales (u) y valores complementarios (v)
        const uReal = real[i + j];
        const uImag = imag[i + j];

        const vReal = real[i + j + len / 2] * wReal - imag[i + j + len / 2] * wImag;
        const vImag = real[i + j + len / 2] * wImag + imag[i + j + len / 2] * wReal;

        // Nueva posición
        real[i + j] = uReal + vReal;
        imag[i + j] = uImag + vImag;

        real[i + j + len / 2] = uReal - vReal;
        imag[i + j + len / 2] = uImag - vImag;

        // Actualizar coeficientes Wn
        const nextWReal = wReal * wlenReal - wImag * wlenImag;
        const nextWImag = wReal * wlenImag + wImag * wlenReal;

        wReal = nextWReal;
        wImag = nextWImag;
      }
    }
  }

  // Devolver señal transformada
  return { real, imag };
}

module.exports = { fft_real };
