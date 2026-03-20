// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { authMiddleware, signToken } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email e senha obrigatórios" });

  const user = await db.getUserByEmail(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: "Credenciais inválidas" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Credenciais inválidas" });

  const token = signToken({ id: user.id, email: user.email, role: user.role, clientId: user.client_id });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, clientId: user.client_id },
  });
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  const user = await db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  res.json(user);
});

// POST /api/auth/change-password
router.post("/change-password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Campos obrigatórios" });
  if (newPassword.length < 6) return res.status(400).json({ error: "Senha mínima de 6 caracteres" });

  const user = await db.getUserByEmail(req.user.email);
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(401).json({ error: "Senha atual incorreta" });

  const hashed = await bcrypt.hash(newPassword, 10);
  await db.updateUserPassword(req.user.id, hashed);
  res.json({ ok: true });
});

module.exports = router;
