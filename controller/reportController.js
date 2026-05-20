const Report = require('../model/Report');

// إنشاء بلاغ
exports.createReport = async (req, res) => {
  try {

    const {
      reporterId,
      reporterModel,
      reportedUserId,
      reportedUserModel,
      reason,
      description
    } = req.body;

    console.log(req.body);

    if (!reporterId || !reportedUserId || !reason || !reporterModel || !reportedUserModel) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const report = await Report.create({
      reporterId,
      reporterModel,
      reportedUserId,
      reportedUserModel,
      reason,
      description
    });

    res.status(201).json({
      message: "Report created successfully",
      data: report
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporterId')
      .populate('reportedUserId');

    res.status(200).json(reports);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};