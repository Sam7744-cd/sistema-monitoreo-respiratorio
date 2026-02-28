require("dotenv").config();
const mongoose = require("mongoose");

// Ajusta si tu variable tiene otro nombre
const URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.DB_URI ||
  process.env.MONGODB;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}
function randi(min, max) {
  return Math.floor(rand(min, max + 1));
}

async function main() {
  if (!URI) throw new Error("No se encontró MONGODB_URI (o similar) en .env");

  await mongoose.connect(URI);
  console.log(" Conectado a MongoDB");

  const db = mongoose.connection.db;

  // Colecciones (nombres como están en tu Atlas)
  const pacientesCol = db.collection("pacientes");
  const medicionesCol = db.collection("Mediciones"); // OJO: en tu Atlas se llama "Mediciones" con M

  // 1) Leer pacientes actuales
  const pacientes = await pacientesCol.find({}).toArray();
  console.log(" Pacientes encontrados:", pacientes.length);

  if (pacientes.length === 0) {
    console.log(" No hay pacientes. Crea pacientes primero.");
    process.exit(0);
  }

  // 2) Back-up de mediciones actuales (por si acaso)
  const backupName = "Mediciones_backup_" + new Date().toISOString().slice(0, 10);
  const backupCol = db.collection(backupName);
  const actuales = await medicionesCol.find({}).toArray();

  if (actuales.length > 0) {
    await backupCol.insertMany(actuales);
    console.log(" Backup creado:", backupName, "(", actuales.length, "docs )");
  } else {
    console.log(" No había mediciones para respaldar.");
  }

  // 3) Limpiar Mediciones (para que no haya choque con IDs viejos)
  await medicionesCol.deleteMany({});
  console.log(" Colección Mediciones vaciada.");

  // 4) Crear mediciones simuladas por paciente (últimos 10 días, 6 mediciones/día)
  const dias = 10;
  const porDia = 6;

  const docs = [];

  for (const p of pacientes) {
    for (let d = dias; d >= 0; d--) {
      for (let i = 0; i < porDia; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - d);
        fecha.setHours(randi(8, 21), randi(0, 59), randi(0, 59), 0);

        // Simulación ligera (no ML real, solo números plausibles)
        // FR normal pediátrica puede variar, aquí solo dejamos rangos presentables
        const fr = randi(18, 34);
        const ruido = -randi(55, 85); // dB negativos tipo tu prototipo
        const sibil = Math.random() < 0.25 ? 1 : 0;
        const roncus = Math.random() < 0.18 ? 1 : 0;

        // Diagnóstico simulado (solo para UI)
        let tipo = "Normal";
        if (sibil && fr > 26) tipo = "Asma";
        else if (roncus && fr > 24) tipo = "Bronquitis";

        docs.push({
          paciente: p._id, // aquí está la CLAVE: enlaza a pacientes reales
          frecuencia_respiratoria: fr,
          ruido,
          sibilancias: sibil,
          roncus,
          resultado: {
            tipo,
            confianza: randi(60, 95),
          },
          features: {
            rms: rand(0.001, 0.2),
            zcr: randi(50, 180),
            centroide: rand(200, 900),
            espectral: rand(0, 1),
          },
          acelerometro: {
            x: rand(-0.2, 0.2),
            y: rand(-0.2, 0.2),
            z: rand(0.8, 1.2),
          },
          createdAt: fecha,
          updatedAt: fecha,
          source: "seed",
        });
      }
    }
  }

  await medicionesCol.insertMany(docs);
  console.log(" Medidas simuladas insertadas:", docs.length);

  console.log(" Listo: ahora Reportes debe llenarse con tus pacientes actuales.");
  process.exit(0);
}

main().catch((e) => {
  console.error(" Error:", e.message);
  process.exit(1);
});