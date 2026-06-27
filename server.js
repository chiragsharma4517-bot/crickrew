const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// DATABASE CONFIGURATION LINK
const DB_URL = "mongodb+srv://Chiragcrickrew:shannogyano@1901@cluster0.inu5gbj.mongodb.net/gamingApp?retryWrites=true&w=majority";

mongoose.connect(DB_URL)
  .then(() => console.log("🚀 Chirag's Database Connected Successfully!"))
  .catch(err => console.log("❌ DB Connection Error: ", err));

// SECURITY USER MODEL (Database Schema)
const PlayerSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  coinsBalance: { type: Number, default: 0 },
  referralCode: { type: String, unique: true },
  referredBy: { type: String, default: null }
});
const Player = mongoose.model('Player', PlayerSchema);

// AUTH ROUTE 1: PLAYER SIGNUP WITH REFERRAL
app.post('/api/signup', async (req, res) => {
  try {
    const { phoneNumber, password, referralCodeInput } = req.body;
    let exist = await Player.findOne({ phoneNumber });
    if (exist) return res.status(400).json({ error: "Mobile number already registered!" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newRefCode = "PLAY" + Math.floor(100000 + Math.random() * 900000);

    const newPlayer = new Player({
      phoneNumber,
      password: hashedPassword,
      referralCode: newRefCode,
      referredBy: referralCodeInput || null
    });
    await newPlayer.save();
    res.status(201).json({ success: true, message: "Registration successful!" });
  } catch (err) {
    res.status(500).json({ error: "Server error during registration." });
  }
});

// AUTH ROUTE 2: SECURE USER LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const player = await Player.findOne({ phoneNumber });
    if (!player) return res.status(400).json({ error: "Invalid Mobile Number or Password" });

    const isMatch = await bcrypt.compare(password, player.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid Mobile Number or Password" });

    const token = jwt.sign({ id: player._id }, "CHIRAG_ANTI_HACK_TOKEN_998877", { expiresIn: '7d' });
    res.json({ success: true, token, player: { id: player._id, phoneNumber: player.phoneNumber, coinsBalance: player.coinsBalance, referralCode: player.referralCode } });
  } catch (err) {
    res.status(500).json({ error: "Server error during login." });
  }
});

// AUTH ROUTE 3: FORGOT / RESET PASSWORD
app.post('/api/reset-password', async (req, res) => {
  try {
    const { phoneNumber, newPassword } = req.body;
    const player = await Player.findOne({ phoneNumber });
    if (!player) return res.status(404).json({ error: "Player not found!" });

    const salt = await bcrypt.genSalt(10);
    player.password = await bcrypt.hash(newPassword, salt);
    await player.save();
    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Server error during reset." });
  }
});

// TRANSACTION SYSTEM: BUY COINS PACKAGES CONFIG (₹10 = 40 Coins)
const COIN_PACKAGES = { "10": 40, "20": 80, "30": 120, "50": 200 };
app.post('/api/buy-coins', async (req, res) => {
  const { playerId, amountINR } = req.body;
  const coinsToAdd = COIN_PACKAGES[String(amountINR)];
  if (!coinsToAdd) return res.status(400).json({ error: "Invalid Package Amount" });

  await Player.findByIdAndUpdate(playerId, { $inc: { coinsBalance: coinsToAdd } });
  res.json({ success: true, message: ${coinsToAdd} Coins added to your account! });
});

// DEFAULT STATUS CHECK
app.get('/', (req, res) => {
  res.send("<h1>🔥 Chirag's Complete Gaming Engine is Live and Running Securely!</h1>");
});

module.exports = app;
