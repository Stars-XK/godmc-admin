const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('http://127.0.0.1:3000/water-basic/station/list', { headers: { 'Authorization': 'Bearer admin' } });
    console.log(Object.keys(res.data));
    console.log(res.data.data ? Object.keys(res.data.data) : 'No data');
  } catch(e) { console.log(e.message); }
}
run();
