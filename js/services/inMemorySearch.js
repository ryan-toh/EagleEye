import { str } from '../utils.js';

/**
 * A schema-agnostic, in-memory inverted index.
 *
 * A source describes how to read one entity collection. This keeps indexing
 * independent from the workbook's current tables and makes it reusable for a
 * different data model.
 */
export class InMemorySearchIndex {
  constructor({ sources = [] } = {}) {
    this.sources = sources;
    this.documents = new Map();
    this.tokens = new Map();
  }

  rebuild() {
    this.documents.clear();
    this.tokens.clear();

    this.sources.forEach((source) => {
      const fields = source.fields.map(normalizeField);

      source.getItems().forEach((item) => {
        const id = str(source.getId(item));
        if (!id) return;

        const documentId = `${source.type}:${id}`;
        const indexedFields = new Map();

        fields.forEach((field) => {
          const value = normalizeText(item[field.name]);
          indexedFields.set(field.name, value);
          tokenize(value).forEach((token) =>
            this.addToken(token, documentId, field.name),
          );
        });

        this.documents.set(documentId, {
          id,
          type: source.type,
          item,
          title: source.getTitle(item),
          context: source.getContext?.(item) || '',
          fields: indexedFields,
          fieldDefinitions: fields,
          onSelect: source.onSelect,
        });
      });
    });
  }

  search(query, { limit = 40 } = {}) {
    const normalizedQuery = normalizeText(query);
    const queryTokens = tokenize(normalizedQuery);
    if (!queryTokens.length) return [];

    const matchesByDocument = new Map();

    queryTokens.forEach((queryToken, queryIndex) => {
      const tokenMatches = this.findTokenMatches(queryToken);
      const nextMatches = new Map();

      tokenMatches.forEach(([token, documents]) => {
        documents.forEach((fields, documentId) => {
          if (queryIndex > 0 && !matchesByDocument.has(documentId)) return;

          const previous =
            nextMatches.get(documentId) || matchesByDocument.get(documentId);
          const match = previous
            ? {
                matchedFields: new Map(previous.matchedFields),
                matchedTokens: new Set(previous.matchedTokens),
                matchedQueryTokens: new Set(previous.matchedQueryTokens),
              }
            : {
                matchedFields: new Map(),
                matchedTokens: new Set(),
                matchedQueryTokens: new Set(),
              };
          fields.forEach((fieldName) => {
            const fieldTokens = new Set(match.matchedFields.get(fieldName));
            fieldTokens.add(token);
            match.matchedFields.set(fieldName, fieldTokens);
          });
          match.matchedTokens.add(token);
          match.matchedQueryTokens.add(queryToken);
          nextMatches.set(documentId, match);
        });
      });

      matchesByDocument.clear();
      nextMatches.forEach((match, documentId) =>
        matchesByDocument.set(documentId, match),
      );
    });

    return [...matchesByDocument.entries()]
      .map(([documentId, match]) =>
        this.toResult(documentId, match, normalizedQuery),
      )
      .sort(
        (left, right) =>
          right.score - left.score || left.title.localeCompare(right.title),
      )
      .slice(0, limit);
  }

  addToken(token, documentId, fieldName) {
    const documents = this.tokens.get(token) || new Map();
    const fields = documents.get(documentId) || new Set();
    fields.add(fieldName);
    documents.set(documentId, fields);
    this.tokens.set(token, documents);
  }

  findTokenMatches(queryToken) {
    const exactMatch = this.tokens.get(queryToken);
    if (exactMatch) return [[queryToken, exactMatch]];

    return [...this.tokens.entries()].filter(([token]) =>
      token.startsWith(queryToken),
    );
  }

  toResult(documentId, match, normalizedQuery) {
    const document = this.documents.get(documentId);
    const matchedFields = [...match.matchedFields.keys()];
    const score = matchedFields.reduce((total, fieldName) => {
      const field = document.fieldDefinitions.find(
        ({ name }) => name === fieldName,
      );
      return total + field.weight * match.matchedFields.get(fieldName).size;
    }, 0);
    const phraseBonus = [...document.fields.values()].some((value) =>
      value.includes(normalizedQuery),
    )
      ? 1000
      : 0;
    const primaryField = matchedFields[0];

    return {
      id: document.id,
      type: document.type,
      title: document.title,
      context: document.context,
      matchedFields,
      matchedText: document.fields.get(primaryField),
      score: score + phraseBonus,
      onSelect: document.onSelect,
      item: document.item,
    };
  }
}

function normalizeField(field) {
  return typeof field === 'string'
    ? { name: field, weight: 1 }
    : { weight: 1, ...field };
}

function normalizeText(value) {
  return str(value).toLocaleLowerCase().trim().replace(/\s+/g, ' ');
}

function tokenize(value) {
  return value.match(/[\p{L}\p{N}]+/gu) || [];
}
