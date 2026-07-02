const { jsPDF } = require("jspdf");
const doc = new jsPDF();
doc.setFontSize(28);
const lines = doc.splitTextToSize("Schmuck Business für Einsteiger", 10000);
console.log(lines);
