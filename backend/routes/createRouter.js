const express = require("express");
const router = express.Router();
const createController = require("../controller/createController");

router.post("/createreport", createController.register);

router.get("/getreport", createController.getReport);

module.exports = router;
