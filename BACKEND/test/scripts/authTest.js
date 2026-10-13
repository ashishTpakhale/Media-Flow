const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const DATA_DIR = path.join(__dirname, "../data");
const TEMP_DIR = path.join(__dirname, "../temp");
const USERS_FILE = path.join(DATA_DIR, "users.json");

if (!fs.existsSync(USERS_FILE)) {
  console.error(`❌ users.json not found at: ${USERS_FILE}`);
  console.log("👉 Please run generateUsers.js or registerUsers.js first.");
  process.exit(1);
}

const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
const tokens = {};

const SECRET = process.env.JWT_SECRET || "TEST_SECRET_KEY";

users.forEach((user) => {
  const token = jwt.sign(
    { id: user.id, email: user.email },
    SECRET,
    { expiresIn: "7d" }
  );

  tokens[user.id] = token;
});

// Ensure output directories exist
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Write tokens for test consumers
fs.writeFileSync(path.join(TEMP_DIR, "tokens.json"), JSON.stringify(tokens, null, 2));
fs.writeFileSync(path.join(DATA_DIR, "tokens.json"), JSON.stringify(tokens, null, 2));

console.log(`✅ JWT generated for ${users.length} users successfully using secret: ${SECRET.slice(0, 5)}...`);
console.log(`📁 Saved to: ${path.join(DATA_DIR, "tokens.json")}`);
