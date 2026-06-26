import { jsPDF } from "jspdf";
const doc = new jsPDF({ format: 'a5', unit: 'pt' });
doc.setFont('helvetica', 'bold');
doc.setFontSize(28);
const lines = doc.splitTextToSize("Schmuck Business                                  für Einsteiger", 392);
console.log(lines);
