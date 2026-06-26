import { jsPDF } from "jspdf";
import fs from "fs";

const doc = new jsPDF({ format: 'a5', unit: 'pt' });
doc.setFont('helvetica', 'bold');
doc.setFontSize(28);

const titleAlign = 'center';
const titleLines = doc.splitTextToSize("Schmuck Business für Einsteiger", 300);

let titleY = 100;
titleLines.forEach(line => {
  doc.text(line, 419.53 / 2, titleY, { align: titleAlign, baseline: 'top' });
  titleY += 28 * 1.2;
});

fs.writeFileSync("test2.pdf", Buffer.from(doc.output('arraybuffer')));
console.log("Created test2.pdf");
