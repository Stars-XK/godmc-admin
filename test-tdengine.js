const axios = require('axios');
async function run() {
  try {
    const res = await axios.post('http://127.0.0.1:6041/rest/sql', 'SELECT ts, SUM(val) FROM (SELECT ts, diff_val as val FROM water_iot.a5m_ws0102_ws0102020201 WHERE ts > 0) t1 GROUP BY ts', {
      auth: { username: 'root', password: 'password' }
    });
    console.log('Result:', res.data);
  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }
}
run();
