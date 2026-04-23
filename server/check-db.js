const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const mysql = require('mysql2/promise');

async function run() {
  const configStr = fs.readFileSync(path.join(__dirname, 'libs/common/src/config/dev.yml'), 'utf8');
  const config = yaml.load(configStr);
  const conn = await mysql.createConnection({
    host: config.db.mysql.host,
    port: config.db.mysql.port,
    user: config.db.mysql.username,
    password: config.db.mysql.password,
    database: config.db.mysql.database,
  });
  const [rows] = await conn.query('DESC water_zone_metric_calc');
  console.log(rows);
  const [data] = await conn.query('SELECT * FROM water_zone_metric_calc LIMIT 10');
  console.log('DATA:', data);
  await conn.end();
}
run().catch(console.error);
