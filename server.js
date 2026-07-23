import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ==========================================
// 1. DATABASE CONNECTION
// ==========================================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ==========================================
// 2. MONGOOSE SCHEMAS & MODELS
// ==========================================

// User Schema
const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String },
  currency: { type: String, default: 'USD' }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  date: { type: Date, default: Date.now },
  isRecurring: { type: Boolean, default: false }
}, { timestamps: true });
const Transaction = mongoose.model('Transaction', transactionSchema);

// Budget Schema
const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  limit: { type: Number, required: true },
  month: { type: String, required: true } // format: YYYY-MM
}, { timestamps: true });
const Budget = mongoose.model('Budget', budgetSchema);

// Goal Schema
const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  deadline: { type: Date, required: true }
}, { timestamps: true });
const Goal = mongoose.model('Goal', goalSchema);

// ==========================================
// 3. AUTH MIDDLEWARE (JWT)
// ==========================================
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) res.status(401).json({ message: 'Not authorized, no token' });
};

// ==========================================
// 4. API ROUTES
// ==========================================

// Auth Route: Sync Firebase user to MongoDB & Generate JWT
app.post('/api/auth/sync', async (req, res) => {
  const { firebaseUid, email, name } = req.body;
  try {
    let user = await User.findOne({ firebaseUid });
    if (!user) {
      user = await User.create({ firebaseUid, email, name });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ _id: user._id, name: user.name, email: user.email, currency: user.currency, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Fetch all transactions for a user
app.get('/api/transactions', protect, async (req, res) => {
  try {
    const { type, category, sort } = req.query;
    let query = { userId: req.user._id };
    
    if (type) query.type = type;
    if (category) query.category = category;

    let sortOption = { date: -1 }; // Default: newest first
    if (sort === 'oldest') sortOption = { date: 1 };
    if (sort === 'highest') sortOption = { amount: -1 };
    if (sort === 'lowest') sortOption = { amount: 1 };

    const transactions = await Transaction.find(query).sort(sortOption);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Add new transaction
app.post('/api/transactions', protect, async (req, res) => {
  const { title, amount, type, category, date, isRecurring } = req.body;
  try {
    const transaction = await Transaction.create({
      userId: req.user._id, title, amount, type, category, date, isRecurring
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE: Remove a transaction
app.delete('/api/transactions/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction || transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Transaction not found or unauthorized' });
    }
    await transaction.deleteOne();
    res.json({ message: 'Transaction removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET & POST: Budgets
app.get('/api/budgets', protect, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/budgets', protect, async (req, res) => {
  const { category, limit, month } = req.body;
  try {
    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id, category, month },
      { limit },
      { new: true, upsert: true } // Update if exists, otherwise create
    );
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET & POST: Goals
app.get('/api/goals', protect, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/goals', protect, async (req, res) => {
  const { title, targetAmount, deadline } = req.body;
  try {
    const goal = await Goal.create({
      userId: req.user._id, title, targetAmount, deadline
    });
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 5. SERVER START
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
