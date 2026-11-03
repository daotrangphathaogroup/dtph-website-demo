import type {SheetData} from 'write-excel-file/universal';

export type ExcelRows = (string | number | null | undefined)[][];

export async function excelBlob(rows: ExcelRows): Promise<Blob> {
  const {default: writeExcelFile} = await import('write-excel-file/universal');
  const data: SheetData = rows.map((row, index) => row.map(value => ({
    value: value ?? '',
    type: typeof value === 'number' ? Number : String,
    ...(index === 0 ? {fontWeight: 'bold' as const, backgroundColor: '#EEF1F8'} : {}),
    wrap: true,
    alignVertical: 'top',
  })));
  return writeExcelFile(data, {
    sheet: 'Danh sách',
    stickyRowsCount: 1,
    columns: (rows[0] ?? []).map((_, column) => ({
      width: Math.min(48, rows.reduce((width, row) => Math.max(width, String(row[column] ?? '').length + 2), 16)),
    })),
  }).toBlob();
}

export async function downloadExcel(rows: ExcelRows, fileName: string): Promise<void> {
  const blob = await excelBlob(rows);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
