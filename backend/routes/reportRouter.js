const express = require("express");
const router = express.Router();
const reportController = require("../controller/reportController");

router.post("/report", reportController.register);

router.get("/getreport", reportController.getReport);

router.get('/:rep_id/articles', reportController.getReportArticles);

router.delete('/:rep_id/delete', reportController.deleteReport);

module.exports = router;
