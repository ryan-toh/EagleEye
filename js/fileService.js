import { FILE_CONFIG } from './schema.js';

export function validateLibraries() {
  if (!window.XLSX) {
    throw new Error('XLSX library not loaded. Check the script tag in index.html.');
  }

  if (!window.mermaid) {
    throw new Error('Mermaid library not loaded. Check the script tag in index.html.');
  }
}

export function getFileInputs() {
  return Object.fromEntries(
    Object.entries(FILE_CONFIG).map(([key, config]) => [
      key,
      document.getElementById(config.inputId)
    ])
  );
}

export function validateFilesPresent(fileInputs) {
  const missing = Object.entries(fileInputs)
    .filter(([, input]) => !input?.files || input.files.length === 0)
    .map(([key]) => FILE_CONFIG[key].label);

  if (missing.length > 0) {
    throw new Error(`Missing file(s): ${missing.join(', ')}`);
  }
}

export async function loadWorkbookData(fileInputs) {
  validateFilesPresent(fileInputs);

  const entries = await Promise.all(
    Object.entries(fileInputs).map(async ([key, input]) => {
      const rows = await readXlsx(input.files[0]);
      return [key, rows];
    })
  );

  return Object.fromEntries(entries);
}

export function validateWorkbookData(workbookData) {
  Object.entries(FILE_CONFIG).forEach(([key, config]) => {
    validateRequiredColumns(config.label, workbookData[key], config.requiredColumns);
  });
}

function readXlsx(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = event => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = window.XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = window.XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
        resolve(rows.map(normalizeRowKeys));
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}

function normalizeRowKeys(row) {
  const normalized = {};

  Object.entries(row).forEach(([key, value]) => {
    normalized[String(key).trim()] = typeof value === 'string' ? value.trim() : value;
  });

  return normalized;
}

function validateRequiredColumns(fileName, rows, columns) {
  if (!rows?.length) {
    throw new Error(`${fileName} has no data rows.`);
  }

  const rowColumns = Object.keys(rows[0]);
  const missing = columns.filter(col => !rowColumns.includes(col));

  if (missing.length) {
    throw new Error(`${fileName} is missing column(s): ${missing.join(', ')}`);
  }
}