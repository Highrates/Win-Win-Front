/**
 * Короткие предлоги/союзы не оставляем висеть в конце строки:
 * пробел после них → неразрывный пробел.
 * Lookbehind нужен, чтобы цепочки «и на …» обрабатывались за один проход
 * (global replace иначе стартует уже на следующем слове без префикса).
 */
const HANGING =
  'а|и|но|не|ни|же|ли|бы|то|в|во|на|к|ко|с|со|у|о|об|обо|по|из|за|от|до|для|при|без|над|под|про|через|как|что|это|или';

const HANGING_RE = new RegExp(`(?<=^|[\\s\\u00A0])(${HANGING})[\\s\\u00A0]+`, 'gi');

export function fixRussianHangingPrepositions(text: string): string {
  if (!text) return text;
  return text.replace(HANGING_RE, '$1\u00A0');
}
