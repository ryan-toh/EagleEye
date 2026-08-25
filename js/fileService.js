import { FILE_CONFIG } from './schema.js';
import { getSampleWorkbookData } from './schema.js';
import {
  parseConditions,
  validateRuleConditions,
} from './domain/conditions.js';
import { str } from './utils.js';

const SHEET_HEADERS_KEY = '__sheetHeaders';

/* Save and Export */

export function saveWorkbookData(
  workbookData,
  filename = FILE_CONFIG.filename,
) {
  validateExportData(workbookData);

  console.log('Attempting to save.');

  if (!window.XLSX) {
    throw new Error('XLSX library not loaded.');
  }

  const dataToExport = isWorkbookDataEmpty(workbookData)
    ? getSampleWorkbookData()
    : workbookData;

  const workbook = window.XLSX.utils.book_new();

  const sheet_config = FILE_CONFIG.sheet;

  const sheets = [
    { key: 'topics', config: sheet_config.topics },
    { key: 'issues', config: sheet_config.issues },
    { key: 'parameters', config: sheet_config.parameters },
    { key: 'rules', config: sheet_config.rules },
    { key: 'recommendations', config: sheet_config.recommendations },
  ];

  for (const { key, config } of sheets) {
    const columns = getExportColumns(key);
    const normalizedRows = dataToExport[key].map((row) =>
      normalizeRowForExport(row, columns),
    );

    const worksheet = window.XLSX.utils.json_to_sheet(normalizedRows, {
      header: columns,
    });

    window.XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName);
  }

  window.XLSX.writeFile(workbook, filename);
}

function isWorkbookDataEmpty(workbookData) {
  return Object.keys(FILE_CONFIG.sheet).every(
    (key) => !workbookData[key]?.length,
  );
}

function normalizeRowForExport(row, columns) {
  const normalized = {};

  for (const column of columns) {
    normalized[column] = row[column] ?? '';
  }

  return normalized;
}

function getExportColumns(key) {
  return (
    FILE_CONFIG['sheet'][key].exportColumns ??
    FILE_CONFIG['sheet'][key].requiredColumns
  );
}

function validateExportData(workbookData) {
  for (const key of Object.keys(FILE_CONFIG['sheet'])) {
    if (!Array.isArray(workbookData[key])) {
      throw new Error(`Cannot export: workbookData.${key} must be an array.`);
    }
  }
}

/* Extract and Import */
export function validateFilePresent(fileInput) {
  if (!fileInput?.files || fileInput.files.length === 0) {
    throw new Error(
      `No file selected. Please upload "${FILE_CONFIG.filename}".`,
    );
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
    const headers = getWorkbookHeaders(workbookData, key);

    validateRequiredColumns(config.sheetName, headers, config.requiredColumns);
    validateSheetRows(key, config, workbookData[key]);
  });

  validateWorkbookRelationships(workbookData);
}

function getWorkbookHeaders(workbookData, key) {
  const savedHeaders = workbookData[SHEET_HEADERS_KEY]?.[key];
  if (savedHeaders) return savedHeaders;

  const firstRow = workbookData[key]?.[0] || {};
  return Object.keys(firstRow);
}

// read a multi-sheet workbook and map each sheet to its key via sheetName
function readMultiSheetXlsx(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = window.XLSX.read(data, { type: 'array' });

        const result = { [SHEET_HEADERS_KEY]: {} };

        for (const [key, config] of Object.entries(FILE_CONFIG.sheet)) {
          const sheet = workbook.Sheets[config.sheetName];

          if (!sheet) {
            throw new Error(
              `Sheet "${config.sheetName}" not found in "${file.name}". ` +
                `Expected sheets: ${Object.values(FILE_CONFIG.sheet)
                  .map((s) => s.sheetName)
                  .join(', ')}.`,
            );
          }

          const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: '' });
          const [headerRow = []] = window.XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: '',
          });

          result[SHEET_HEADERS_KEY][key] = headerRow
            .map((header) => String(header).trim())
            .filter(Boolean);
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
    normalized[String(key).trim()] =
      typeof value === 'string' ? value.trim() : value;
  });

  return normalized;
}

function validateRequiredColumns(sheetName, headers, columns) {
  const missing = columns.filter((col) => !headers.includes(col));

  if (missing.length) {
    throw new Error(
      `Sheet "${sheetName}" is missing column(s): ${missing.join(', ')}`,
    );
  }
}

function validateSheetRows(key, config, rows) {
  if (!Array.isArray(rows)) {
    throw new Error(`Sheet "${config.sheetName}" could not be read as rows.`);
  }

  const idColumn = getIdColumn(key);
  const knownIds = new Set();

  rows.forEach((row, index) => {
    const location = createCellLocation(config.sheetName, index);
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error(`${location}: expected a data row.`);
    }

    getRequiredValueColumns(key).forEach((column) => {
      if (!str(row[column])) {
        throw new Error(
          `${location}, column "${column}" is required but is blank.`,
        );
      }
    });

    validateRowFormats(key, row, location);

    if (idColumn) {
      const id = str(row[idColumn]);
      if (knownIds.has(id)) {
        throw new Error(
          `${location}, column "${idColumn}" duplicates ID "${id}".`,
        );
      }
      knownIds.add(id);
    }
  });
}

function validateRowFormats(key, row, location) {
  if (key === 'parameters') {
    const requiredValue = str(row.required).toLowerCase();
    if (
      requiredValue &&
      !['yes', 'no', 'true', 'false', 'y', 'n', '1', '0'].includes(
        requiredValue,
      )
    ) {
      throw new Error(
        `${location}, column "required" must be yes or no (or a boolean value).`,
      );
    }
    if (str(row.order) && !isPositiveInteger(row.order)) {
      throw new Error(
        `${location}, column "order" must be a positive whole number.`,
      );
    }
  }

  if (key === 'rules') {
    try {
      parseConditions(row.conditions);
    } catch {
      throw new Error(
        `${location}, column "conditions" must be a JSON object, for example {"PARAM_001":"Yes"}.`,
      );
    }
    if (str(row.priority) && !isPositiveInteger(row.priority)) {
      throw new Error(
        `${location}, column "priority" must be a positive whole number.`,
      );
    }
  }
}

function validateWorkbookRelationships(workbookData) {
  const topicIds = new Set(workbookData.topics.map((row) => str(row.topic_id)));
  const issueIds = new Set(workbookData.issues.map((row) => str(row.issue_id)));
  const recommendationIds = new Set(
    workbookData.recommendations.map((row) => str(row.recommendation_id)),
  );

  workbookData.issues.forEach((row, index) => {
    assertReference(
      topicIds,
      row.topic_id,
      '2_issues',
      index,
      'topic_id',
      '1_topics',
    );
  });
  workbookData.parameters.forEach((row, index) => {
    assertReference(
      issueIds,
      row.issue_id,
      '3_parameters',
      index,
      'issue_id',
      '2_issues',
    );
  });
  workbookData.rules.forEach((row, index) => {
    assertReference(
      issueIds,
      row.issue_id,
      '4_decision_rules',
      index,
      'issue_id',
      '2_issues',
    );
    assertReference(
      recommendationIds,
      row.recommendation_id,
      '4_decision_rules',
      index,
      'recommendation_id',
      '5_recommendations',
    );
    try {
      validateRuleConditions(
        row.conditions,
        row.issue_id,
        workbookData.parameters,
      );
    } catch (error) {
      throw new Error(
        `${createCellLocation('4_decision_rules', index)}, column "conditions" is invalid: ${error.message}`,
        { cause: error },
      );
    }
  });
}

function assertReference(
  validIds,
  value,
  sheetName,
  rowIndex,
  column,
  targetSheet,
) {
  const id = str(value);
  if (!validIds.has(id)) {
    throw new Error(
      `${createCellLocation(sheetName, rowIndex)}, column "${column}" references "${id}", which does not exist in sheet "${targetSheet}".`,
    );
  }
}

function isPositiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

function createCellLocation(sheetName, rowIndex) {
  return `Sheet "${sheetName}", row ${rowIndex + 2}`;
}

function getIdColumn(key) {
  return {
    topics: 'topic_id',
    issues: 'issue_id',
    parameters: 'parameter_id',
    rules: 'rule_id',
    recommendations: 'recommendation_id',
  }[key];
}

function getRequiredValueColumns(key) {
  return {
    topics: ['topic_id', 'topic_name'],
    issues: ['issue_id', 'topic_id', 'issue_name'],
    parameters: ['issue_id', 'parameter_id', 'parameter_name'],
    rules: ['rule_id', 'issue_id', 'conditions', 'recommendation_id'],
    recommendations: ['recommendation_id', 'final_decision'],
  }[key];
}
