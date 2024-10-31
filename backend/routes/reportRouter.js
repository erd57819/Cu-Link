const express = require("express");
const router = express.Router();
const reportController = require("../controller/reportController");

router.post("/report", reportController.register);

router.get("/getreport", reportController.getReport);

module.exports = router;
