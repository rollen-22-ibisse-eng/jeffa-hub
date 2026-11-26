// v87b: vier Bremsen für explizite Inhalte gelöst (Seraphina, Persona/Karte, safe_mode, Gast-Referenzbilder).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { enforceImageMode } from '../src/mode-server.js';
import { chatMode, effectiveAdult, MODES } from '../apps/shared/mode.js';

const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('Seraphina-Erwachsenenprompt erlaubt explizite Inhalte und schützt Minderjährige', () => {
  const t = src('apps/chat/profiles.js');
  assert.doesNotMatch(t, /Bleib geschmackvoll und andeutend statt explizit/);
  assert.match(t, /systemPromptAdult: 'Du bist Seraphina[\s\S]*Explizite, freizügige und erotische Inhalte zwischen Erwachsenen sind erlaubt/);
  assert.match(t, /niemanden minderjährig oder kindlich darstellen/);
});

test('Persona- und Karten-Generator: keine pauschale Explizit-Sperre, Erwachsene bleiben Pflicht', () => {
  const persona = src('functions/api/persona.ts');
  const card = src('functions/api/card/[[path]].ts');
  assert.doesNotMatch(persona, /Keine expliziten sexuellen Inhalte\. Alle Charaktere/);
  assert.match(persona, /Explizite Inhalte mit erwachsenen Figuren sind erlaubt/);
  assert.match(persona, /Antworte jugendfrei: keine sexuellen oder expliziten Inhalte/);
  assert.match(persona, /Niemals Minderjährige oder kindliche Darstellungen/);
  assert.doesNotMatch(card, /Keine expliziten Inhalte/);
  assert.match(card, /Explizite Inhalte mit erwachsenen Figuren sind erlaubt/);
  assert.match(card, /Niemals Minderjährige oder kindliche Darstellungen/);
});

test('safe_mode / enforceImageMode: Jugendfrei bleibt wirksam, sonst kein Downgrade', () => {
  assert.equal(enforceImageMode({ adult: true, mode: 'jugendfrei' }).adult, false);
  assert.equal(enforceImageMode({ adult: true, mode: 'hemmungslos' }).adult, true);
  assert.equal(enforceImageMode({ adult: true, mode: 'sfw' }).adult, false);
  assert.equal(enforceImageMode({ adult: true }).adult, true);
  const handler = src('src/bild/image-handler.ts');
  assert.match(handler, /sfwChosen \? true : \(body\.adult === true \? false/);
  const img = src('src/imgsvc-image.ts');
  assert.match(img, /safe_mode: !body\.adult/);
});

test('Referenzbilder: Gäste statt nur Admin, Einwilligung serverseitig Pflicht, Altersschutz bleibt', () => {
  const api = src('functions/api/refs/[[path]].ts');
  assert.match(api, /requireRole\(ctx, "read"\)/);
  assert.match(api, /adultConsent !== true/);
  assert.match(api, /consent_required/);
  assert.match(api, /if \(!isAdmin\) return j\(403, \{ error: "forbidden" \}\)/);
  const ui = src('apps/chat/refs.js');
  assert.match(ui, /confirmAdultConsent/);
  assert.match(ui, /Ich bestätige das/);
  assert.match(ui, /adultConsent: true/);
  const profiles = src('apps/chat/profiles.js');
  assert.doesNotMatch(profiles, /Nur mit Admin-Entsperrung/);
  const img = src('src/imgsvc-image.ts');
  assert.match(img, /canRead && \(refMode === "face" \|\| refMode === "figur"\)/);
  assert.match(img, /minorRisk\(profile, resolved\).*youthRisk\(lookUsed\)/);
  const look = src('apps/chat/look.js');
  assert.doesNotMatch(look, /nur mit Admin-Entsperrung/);
});

test('gewähltes Jugendfrei bleibt jugendfrei, auch wenn der Gast altersgeprüft ist', () => {
  const on = () => true;
  assert.equal(chatMode({ mode: 'jugendfrei' }, { adult: true }, on), MODES.jugendfrei);
  assert.equal(effectiveAdult({ mode: 'jugendfrei' }, { adult: true }, on), false);
});
