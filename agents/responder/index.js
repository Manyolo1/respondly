import 'dotenv/config';
import express from 'express';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const PORT = process.env.RESPONDER_PORT || 9002;

function verifyToken(req, res, next) {
  try {
    jwt.verify(
      req.headers.authorization?.split(' ')[1],
      process.env.JWT_SECRET
    );
    next();
  } catch {
    res.status(401).json({ error: "unauthorized" });
  }
}

app.post('/rpc/respond', verifyToken, async (req, res) => {
  const { email, category } = req.body;
  const prompt = `You are a helpful support agent. Write an empathetic reply for this ${category} issue:\n\n${email}`;

  try {
    const result = await model.generateContent(prompt);
    res.json({ draft: result.response.text().trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "generation_failed" });
  }
});

app.listen(PORT, () => console.log(`Responder agent on :${PORT}`));
