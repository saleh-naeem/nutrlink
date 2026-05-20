const express = require('express');
const router = express.Router();
const authToken = require('../middleware/verifyToken');
const checkAdmin = require('../middleware/isadmin');
const reportController = require('../controller/reportController');

router.post('/',   authToken,             reportController.createReport);
router.get('/',    authToken, checkAdmin, reportController.getReports);
router.put('/:id', authToken, checkAdmin, reportController.updateReportStatus);
router.delete('/:id', authToken, checkAdmin, reportController.deleteReport);

module.exports = router;