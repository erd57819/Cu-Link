export function addReportPages(pdf, canvas) {
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const imageHeight = (canvas.height * width) / canvas.width;
  const data = canvas.toDataURL('image/png');
  const pages = Math.max(1, Math.ceil(imageHeight / height));
  for (let page = 0; page < pages; page += 1) {
    if (page > 0) pdf.addPage();
    pdf.addImage(data, 'PNG', 0, -page * height, width, imageHeight);
  }
}
