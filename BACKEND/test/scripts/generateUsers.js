import fs from "fs"
import bcrypt from "bcryptjs"

const users = []

for (let i = 1; i <= 150; i++) {
  users.push({
    id: `user_${i}`,
    username: `user${i}`,
    email: `user${i}@test.com`,
    password: bcrypt.hashSync("password123", 10),
    createdAt: new Date().toISOString(),
  })
}

fs.writeFileSync(
  "./data/users.json",
  JSON.stringify(users, null, 2)
)

console.log("✅ 150 users generated")
