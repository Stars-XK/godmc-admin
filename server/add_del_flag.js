const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: '139.224.26.134',
    user: 'dma',
    password: 'QzwTwHR3YT85AbNf',
    database: 'dma',
    port: 3306
  });

  try {
    console.log('Connected to MySQL database.');
    
    // Check if del_flag already exists
    const [columns] = await connection.execute("SHOW COLUMNS FROM sys_job LIKE 'del_flag'");
    if (columns.length === 0) {
      console.log('Adding del_flag column to sys_job table...');
      await connection.execute("ALTER TABLE sys_job ADD COLUMN del_flag char(1) DEFAULT '0' COMMENT '删除标志'");
      console.log('Successfully added del_flag column.');
    } else {
      console.log('del_flag column already exists in sys_job table.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
    console.log('Connection closed.');
  }
}

main();