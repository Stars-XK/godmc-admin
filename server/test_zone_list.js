const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('http://127.0.0.1:3000/water-basic/zone/list', { headers: { 'Authorization': 'Bearer admin' } });
    console.log("type of zoneRes:", typeof res.data);
    console.log("keys of zoneRes:", Object.keys(res.data));
    console.log("data is array:", Array.isArray(res.data.data));
    console.log("length of data:", res.data.data?.length);
    console.log("boundary of first item:", typeof res.data.data[0]?.boundary, res.data.data[0]?.boundary ? res.data.data[0].boundary.substring(0, 20) : "null");
  } catch(e) { console.log(e.message); }
}
run();
