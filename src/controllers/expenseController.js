const Expense = require('../models/Expense');
const User = require('../models/User');
const mongoose = require('mongoose');

const calculateSplit = (amount, splitType, splitDetails) => {
  let calculatedDetails = [];

  switch (splitType) {
    case 'equal':
      const equalAmount = amount / splitDetails.length;
      calculatedDetails = splitDetails.map(detail => ({
        user: detail.user,
        userId: detail.userId,
        amount: equalAmount,
      }));
      break;

    case 'exact':
      calculatedDetails = splitDetails.map(detail => ({
        user: detail.user,
        userId: detail.userId,
        amount: detail.amount,
      }));
      break;

    case 'percentage':
      calculatedDetails = splitDetails.map(detail => ({
        user: detail.user,
        userId: detail.userId,
        amount: (detail.percentage / 100) * amount,
        percentage: detail.percentage
      }));
      break;

    default:
      throw new Error('Invalid split type');
  }

  return calculatedDetails;
};

const findOrCreateUser = async (userName) => {
  let user = await User.findOne({ name: userName });

  if (!user) {
    user = new User({ name: userName, email: `${userName.replace(' ', '').toLowerCase()}@example.com`, mobile: '1234567890', password: 'defaultpassword' });
    await user.save();
  }

  return user;
};

exports.addExpense = async (req, res) => {
  try {
    const { amount, description, paidBy, paidByUserId, splitType, splitDetails } = req.body;

    // Validate splitDetails based on splitType
    if (splitType === 'percentage') {
      const totalPercentage = splitDetails.reduce((acc, curr) => acc + curr.percentage, 0);
      if (totalPercentage !== 100) {
        return res.status(400).json({ error: 'Percentages must add up to 100%' });
      }
    }

    // Find or create users for splitDetails and update userId
    const updatedSplitDetails = await Promise.all(splitDetails.map(async (detail) => {
      const user = await findOrCreateUser(detail.user);
      return { ...detail, userId: user._id };
    }));

    const calculatedSplitDetails = calculateSplit(amount, splitType, updatedSplitDetails);

    const newExpense = new Expense({ amount, description, paidBy, paidByUserId, splitType, splitDetails: calculatedSplitDetails });
    await newExpense.save();

    res.status(201).json(newExpense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getUserExpenses = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Validate the userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Find the expense document where the userId is in splitDetails
    const expense = await Expense.findOne({
      'splitDetails.userId': userId,
    });

    // If no expense is found, return a 404 error
    if (!expense) {
      return res.status(404).json({ error: 'No expenses found for this user' });
    }

    // Find the specific split detail for the user
    const userSplitDetail = expense.splitDetails.find(detail =>
      detail.userId.equals(userId)
    );

    // If userSplitDetail is found, return the amount
    if (userSplitDetail) {
      return res.json({ amount: userSplitDetail.amount });
    }

    // If no matching split detail is found, return an error
    return res.status(404).json({ error: 'No amount found for this user' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().populate('paidByUserId splitDetails.userId');
    res.json(expenses);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


const createCsvWriter = require('csv-writer').createObjectCsvWriter;

exports.downloadBalanceSheet = async (req, res) => {
  try {
    // Fetch expenses from the database
    const expenses = await Expense.find().populate('paidByUserId splitDetails.userId');

    // Transform the expenses data into a flat structure for CSV
    const csvData = expenses.map(expense => {
      return {
        expenseId: expense._id,
        amount: expense.amount,
        description: expense.description,
        paidBy: expense.paidBy,
        paidByUserId: expense.paidByUserId._id,
        paidByEmail: expense.paidByUserId.email,
        splitType: expense.splitType,
        date: expense.date,
        splitDetails: expense.splitDetails.map(detail => ({
          user: detail.user,
          userId: detail.userId._id,
          userEmail: detail.userId.email,
          amount: detail.amount,
          percentage: detail.percentage,
        }))
      };
    });

    // Flatten the splitDetails for CSV
    const flattenedCsvData = [];
    csvData.forEach(expense => {
      expense.splitDetails.forEach(detail => {
        flattenedCsvData.push({
          expenseId: expense.expenseId,
          amount: expense.amount,
          description: expense.description,
          paidBy: expense.paidBy,
          paidByUserId: expense.paidByUserId,
          paidByEmail: expense.paidByEmail,
          splitType: expense.splitType,
          date: expense.date,
          user: detail.user,
          userId: detail.userId,
          userEmail: detail.userEmail,
          splitAmount: detail.amount,
          percentage: detail.percentage,
        });
      });
    });

    // Define the CSV writer
    const csvWriter = createCsvWriter({
      path: 'expenses.csv', // Temporary file path
      header: [
        { id: 'expenseId', title: 'Expense ID' },
        { id: 'amount', title: 'Amount' },
        { id: 'description', title: 'Description' },
        { id: 'paidBy', title: 'Paid By' },
        { id: 'paidByUserId', title: 'Paid By User ID' },
        { id: 'paidByEmail', title: 'Paid By Email' },
        { id: 'splitType', title: 'Split Type' },
        { id: 'date', title: 'Date' },
        { id: 'user', title: 'User' },
        { id: 'userId', title: 'User ID' },
        { id: 'userEmail', title: 'User Email' },
        { id: 'splitAmount', title: 'Split Amount' },
        { id: 'percentage', title: 'Percentage' },
      ]
    });

    // Write data to CSV file
    await csvWriter.writeRecords(flattenedCsvData);

    // Set the response headers for CSV file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');

    // Read the CSV file and send it in the response
    res.download('expenses.csv', (err) => {
      if (err) {
        res.status(500).json({ error: 'Could not download the file' });
      }
      // Optionally, you can delete the file after sending
      // fs.unlinkSync('expenses.csv');
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
