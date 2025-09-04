import 'dotenv/config';
import express from 'express';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

const PORT = process.env.CLASSIFIER_PORT || 9001;

function verifyToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'unauthorized' });
  }
}

app.post('/rpc/classify', verifyToken, async (req, res) => {
  try {
    const { email } = req.body;
    const prompt = `Classify this support email:\n${email}\nCategories: Billing, Technical, Account, General.`;

    const result = await model.generateContent(prompt);

    // Gemini returns text differently
    const category = result.response.text().trim();
    res.json({ category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Classification failed' });
  }
});

app.listen(PORT, () => console.log(`Classifier agent on :${PORT}`));
