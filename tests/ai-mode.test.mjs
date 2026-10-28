import test from 'node:test';
import assert from 'node:assert/strict';

const isValidMode = (mode) => mode === 'cloud' || mode === 'local';

test('only cloud and local are valid AI modes', () => {
  assert.equal(isValidMode('cloud'), true);
  assert.equal(isValidMode('local'), true);
  assert.equal(isValidMode('gemini'), false);
  assert.equal(isValidMode('ollama'), false);
  assert.equal(isValidMode(undefined), false);
  assert.equal(isValidMode(null), false);
});
