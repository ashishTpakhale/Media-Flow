const axios = require("axios")
const fs = require("fs")
const { BASE_URL } = require("../config")

const users = JSON.parse(fs.readFileSync("./data/users.json"))
const tokens = {}

const run = async () => {
  for (const user of users) {
    try {
      const res = await axios.post(`${BASE_URL}/api/login`, {
        email: user.email,
        password: user.password,
      })

      tokens[user.email] = res.data.token
      console.log(`🔐 Logged in ${user.email}`)
    } catch (err) {
      console.log(`❌ Login failed ${user.email}`)
    }
  }

  fs.writeFileSync(
    "./data/tokens.json",
    JSON.stringify(tokens, null, 2)
  )

  console.log("🎉 All tokens stored")
}

run()
