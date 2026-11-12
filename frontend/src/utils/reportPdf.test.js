import { addReportPages } from './reportPdf';

test.each([[297, 1], [594, 2], [700, 3]])('exports %s mm of text over %s A4 pages', (imageHeight, pages) => {
  const pdf = {
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    addPage: jest.fn(), addImage: jest.fn(),
  };
  addReportPages(pdf, { width: 210, height: imageHeight, toDataURL: () => 'data:image/png;base64,test' });
  expect(pdf.addPage).toHaveBeenCalledTimes(pages - 1);
  expect(pdf.addImage).toHaveBeenCalledTimes(pages);
  expect(pdf.addImage.mock.calls[pages - 1]).toEqual(['data:image/png;base64,test', 'PNG', 0, -(pages - 1) * 297, 210, imageHeight]);
});
