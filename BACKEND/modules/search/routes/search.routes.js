    const express = require("express");
    const searchController = require("../controller/search.controller");

    const router = express.Router();

    router.get("/", searchController.search);

    module.exports = router;
