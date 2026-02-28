// migrarMediciones.js
require("dotenv").config();
const mongoose = require("mongoose");

function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function normalizeDiag(doc) {
  // En tus docs vi "diagnóstico" con tilde, y otros usan "diagnostico"
  return pick(doc, ["diagnóstico", "diagnostico", "resultado", "tipo"]);
}

function normalizeDate(doc) {
  // En tus docs vi "creadoEn" (y a veces "createdAt")
  return (
    pick(doc, ["createdAt", "creadoEn", "timestamp", "fecha"]) ||
    new Date()
  );
}

function normalizeUpdated(doc) {
  return pick(doc, ["updatedAt", "actualizadoEn", "timestamp", "fecha"]) || new Date();
}

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function migrar() {
  try {
    //  Ajusta aquí si tu .env usa otro nombre.
    // Por lo que ya vimos contigo, lo más común es MONGODB_URI.
    const uri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      process.env.DB_URI ||
      process.env.MONGODB;

    if (!uri) {
      throw new Error(
        "No encuentro la URI en .env. Usa MONGODB_URI (recomendado) o ajusta el script."
      );
    }

    await mongoose.connect(uri);
    console.log(" Conectado a MongoDB");

    const db = mongoose.connection.db;

    // 1) Listar colecciones reales (para evitar errores por nombres)
    const collections = await db.listCollections().toArray();
    console.log("\n Colecciones encontradas:");
    collections.forEach((c) => console.log(" -", c.name));

    // 2) Detectar automáticamente las colecciones origen
    // Buscamos algo que contenga "tempor" y "medicion", y algo que contenga "hist" y "medicion"
    const findByRegex = (regexList) => {
      const name = collections
        .map((c) => c.name)
        .find((n) => regexList.every((rgx) => rgx.test(n)));
      return name;
    };

    const temporalesName =
      findByRegex([/medicion/i, /tempor/i]) ||
      findByRegex([/medicion/i, /tiempo/i]) ||
      "Medicionestemporales"; // fallback

    const historicasName =
      findByRegex([/medicion/i, /hist/i]) ||
      "Mediciones históricas"; // fallback

    console.log("\n Orígenes detectados:");
    console.log(" - Temporales:", temporalesName);
    console.log(" - Históricas:", historicasName);

    // 3) Leer docs
    const temporales = await db.collection(temporalesName).find({}).toArray().catch(() => []);
    const historicas = await db.collection(historicasName).find({}).toArray().catch(() => []);

    console.log("\n Totales encontrados:");
    console.log(" - Temporales:", temporales.length);
    console.log(" - Históricas:", historicas.length);

    // 4) Insertar en colección final
    const destino = db.collection("mediciones");

    let insertados = 0;
    let saltadosSinPaciente = 0;

    const migrarDoc = async (doc, source) => {
      const paciente = pick(doc, ["paciente", "pacienteId"]);
      if (!paciente) {
        saltadosSinPaciente++;
        return;
      }

      const ruido = toNumber(pick(doc, ["ruido"]), 0);

      // Si no existe frecuencia_respiratoria en tus datos viejos,
      // la dejamos estimada para que tu app tenga un valor (temporal).
      //  Luego cuando conectes el dispositivo, ya vendrá la frecuencia real.
      const frReal = pick(doc, ["frecuencia_respiratoria", "frecuencia"]);
      const frecuencia_respiratoria =
        frReal !== undefined ? toNumber(frReal, 0) : Math.abs(ruido); // estimación temporal

      const diag = normalizeDiag(doc);
      const alerta = !!pick(doc, ["alerta"]);

      // Acelerómetro: en temporales vi movX/movY/movZ
      const ax = toNumber(pick(doc, ["movX", "acelerometro?.x", "x"]), 0);
      const ay = toNumber(pick(doc, ["movY", "acelerometro?.y", "y"]), 0);
      const az = toNumber(pick(doc, ["movZ", "acelerometro?.z", "z"]), 0);

      // Features: en históricas vi RMS/zcr/centroide/espectral (y a veces en temporales no)
      const rms = pick(doc, ["RMS", "rms"]);
      const zcr = pick(doc, ["zcr"]);
      const centroide = pick(doc, ["centroide"]);
      const espectral = pick(doc, ["espectral"]);

      const createdAt = normalizeDate(doc);
      const updatedAt = normalizeUpdated(doc);

      // Para evitar duplicados en futuras corridas:
      // guardamos source + legacyId, y hacemos upsert.
      const legacyId = doc._id;

      await destino.updateOne(
        { source, legacyId },
        {
          $setOnInsert: {
            paciente,
            frecuencia_respiratoria,
            ruido,
            sibilancias: toNumber(pick(doc, ["sibilancias"]), 0),
            roncus: toNumber(pick(doc, ["roncus"]), 0),
            resultado: {
              tipo: (typeof diag === "string" && diag.trim()) ? diag.trim() : "por determinar",
              confianza: toNumber(pick(doc, ["confianza", "resultado?.confianza"]), 0),
            },
            features: {
              rms: rms !== undefined ? toNumber(rms, 0) : null,
              zcr: zcr !== undefined ? toNumber(zcr, 0) : null,
              centroide: centroide !== undefined ? toNumber(centroide, 0) : null,
              espectral: espectral !== undefined ? toNumber(espectral, 0) : null,
            },
            acelerometro: { x: ax, y: ay, z: az },
            createdAt,
            updatedAt,
            source,
            legacyId,
          },
        },
        { upsert: true }
      );

      insertados++;
    };

    console.log("\n Migrando temporales...");
    for (const doc of temporales) await migrarDoc(doc, "temporales");

    console.log(" Migrando históricas...");
    for (const doc of historicas) await migrarDoc(doc, "historicas");

    console.log("\n Migración completada");
    console.log(" Insertados:", insertados);
    console.log(" Saltados (sin paciente):", saltadosSinPaciente);

    console.log("\n Verifica en MongoDB Atlas: colección 'mediciones' ya debe tener datos.");
    process.exit(0);
  } catch (err) {
    console.error("\n Error en migración:", err.message);
    process.exit(1);
  }
}

migrar();