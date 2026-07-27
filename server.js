const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Scheduler-Code');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

function auth(req, res, next) {
  if (req.headers['x-scheduler-code'] !== process.env.SCHEDULER_CODE) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  next();
}

let _sb = null;
function sb() {
  if (!_sb) _sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  return _sb;
}

app.get('/schedule', auth, async (req, res) => {
  const { data, error } = await sb().from('weekly_schedule').select('data').eq('id', 1).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.data);
});

app.post('/schedule', auth, async (req, res) => {
  const { error } = await sb().from('weekly_schedule')
    .update({ data: req.body, updated_at: new Date().toISOString() })
    .eq('id', 1);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.get('/', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Scheduler backend on port ${PORT}`));
