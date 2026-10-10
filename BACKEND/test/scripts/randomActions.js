import fs from "fs"

const users = JSON.parse(fs.readFileSync("./data/users.json"))
const videos = JSON.parse(fs.readFileSync("./data/videos.json"))

const likes = {}

users.forEach((user) => {
  const likedVideos = []

  const likeCount = Math.floor(Math.random() * 20)

  for (let i = 0; i < likeCount; i++) {
    const video = videos[Math.floor(Math.random() * videos.length)]
    likedVideos.push(video.id)
  }

  likes[user.id] = [...new Set(likedVideos)]
})

fs.writeFileSync(
  "./data/likes.json",
  JSON.stringify(likes, null, 2)
)

console.log("✅ Random likes added")
