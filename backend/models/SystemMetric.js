const mongoose = require('mongoose');

const SystemMetricSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['agent_run', 'api_call', 'credit_transaction']
  },
  agentName: { type: String }, // 'Research Agent', 'Calibration Agent', etc.
  status: { 
    type: String, 
    enum: ['success', 'failed', 'running'],
    default: 'success'
  },
  details: { type: String }, // Any extra info or error message
  tokensUsed: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  qualityScore: { type: Number }, // 0-100 for API quality tracking
  metadata: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemMetric', SystemMetricSchema);
