// Re-export canonical recordView controller to avoid competing implementations
const { recordView } = require("./recordView.controller");

module.exports = { recordView };