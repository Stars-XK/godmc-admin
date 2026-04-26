const proj4 = require('proj4');
const customProj4Str = '+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=39500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
const res = proj4(customProj4Str, 'WGS84', [39666720.877, 2758020.207]);
console.log(res);
