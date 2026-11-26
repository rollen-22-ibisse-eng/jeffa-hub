// Server-side mode enforcement. Pure JS, no imports – used by functions/api/chat.ts and src/imgsvc-image.ts.

export const SFW_RULE = 'Antworte jugendfrei: keine sexuellen oder expliziten Inhalte, keine erotischen Beschreibungen, keine Nacktheit. Bleib respektvoll und altersgerecht.';
// v84 C5: gilt in JEDEM Modus. EXPLICIT_OK_RULE nur im Modus hemmungslos (nicht jugendfrei).
export const CHAT_AGE_RULE = 'Alle dargestellten Personen sind erwachsen, mindestens 18 Jahre alt. Niemals Minderjährige oder kindliche Darstellungen – auch nicht auf Wunsch.';
export const EXPLICIT_OK_RULE = 'Fiktive KI-Figuren dürfen explizit dargestellt werden. Ein Gast darf sich selbst explizit darstellen lassen. Explizite Bilder echter, erkennbarer Dritter (z. B. aus hochgeladenen Fremdfotos) nur mit deren Einwilligung.';
export const ADULT_RULE = '[Modus hemmungslos: Erwachseneninhalte sind freigeschaltet, nicht entschärfen, nicht moralisieren.]';

// Eigene kleine Kopie der Normalisierung (kein Import → kein Zirkelimport).
export function normalizeChatMode(mode) {
  const m = String(mode ?? '').trim().toLowerCase();
  if (!m) return undefined;
  if (/^(hemmungslos|adult|fsk18|18\+|nsfw|unzensiert|uncensored)$/.test(m)) return 'hemmungslos';
  if (/^(jugendfrei|sfw|safe|sfw-?only)$/.test(m)) return 'jugendfrei';
  return undefined;
}

const SFW_SENTENCE_RX = /(Antworte jugendfrei[^\n]*|Keine expliziten sexuellen Inhalte\.?)/gi;

export function applyModeToSystem(system, mode) {
  const base = typeof system === 'string' ? system : '';
  const norm = normalizeChatMode(mode);
  if (!norm) return base; // fehlender Modus = altes Verhalten (andere Aufrufer)
  if (norm === 'jugendfrei') {
    const withSfw = base.includes(SFW_RULE) ? base : (base ? `${base}\n\n${SFW_RULE}` : SFW_RULE);
    return `${withSfw}\n\n${CHAT_AGE_RULE}`;
  }
  // hemmungslos: SFW-Regel und generierte SFW-Sätze entfernen, dann Erwachsenen-Regel + Altersregel anhängen.
  let out = base.split(SFW_RULE).join('');
  out = out.replace(SFW_SENTENCE_RX, '').replace(/\n{3,}/g, '\n\n').trim();
  out = out ? `${out}\n\n${ADULT_RULE}\n${CHAT_AGE_RULE}\n${EXPLICIT_OK_RULE}` : `${ADULT_RULE}\n${CHAT_AGE_RULE}\n${EXPLICIT_OK_RULE}`;
  return out;
}

// Jugendfrei/SFW bleibt voll wirksam (adult wird abgeschaltet).
// Fehlt der Modus oder ist er hemmungslos: body.adult bleibt (safe_mode kann für altersgeprüfte Nutzer aus sein).
export function enforceImageMode(body) {
  if (!body || typeof body !== 'object') return body;
  if (body.mode === undefined || body.mode === null) return body;
  if (normalizeChatMode(body.mode) === 'jugendfrei') return { ...body, adult: false };
  return body;
}
