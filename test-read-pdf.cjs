const fs = require('fs');
const content = fs.readFileSync('test-align.pdf', 'utf8');
const lines = content.split('\n');
lines.forEach(l => {
  if (l.includes('Center')) console.log(l);
});
