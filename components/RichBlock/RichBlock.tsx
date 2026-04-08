'use client';

import type { ComponentType } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import styles from './RichBlock.module.css';
import 'react-quill/dist/quill.snow.css';

/** Без next/dynamic: Loadable не пробрасывает ref на классовый ReactQuill → warning в консоли. */

export type RichBlockUploadMedia = (file: File, type: 'image' | 'video') => Promise<string>;

/** Выбор уже загруженного файла из медиатеки (админ). Возвращает публичный URL или null при отмене. */
export type RichBlockPickMediaFromLibrary = (kind: 'image' | 'video') => Promise<string | null>;

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
};

export function RichBlock({
  value,
  onChange,
  placeholder,
  uploadMedia,
  pickMediaFromLibrary,
  onUploadError,
}: RichBlockProps) {
  const fieldId = useId();
  const imageInputId = `${fieldId}-rich-img`;
  const videoInputId = `${fieldId}-rich-vid`;

  const [selectedMediaEl, setSelectedMediaEl] = useState<HTMLElement | null>(null);
  const [activeSizePreset, setActiveSizePreset] = useState<'small' | 'medium' | 'full' | null>(null);
  const [activeAlignPreset, setActiveAlignPreset] = useState<'left' | 'center' | 'right' | 'wrap' | null>(null);
  const [uploadBusy, setUploadBusy] = useState<'image' | 'video' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const reactQuillRef = useRef<any>(null);
  const [QuillEditor, setQuillEditor] = useState<ComponentType<Record<string, unknown>> | null>(null);

  const getQuillEditor = () => reactQuillRef.current?.getEditor?.() ?? null;

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const rq = await import('react-quill');
      if (!mounted) return;
      const Quill = rq.Quill;
      if (Quill) {
        const Block = Quill.import('blots/block');
        const BlockEmbed = Quill.import('blots/block/embed');
        class CaseVideoBlot extends BlockEmbed {
          static blotName = 'caseVideo';
          static tagName = 'video';
          static className = 'case-rich-media-video';
          static create(src: string) {
            const node = super.create() as HTMLVideoElement;
            node.setAttribute('src', src);
            node.setAttribute('controls', 'true');
            node.setAttribute('playsinline', 'true');
            node.setAttribute('preload', 'metadata');
            return node;
          }
          static value(node: HTMLVideoElement) {
            return node.getAttribute('src') || '';
          }
        }
        Quill.register(CaseVideoBlot, true);

        /**
         * Подпись к изображению как обычная строка под embed-картинкой.
         * Так Quill не ломает разметку (в отличие от figure/figcaption).
         */
        class CaseImageCaptionBlot extends Block {
          static blotName = 'caseImageCaption';
          static tagName = 'p';
          static className = 'case-rich-image-caption';
          static create(value: unknown) {
            const node = super.create(value) as HTMLParagraphElement;
            node.setAttribute('data-placeholder', 'Подпись к изображению…');
            return node;
          }
        }
        Quill.register(CaseImageCaptionBlot, true);
      }
      setQuillEditor(() => rq.default as ComponentType<Record<string, unknown>>);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const modules = {
    toolbar: [
      [{ header: [2, 3, false] }],
      ['blockquote'],
      ['bold', 'italic', 'underline'],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  } as const;

  const formats = [
    'header',
    'blockquote',
    'bold',
    'italic',
    'underline',
    'align',
    'list',
    'bullet',
    'link',
    'image',
    'video',
    'caseVideo',
    'caseImageCaption',
  ] as const;

  const readMediaPresetState = (el: HTMLElement | null) => {
    if (!el) {
      setActiveSizePreset(null);
      setActiveAlignPreset(null);
      return;
    }
    setActiveSizePreset((el.getAttribute('data-size') as 'small' | 'medium' | 'full' | null) ?? null);
    setActiveAlignPreset((el.getAttribute('data-align') as 'left' | 'center' | 'right' | 'wrap' | null) ?? null);
  };

  const applyMediaPreset = (cls: string, group: 'size' | 'align') => {
    if (!selectedMediaEl) return;
    if (group === 'size') {
      selectedMediaEl.style.maxWidth = '100%';
      selectedMediaEl.style.height = 'auto';
      selectedMediaEl.style.width =
        cls === 'case-media-small' ? 'min(35%, 220px)' : cls === 'case-media-medium' ? 'min(65%, 520px)' : '100%';
      selectedMediaEl.setAttribute('data-size', cls === 'case-media-small' ? 'small' : cls === 'case-media-medium' ? 'medium' : 'full');
    } else {
      selectedMediaEl.style.display = 'block';
      selectedMediaEl.style.float = 'none';
      selectedMediaEl.style.margin = '0';
      if (cls === 'case-media-left') selectedMediaEl.style.marginRight = 'auto';
      if (cls === 'case-media-center') {
        selectedMediaEl.style.marginLeft = 'auto';
        selectedMediaEl.style.marginRight = 'auto';
      }
      if (cls === 'case-media-right') selectedMediaEl.style.marginLeft = 'auto';
      if (cls === 'case-media-wrap') {
        selectedMediaEl.style.float = 'left';
        selectedMediaEl.style.width = 'min(45%, 340px)';
        selectedMediaEl.style.marginRight = '16px';
        selectedMediaEl.style.marginBottom = '12px';
      }
      selectedMediaEl.setAttribute(
        'data-align',
        cls === 'case-media-left' ? 'left' : cls === 'case-media-center' ? 'center' : cls === 'case-media-right' ? 'right' : 'wrap'
      );
    }
    readMediaPresetState(selectedMediaEl);
  };

  function insertSrcAtCursor(src: string, kind: 'image' | 'video') {
    const quill = getQuillEditor();
    if (!quill) {
      if (kind === 'image') {
        onChange(`${value}<p><img src="${src}" alt="" /></p>`);
      } else {
        onChange(`${value}<p><video class="case-rich-media-video" controls src="${src}"></video></p>`);
      }
      return;
    }
    const range = quill.getSelection(true);
    const index = range ? range.index : quill.getLength();
    if (kind === 'image') {
      quill.insertEmbed(index, 'image', src, 'user');
    } else {
      quill.insertEmbed(index, 'caseVideo', src, 'user');
    }
    quill.setSelection(index + 1, 0);
  }

  const insertImage = (file: File | null) => {
    if (!file) return;
    setUploadError(null);

    if (uploadMedia && !pickMediaFromLibrary) {
      setUploadBusy('image');
      void (async () => {
        try {
          const url = await uploadMedia(file, 'image');
          insertSrcAtCursor(url, 'image');
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Не удалось загрузить изображение';
          setUploadError(msg);
          onUploadError?.(msg);
        } finally {
          setUploadBusy(null);
        }
      })();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      if (!src) return;
      insertSrcAtCursor(src, 'image');
    };
    reader.readAsDataURL(file);
  };

  const insertVideo = (file: File | null) => {
    if (!file) return;
    setUploadError(null);

    if (uploadMedia && !pickMediaFromLibrary) {
      setUploadBusy('video');
      void (async () => {
        try {
          const url = await uploadMedia(file, 'video');
          insertSrcAtCursor(url, 'video');
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Не удалось загрузить видео';
          setUploadError(msg);
          onUploadError?.(msg);
        } finally {
          setUploadBusy(null);
        }
      })();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      if (!src) return;
      insertSrcAtCursor(src, 'video');
    };
    reader.readAsDataURL(file);
  };

  const handleEditorClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest(`.${styles.richMediaToolbar}`) || target?.closest('.ql-toolbar')) return;
    if (!target?.closest('.ql-editor')) return;
    const media = target?.closest('img,video,iframe') as HTMLElement | null;
    setSelectedMediaEl(media ?? null);
    readMediaPresetState(media ?? null);

    if (media?.tagName === 'IMG') {
      // После клика Quill выставляет selection на embed-картинке — ждём тик и вставляем строку подписи под ней.
      setTimeout(() => {
        const quill = getQuillEditor();
        if (!quill) return;
        const range = quill.getSelection(true);
        if (!range) return;

        // Если клик по картинке — selection обычно указывает на неё (leaf domNode === img).
        const [leaf] = quill.getLeaf(range.index);
        const leafDom = (leaf as any)?.domNode as HTMLElement | undefined;
        if (!leafDom || leafDom.tagName !== 'IMG') return;

        const index = range.index;
        const [nextLeaf] = quill.getLeaf(index + 1);
        const nextDom = (nextLeaf as any)?.domNode as HTMLElement | undefined;
        const alreadyCaption =
          nextDom?.tagName === 'P' && nextDom.classList?.contains('case-rich-image-caption');
        if (alreadyCaption) {
          // Курсор в подпись
          nextDom?.setAttribute('data-placeholder', 'Подпись к изображению…');
          quill.setSelection(index + 2, 0, 'user');
          return;
        }

        quill.insertText(index + 1, '\n', 'user');
        quill.formatLine(index + 1, 1, 'caseImageCaption', true, 'user');

        // Гарантируем, что это именно caption-строка (класс + placeholder попадут в сохранённый HTML).
        const [line] = quill.getLine(index + 1);
        const lineDom = (line as any)?.domNode as HTMLElement | undefined;
        if (lineDom?.tagName === 'P') {
          lineDom.classList.add('case-rich-image-caption');
          lineDom.setAttribute('data-placeholder', 'Подпись к изображению…');
        }
        quill.setSelection(index + 2, 0, 'user');
      }, 0);
    }
  };

  const handleEditorKeyDownCapture = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter') return;
    const target = e.target as HTMLElement | null;
    if (!target?.closest('.ql-editor')) return;
    const quill = getQuillEditor();
    if (!quill) return;
    const range = quill.getSelection(true);
    if (!range) return;
    const [line] = quill.getLine(range.index);
    const lineDom = (line as any)?.domNode as HTMLElement | undefined;
    const isCaption = !!lineDom?.classList?.contains('case-rich-image-caption');
    if (!isCaption) return;

    // Завершаем caption: создаём новую строку без caption-формата.
    e.preventDefault();
    const nextIndex = range.index + 1;
    quill.insertText(range.index, '\n', 'user');
    // Переводим курсор на новую строку и принудительно снимаем формат/класс подписи.
    quill.setSelection(nextIndex, 0, 'silent');
    quill.formatLine(nextIndex, 1, 'caseImageCaption', false, 'user');
    try {
      const [newLine] = quill.getLine(nextIndex);
      const newLineDom = (newLine as any)?.domNode as HTMLElement | undefined;
      if (newLineDom?.classList?.contains('case-rich-image-caption')) {
        newLineDom.classList.remove('case-rich-image-caption');
        newLineDom.removeAttribute('data-placeholder');
      }
    } catch {
      // no-op
    }
    quill.setSelection(nextIndex, 0, 'user');
  };

  function pickImageFromLibrary() {
    if (!pickMediaFromLibrary) return;
    setUploadError(null);
    setUploadBusy('image');
    void (async () => {
      try {
        const url = await pickMediaFromLibrary('image');
        if (url) insertSrcAtCursor(url, 'image');
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Не удалось выбрать изображение';
        setUploadError(msg);
        onUploadError?.(msg);
      } finally {
        setUploadBusy(null);
      }
    })();
  }

  function pickVideoFromLibrary() {
    if (!pickMediaFromLibrary) return;
    setUploadError(null);
    setUploadBusy('video');
    void (async () => {
      try {
        const url = await pickMediaFromLibrary('video');
        if (url) insertSrcAtCursor(url, 'video');
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Не удалось выбрать видео';
        setUploadError(msg);
        onUploadError?.(msg);
      } finally {
        setUploadBusy(null);
      }
    })();
  }

  const busy = uploadBusy !== null;
  const useLibraryPicker = !!pickMediaFromLibrary;

  return (
    <div className={styles.richEditorWrap} onClickCapture={handleEditorClickCapture} onKeyDownCapture={handleEditorKeyDownCapture}>
      <div className={styles.richMediaToolbar}>
        <span className={selectedMediaEl ? styles.mediaStatusOn : styles.mediaStatusOff}>
          {selectedMediaEl ? 'Выбрано медиа' : 'Не выбрано медиа'}
        </span>
        {uploadMedia && !useLibraryPicker ? (
          <span className={styles.richToolBtn} style={{ opacity: 0.85, cursor: 'default' }} title="Файлы загружаются на сервер">
            (облако)
          </span>
        ) : null}
        {useLibraryPicker ? (
          <span className={styles.richToolBtn} style={{ opacity: 0.85, cursor: 'default' }} title="Выбор из медиатеки">
            (объекты)
          </span>
        ) : null}
        {busy ? <span className={styles.mediaStatusOn}>Загрузка…</span> : null}
        {useLibraryPicker ? (
          <>
            <button
              type="button"
              className={styles.richToolBtn}
              disabled={busy}
              onClick={pickImageFromLibrary}
            >
              + Изображение
            </button>
            <button
              type="button"
              className={styles.richToolBtn}
              disabled={busy}
              onClick={pickVideoFromLibrary}
            >
              + Видео
            </button>
          </>
        ) : (
          <>
            <label className={styles.richToolBtn} htmlFor={imageInputId}>
              + Изображение
            </label>
            <label className={styles.richToolBtn} htmlFor={videoInputId}>
              + Видео
            </label>
          </>
        )}
        <span className={styles.richToolSep} />
        <button type="button" className={`${styles.richToolBtn} ${activeSizePreset === 'small' ? styles.richToolBtnActive : ''}`} onClick={() => applyMediaPreset('case-media-small', 'size')}>small</button>
        <button type="button" className={`${styles.richToolBtn} ${activeSizePreset === 'medium' ? styles.richToolBtnActive : ''}`} onClick={() => applyMediaPreset('case-media-medium', 'size')}>medium</button>
        <button type="button" className={`${styles.richToolBtn} ${activeSizePreset === 'full' ? styles.richToolBtnActive : ''}`} onClick={() => applyMediaPreset('case-media-full', 'size')}>full</button>
        <span className={styles.richToolSep} />
        <button type="button" className={`${styles.richToolBtn} ${activeAlignPreset === 'left' ? styles.richToolBtnActive : ''}`} onClick={() => applyMediaPreset('case-media-left', 'align')}>left</button>
        <button type="button" className={`${styles.richToolBtn} ${activeAlignPreset === 'center' ? styles.richToolBtnActive : ''}`} onClick={() => applyMediaPreset('case-media-center', 'align')}>center</button>
        <button type="button" className={`${styles.richToolBtn} ${activeAlignPreset === 'right' ? styles.richToolBtnActive : ''}`} onClick={() => applyMediaPreset('case-media-right', 'align')}>right</button>
        <button type="button" className={`${styles.richToolBtn} ${activeAlignPreset === 'wrap' ? styles.richToolBtnActive : ''}`} onClick={() => applyMediaPreset('case-media-wrap', 'align')}>wrap</button>
      </div>
      {uploadError ? (
        <p className={styles.uploadError} role="alert">
          {uploadError}
        </p>
      ) : null}
      {!useLibraryPicker ? (
        <>
          <input
            id={imageInputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className={styles.hiddenPicker}
            disabled={busy}
            onChange={(e) => {
              insertImage(e.target.files?.[0] ?? null);
              e.currentTarget.value = '';
            }}
          />
          <input
            id={videoInputId}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            className={styles.hiddenPicker}
            disabled={busy}
            onChange={(e) => {
              insertVideo(e.target.files?.[0] ?? null);
              e.currentTarget.value = '';
            }}
          />
        </>
      ) : null}
      {QuillEditor ? (
        <QuillEditor
          ref={reactQuillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats as unknown as string[]}
          placeholder={placeholder}
        />
      ) : (
        <div className={styles.quillLoading} aria-busy="true">
          Загрузка редактора…
        </div>
      )}
    </div>
  );
}
