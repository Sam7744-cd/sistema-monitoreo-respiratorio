require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/database.js");

connectDB();

const app = express();

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "PATCH"] }));

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(express.json({ limit: "10mb" }));

const authRoutes = require("./routes/authRoutes");
const pacienteRoutes = require("./routes/pacienteRoutes");
const medicionRoutes = require("./routes/medicionRoutes");
const dispositivoRoutes = require("./routes/dispositivoRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const mlRoutes = require("./routes/mlRoutes");
const familiarRoutes = require("./routes/familiarRoutes");
const iotRoutes = require("./routes/iotRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/pacientes", pacienteRoutes);
app.use("/api/mediciones", medicionRoutes);
app.use("/api/dispositivos", dispositivoRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/familiares", familiarRoutes);
app.use("/api/iot", iotRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "Servidor funcionando",
    database: "Conectado a MongoDB Atlas",
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

const PORT = process.env.PORT || 3680;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor escuchando externamente en el puerto ${PORT}`);
});