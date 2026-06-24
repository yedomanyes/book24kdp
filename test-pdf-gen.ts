import { generateBookPdf } from './src/utils/PdfGenerator.js';
import * as fs from 'fs';

const outline = { title: 'Test', subtitle: 'Sub', pages: [] };
const config = {
  title: 'Die Sucht die dich Zerstört',
  subtitle: 'Besiege deine Glücksspielsucht in 2 Wochen Vollständig',
  authorName: 'Renzo Laafy',
  publisherLine: 'Book24 Studio',
  pageSize: '5x8',
  titlePageLayout: 'centered'
};

const pdfBlob = generateBookPdf(outline, config as any);
// wait, generateBookPdf returns a Blob which is a web API, not available in plain Node unless polyfilled.
