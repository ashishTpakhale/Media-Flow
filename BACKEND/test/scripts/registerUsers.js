const axios = require("axios")
const fs = require("fs")
const { BASE_URL, TOTAL_USERS } = require("../config")

const users = []

for (let i = 1; i <= TOTAL_USERS; i++) {
  users.push({
    username: `user${i}`,
    email: `user${i}@test.com`,
    password: "password123",
  })
}

const register = async (user) => {
  try {
    await axios.post(`${BASE_URL}/api/register`, user)
    console.log(`✅ Registered ${user.email}`)
  } catch (err) {
    console.log(`⚠️ Already exists ${user.email}`)
  }
}

const run = async () => {
  for (const user of users) {
    await register(user)
  }

  fs.writeFileSync(
    "./data/users.json",
    JSON.stringify(users, null, 2)
  )

  console.log("🎉 User registration done")
}

run()
