import type { Editor } from "@tiptap/react";
import type { Transaction } from "@tiptap/pm/state";

/** Глубина подавления ProseMirror scrollToSelection (пресеты медиа / тулбар). */
let scrollSuppressDepth = 0;

export function isRichBlockScrollSuppressed() {
  return scrollSuppressDepth > 0;
}

function bumpScrollSuppress() {
  scrollSuppressDepth += 1;
  // DOMObserver.flush / selectionchange часто после текущего тика.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scrollSuppressDepth = Math.max(0, scrollSuppressDepth - 1);
    });
  });
}

/** Фокус DOM без прокрутки страницы к каретке / редактору. */
export function focusDomNoScroll(editor: Editor) {
  const dom = editor.view.dom as HTMLElement;
  try {
    dom.focus({ preventScroll: true });
  } catch {
    dom.focus();
  }
}

/**
 * Chain без TipTap focus() — тот делает rAF + view.focus() и часто
 * прокручивает страницу к редактору. ToolBtn уже preventDefault на mousedown,
 * selection сохраняется; если фокуса нет — preventScroll DOM focus.
 */
export function chainFocusNoScroll(editor: Editor | null | undefined) {
  if (!editor) return null;
  if (!editor.view.hasFocus()) {
    focusDomNoScroll(editor);
  }
  bumpScrollSuppress();
  return editor.chain();
}

/**
 * Dispatch транзакции без tr.scrollIntoView() и с подавлением
 * EditorView.scrollToSelection (иначе страница прыгает к картинке).
 */
export function dispatchTrNoScroll(
  editor: Editor,
  build: (tr: Transaction) => Transaction | null | undefined,
) {
  const { state, view } = editor;
  const next = build(state.tr);
  if (!next) return false;
  bumpScrollSuppress();
  view.dispatch(next);
  if (!view.hasFocus()) focusDomNoScroll(editor);
  return true;
}
