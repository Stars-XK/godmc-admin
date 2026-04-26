const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('http://127.0.0.1:3000/water-basic/zone/list', { headers: { 'Authorization': 'Bearer admin' } });
    console.log("zones count:", res.data.data.rows?.length || res.data.data?.length);
    console.log("first zone boundary:", res.data.data.rows[0]?.boundary ? "Exists" : "Not Exists");
  } catch(e) { console.log(e.message); }
}
run();
