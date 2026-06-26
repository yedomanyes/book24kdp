import { jsPDF } from "jspdf";
const doc = new jsPDF();
const lines = doc.splitTextToSize("Schmuck Business für\nEinsteiger", 300);
console.log(lines);
