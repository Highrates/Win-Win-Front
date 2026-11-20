"use client";

import type { Editor } from "@tiptap/react";
import {
  useCallback,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import type { RichBlockStrings } from "@/lib/richBlockI18n";
import type {
  RichBlockPickMediaFromLibrary,
  RichBlockUploadMedia,
} from "./richBlockTypes";
import { chainFocusNoScroll } from "./tiptapFocus";

function isDataUrl(src: string): boolean {
  return /^\s*data:/i.test(src);
}

type Args = {
  editorRef: MutableRefObject<Editor | null>;
  uploadMedia?: RichBlockUploadMedia;
  pickMediaFromLibrary?: RichBlockPickMediaFromLibrary;
  onUploadError?: (message: string) => void;
  value: string;
  onChangeRef: MutableRefObject<(value: string) => void>;
  strings: RichBlockStrings;
};

/**
 * Вставка/загрузка медиа. Без `uploadMedia` файлы с диска не превращаются в base64 —
 * только URL из upload или медиатеки.
 */
export function useRichBlockUpload({
  editorRef,
  uploadMedia,
  pickMediaFromLibrary,
  onUploadError,
  value,
  onChangeRef,
  strings: s,
}: Args) {
  const [uploadBusy, setUploadBusy] = useState<"image" | "video" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadMediaRef = useRef(uploadMedia);
  uploadMediaRef.current = uploadMedia;
  const onUploadErrorRef = useRef(onUploadError);
  onUploadErrorRef.current = onUploadError;
  const runUploadRef = useRef<((file: File) => Promise<void>) | null>(null);
  /** Позиция каретки до file dialog / медиатеки (иначе blur сбрасывает selection в начало). */
  const savedInsertPosRef = useRef<number | null>(null);

  const reportError = useCallback((msg: string) => {
    setUploadError(msg);
    onUploadErrorRef.current?.(msg);
  }, []);

  /** Вызвать синхронно на mousedown/click кнопки Фото/Видео — до открытия диалога. */
  const captureInsertCursor = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) {
      savedInsertPosRef.current = null;
      return;
    }
    savedInsertPosRef.current = ed.state.selection.from;
  }, [editorRef]);

  const insertSrcAtCursor = useCallback(
    (src: string, kind: "image" | "video") => {
      if (isDataUrl(src)) {
        reportError(s.noUploadHandler);
        return;
      }
      const ed = editorRef.current;
      if (!ed) {
        if (kind === "image") {
          onChangeRef.current(
            `${value}<img class="case-rich-media-image" src="${src}" alt="" />`,
          );
        } else {
          onChangeRef.current(
            `${value}<video class="case-rich-media-video" controls src="${src}"></video>`,
          );
        }
        return;
      }

      const at =
        savedInsertPosRef.current ?? ed.state.selection.from;
      savedInsertPosRef.current = null;
      const insertAt = Math.min(
        Math.max(0, at),
        ed.state.doc.content.size,
      );

      if (kind === "image") {
        /** Сразу с блоком подписи — не ждать клика по картинке. */
        chainFocusNoScroll(ed)
          ?.insertContentAt(insertAt, [
            { type: "image", attrs: { src, alt: "" } },
            { type: "imageCaption" },
          ])
          .run();
        queueMicrotask(() => {
          const editor = editorRef.current;
          if (!editor) return;
          /** Подпись сразу после вставленного image у insertAt (не «последняя в документе»). */
          const node = editor.state.doc.nodeAt(insertAt);
          if (node?.type.name === "image") {
            const captionPos = insertAt + node.nodeSize;
            const cap = editor.state.doc.nodeAt(captionPos);
            if (cap?.type.name === "imageCaption") {
              editor.commands.setTextSelection(captionPos + 1);
              return;
            }
          }
          let bestImg: number | null = null;
          editor.state.doc.descendants((n, pos) => {
            if (n.type.name === "image" && n.attrs.src === src) {
              if (
                bestImg == null ||
                Math.abs(pos - insertAt) < Math.abs(bestImg - insertAt)
              ) {
                bestImg = pos;
              }
            }
            return undefined;
          });
          if (bestImg != null) {
            const img = editor.state.doc.nodeAt(bestImg);
            if (img) {
              const captionPos = bestImg + img.nodeSize;
              if (
                editor.state.doc.nodeAt(captionPos)?.type.name ===
                "imageCaption"
              ) {
                editor.commands.setTextSelection(captionPos + 1);
              }
            }
          }
        });
      } else {
        chainFocusNoScroll(ed)
          ?.insertContentAt(insertAt, {
            type: "caseVideo",
            attrs: { src },
          })
          .run();
      }
    },
    [editorRef, onChangeRef, reportError, s.noUploadHandler, value],
  );

  const runUpload = useCallback(
    async (file: File) => {
      const kind = file.type.startsWith("image/")
        ? ("image" as const)
        : file.type.startsWith("video/")
          ? ("video" as const)
          : null;
      if (!kind) return;
      setUploadError(null);
      setUploadBusy(kind);
      try {
        const fn = uploadMediaRef.current;
        if (!fn) {
          reportError(s.noUploadHandler);
          return;
        }
        const url = await fn(file, kind);
        insertSrcAtCursor(url, kind);
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : kind === "image"
              ? s.errUploadImage
              : s.errUploadVideo;
        reportError(msg);
      } finally {
        setUploadBusy(null);
      }
    },
    [insertSrcAtCursor, reportError, s.errUploadImage, s.errUploadVideo, s.noUploadHandler],
  );

  runUploadRef.current = runUpload;

  const pickImageFromLibrary = useCallback(() => {
    if (!pickMediaFromLibrary) return;
    captureInsertCursor();
    setUploadError(null);
    setUploadBusy("image");
    void (async () => {
      try {
        const url = await pickMediaFromLibrary("image");
        if (url) insertSrcAtCursor(url, "image");
      } catch (e) {
        reportError(e instanceof Error ? e.message : s.errPickImage);
      } finally {
        setUploadBusy(null);
      }
    })();
  }, [
    captureInsertCursor,
    insertSrcAtCursor,
    pickMediaFromLibrary,
    reportError,
    s.errPickImage,
  ]);

  const pickVideoFromLibrary = useCallback(() => {
    if (!pickMediaFromLibrary) return;
    captureInsertCursor();
    setUploadError(null);
    setUploadBusy("video");
    void (async () => {
      try {
        const url = await pickMediaFromLibrary("video");
        if (url) insertSrcAtCursor(url, "video");
      } catch (e) {
        reportError(e instanceof Error ? e.message : s.errPickVideo);
      } finally {
        setUploadBusy(null);
      }
    })();
  }, [
    captureInsertCursor,
    insertSrcAtCursor,
    pickMediaFromLibrary,
    reportError,
    s.errPickVideo,
  ]);

  /** Файл с диска — только через uploadMedia; иначе ошибка (без FileReader/base64). */
  const insertImage = useCallback(
    (file: File | null) => {
      if (!file) return;
      setUploadError(null);
      if (!uploadMedia) {
        reportError(s.noUploadHandler);
        return;
      }
      if (pickMediaFromLibrary) {
        /** Кнопки ведут в медиатеку; file input в этом режиме скрыт. */
        return;
      }
      void runUpload(file);
    },
    [pickMediaFromLibrary, reportError, runUpload, s.noUploadHandler, uploadMedia],
  );

  const insertVideo = useCallback(
    (file: File | null) => {
      if (!file) return;
      setUploadError(null);
      if (!uploadMedia) {
        reportError(s.noUploadHandler);
        return;
      }
      if (pickMediaFromLibrary) return;
      void runUpload(file);
    },
    [pickMediaFromLibrary, reportError, runUpload, s.noUploadHandler, uploadMedia],
  );

  return {
    uploadBusy,
    uploadError,
    setUploadError,
    runUploadRef,
    captureInsertCursor,
    insertSrcAtCursor,
    pickImageFromLibrary,
    pickVideoFromLibrary,
    insertImage,
    insertVideo,
    busy: uploadBusy !== null,
    useLibraryPicker: !!pickMediaFromLibrary,
    /** Можно показать кнопки вставки: upload и/или медиатека. */
    canInsertMedia: Boolean(uploadMedia || pickMediaFromLibrary),
    /** File input: только upload без library picker. */
    showFilePickers: Boolean(uploadMedia && !pickMediaFromLibrary),
  };
}
