const { jsPDF } = require("jspdf");
const doc = new jsPDF({ format: [396, 612] });
doc.setFontSize(28);
doc.text("Schmuck Business für Einsteiger", 198, 100, { align: 'center' });
doc.save("test.pdf");
