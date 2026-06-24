const { jsPDF } = require('jspdf');
const doc = new jsPDF();
doc.text('Center', 105, 100, { align: 'center', baseline: 'top' });
doc.text('CenterBottom', 105, 120, { align: 'center', baseline: 'bottom' });
doc.save('test-align.pdf');
