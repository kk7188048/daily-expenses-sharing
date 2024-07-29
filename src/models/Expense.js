const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
  paidBy: { type: String, required: true },
  paidByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  splitType: { type: String, enum: ['equal', 'exact', 'percentage'], required: true },
  splitDetails: [{
    user: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: function() { return this.splitType === 'exact'; } },
    percentage: { type: Number, required: function() { return this.splitType === 'percentage'; } }
  }],
});

expenseSchema.pre('save', function (next) {
  if (this.splitType === 'percentage') {
    const totalPercentage = this.splitDetails.reduce((acc, curr) => acc + curr.percentage, 0);
    if (totalPercentage !== 100) {
      return next(new Error('Percentages must add up to 100%'));
    }
  }
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);
