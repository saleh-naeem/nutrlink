const express = require('express');
const router = express.Router();
const authToken=require('../middleware/verifyToken');
const checkAdmin=require('../middleware/isadmin');
const reportController = require('../controller/reportController');

router.post('/',authToken, reportController.createReport);
router.get('/', authToken,checkAdmin, reportController.getReports);

module.exports = router;
