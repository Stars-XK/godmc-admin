const fs = require('fs');
const path = require('path');

const cliJsonPath = path.join(__dirname, 'nest-cli.json');
const cliJson = JSON.parse(fs.readFileSync(cliJsonPath, 'utf8'));

// Global assets (for default nest build)
cliJson.compilerOptions.assets = [
  "**/*.yml",
  {
    "include": "../../libs/shared/src/config/*.yml",
    "outDir": "./dist/apps/api-gateway"
  }
];

for (const project of Object.keys(cliJson.projects)) {
  if (!cliJson.projects[project].compilerOptions) {
    cliJson.projects[project].compilerOptions = {};
  }
  cliJson.projects[project].compilerOptions.assets = [
    "**/*.yml",
    {
      "include": "../../../libs/shared/src/config/*.yml",
      "outDir": `./dist/apps/${project}`
    }
  ];
}

fs.writeFileSync(cliJsonPath, JSON.stringify(cliJson, null, 2));
