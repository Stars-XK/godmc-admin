const XLSX = require('xlsx');
const fs = require('fs');
const workbook = XLSX.readFile('/workspace/server/test.xlsx', { type: 'binary' }); // if it exists
