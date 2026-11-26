// Regel Intimfoto 26.11.2026: keine Beschränkung expliziter Bilder auf Marie/Christian.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHAT_AGE_RULE, EXPLICIT_OK_RULE } from '../apps/shared/promptapp/chat.js';
import { applyModeToSystem, CHAT_AGE_RULE as SERVER_AGE, EXPLICIT_OK_RULE as SERVER_OK, SFW_RULE } from '../src/mode-server.js';

const src = (p) => readFileSync(p, 'utf8');

test('CHAT_AGE_RULE und EXPLICIT_OK_RULE sind in Chat- und Server-Datei gleich', () => {
  assert.equal(CHAT_AGE_RULE, SERVER_AGE);
  assert.equal(EXPLICIT_OK_RULE, SERVER_OK);
  assert.match(CHAT_AGE_RULE, /Alle dargestellten Personen sind erwachsen/);
  assert.match(CHAT_AGE_RULE, /Niemals Minderjährige/);
  assert.doesNotMatch(CHAT_AGE_RULE, /nur Marie|nur Christian|keine echten Gesichter/);
  assert.match(EXPLICIT_OK_RULE, /Fiktive KI-Figuren dürfen explizit dargestellt werden/);
  assert.match(EXPLICIT_OK_RULE, /Ein Gast darf sich selbst explizit darstellen lassen/);
  assert.match(EXPLICIT_OK_RULE, /erkennbarer Dritter/);
  assert.match(EXPLICIT_OK_RULE, /Einwilligung/);
});

test('hemmungslos trägt die neue Linie, jugendfrei nicht', () => {
  const h = applyModeToSystem('Basis.', 'hemmungslos');
  const j = applyModeToSystem('Basis.', 'jugendfrei');
  assert.ok(h.includes(EXPLICIT_OK_RULE) && h.includes(CHAT_AGE_RULE));
  assert.ok(j.includes(CHAT_AGE_RULE) && j.includes(SFW_RULE));
  assert.ok(!j.includes(EXPLICIT_OK_RULE));
});

test('Kollab-Gemini-Prompt ohne „keine echten Personen/Gesichter“, mit neuer Linie', () => {
  const t = src('src/kollab-team.js');
  assert.doesNotMatch(t, /keine echten Personen\/Gesichter/);
  assert.match(t, /Fiktive KI-Figuren dürfen explizit dargestellt werden/);
  assert.match(t, /Ein Gast darf sich selbst explizit darstellen lassen/);
});
