import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemorySearchIndex } from '../js/services/inMemorySearch.js';

const articles = [
  { id: 'one', heading: 'Travel cover', body: 'Customer is travelling abroad' },
  { id: 'two', heading: 'Home cover', body: 'Customer owns a house' },
];
const notes = [{ id: 'three', content: 'Escalate travel claims for review' }];

function createIndex() {
  const index = new InMemorySearchIndex({
    sources: [
      {
        type: 'article',
        getItems: () => articles,
        getId: (item) => item.id,
        getTitle: (item) => item.heading,
        fields: [
          { name: 'heading', weight: 8 },
          { name: 'body', weight: 2 },
        ],
      },
      {
        type: 'note',
        getItems: () => notes,
        getId: (item) => item.id,
        getTitle: () => 'Review note',
        fields: ['content'],
      },
    ],
  });
  index.rebuild();
  return index;
}

test('in-memory search indexes configured schema fields only', () => {
  const index = createIndex();

  assert.deepEqual(
    index.search('house').map((result) => result.id),
    ['two'],
  );
  assert.equal(index.search('owns').length, 1);
  assert.equal(index.search('missing').length, 0);
});

test('in-memory search requires every query token and supports prefixes', () => {
  const index = createIndex();

  assert.deepEqual(
    index.search('travel customer').map((result) => result.id),
    ['one'],
  );
  assert.deepEqual(
    index.search('travel house').map((result) => result.id),
    [],
  );
  assert.deepEqual(
    index.search('escal').map((result) => result.id),
    ['three'],
  );
});
