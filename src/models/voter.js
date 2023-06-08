const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  isCandidate: {
    type: Boolean, // Alternatively, you can use Buffer for binary data
    default: false
  },
 
  metamaskAccount: {
    type: String,
    required: true,
    unique: true
  },
  facialBiometricData: {
    type: [Number], // Alternatively, you can use Buffer for binary data
    required: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
});

const Voter = mongoose.model('Voter', voterSchema);

module.exports = Voter;
