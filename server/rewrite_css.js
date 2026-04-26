const fs = require('fs');
let content = fs.readFileSync('/workspace/admin/src/views/gis/screen/index.vue', 'utf8');

content = content.replace('backdrop-filter: blur(4px);', '');
content = content.replace('backdrop-filter: blur(4px);', '');
content = content.replace('backdrop-filter: blur(4px);', '');

const cssAdd = `
.simple-marker {
  width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
.simple-marker.mini {
  width: 8px; height: 8px;
}
.simple-label {
  background: rgba(255,255,255,0.9); color: #333; padding: 2px 6px; border-radius: 4px;
  border: 1px solid #ccc; font-size: 12px; white-space: nowrap; font-weight: bold;
}
.theme-dark .simple-label {
  background: rgba(10,20,40,0.9); color: #fff; border-color: #555;
}

.layer-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}
.layer-group-title {
  color: #fff; font-size: 13px; font-weight: bold; margin: 10px 0 5px 0;
  border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;
}
.theme-light .layer-group-title {
  color: #111827; border-bottom: 1px solid rgba(0,0,0,0.1);
}
.layer-switch.mini {
  padding: 5px 8px;
}
.layer-switch.mini .layer-name {
  font-size: 12px;
}
`;

content = content.replace('</style>', cssAdd + '\n</style>');
fs.writeFileSync('/workspace/admin/src/views/gis/screen/index.vue', content);
