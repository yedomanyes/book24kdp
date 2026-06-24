const { jsPDF } = require('jspdf');
const start = performance.now();
for (let i = 0; i < 100; i++) {
  const doc = new jsPDF();
  doc.text('Test', 100, 100);
  const out = doc.output('datauristring');
}
console.log((performance.now() - start) / 100);
