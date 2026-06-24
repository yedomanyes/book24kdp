const { jsPDF } = require('jspdf');

function generateMock() {
  const doc = new jsPDF({ format: [5*72, 8*72], unit: 'pt' });
  const config = {
    title: 'Die Sucht die dich Zerstoert',
    subtitle: 'Besiege deine Gluecksspielsucht in 2 Wochen Vollstaendig',
    authorName: 'Renzo Laafy',
    publisherLine: 'Book24 Studio'
  };
  const outline = { title: 'Old Title' };
  
  const pageWidth = 5*72;
  const pageHeight = 8*72;
  const writableWidth = pageWidth - 90;
  
  const titleAlign = 'center';
  const titleOffsetPt = 0;
  const insideMargin = 45;
  const outsideMargin = 45;
  
  function getTitleElemX(align, offsetPt, leftM) {
    if (align === 'left') return leftM + offsetPt;
    if (align === 'right') return pageWidth - outsideMargin + offsetPt;
    return pageWidth / 2 + offsetPt;
  }
  
  const titleSize = 28;
  let titleY = pageHeight * 0.25;
  doc.setFontSize(titleSize);
  const titleLines = doc.splitTextToSize(config.title || outline.title || '', writableWidth);
  titleLines.forEach(line => {
    const tx = getTitleElemX(titleAlign, titleOffsetPt, insideMargin);
    doc.text(line, tx, titleY, { align: titleAlign, baseline: 'top' });
    titleY += titleSize * 1.2;
  });
  
  doc.save('test-mock.pdf');
}
generateMock();
