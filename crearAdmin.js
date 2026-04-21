require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Usuario = require("./src/models/Usuario");

const URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.DB_URI ||
  process.env.MONGODB;

async function main() {
  try {
    if (!URI) throw new Error("No se encontró la URI de MongoDB en .env");

    await mongoose.connect(URI);
    console.log("Conectado a MongoDB");

    const email = "admin@pulmi.com";
    const passwordPlano = "Admin12345";

    const existe = await Usuario.findOne({ email });
    if (existe) {
      console.log("Ya existe un admin con ese correo:", email);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(passwordPlano, 10);

    const admin = new Usuario({
      nombre: "Administrador Principal",
      email,
      password: hashedPassword,
      rol: "admin",
      telefono: "0967913398",
      cedula: "0982771234",
    });

    await admin.save();

    console.log("Admin creado correctamente");
    console.log("Correo:", email);
    console.log("Contraseña:", passwordPlano);

    process.exit(0);
  } catch (error) {
    console.error("Error creando admin:", error.message);
    process.exit(1);
  }
}

main();