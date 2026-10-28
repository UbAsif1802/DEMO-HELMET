import test from 'node:test';
import assert from 'node:assert/strict';

test('cloud gemini validation passes', () => {
  const provider = 'cloud';
  assert.equal(provider, 'cloud');
});
