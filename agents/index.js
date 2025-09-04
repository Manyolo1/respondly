import 'dotenv/config';
import express from 'express';
import { OpenAI } from 'openai';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const PORT = process.env.VERIFIER_PORT || 9003;

function verifyToken(req, res, next) {
  try {
    jwt.verify(req.headers.authorization?.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "unauthorized" });
  }
}

app.post('/rpc/verify', verifyToken, async (req, res) => {
  const { draft } = req.body;
  const prompt = `Review this draft reply:\n\n${draft}\n\nCheck tone, compliance, empathy. If acceptable, return APPROVED. Otherwise return REJECTED with notes and improved response.`;
  const resp = await client.chat.completions.create({ model: "gpt-4o-mini", messages: [{role:"user", content:prompt}] });
  const content = resp.choices[0].message.content.trim();
  res.json({ result: content.includes("APPROVED") ? "APPROVED" : "REJECTED", notes: content, final_response: draft });
});

app.listen(PORT, () => console.log(`Verifier agent on :${PORT}`));
