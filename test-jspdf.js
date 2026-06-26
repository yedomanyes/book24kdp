import { jsPDF } from "jspdf";
import fs from "fs";

const doc = new jsPDF({ format: 'a5' });
doc.setFont('helvetica');
doc.setFontSize(28);
doc.text("Schmuck Business für Einsteiger", 50, 50);
fs.writeFileSync("test.pdf", Buffer.from(doc.output('arraybuffer')));
console.log("Created test.pdf");
