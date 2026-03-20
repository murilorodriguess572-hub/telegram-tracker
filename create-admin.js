// create-admin.js
// Uso: node create-admin.js <nome> <email> <senha>
// Exemplo: node create-admin.js "Admin" "admin@experttracking.com" "senha123"
require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./db");

(async () => {
  const [,, name, email, password] = process.argv;
  if (!name || !email || !password) {
    console.error("Uso: node create-admin.js <nome> <email> <senha>");
    process.exit(1);
  }

  await db.initDB();
  const hash = await bcrypt.hash(password, 10);
  const user = await db.createUser(name, email.toLowerCase(), hash, "superadmin", null);
  console.log("✅ Super Admin criado:", user);
  process.exit(0);
})();
