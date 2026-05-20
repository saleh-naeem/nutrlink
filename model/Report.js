const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'reporterModel'
  },

  reporterModel: {
    type: String,
    required: true,
    enum: ['Customer', 'Nutritionist']
  },

  reportedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'reportedUserModel'
  },

  reportedUserModel: {
    type: String,
    required: true,
    enum: ['Customer', 'Nutritionist']
  },

  reason: {
    type: String,
    required: true
  },

  description: String,

  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  }

}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);