import { FILE_CONFIG } from "./schema.js";

/* Save and Export */

// multi sheet export
// export function saveWorkbookData(workbookData, filename="bot-input") {
//   if (!window.XLSX) {
//     throw new Error('XLSX Library not loaded.');
//   }

//   const workbook = window.XLSX.utils.book_new();

//   Object.entries(FILE_CONFIG).forEach(([key, config]) => {
//     const rows = Array.isArray(data[key]) ? data[key] : [];
//     const exportRows = rows.map(row => normalizeRowForExport(row, config.exportColumns || config.requiredColumns));
//     const worksheet = window.XLSX.utils.json_to_sheet(exportRows, {
//       header: config.exportColumns || config.requiredColumns
//     });

//     window.XLSX.writeFile(workbook, filename);
//   })
// }

// single sheet export
export function saveWorkbookData(workbookData) {
  validateExportData(workbookData);

  console.log("Attempting to save.");

  saveSingleWorkbook(
    FILE_CONFIG.topics.label,
    workbookData.topics,
    getExportColumns("topics")
  );

  saveSingleWorkbook(
    FILE_CONFIG.issues.label,
    workbookData.issues,
    getExportColumns("issues")
  );

  saveSingleWorkbook(
    FILE_CONFIG.parameters.label,
    workbookData.parameters,
    getExportColumns("parameters")
  );

  saveSingleWorkbook(
    FILE_CONFIG.rules.label,
    workbookData.rules,
    getExportColumns("rules")
  );

  saveSingleWorkbook(
    FILE_CONFIG.recommendations.label,
    workbookData.recommendations,
    getExportColumns("recommendations")
  );
}

function saveSingleWorkbook(filename, rows, columns) {
  if (!window.XLSX) {
    throw new Error("XLSX library not loaded.");
  }

  const workbook = window.XLSX.utils.book_new();

  const normalizedRows = rows.map((row) =>
    normalizeRowForExport(row, columns)
  );

  const worksheet = window.XLSX.utils.json_to_sheet(normalizedRows, {
    header: columns
  });

  window.XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  window.XLSX.writeFile(workbook, filename);
}

function normalizeRowForExport(row, columns) {
  const normalized = {};

  for (const column of columns) {
    normalized[column] = row[column] ?? "";
  }

  return normalized;
}

function getExportColumns(key) {
  return FILE_CONFIG[key].exportColumns ?? FILE_CONFIG[key].requiredColumns;
}

function validateExportData(workbookData) {
  for (const key of Object.keys(FILE_CONFIG)) {
    if (!Array.isArray(workbookData[key])) {
      throw new Error(`Cannot export: workbookData.${key} must be an array.`);
    }
  }
}

/* Extract and Import */

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