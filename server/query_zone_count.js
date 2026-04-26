const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('http://127.0.0.1:3000/water-basic/zone/list', { headers: { 'Authorization': 'Bearer admin' } });
    console.log("list keys:", Object.keys(res.data));
    console.log("list total:", res.data.data?.total || res.data.total);
    
    const treeRes = await axios.get('http://127.0.0.1:3000/water-basic/zone/tree', { headers: { 'Authorization': 'Bearer admin' } });
    console.log("tree keys:", Object.keys(treeRes.data));
    console.log("tree data length:", treeRes.data.data?.length || treeRes.data.length);
  } catch(e) { console.log(e.message); }
}
run();
