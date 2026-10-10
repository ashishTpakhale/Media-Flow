// routes/analytics.routes.js
const router = require("express").Router()
const { authMiddleware } = require("../../../middleware/authMiddleware")
const { getSingleVideoAnalytics } = require("../controller/videoAnalytics.controller")

router.get("/video/:videoId", authMiddleware, getSingleVideoAnalytics)

module.exports = router
