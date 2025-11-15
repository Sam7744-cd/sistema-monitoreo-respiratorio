// Importación de la librería Mongoose para manejar la conexión a MongoDB
const mongoose = require('mongoose');

// Función asíncrona que establece la conexión con MongoDB usando la URI del archivo .env
const connectDB = async () => {
  try {
    // Obtener la URI desde las variables de entorno
    const uri = process.env.MONGODB_URI;

    // Validación básica por si no se configuró correctamente
    if (!uri || typeof uri !== 'string' || uri.trim() === '') {
      throw new Error('La variable de entorno MONGODB_URI no está definida o está vacía.');
    }

    // Conexión a MongoDB con la URI proporcionada
    const conn = await mongoose.connect(uri);

    // Mensaje en consola si la conexión fue exitosa
    console.log(`MongoDB conectado correctamente: ${conn.connection.host}`);
  } catch (error) {
    // Mostrar el error en consola si falla la conexión
    console.error('Error al conectar a MongoDB:', error);

    // Finalizar el proceso si no se pudo conectar
    process.exit(1);
  }
};

// Exportar la función para que pueda ser utilizada en el servidor
module.exports = connectDB;
