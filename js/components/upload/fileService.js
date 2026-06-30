import { FILE_CONFIG } from "../../schema.js";
import { uploadDom } from "./dom.js";

/* Save and Export */

// multi sheet export
export function saveWorkbookData(workbookData, filename = "bot-input.xlsx") {
  validateExportData(workbookData);

  console.log("Attempting to save.");

  if (!window.XLSX) {
    throw new Error("XLSX library not loaded.");
  }

  const workbook = window.XLSX.utils.book_new();
  const sheet_config = FILE_CONFIG.sheet

  const sheets = [
    { key: "topics", config: sheet_config.topics },
    { key: "issues", config: sheet_config.issues },
    { key: "parameters", config: sheet_config.parameters },
    { key: "rules", config: sheet_config.rules },
    { key: "recommendations", config: sheet_config.recommendations },
  ];

  for (const { key, config } of sheets) {
    const columns = getExportColumns(key);
    const normalizedRows = workbookData[key].map((row) =>
      normalizeRowForExport(row, columns)
    );

    const worksheet = window.XLSX.utils.json_to_sheet(normalizedRows, {
      header: columns,
    });

    window.XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName);
  }

  window.XLSX.writeFile(workbook, filename);
}

// single sheet export
// export function saveWorkbookData(workbookData) {
//   validateExportData(workbookData);

//   console.log("Attempting to save.");

//   saveSingleWorkbook(
//     FILE_CONFIG.topics.label,
//     workbookData.topics,
//     getExportColumns("topics")
//   );

//   saveSingleWorkbook(
//     FILE_CONFIG.issues.label,
//     workbookData.issues,
//     getExportColumns("issues")
//   );

//   saveSingleWorkbook(
//     FILE_CONFIG.parameters.label,
//     workbookData.parameters,
//     getExportColumns("parameters")
//   );

//   saveSingleWorkbook(
//     FILE_CONFIG.rules.label,
//     workbookData.rules,
//     getExportColumns("rules")
//   );

//   saveSingleWorkbook(
//     FILE_CONFIG.recommendations.label,
//     workbookData.recommendations,
//     getExportColumns("recommendations")
//   );
// }

// function saveSingleWorkbook(filename, rows, columns) {
//   if (!window.XLSX) {
//     throw new Error("XLSX library not loaded.");
//   }

//   const workbook = window.XLSX.utils.book_new();

//   const normalizedRows = rows.map((row) =>
//     normalizeRowForExport(row, columns)
//   );

//   const worksheet = window.XLSX.utils.json_to_sheet(normalizedRows, {
//     header: columns
//   });

//   window.XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
//   window.XLSX.writeFile(workbook, filename);
// }

function normalizeRowForExport(row, columns) {
  const normalized = {};

  for (const column of columns) {
    normalized[column] = row[column] ?? "";
  }

  return normalized;
}

function getExportColumns(key) {
  return FILE_CONFIG['sheet'][key].exportColumns ?? FILE_CONFIG['sheet'][key].requiredColumns;
}

function validateExportData(workbookData) {
  for (const key of Object.keys(FILE_CONFIG['sheet'])) {
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

export function validateFilePresent(fileInput) {
  if (!fileInput?.files || fileInput.files.length === 0) {
    throw new Error(`No file selected. Please upload "${FILE_CONFIG.filename}".`);
  }
}

// read single workbook and return { topics: [...], issues: [...], ... }
export async function loadWorkbookData(fileInput) {
  validateFilePresent(fileInput);
  return await readMultiSheetXlsx(fileInput.files[0]);
}

// validate that each sheet has the required columns
export function validateWorkbookData(workbookData) {
  Object.entries(FILE_CONFIG.sheet).forEach(([key, config]) => {
    validateRequiredColumns(config.sheetName, workbookData[key], config.requiredColumns);
  });
}

// read a multi-sheet workbook and map each sheet to its key via sheetName
function readMultiSheetXlsx(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = event => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = window.XLSX.read(data, { type: 'array' });

        // Build a reverse lookup: sheetName → key
        // e.g. { "1_topics": "topics", "2_issues": "issues", ... }
        const sheetNameToKey = Object.fromEntries(
          Object.entries(FILE_CONFIG.sheet).map(([key, config]) => [config.sheetName, key])
        );

        const result = {};

        for (const [key, config] of Object.entries(FILE_CONFIG.sheet)) {
          const sheet = workbook.Sheets[config.sheetName];

          if (!sheet) {
            throw new Error(
              `Sheet "${config.sheetName}" not found in "${file.name}". ` +
              `Expected sheets: ${Object.values(FILE_CONFIG.sheet).map(s => s.sheetName).join(', ')}.`
            );
          }

          const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: '' });
          result[key] = rows.map(normalizeRowKeys);
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
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

function validateRequiredColumns(sheetName, rows, columns) {
  if (!rows?.length) {
    throw new Error(`Sheet "${sheetName}" has no data rows.`);
  }

  const rowColumns = Object.keys(rows[0]);
  const missing = columns.filter(col => !rowColumns.includes(col));

  if (missing.length) {
    throw new Error(`Sheet "${sheetName}" is missing column(s): ${missing.join(', ')}`);
  }
}