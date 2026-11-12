const express = require("express");
const router = express.Router();
const reportController = require("../controller/reportController");
const requireUser = require('../middleware/requireUser');
const privateApi = require('../controller/privateApiProxy');
router.use(requireUser);
router.post('/save', privateApi.saveReport);

router.post("/report", privateApi.saveReport);

router.get("/getreport", reportController.getReport);

router.get('/:rep_id/articles', reportController.getReportArticles);

router.delete('/:rep_id/delete', reportController.deleteReport);

module.exports = router;
