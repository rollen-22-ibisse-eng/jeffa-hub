// Per-chat mode switch: 'jugendfrei' | 'hemmungslos'. Pure, testable.
import { isAdult as globalIsAdult } from './fsk.js';

export const MODES = { jugendfrei: 'jugendfrei', hemmungslos: 'hemmungslos' };

const isMode = (v) => v === MODES.jugendfrei || v === MODES.hemmungslos;

export function chatMode(conv, profile, isAdultFn = globalIsAdult) {
  const v = conv?.mode;
  if (isMode(v)) return v;
  // Harte Ausnahmen: Profil sperrt Erwachseneninhalte.
  if (profile?.adult === 'never' || profile?.adultMode === false) return MODES.jugendfrei;
  // 18+-Profile und altersgeprüfte Nutzer: Standard hemmungslos, außer der Gast wählt jugendfrei.
  if (profile?.adult === true) return MODES.hemmungslos;
  try { if (isAdultFn()) return MODES.hemmungslos; } catch {}
  return MODES.jugendfrei;
}

export function effectiveAdult(conv, profile, isAdultFn = globalIsAdult) {
  if (!isAdultFn()) return false;
  if (chatMode(conv, profile, isAdultFn) !== MODES.hemmungslos) return false;
  if (profile?.adultMode === false) return false;
  if (profile?.adult === 'never') return false;
  return true;
}

