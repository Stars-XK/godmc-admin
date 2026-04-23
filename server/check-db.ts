import { DataSource } from 'typeorm';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  const configStr = fs.readFileSync(path.join(__dirname, 'libs/common/src/config/dev.yml'), 'utf8');
  const config = yaml.load(configStr);
  const ds = new DataSource({
    type: 'mysql',
    host: config.db.mysql.host,
    port: config.db.mysql.port,
    username: config.db.mysql.username,
    password: config.db.mysql.password,
    database: config.db.mysql.database,
  });
  await ds.initialize();
  const rows = await ds.query('DESC water_zone_metric_calc');
  console.log(rows);
  const data = await ds.query('SELECT * FROM water_zone_metric_calc LIMIT 10');
  console.log('DATA:', data);
  await ds.destroy();
}
run().catch(console.error);
