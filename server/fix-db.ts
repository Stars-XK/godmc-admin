import { DataSource } from 'typeorm';
const ds = new DataSource({
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  password: 'password', // or whatever their password is, but wait, typeorm config is in dev.yml
});
