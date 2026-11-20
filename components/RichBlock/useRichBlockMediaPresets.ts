"use client";

import type { Editor } from "@tiptap/react";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import {
  useCallback,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
} from "react";
import { type RichAlign, type RichSize } from "./caseRichExtensions";
import { chainFocusNoScroll, dispatchTrNoScroll } from "./tiptapFocus";

function dataAlignFromToolbarCls(cls: string): RichAlign {
  if (cls === "case-media-left") return "left";
  if (cls === "case-media-center") return "center";
  if (cls === "case-media-right") return "right";
  if (cls === "case-media-wrap-end") return "wrap-end";
  if (cls === "case-media-wrap") return "wrap";
  return "left";
}

function sizeFromToolbarCls(cls: string): RichSize {
  if (cls === "case-media-small") return "small";
  if (cls === "case-media-medium") return "medium";
  return "full";
}

function findMediaPosByEl(
  editor: Editor,
  media: HTMLElement,
): number | null {
  const mediaSrc = media.getAttribute("src");
  let foundPos: number | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (foundPos != null) return false;
    if (
      node.type.name === "image" &&
      media instanceof HTMLImageElement &&
      node.attrs.src === mediaSrc
    ) {
      foundPos = pos;
      return false;
    }
    if (
      node.type.name === "caseVideo" &&
      media instanceof HTMLVideoElement &&
      node.attrs.src === mediaSrc
    ) {
      foundPos = pos;
      return false;
    }
    return undefined;
  });
  return foundPos;
}

type Args = {
  editorRef: MutableRefObject<Editor | null>;
  allowMedia: boolean;
  mediaToolbarClass: string;
  formatToolbarClass: string;
  proseMirrorClass: string;
};

/** Выбор медиа в документе, пресеты size/align, автоподпись. */
export function useRichBlockMediaPresets({
  editorRef,
  allowMedia,
  mediaToolbarClass,
  formatToolbarClass,
  proseMirrorClass,
}: Args) {
  const [selectedMediaPos, setSelectedMediaPos] = useState<number | null>(null);
  const [activeSizePreset, setActiveSizePreset] = useState<RichSize | null>(
    null,
  );
  const [activeAlignPreset, setActiveAlignPreset] = useState<RichAlign | null>(
    null,
  );
  const [selectedImageAlt, setSelectedImageAltState] = useState("");

  const syncSelectionRef = useRef<(ed: Editor) => void>(() => {});

  const applyMediaUiState = useCallback(
    (pos: number, node: { type: { name: string }; attrs: Record<string, unknown> }) => {
      setSelectedMediaPos(pos);
      if (node.type.name === "image") {
        setActiveAlignPreset((node.attrs.align as RichAlign | null) ?? null);
        setActiveSizePreset((node.attrs.size as RichSize | null) ?? null);
        setSelectedImageAltState(String(node.attrs.alt ?? ""));
      } else {
        setActiveAlignPreset(null);
        setActiveSizePreset(null);
        setSelectedImageAltState("");
      }
    },
    [],
  );

  const clearMediaUiState = useCallback(() => {
    setSelectedMediaPos(null);
    setActiveAlignPreset(null);
    setActiveSizePreset(null);
    setSelectedImageAltState("");
  }, []);

  const syncSelectionFromEditor = useCallback(
    (ed: Editor) => {
      const { from } = ed.state.selection;
      const node = ed.state.doc.nodeAt(from);
      if (node?.type.name === "image" || node?.type.name === "caseVideo") {
        applyMediaUiState(from, node);
        return;
      }
      if (ed.state.selection instanceof NodeSelection) {
        const n = ed.state.selection.node;
        if (n.type.name === "image" || n.type.name === "caseVideo") {
          applyMediaUiState(ed.state.selection.from, n);
          return;
        }
      }
      const $from = ed.state.selection.$from;
      for (let d = $from.depth; d > 0; d--) {
        const n = $from.node(d);
        if (n.type.name === "image" || n.type.name === "caseVideo") {
          applyMediaUiState($from.before(d), n);
          return;
        }
      }
      /**
       * Клик/mouseup часто ставит каретку в подпись сразу под фото —
       * это всё ещё «работа с этим фото», не сброс media-toolbar.
       */
      if ($from.parent.type.name === "imageCaption") {
        const captionPos = $from.before($from.depth);
        const $cap = ed.state.doc.resolve(captionPos);
        const before = $cap.nodeBefore;
        if (before?.type.name === "image") {
          applyMediaUiState(captionPos - before.nodeSize, before);
          return;
        }
      }
      clearMediaUiState();
    },
    [applyMediaUiState, clearMediaUiState],
  );

  syncSelectionRef.current = syncSelectionFromEditor;

  /**
   * Создать caption если нет. По умолчанию НЕ переводит каретку в подпись —
   * иначе клик по фото сразу сбрасывает NodeSelection (и media-toolbar).
   */
  const ensureCaptionAfterImage = useCallback(
    (imgPos: number, focusCaption = false) => {
      const editor = editorRef.current;
      if (!editor) return;
      const node = editor.state.doc.nodeAt(imgPos);
      if (!node || node.type.name !== "image") return;
      const after = imgPos + node.nodeSize;
      const next = editor.state.doc.nodeAt(after);
      const align = (node.attrs.align as RichAlign | null) ?? null;
      const size = (node.attrs.size as RichSize | null) ?? null;

      if (next?.type.name === "imageCaption") {
        if (focusCaption) {
          chainFocusNoScroll(editor)?.setTextSelection(after + 1).run();
        }
        return;
      }

      const captionType = editor.schema.nodes.imageCaption;
      if (!captionType) return;

      dispatchTrNoScroll(editor, (tr) => {
        const captionNode = captionType.create({ align, size });
        tr = tr.insert(after, captionNode);
        if (focusCaption) {
          tr = tr.setSelection(
            TextSelection.near(tr.doc.resolve(after + 1)),
          );
        } else {
          tr = tr.setSelection(NodeSelection.create(tr.doc, imgPos));
        }
        return tr;
      });
    },
    [editorRef],
  );

  const applyMediaPreset = useCallback(
    (cls: string, group: "size" | "align") => {
      const editor = editorRef.current;
      if (!editor || selectedMediaPos == null) return;
      const node = editor.state.doc.nodeAt(selectedMediaPos);
      if (!node) return;
      if (node.type.name === "caseVideo") return;
      if (node.type.name !== "image") return;

      const curAlign = (node.attrs.align as RichAlign | null) ?? null;
      const curSize = (node.attrs.size as RichSize | null) ?? null;

      let nextAlign: RichAlign | null =
        group === "align" ? dataAlignFromToolbarCls(cls) : curAlign;
      let nextSize: RichSize | null =
        group === "size" ? sizeFromToolbarCls(cls) : curSize;

      const isWrap =
        nextAlign === "wrap" || nextAlign === "wrap-end";
      const wasWrap = curAlign === "wrap" || curAlign === "wrap-end";

      // wrap + full в CSS = float:none — тихо ломает обтекание.
      if (group === "align" && isWrap && (!nextSize || nextSize === "full")) {
        nextSize = "medium";
      }
      // L при активном wrap → снять обтекание, оставить full по центру.
      if (group === "size" && nextSize === "full" && wasWrap) {
        nextAlign = "center";
      }

      const pos = selectedMediaPos;
      dispatchTrNoScroll(editor, (tr) => {
        tr = tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          align: nextAlign,
          size: nextSize,
        });
        const after = pos + node.nodeSize;
        const next = tr.doc.nodeAt(after);
        if (next?.type.name === "imageCaption") {
          tr = tr.setNodeMarkup(after, undefined, {
            ...next.attrs,
            align: nextAlign,
            size: nextSize,
          });
        }
        // Держим NodeSelection на картинке — без scrollIntoView.
        tr = tr.setSelection(NodeSelection.create(tr.doc, pos));
        return tr;
      });

      setActiveSizePreset(nextSize);
      setActiveAlignPreset(nextAlign);
    },
    [editorRef, selectedMediaPos],
  );

  /** mousedown: выбрать медиа до drag/click TipTap; без увода в caption. */
  const handleEditorMouseDownCapture = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      const editor = editorRef.current;
      if (!allowMedia || !editor) return;
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (
        target?.closest(`.${mediaToolbarClass}`) ||
        target?.closest(`.${formatToolbarClass}`)
      ) {
        return;
      }
      if (!target?.closest(`.${proseMirrorClass}`)) return;

      const media = target?.closest("img,video") as HTMLElement | null;
      if (!media) {
        return;
      }

      const pos = findMediaPosByEl(editor, media);
      if (pos == null) return;

      const n = editor.state.doc.nodeAt(pos);
      if (!n) return;

      // Не даём браузеру начать drag-select / потерять клик — ставим NodeSelection сами.
      e.preventDefault();
      e.stopPropagation();

      dispatchTrNoScroll(editor, (tr) =>
        tr.setSelection(NodeSelection.create(tr.doc, pos)),
      );
      applyMediaUiState(pos, n);
      // Не вызываем ensureCaption здесь: вставка caption между mousedown и click
      // сдвигает DOM и часто уводит каретку в подпись / сбрасывает тулбар.
    },
    [
      allowMedia,
      applyMediaUiState,
      editorRef,
      formatToolbarClass,
      mediaToolbarClass,
      proseMirrorClass,
    ],
  );

  /** click: закрепить выбор медиа; клик по подписи = то же фото; иначе sync selection. */
  const handleEditorClickCapture = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      const editor = editorRef.current;
      if (!allowMedia || !editor) return;
      const target = e.target as HTMLElement | null;
      if (
        target?.closest(`.${mediaToolbarClass}`) ||
        target?.closest(`.${formatToolbarClass}`)
      ) {
        return;
      }
      if (!target?.closest(`.${proseMirrorClass}`)) return;

      const media = target?.closest("img,video") as HTMLElement | null;
      if (media) {
        const pos = findMediaPosByEl(editor, media);
        if (pos != null) {
          const n = editor.state.doc.nodeAt(pos);
          if (n) {
            dispatchTrNoScroll(editor, (tr) =>
              tr.setSelection(NodeSelection.create(tr.doc, pos)),
            );
            applyMediaUiState(pos, n);
          }
        }
        return;
      }

      if (target?.closest("p.case-rich-image-caption")) {
        // Каретка обычно уже в caption после клика → sync подхватит imageBefore.
        queueMicrotask(() => {
          const ed = editorRef.current;
          if (ed) syncSelectionFromEditor(ed);
        });
        return;
      }

      syncSelectionFromEditor(editor);
    },
    [
      allowMedia,
      applyMediaUiState,
      editorRef,
      formatToolbarClass,
      mediaToolbarClass,
      proseMirrorClass,
      syncSelectionFromEditor,
    ],
  );

  const addCaptionToSelectedImage = useCallback(() => {
    if (selectedMediaPos == null) return;
    const editor = editorRef.current;
    const node = editor?.state.doc.nodeAt(selectedMediaPos);
    if (!node || node.type.name !== "image") return;
    ensureCaptionAfterImage(selectedMediaPos, true);
  }, [editorRef, ensureCaptionAfterImage, selectedMediaPos]);

  const setSelectedImageAlt = useCallback(
    (alt: string) => {
      setSelectedImageAltState(alt);
      const editor = editorRef.current;
      if (!editor || selectedMediaPos == null) return;
      const node = editor.state.doc.nodeAt(selectedMediaPos);
      if (!node || node.type.name !== "image") return;
      const pos = selectedMediaPos;
      dispatchTrNoScroll(editor, (tr) => {
        tr = tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          alt,
        });
        tr = tr.setSelection(NodeSelection.create(tr.doc, pos));
        return tr;
      });
    },
    [editorRef, selectedMediaPos],
  );

  const deleteSelectedMedia = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || selectedMediaPos == null) return;
    const node = editor.state.doc.nodeAt(selectedMediaPos);
    if (!node || (node.type.name !== "image" && node.type.name !== "caseVideo")) {
      return;
    }
    const from = selectedMediaPos;
    let to = from + node.nodeSize;
    if (node.type.name === "image") {
      const next = editor.state.doc.nodeAt(to);
      if (next?.type.name === "imageCaption") {
        to += next.nodeSize;
      }
    }
    dispatchTrNoScroll(editor, (tr) => tr.delete(from, to));
    clearMediaUiState();
  }, [clearMediaUiState, editorRef, selectedMediaPos]);

  const selectedIsImage =
    selectedMediaPos != null &&
    editorRef.current?.state.doc.nodeAt(selectedMediaPos)?.type.name ===
      "image";

  return {
    activeSizePreset,
    activeAlignPreset,
    selectedImageAlt,
    syncSelectionRef,
    applyMediaPreset,
    handleEditorMouseDownCapture,
    handleEditorClickCapture,
    addCaptionToSelectedImage,
    setSelectedImageAlt,
    deleteSelectedMedia,
    hasMediaSelected: selectedMediaPos != null,
    selectedIsImage: Boolean(selectedIsImage),
  };
}
