import { jsPDF } from "jspdf";
const doc = new jsPDF();
const lines = doc.splitTextToSize("Schmuck Business für Einsteiger", 300);
console.log(lines);
