import * as XLSX from 'xlsx';

/**
 * Exports data to an Excel file and triggers a download.
 * @param {Array} data - Array of objects to export.
 * @param {String} fileName - Desired name of the file (without extension).
 * @param {String} sheetName - Name of the sheet inside the Excel file.
 */
export const exportToExcel = (data, fileName, sheetName = 'Data') => {
  if (!data || data.length === 0) {
    console.error('No data provided for export');
    return;
  }

  // Create a worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Create a workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Buffer and Download
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
