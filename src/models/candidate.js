const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  party: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
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
  isCandidate: {
    type: Boolean, // Alternatively, you can use Buffer for binary data
    default: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
});

const Candidate = mongoose.model('Candidate', candidateSchema);

module.exports = Candidate;
