const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth");
const { listarFamiliares } = require("../controllers/familiarController");

router.use(authMiddleware);

// GET /api/familiares
router.get("/", listarFamiliares);

module.exports = router;