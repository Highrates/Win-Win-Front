"use client";

import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useOptionalAdminLocale } from "@/lib/admin-i18n/adminLocaleContext";
import {
  detectRichBlockLocale,
  richBlockStrings,
  type RichBlockLocale,
} from "@/lib/richBlockI18n";
import {
  createRichEditorExtensions,
  normalizeAccountRichHtml,
} from "./createRichEditorExtensions";
import { RichBlockLinkDialog } from "./RichBlockLinkDialog";
import { RichBlockToolbar } from "./RichBlockToolbar";
import type {
  RichBlockPickMediaFromLibrary,
  RichBlockUploadMedia,
  RichBlockVariant,
} from "./richBlockTypes";
import { normalizeRichLinkUrl } from "./richLinkUrl";
import {
  chainFocusNoScroll,
  isRichBlockScrollSuppressed,
} from "./tiptapFocus";
import { useRichBlockMedia } from "./useRichBlockMedia";
import styles from "./RichBlock.module.css";

export type {
  RichBlockPickMediaFromLibrary,
  RichBlockUploadMedia,
  RichBlockVariant,
} from "./richBlockTypes";

type RichBlockProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Если задано — изображения/видео грузятся на сервер (S3), в HTML попадают URL, а не base64. */
  uploadMedia?: RichBlockUploadMedia;
  /** Если задано — «+ Изображение / + Видео» открывают выбор из медиатеки вместо файла с диска. */
  pickMediaFromLibrary?: RichBlockPickMediaFromLibrary;
  /** Дополнительно к сообщению под тулбаром (например, общий toast в родителе). */
  onUploadError?: (message: string) => void;
  /** false — только текст (без тулбара медиа и вставок изображений/видео). */
  allowMedia?: boolean;
  /** Скин хрома редактора: админка vs ЛК. HTML-контракт один и тот же. */
  variant?: RichBlockVariant;
  /** Явная локаль; иначе admin locale из AdminChrome, иначе ru. */
  locale?: RichBlockLocale;
};

export function RichBlock({
  value,
  onChange,
  placeholder,
  uploadMedia,
  pickMediaFromLibrary,
  onUploadError,
  allowMedia = true,
  variant = "account",
  locale: localeProp,
}: RichBlockProps) {
  const fieldId = useId();
  const imageInputId = `${fieldId}-rich-img`;
  const videoInputId = `${fieldId}-rich-vid`;
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const adminLocale = useOptionalAdminLocale();
  const [detectedLocale, setDetectedLocale] = useState<RichBlockLocale>("ru");
  useEffect(() => {
    setDetectedLocale(detectRichBlockLocale("ru"));
  }, []);
  const locale: RichBlockLocale =
    localeProp ?? adminLocale?.locale ?? detectedLocale;
  const s = useMemo(() => richBlockStrings(locale), [locale]);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const wrapRef = useRef<HTMLDivElement>(null);
  const toolbarStackRef = useRef<HTMLDivElement>(null);
  const skipNextExternalSync = useRef(false);
  const editorRef = useRef<Editor | null>(null);

  const normalizeHtml = useMemo(
    () =>
      variant === "account"
        ? normalizeAccountRichHtml
        : (html: string) => html,
    [variant],
  );

  const extensions = useMemo(
    () =>
      createRichEditorExtensions({
        placeholder: placeholder || "",
        variant,
        captionPlaceholder: s.captionPlaceholder,
      }),
    [placeholder, variant, s.captionPlaceholder],
  );

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("https://");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkHadExisting, setLinkHadExisting] = useState(false);

  const media = useRichBlockMedia({
    editorRef,
    allowMedia,
    uploadMedia,
    pickMediaFromLibrary,
    onUploadError,
    value,
    onChangeRef,
    mediaToolbarClass: styles.richMediaToolbar,
    formatToolbarClass: styles.richEditorStickyToolbars,
    proseMirrorClass: styles.proseMirror,
    strings: s,
  });

  const editor = useEditor(
    {
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      extensions,
      content: normalizeHtml(value || ""),
      editorProps: {
        attributes: {
          class: styles.proseMirror,
          "aria-label": s.editorAria,
        },
        /** Не скроллить окно к atom-медиа / при пресетах (S/M/L). */
        handleScrollToSelection: (view) => {
          if (isRichBlockScrollSuppressed()) return true;
          if (view.state.selection instanceof NodeSelection) return true;
          return false;
        },
        handlePaste: (_view, event) => {
          if (!allowMedia || !uploadMedia) return false;
          const cd = event.clipboardData;
          if (!cd) return false;
          const files = [
            ...(cd.files ? Array.from(cd.files) : []),
            ...Array.from(cd.items)
              .filter((i) => i.kind === "file")
              .map((i) => i.getAsFile())
              .filter((f): f is File => !!f),
          ];
          for (const f of files) {
            if (f.type.startsWith("image/") || f.type.startsWith("video/")) {
              event.preventDefault();
              void media.runUploadRef.current?.(f);
              return true;
            }
          }
          return false;
        },
        handleDrop: (_view, event) => {
          if (!allowMedia || !uploadMedia) return false;
          const files = event.dataTransfer?.files;
          if (!files?.length) return false;
          for (const f of Array.from(files)) {
            if (f.type.startsWith("image/") || f.type.startsWith("video/")) {
              event.preventDefault();
              void media.runUploadRef.current?.(f);
              return true;
            }
          }
          return false;
        },
      },
      onUpdate: ({ editor: ed }) => {
        skipNextExternalSync.current = true;
        onChangeRef.current(normalizeHtml(ed.getHTML()));
      },
      onSelectionUpdate: ({ editor: ed }) => {
        media.syncSelectionRef.current(ed);
      },
    },
    [extensions, allowMedia, uploadMedia, s.editorAria, normalizeHtml],
  );

  editorRef.current = editor;

  useEffect(() => {
    if (!editor) return;
    if (skipNextExternalSync.current) {
      skipNextExternalSync.current = false;
      return;
    }
    const next = normalizeHtml(value || "");
    const current = editor.getHTML();
    if (next === current) return;
    if (!next && (current === "<p></p>" || current === "")) return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [value, editor, normalizeHtml]);

  const formatState = useEditorState({
    editor,
    selector: (ctx) => {
      const ed = ctx.editor;
      if (!ed) {
        return {
          bold: false,
          italic: false,
          underline: false,
          bulletList: false,
          orderedList: false,
          blockquote: false,
          link: false,
          h1: false,
          h2: false,
          h3: false,
          alignLeft: false,
          alignCenter: false,
          alignRight: false,
          canUndo: false,
          canRedo: false,
        };
      }
      return {
        bold: ed.isActive("bold"),
        italic: ed.isActive("italic"),
        underline: ed.isActive("underline"),
        bulletList: ed.isActive("bulletList"),
        orderedList: ed.isActive("orderedList"),
        blockquote: ed.isActive("blockquote"),
        link: ed.isActive("link"),
        h1: ed.isActive("heading", { level: 1 }),
        h2: ed.isActive("heading", { level: 2 }),
        h3: ed.isActive("heading", { level: 3 }),
        alignLeft: ed.isActive({ textAlign: "left" }),
        alignCenter: ed.isActive({ textAlign: "center" }),
        alignRight: ed.isActive({ textAlign: "right" }),
        canUndo: ed.can().undo(),
        canRedo: ed.can().redo(),
      };
    },
  });

  const openLinkDialog = () => {
    if (!editor) return;
    const prev = (editor.getAttributes("link").href as string | undefined) || "";
    setLinkHadExisting(Boolean(prev));
    setLinkDraft(prev || "https://");
    setLinkError(null);
    setLinkOpen(true);
  };

  const closeLinkDialog = () => {
    setLinkOpen(false);
    setLinkError(null);
  };

  const applyLinkFromDialog = () => {
    if (!editor) return;
    const normalized = normalizeRichLinkUrl(linkDraft, s);
    if (!normalized.ok) {
      setLinkError(normalized.error);
      return;
    }
    chainFocusNoScroll(editor)
      ?.extendMarkRange("link")
      .setLink({ href: normalized.href })
      .run();
    closeLinkDialog();
  };

  const removeLinkFromDialog = () => {
    if (!editor) return;
    chainFocusNoScroll(editor)
      ?.extendMarkRange("link")
      .unsetLink()
      .run();
    closeLinkDialog();
  };

  return (
    <div
      ref={wrapRef}
      className={`${styles.richEditorWrap} ${
        variant === "admin" ? styles.variantAdmin : styles.variantAccount
      }`}
      onMouseDownCapture={
        allowMedia ? media.handleEditorMouseDownCapture : undefined
      }
      onClickCapture={allowMedia ? media.handleEditorClickCapture : undefined}
    >
      <RichBlockToolbar
        toolbarStackRef={toolbarStackRef}
        variant={variant}
        allowMedia={allowMedia}
        editor={editor}
        formatState={formatState}
        uploadMedia={uploadMedia}
        useLibraryPicker={media.useLibraryPicker}
        canInsertMedia={media.canInsertMedia}
        busy={media.busy}
        uploadBusy={media.uploadBusy}
        hasMediaSelected={media.hasMediaSelected}
        selectedIsImage={media.selectedIsImage}
        selectedImageAlt={media.selectedImageAlt}
        uploadError={media.uploadError}
        activeSizePreset={media.activeSizePreset}
        activeAlignPreset={media.activeAlignPreset}
        strings={s}
        onCaptureInsertCursor={media.captureInsertCursor}
        onPickImageFromLibrary={media.pickImageFromLibrary}
        onPickVideoFromLibrary={media.pickVideoFromLibrary}
        imageInputId={imageInputId}
        videoInputId={videoInputId}
        onPickImageFile={() => imageInputRef.current?.click()}
        onPickVideoFile={() => videoInputRef.current?.click()}
        onApplyMediaPreset={media.applyMediaPreset}
        onAddCaption={media.addCaptionToSelectedImage}
        onSelectedImageAltChange={media.setSelectedImageAlt}
        onDeleteMedia={media.deleteSelectedMedia}
        onOpenLinkDialog={openLinkDialog}
      />
      {allowMedia && media.showFilePickers ? (
        <>
          <input
            ref={imageInputRef}
            id={imageInputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className={styles.hiddenPicker}
            tabIndex={-1}
            aria-label={s.photo}
            disabled={media.busy}
            onChange={(e) => {
              media.insertImage(e.target.files?.[0] ?? null);
              e.currentTarget.value = "";
            }}
          />
          <input
            ref={videoInputRef}
            id={videoInputId}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            className={styles.hiddenPicker}
            tabIndex={-1}
            aria-label={s.video}
            disabled={media.busy}
            onChange={(e) => {
              media.insertVideo(e.target.files?.[0] ?? null);
              e.currentTarget.value = "";
            }}
          />
        </>
      ) : null}
      {editor ? (
        <EditorContent editor={editor} className={styles.editorShell} />
      ) : (
        <div
          className={styles.editorLoading}
          aria-busy="true"
          aria-label={s.editorLoading}
        >
          <div className={styles.loadingToolbar} aria-hidden>
            <span className={styles.loadingChip} />
            <span className={styles.loadingChip} />
            <span className={styles.loadingChipWide} />
            <span className={styles.loadingChip} />
            <span className={styles.loadingChip} />
          </div>
          <div className={styles.loadingBody} aria-hidden>
            <span className={styles.loadingLine} />
            <span className={`${styles.loadingLine} ${styles.loadingLineShort}`} />
            <span className={styles.loadingLine} />
            <span className={`${styles.loadingLine} ${styles.loadingLineMid}`} />
          </div>
        </div>
      )}
      <RichBlockLinkDialog
        open={linkOpen}
        fieldId={fieldId}
        variant={variant}
        linkDraft={linkDraft}
        linkError={linkError}
        linkHadExisting={linkHadExisting}
        strings={s}
        onDraftChange={setLinkDraft}
        onClearError={() => setLinkError(null)}
        onClose={closeLinkDialog}
        onSubmit={applyLinkFromDialog}
        onRemove={removeLinkFromDialog}
      />
    </div>
  );
}
