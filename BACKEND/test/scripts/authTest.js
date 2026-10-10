import fs from "fs"
import jwt from "jsonwebtoken"

const users = JSON.parse(fs.readFileSync("./data/users.json"))
const tokens = {}

const SECRET = "TEST_SECRET_KEY"

users.forEach((user) => {
  const token = jwt.sign(
    { id: user.id, email: user.email },
    SECRET,
    { expiresIn: "1h" }
  )

  tokens[user.id] = token
})

fs.writeFileSync(
  "./temp/tokens.json",
  JSON.stringify(tokens, null, 2)
)

console.log("✅ JWT generated for all users")
