"use client";

import type { Editor } from "@tiptap/react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import type { RichBlockStrings } from "@/lib/richBlockI18n";
import type { RichAlign, RichSize } from "./caseRichExtensions";
import type {
  RichBlockUploadMedia,
  RichBlockVariant,
} from "./richBlockTypes";
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconBold,
  IconBulletList,
  IconClear,
  IconHorizontalRule,
  IconImage,
  IconItalic,
  IconLink,
  IconMore,
  IconOrderedList,
  IconQuote,
  IconRedo,
  IconShortcuts,
  IconTrash,
  IconUnderline,
  IconUndo,
  IconVideo,
} from "./RichBlockToolbarIcons";
import { chainFocusNoScroll } from "./tiptapFocus";
import styles from "./RichBlock.module.css";

export type RichFormatState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  link: boolean;
  h1: boolean;
  h2: boolean;
  h3: boolean;
  alignLeft: boolean;
  alignCenter: boolean;
  alignRight: boolean;
  canUndo: boolean;
  canRedo: boolean;
};

const MEDIA_HINT_STORAGE_KEY = "richblock-media-hint-dismissed";
const MORE_MQ = "(min-width: 1100px)";

function keepEditorSelection(e: ReactMouseEvent) {
  e.preventDefault();
}

function readModKey(): string {
  if (typeof navigator === "undefined") return "Ctrl+";
  const mac =
    /Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
    /Mac OS/.test(navigator.userAgent);
  return mac ? "⌘" : "Ctrl+";
}

function ToolBtn({
  label,
  title,
  active,
  disabled,
  busy,
  onClick,
  onMouseDownExtra,
  children,
  className,
  ariaControls,
}: {
  label: string;
  title?: string;
  active?: boolean;
  disabled?: boolean;
  busy?: boolean;
  onClick?: () => void;
  /** После keepEditorSelection — напр. сохранить курсор до file dialog. */
  onMouseDownExtra?: () => void;
  children?: ReactNode;
  className?: string;
  ariaControls?: string;
}) {
  const pressed = Boolean(active);
  const tip = title ?? label;
  return (
    <button
      type="button"
      title={tip}
      aria-label={tip}
      aria-pressed={pressed}
      aria-busy={busy ? true : undefined}
      aria-controls={ariaControls}
      className={[
        styles.richToolBtn,
        styles.toolIconBtn,
        pressed ? styles.richToolBtnActive : "",
        busy ? styles.toolBtnDisabled : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled || busy}
      onMouseDown={(e) => {
        keepEditorSelection(e);
        onMouseDownExtra?.();
      }}
      onClick={onClick}
    >
      {children ?? label}
    </button>
  );
}

function ToolGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.toolGroup} role="group" aria-label={label}>
      {children}
    </div>
  );
}

type ConfirmKind = "clear" | "delete" | null;

type Props = {
  toolbarStackRef: Ref<HTMLDivElement>;
  variant: RichBlockVariant;
  allowMedia: boolean;
  editor: Editor | null;
  formatState: RichFormatState | null;
  uploadMedia?: RichBlockUploadMedia;
  useLibraryPicker: boolean;
  canInsertMedia: boolean;
  busy: boolean;
  uploadBusy: "image" | "video" | null;
  hasMediaSelected: boolean;
  selectedIsImage: boolean;
  selectedImageAlt: string;
  uploadError: string | null;
  activeSizePreset: RichSize | null;
  activeAlignPreset: RichAlign | null;
  imageInputId?: string;
  videoInputId?: string;
  strings: RichBlockStrings;
  onCaptureInsertCursor: () => void;
  onPickImageFromLibrary: () => void;
  onPickVideoFromLibrary: () => void;
  onPickImageFile: () => void;
  onPickVideoFile: () => void;
  onApplyMediaPreset: (cls: string, group: "size" | "align") => void;
  onAddCaption: () => void;
  onSelectedImageAltChange: (alt: string) => void;
  onDeleteMedia: () => void;
  onOpenLinkDialog: () => void;
};

export function RichBlockToolbar({
  toolbarStackRef,
  variant,
  allowMedia,
  editor,
  formatState,
  uploadMedia,
  useLibraryPicker,
  canInsertMedia,
  busy,
  uploadBusy,
  hasMediaSelected,
  selectedIsImage,
  selectedImageAlt,
  uploadError,
  activeSizePreset,
  activeAlignPreset,
  imageInputId,
  videoInputId,
  strings: s,
  onCaptureInsertCursor,
  onPickImageFromLibrary,
  onPickVideoFromLibrary,
  onPickImageFile,
  onPickVideoFile,
  onApplyMediaPreset,
  onAddCaption,
  onSelectedImageAltChange,
  onDeleteMedia,
  onOpenLinkDialog,
}: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const moreRowId = useId();
  const [stuck, setStuck] = useState(false);
  const [mod, setMod] = useState("Ctrl+");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [mediaHintVisible, setMediaHintVisible] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [wideLayout, setWideLayout] = useState(false);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);

  useEffect(() => {
    setMod(readModKey());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(MORE_MQ);
    const sync = () => setWideLayout(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!allowMedia) return;
    try {
      if (sessionStorage.getItem(MEDIA_HINT_STORAGE_KEY) === "1") return;
    } catch {
      /* private mode */
    }
    setMediaHintVisible(true);
  }, [allowMedia]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setStuck(!entry?.isIntersecting);
      },
      { threshold: [1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const dismissMediaHint = () => {
    setMediaHintVisible(false);
    try {
      sessionStorage.setItem(MEDIA_HINT_STORAGE_KEY, "1");
    } catch {
      /* private mode */
    }
  };

  const mediaSourceTitle = useLibraryPicker
    ? s.mediaSourceLibrary
    : uploadMedia
      ? s.mediaSourceUpload
      : s.mediaSourceLocal;

  const tip = (label: string, key?: string) =>
    key ? s.shortcutWithMod(label, mod, key) : label;

  const run = (fn: (c: NonNullable<ReturnType<typeof chainFocusNoScroll>>) => void) => {
    const c = chainFocusNoScroll(editor);
    if (!c) return;
    fn(c);
  };

  const showMoreRow = wideLayout || moreOpen;
  const selectedIsVideo = hasMediaSelected && !selectedIsImage;

  const requestClear = () => {
    if (!editor) return;
    setConfirmKind("clear");
    setShortcutsOpen(false);
  };

  const requestDelete = () => {
    setConfirmKind("delete");
    setShortcutsOpen(false);
  };

  const runConfirm = () => {
    if (confirmKind === "clear") {
      run((c) => c.unsetAllMarks().clearNodes().run());
    } else if (confirmKind === "delete") {
      onDeleteMedia();
    }
    setConfirmKind(null);
  };

  const showMediaHint =
    allowMedia &&
    mediaHintVisible &&
    !hasMediaSelected &&
    !shortcutsOpen &&
    !confirmKind;

  const confirmMessage =
    confirmKind === "delete"
      ? selectedIsVideo
        ? s.deleteVideoConfirm
        : s.deleteMediaConfirm
      : s.clearFormatConfirm;

  return (
    <>
      <div ref={sentinelRef} className={styles.stickySentinel} aria-hidden />
      <div
        ref={toolbarStackRef}
        className={[
          styles.richEditorStickyToolbars,
          stuck ? styles.stickyStuck : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          className={styles.formatToolbar}
          role="toolbar"
          aria-label={s.formatToolbarAria}
        >
          <ToolGroup label={s.groupHistory}>
            <ToolBtn
              label={s.undo}
              title={tip(s.undo, "Z")}
              disabled={!editor || !formatState?.canUndo}
              onClick={() => run((c) => c.undo().run())}
            >
              <IconUndo />
            </ToolBtn>
            <ToolBtn
              label={s.redo}
              title={tip(s.redo, "⇧Z")}
              disabled={!editor || !formatState?.canRedo}
              onClick={() => run((c) => c.redo().run())}
            >
              <IconRedo />
            </ToolBtn>
          </ToolGroup>

          <span className={styles.richToolSep} aria-hidden />

          <ToolGroup label={s.groupHeadings}>
            {variant === "admin" ? (
              <ToolBtn
                label="H1"
                title={s.h1}
                active={formatState?.h1}
                disabled={!editor}
                className={styles.toolHeadingBtn}
                onClick={() =>
                  run((c) => c.toggleHeading({ level: 1 }).run())
                }
              />
            ) : null}
            <ToolBtn
              label="H2"
              title={s.h2}
              active={formatState?.h2}
              disabled={!editor}
              className={styles.toolHeadingBtn}
              onClick={() =>
                run((c) => c.toggleHeading({ level: 2 }).run())
              }
            />
            <ToolBtn
              label="H3"
              title={s.h3}
              active={formatState?.h3}
              disabled={!editor}
              className={styles.toolHeadingBtn}
              onClick={() =>
                run((c) => c.toggleHeading({ level: 3 }).run())
              }
            />
          </ToolGroup>

          <span className={styles.richToolSep} aria-hidden />

          <ToolGroup label={s.groupMarks}>
            <ToolBtn
              label="B"
              title={tip(s.bold, "B")}
              active={formatState?.bold}
              disabled={!editor}
              onClick={() => run((c) => c.toggleBold().run())}
            >
              <IconBold />
            </ToolBtn>
            <ToolBtn
              label="I"
              title={tip(s.italic, "I")}
              active={formatState?.italic}
              disabled={!editor}
              onClick={() => run((c) => c.toggleItalic().run())}
            >
              <IconItalic />
            </ToolBtn>
            <ToolBtn
              label="U"
              title={tip(s.underline, "U")}
              active={formatState?.underline}
              disabled={!editor}
              onClick={() => run((c) => c.toggleUnderline().run())}
            >
              <IconUnderline />
            </ToolBtn>
          </ToolGroup>

          <span className={styles.richToolSep} aria-hidden />

          <ToolGroup label={s.groupLists}>
            <ToolBtn
              label="Список"
              title={s.bulletList}
              active={formatState?.bulletList}
              disabled={!editor}
              onClick={() => run((c) => c.toggleBulletList().run())}
            >
              <IconBulletList />
            </ToolBtn>
            <ToolBtn
              label="Нумерация"
              title={s.orderedList}
              active={formatState?.orderedList}
              disabled={!editor}
              onClick={() => run((c) => c.toggleOrderedList().run())}
            >
              <IconOrderedList />
            </ToolBtn>
          </ToolGroup>

          <span className={styles.richToolSep} aria-hidden />

          <ToolGroup label={s.groupLink}>
            <ToolBtn
              label={s.link}
              title={tip(s.link, "K")}
              active={formatState?.link}
              disabled={!editor}
              onClick={onOpenLinkDialog}
            >
              <IconLink />
            </ToolBtn>
          </ToolGroup>

          {allowMedia && canInsertMedia ? (
            <>
              <span className={styles.richToolSep} aria-hidden />
              <ToolGroup label={s.groupMedia}>
                <span
                  className={styles.mediaSourceChip}
                  title={mediaSourceTitle}
                >
                  {useLibraryPicker ? s.fromLibrary : s.uploadFile}
                </span>
                <ToolBtn
                  label={s.photo}
                  title={s.imageTitle(mediaSourceTitle)}
                  disabled={busy}
                  busy={uploadBusy === "image"}
                  className={styles.toolMediaInsert}
                  ariaControls={
                    !useLibraryPicker ? imageInputId : undefined
                  }
                  onMouseDownExtra={onCaptureInsertCursor}
                  onClick={() => {
                    onCaptureInsertCursor();
                    if (useLibraryPicker) onPickImageFromLibrary();
                    else onPickImageFile();
                  }}
                >
                  <IconImage />
                  <span className={styles.toolBtnText}>{s.photo}</span>
                </ToolBtn>
                <ToolBtn
                  label={s.video}
                  title={s.videoTitle(mediaSourceTitle)}
                  disabled={busy}
                  busy={uploadBusy === "video"}
                  className={styles.toolMediaInsert}
                  ariaControls={
                    !useLibraryPicker ? videoInputId : undefined
                  }
                  onMouseDownExtra={onCaptureInsertCursor}
                  onClick={() => {
                    onCaptureInsertCursor();
                    if (useLibraryPicker) onPickVideoFromLibrary();
                    else onPickVideoFile();
                  }}
                >
                  <IconVideo />
                  <span className={styles.toolBtnText}>{s.video}</span>
                </ToolBtn>
                {busy ? (
                  <span className={styles.mediaBusy} aria-live="polite">
                    {s.uploading}
                  </span>
                ) : null}
              </ToolGroup>
            </>
          ) : null}

          {!wideLayout ? (
            <>
              <span className={styles.richToolSep} aria-hidden />
              <ToolBtn
                label={s.moreTools}
                title={s.moreToolsTitle}
                active={moreOpen}
                ariaControls={moreRowId}
                onClick={() => setMoreOpen((v) => !v)}
              >
                <IconMore />
                <span className={styles.toolBtnText}>{s.moreTools}</span>
              </ToolBtn>
            </>
          ) : null}
        </div>

        {showMoreRow ? (
          <div
            id={moreRowId}
            className={styles.formatToolbarMore}
            role="toolbar"
            aria-label={s.moreToolsTitle}
          >
            <span className={styles.toolGroupLabel}>{s.miniBlocks}</span>
            <ToolGroup label={s.groupBlocks}>
              <ToolBtn
                label={s.blockquote}
                title={s.blockquote}
                active={formatState?.blockquote}
                disabled={!editor}
                onClick={() => run((c) => c.toggleBlockquote().run())}
              >
                <IconQuote />
              </ToolBtn>
              <ToolBtn
                label={s.horizontalRule}
                title={s.horizontalRule}
                disabled={!editor}
                onClick={() => run((c) => c.setHorizontalRule().run())}
              >
                <IconHorizontalRule />
              </ToolBtn>
            </ToolGroup>

            <span className={styles.richToolSep} aria-hidden />

            <span className={styles.toolGroupLabel}>{s.miniAlign}</span>
            <ToolGroup label={s.groupAlign}>
              <ToolBtn
                label="Слева"
                title={s.alignLeft}
                active={formatState?.alignLeft}
                disabled={!editor}
                onClick={() => run((c) => c.setTextAlign("left").run())}
              >
                <IconAlignLeft />
              </ToolBtn>
              <ToolBtn
                label="Центр"
                title={s.alignCenter}
                active={formatState?.alignCenter}
                disabled={!editor}
                onClick={() => run((c) => c.setTextAlign("center").run())}
              >
                <IconAlignCenter />
              </ToolBtn>
              <ToolBtn
                label="Справа"
                title={s.alignRight}
                active={formatState?.alignRight}
                disabled={!editor}
                onClick={() => run((c) => c.setTextAlign("right").run())}
              >
                <IconAlignRight />
              </ToolBtn>
            </ToolGroup>

            <span className={styles.richToolSep} aria-hidden />

            <ToolGroup label={s.groupLink}>
              <ToolBtn
                label={s.clearFormat}
                title={s.clearFormat}
                disabled={!editor}
                onClick={requestClear}
              >
                <IconClear />
              </ToolBtn>
              <ToolBtn
                label={s.shortcutsBtn}
                title={s.shortcutsBtn}
                active={shortcutsOpen}
                onClick={() => {
                  setShortcutsOpen((v) => !v);
                  setConfirmKind(null);
                }}
              >
                <IconShortcuts />
              </ToolBtn>
            </ToolGroup>
          </div>
        ) : null}

        {confirmKind ? (
          <div
            className={styles.confirmBar}
            role="alertdialog"
            aria-modal="true"
            aria-label={confirmMessage}
          >
            <p className={styles.confirmBarText}>{confirmMessage}</p>
            <div className={styles.confirmBarActions}>
              <button
                type="button"
                className={styles.confirmBarBtn}
                onMouseDown={keepEditorSelection}
                onClick={() => setConfirmKind(null)}
              >
                {s.confirmCancel}
              </button>
              <button
                type="button"
                className={`${styles.confirmBarBtn} ${styles.confirmBarBtnDanger}`}
                onMouseDown={keepEditorSelection}
                onClick={runConfirm}
              >
                {s.confirmAction}
              </button>
            </div>
          </div>
        ) : null}

        {shortcutsOpen ? (
          <div
            className={styles.shortcutsPanel}
            role="region"
            aria-label={s.shortcutsTitle}
          >
            <p className={styles.shortcutsTitle}>{s.shortcutsTitle}</p>
            <ul className={styles.shortcutsList}>
              <li>
                <kbd>{mod}Z</kbd> {s.undo}
              </li>
              <li>
                <kbd>{mod}⇧Z</kbd> {s.redo}
              </li>
              <li>
                <kbd>{mod}B</kbd> {s.bold}
              </li>
              <li>
                <kbd>{mod}I</kbd> {s.italic}
              </li>
              <li>
                <kbd>{mod}U</kbd> {s.underline}
              </li>
              <li>
                <kbd>{mod}K</kbd> {s.link}
              </li>
              <li>
                <kbd>Enter</kbd> {s.captionBtn}
              </li>
            </ul>
          </div>
        ) : null}

        {allowMedia && hasMediaSelected ? (
          <>
            <div
              className={styles.richMediaToolbar}
              role="toolbar"
              aria-label={s.mediaToolbarAria}
            >
              <span className={styles.mediaSelectedBadge}>
                {selectedIsImage ? s.mediaBadge : s.videoBadge}
              </span>
              {selectedIsImage ? (
                <>
                  <ToolBtn
                    label={s.captionBtn}
                    title={s.captionBtnTitle}
                    className={styles.toolMediaInsert}
                    onClick={onAddCaption}
                  >
                    <span className={styles.toolBtnText}>{s.captionBtn}</span>
                  </ToolBtn>
                  <span className={styles.toolGroupLabel}>{s.sizeLabel}</span>
                  <ToolGroup label={s.groupMediaSize}>
                    <ToolBtn
                      label="S"
                      title={s.sizeSmall}
                      active={activeSizePreset === "small"}
                      onClick={() =>
                        onApplyMediaPreset("case-media-small", "size")
                      }
                    />
                    <ToolBtn
                      label="M"
                      title={s.sizeMedium}
                      active={activeSizePreset === "medium"}
                      onClick={() =>
                        onApplyMediaPreset("case-media-medium", "size")
                      }
                    />
                    <ToolBtn
                      label="L"
                      title={s.sizeFull}
                      active={activeSizePreset === "full"}
                      onClick={() =>
                        onApplyMediaPreset("case-media-full", "size")
                      }
                    />
                  </ToolGroup>
                  <span className={styles.richToolSep} aria-hidden />
                  <span className={styles.toolGroupLabel}>{s.posLabel}</span>
                  <ToolGroup label={s.groupMediaPos}>
                    <ToolBtn
                      label="←"
                      title={s.mediaLeft}
                      active={activeAlignPreset === "left"}
                      onClick={() =>
                        onApplyMediaPreset("case-media-left", "align")
                      }
                    >
                      <IconAlignLeft />
                    </ToolBtn>
                    <ToolBtn
                      label="↔"
                      title={s.mediaCenter}
                      active={activeAlignPreset === "center"}
                      onClick={() =>
                        onApplyMediaPreset("case-media-center", "align")
                      }
                    >
                      <IconAlignCenter />
                    </ToolBtn>
                    <ToolBtn
                      label="→"
                      title={s.mediaRight}
                      active={activeAlignPreset === "right"}
                      onClick={() =>
                        onApplyMediaPreset("case-media-right", "align")
                      }
                    >
                      <IconAlignRight />
                    </ToolBtn>
                    <ToolBtn
                      label={s.wrapLeftShort}
                      title={s.wrapLeft}
                      active={activeAlignPreset === "wrap"}
                      className={styles.toolMediaInsert}
                      onClick={() =>
                        onApplyMediaPreset("case-media-wrap", "align")
                      }
                    >
                      <span className={styles.wrapGlyph}>⇄</span>
                      <span className={styles.toolBtnText}>
                        {s.wrapLeftShort}
                      </span>
                    </ToolBtn>
                    <ToolBtn
                      label={s.wrapRightShort}
                      title={s.wrapRight}
                      active={activeAlignPreset === "wrap-end"}
                      className={styles.toolMediaInsert}
                      onClick={() =>
                        onApplyMediaPreset("case-media-wrap-end", "align")
                      }
                    >
                      <span className={styles.wrapGlyph}>⇆</span>
                      <span className={styles.toolBtnText}>
                        {s.wrapRightShort}
                      </span>
                    </ToolBtn>
                  </ToolGroup>
                  <span className={styles.richToolSep} aria-hidden />
                </>
              ) : (
                <span className={styles.videoSelectedNote} role="note">
                  {s.videoSelectedHint}
                </span>
              )}
              <ToolBtn
                label={s.deleteMedia}
                title={s.deleteMedia}
                className={styles.toolMediaDanger}
                onClick={requestDelete}
              >
                <IconTrash />
                <span className={styles.toolBtnText}>{s.deleteMedia}</span>
              </ToolBtn>
            </div>
            {selectedIsImage &&
            (activeAlignPreset === "wrap" ||
              activeAlignPreset === "wrap-end") ? (
              <p className={styles.wrapActiveNote} role="note">
                {s.wrapActiveNote}
              </p>
            ) : null}
            {selectedIsImage ? (
              <div className={styles.mediaAltRow}>
                <label className={styles.mediaAltField}>
                  <span className={styles.toolGroupLabel}>{s.altLabel}</span>
                  <input
                    type="text"
                    className={styles.mediaAltInput}
                    value={selectedImageAlt}
                    placeholder={s.altPlaceholder}
                    aria-label={s.altFieldLabel}
                    onChange={(e) =>
                      onSelectedImageAltChange(e.target.value)
                    }
                  />
                </label>
              </div>
            ) : null}
          </>
        ) : showMediaHint ? (
          <div className={styles.mediaHint} role="note">
            <p className={styles.mediaHintText}>{s.mediaHint}</p>
            <button
              type="button"
              className={styles.mediaHintDismiss}
              title={s.mediaHintDismiss}
              aria-label={s.mediaHintDismiss}
              onMouseDown={keepEditorSelection}
              onClick={dismissMediaHint}
            >
              ×
            </button>
          </div>
        ) : null}

        {allowMedia && uploadError ? (
          <p className={styles.uploadError} role="alert">
            {uploadError}
          </p>
        ) : null}
      </div>
    </>
  );
}
