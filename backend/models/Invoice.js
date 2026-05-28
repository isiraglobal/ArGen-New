const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  poNumber: {
    type: String,
    default: '12-34-56-7890'
  },
  date: {
    type: Date,
    default: Date.now
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  // Agency / Service Provider Details (My details)
  providerName: {
    type: String,
    default: 'ArGen AI Workflow Intelligence'
  },
  providerPhone: {
    type: String,
    default: '+1 (555) 019-2834'
  },
  providerAddress: {
    type: String,
    default: '100 Pine St, Suite 2400, San Francisco, CA'
  },
  providerEmail: {
    type: String,
    default: 'billing@argen.isira.club'
  },
  // Client Bill To Details
  clientName: {
    type: String,
    required: true
  },
  clientAddress: {
    type: String,
    default: 'Corporate Headquarters'
  },
  clientContact: {
    type: String,
    required: true
  },
  // Project Details
  productName: {
    type: String,
    default: 'ArGen Enterprise SaaS Platform License'
  },
  productDescription: {
    type: String,
    default: 'Autonomous AI productivity auditing platform and workflow playbooks'
  },
  usageTerms: {
    type: String,
    default: 'Unlimited usage for verified domain members'
  },
  periodOfUse: {
    type: String,
    default: 'Unlimited / Annual Subscription'
  },
  // Items table
  items: [
    {
      description: { type: String, required: true },
      amount: { type: Number, required: true }
    }
  ],
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  totalDue: {
    type: Number,
    required: true,
    default: 0
  },
  // Payment Options
  paymentMethods: {
    bankTransfer: {
      bankName: { type: String, default: 'Silicon Valley Bank' },
      accountNumber: { type: String, default: '•••• •••• 9821' },
      routingNumber: { type: String, default: '021000021' },
      ein: { type: String, default: '12-3456789' }
    },
    zelle: {
      phoneNumber: { type: String, default: '+1 (555) 019-2834' }
    }
  },
  paymentTerms: {
    type: String,
    default: 'Payment is due upon receipt of this invoice unless otherwise agreed in writing. A late fee of 5% may be applied to balances unpaid after 30 days. Final deliverables, including edited footage and project files, may be withheld until payment has been received in full. Thank you for your prompt payment and continued business.'
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Paid', 'Overdue'],
    default: 'Draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
