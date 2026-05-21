const Report = require('../model/Report');
const Customer= require("../model/Customer")
const Nutritionist= require("../model/Nutritionist")

// ── Create a report ────────────────────────────────────────
exports.createReport = async (req, res) => {
  try {
    const { reporterId, reporterModel, reportedUserId, reportedUserModel, reason, description } = req.body;

    if (!reporterId || !reportedUserId || !reason || !reporterModel || !reportedUserModel) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const report = await Report.create({
      reporterId, reporterModel,
      reportedUserId, reportedUserModel,
      reason, description,
    });

    res.status(201).json({ message: 'Report created successfully', data: report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get all reports (admin only) ───────────────────────────
exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    const populated = await Promise.all(reports.map(async (r) => {
      const obj = r.toObject();
      obj.reporterData    = await Customer.findOne({ user: r.reporterId }) || null;
      obj.reportedData    = await Nutritionist.findOne({ user: r.reportedUserId }) || null;
      return obj;
    }));

    res.status(200).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Update report status (admin only) ─────────────────────
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['pending', 'reviewed', 'resolved'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
    }

    const report = await Report.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!report) return res.status(404).json({ message: 'Report not found' });

    res.status(200).json({ message: 'Report updated successfully', data: report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Delete a report (admin only) ───────────────────────────
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findByIdAndDelete(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};