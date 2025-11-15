// Este controlador se encarga de manejar todas las alertas del sistema.
// Aquí defini funciones para crear alertas, obtener las de un paciente, y marcarlas como leídas.

const Alerta = require('../models/Alerta');

// Función para crear una nueva alerta en la base de datos
const crearAlerta = async (req, res) => {
  try {
    // Recibo los datos desde el frontend o desde una lógica automática
    const { pacienteId, tipo, mensaje } = req.body;

    // Creo una nueva instancia de alerta con esos datos
    const nuevaAlerta = new Alerta({
      paciente: pacienteId,
      tipo,
      mensaje
    });

    // Guardo la alerta en la base de datos
    await nuevaAlerta.save();

    // Envi
    // o la respuesta al frontend con la alerta creada
    res.status(201).json({
      mensaje: 'Alerta creada exitosamente',
      alerta: nuevaAlerta
    });

  } catch (error) {
    // Manejo de errores si algo falla
    res.status(500).json({
      error: 'Error creando la alerta: ' + error.message
    });
  }
};

// Función para obtener todas las alertas de un paciente específico
const obtenerAlertas = async (req, res) => {
  try {
    const { pacienteId } = req.params;

    // Busco todas las alertas del paciente ordenadas por fecha descendente
    const alertas = await Alerta.find({ paciente: pacienteId }).sort({ fecha: -1 });

    // Envío la lista de alertas al frontend
    res.json({ alertas });

  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo alertas: ' + error.message
    });
  }
};

// Función para marcar una alerta como leída
const marcarLeida = async (req, res) => {
  try {
    const { alertaId } = req.params;

    // Actualizo la propiedad "leido" a true
    const alerta = await Alerta.findByIdAndUpdate(
      alertaId,
      { leido: true },
      { new: true } // Para que me devuelva el documento actualizado
    );

    if (!alerta) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    res.json({
      mensaje: 'Alerta marcada como leída',
      alerta
    });

  } catch (error) {
    res.status(500).json({
      error: 'Error actualizando alerta: ' + error.message
    });
  }
};

// Exporto las funciones para usarlas en las rutas
module.exports = {
  crearAlerta,
  obtenerAlertas,
  marcarLeida
};
