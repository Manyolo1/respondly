import 'dotenv/config';
import express from 'express';
import jwt from 'jsonwebtoken';
import pRetry from 'p-retry';
import axios from 'axios';

const PORT = process.env.PORT || 4000;
const app = express();
app.use(express.json());

function mintServiceToken() {
  return jwt.sign({ iss: 'orchestrator' }, process.env.JWT_SECRET, { expiresIn: '5m' });
}

async function callAgent(url, method, params) {
  const token = mintServiceToken();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  return pRetry(async () => {
    const res = await axios.post(`${url}/rpc/${method}`, params, { headers });
    return res.data;
  }, { retries: 2 });
}

app.post('/v1/process_ticket', async (req, res) => {
  const { ticket_id, body } = req.body;
  if (!body) return res.status(400).json({ error: "body required" });
  try {
    const cat = await callAgent(process.env.CLASSIFIER_URL, 'classify', { email: body });
    const draft = await callAgent(process.env.RESPONDER_URL, 'respond', { email: body, category: cat.category });
    const ver = await callAgent(process.env.VERIFIER_URL, 'verify', { draft: draft.draft });

    res.json({
      ticket_id,
      category: cat.category,
      draft: draft.draft,
      final_response: ver.final_response,
      result: ver.result,
      notes: ver.notes
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'orchestration_failed' });
  }
});

app.get('/healthz', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Orchestrator listening on :${PORT}`));
