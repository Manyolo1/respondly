import 'dotenv/config';
import express from 'express';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const PORT = process.env.VERIFIER_PORT || 9003;

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

app.post('/rpc/verify', verifyToken, async (req, res) => {
  const { draft } = req.body;
  const prompt = `Review this draft reply:\n\n${draft}\n\nCheck tone, compliance, empathy. If acceptable, return APPROVED. Otherwise return REJECTED with notes and improved response.`;

  try {
    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    res.json({
      result: content.includes("APPROVED") ? "APPROVED" : "REJECTED",
      notes: content,
      final_response: draft
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "verification_failed" });
  }
});

app.listen(PORT, () => console.log(`Verifier agent on :${PORT}`));
