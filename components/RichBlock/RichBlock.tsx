'use client';

import type { ComponentType } from 'react';
import type { DeltaStatic } from 'quill';
import { useEffect, useId, useRef, useState } from 'react';
import styles from './RichBlock.module.css';
import 'react-quill/dist/quill.snow.css';

/** Без next/dynamic: Loadable не пробрасывает ref на классовый ReactQuill → warning в консоли. */

export type RichBlockUploadMedia = (file: File, type: 'image' | 'video') => Promise<string>;

/** Выбор уже загруженного файла из медиатеки (админ). Возвращает публичный URL или null при отмене. */
export type RichBlockPickMediaFromLibrary = (kind: 'image' | 'video') => Promise<string | null>;

/** `import('react-quill')` в Next даёт `{ default: ReactQuill }`; `Quill` висит на `default`, не на корне модуля. */
function getQuillFromReactQuillModule(mod: { default?: { Quill?: unknown }; Quill?: unknown }): unknown {
  return mod.default?.Quill ?? mod.Quill;
}

/** Индекс embed-картинки в документе Quill (find по DOM надёжнее, чем getLeaf от selection). */
function getImageBlotIndex(quill: { constructor: any; getIndex: (b: unknown) => number }, img: HTMLImageElement): number | null {
  const Q = quill.constructor;
  let blot: unknown = typeof Q.find === 'function' ? Q.find(img) : null;
  if (!blot) {
    try {
      const Parchment = Q.import('parchment');
      blot = typeof Parchment.find === 'function' ? Parchment.find(img) : null;
    } catch {
      blot = null;
    }
  }
  if (!blot) return null;
  try {
    return quill.getIndex(blot as Parameters<typeof quill.getIndex>[0]);
  } catch {
    return null;
  }
}

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

  /** После правок DOM (пресеты) ReactQuill может не вызвать onChange — иначе в родителе остаётся старый HTML без data-align. */
  const syncHtmlFromQuill = () => {
    const quill = getQuillEditor();
    const html = quill?.root?.innerHTML;
    if (typeof html === 'string') onChange(html);
  };

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const rq = await import('react-quill');
      if (!mounted) return;
      const Quill = getQuillFromReactQuillModule(rq as { default?: { Quill?: unknown }; Quill?: unknown }) as
        | { import: (name: string) => unknown; register: (def: unknown, overwrite?: boolean) => void }
        | null;
      if (Quill) {
        const Block = Quill.import('blots/block') as any;
        const BlockEmbed = Quill.import('blots/block/embed') as any;
        /** Как встроенный `formats/image`: `Parchment.Embed`, не `BlockEmbed` — для `<img>` иначе Parchment не создаёт blot. */
        const BaseImage = Quill.import('formats/image') as any;

        class RichImageBlot extends BaseImage {
          static blotName = 'image';
          static create(value: unknown) {
            const v =
              typeof value === 'string'
                ? { src: value }
                : value && typeof value === 'object' && value !== null && 'src' in value
                  ? (value as { src: string; align?: string; size?: string })
                  : { src: '' };
            const src = typeof v.src === 'string' ? v.src : '';
            const node = super.create(src) as HTMLImageElement;
            node.classList.add('case-rich-media-image');
            if (v.align) node.setAttribute('data-align', v.align);
            if (v.size) node.setAttribute('data-size', v.size);
            return node;
          }
          static value(node: HTMLImageElement) {
            const src = (super.value(node) as string) || node.getAttribute('src') || '';
            const align = node.getAttribute('data-align') || undefined;
            const size = node.getAttribute('data-size') || undefined;
            if (align || size) return { src, align, size };
            return src;
          }
        }
        Quill.register(RichImageBlot, true);

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
          /** Нужен для clipboard.convert: иначе matchBlot не вешает формат на строку при загрузке HTML из БД. */
          static formats() {
            return true;
          }
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

  /** При загрузке HTML в редактор clipboard по умолчанию кладёт в delta только src — data-align/data-size теряются. */
  useEffect(() => {
    if (!QuillEditor) return;
    const raf = requestAnimationFrame(() => {
      const quill = reactQuillRef.current?.getEditor?.();
      if (!quill) return;
      const tag = '__winWinRichImgMatcher';
      if ((quill as unknown as Record<string, boolean>)[tag]) return;
      (quill as unknown as Record<string, boolean>)[tag] = true;
      void import('react-quill').then((rq) => {
        const Quill = getQuillFromReactQuillModule(rq as { default?: { Quill?: unknown }; Quill?: unknown }) as {
          import: (name: string) => new () => { insert: (v: unknown, k?: unknown) => unknown };
        } | null;
        if (!Quill?.import) return;
        const Delta = Quill.import('delta') as new () => { insert: (v: unknown, k?: unknown) => unknown };
        quill.clipboard.addMatcher('IMG', (node: Node, delta: DeltaStatic): DeltaStatic => {
          if (node.nodeName !== 'IMG') return delta;
          const el = node as HTMLImageElement;
          const src = el.getAttribute('src') || '';
          if (!src) return delta;
          const align = el.getAttribute('data-align') || undefined;
          const size = el.getAttribute('data-size') || undefined;
          const embedVal = align || size ? { src, align, size } : src;
          return new Delta().insert({ image: embedVal }) as DeltaStatic;
        });
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [QuillEditor]);

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

    /** Видео: по-прежнему только DOM + синк HTML (отдельный embed). */
    if (selectedMediaEl.tagName === 'VIDEO') {
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
      syncHtmlFromQuill();
      return;
    }

    if (selectedMediaEl.tagName !== 'IMG') return;

    /**
     * Quill держит истину в Delta. Только data-* в DOM недостаточно — при следующем цикле модель снова { image: url }.
     * Пересобираем embed в Delta с { src, align, size }, чтобы сохранение и перезагрузка не теряли пресеты.
     */
    if (group === 'size') {
      selectedMediaEl.setAttribute('data-size', cls === 'case-media-small' ? 'small' : cls === 'case-media-medium' ? 'medium' : 'full');
    } else {
      selectedMediaEl.setAttribute(
        'data-align',
        cls === 'case-media-left' ? 'left' : cls === 'case-media-center' ? 'center' : cls === 'case-media-right' ? 'right' : 'wrap'
      );
    }
    selectedMediaEl.removeAttribute('style');

    const quill = getQuillEditor();
    if (quill) {
      const Q = quill.constructor as { import: (n: string) => any; find: (n: Node) => unknown };
      const Delta = Q.import('delta');
      const blot = Q.find(selectedMediaEl) as { offset?: (root: unknown) => number } | null;
      if (blot) {
        const index = quill.getIndex(blot as Parameters<typeof quill.getIndex>[0]);
        const src = selectedMediaEl.getAttribute('src') || '';
        const align = selectedMediaEl.getAttribute('data-align') || undefined;
        const size = selectedMediaEl.getAttribute('data-size') || undefined;
        const embedVal = align || size ? { src, align, size } : src;
        quill.updateContents(new Delta().retain(index).delete(1).insert({ image: embedVal }), 'user');

        const [leaf] = quill.getLeaf(index);
        const newImg = (leaf as { domNode?: HTMLElement })?.domNode;
        if (newImg?.tagName === 'IMG') {
          setSelectedMediaEl(newImg);
          /** Embed = 1 + перевод строки конца блока = 1 → следующая строка с index + 2. */
          const [capLine] = quill.getLine(index + 2);
          const capDom = (capLine as { domNode?: HTMLElement })?.domNode;
          if (capDom?.tagName === 'P' && capDom.classList.contains('case-rich-image-caption')) {
            if (size) capDom.setAttribute('data-size', size);
            if (align) capDom.setAttribute('data-align', align);
          }
          readMediaPresetState(newImg);
          syncHtmlFromQuill();
          return;
        }
      }
    }

    readMediaPresetState(selectedMediaEl);
    syncHtmlFromQuill();
  };

  function insertSrcAtCursor(src: string, kind: 'image' | 'video') {
    const quill = getQuillEditor();
    if (!quill) {
      if (kind === 'image') {
        onChange(`${value}<p><img class="case-rich-media-image" src="${src}" alt="" /></p>`);
      } else {
        onChange(`${value}<p><video class="case-rich-media-video" controls src="${src}"></video></p>`);
      }
      return;
    }
    const range = quill.getSelection(true);
    const index = range ? range.index : quill.getLength();
    if (kind === 'image') {
      /** Quill ожидает строку URL; объект ломает insert/update delta в части сборок. */
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
      const imgEl = media as HTMLImageElement;
      /**
       * Не вызывать syncHtmlFromQuill здесь: лишний onChange → родитель обновляет value → ReactQuill
       * делает setContents(clipboard.convert) → сброс скролла и «прыжок» к началу. insertText/formatLine сами дают onChange.
       */
      queueMicrotask(() => {
        const quill = getQuillEditor();
        if (!quill) return;
        const index = getImageBlotIndex(quill, imgEl);
        if (index == null) return;

        /** В Delta: embed = 1 символ, затем перевод строки конца блока = ещё 1 → следующая строка начинается с index + 2. */
        const captionBlockIndex = index + 2;
        const nextSibling = imgEl.nextElementSibling;
        const alreadyCaptionByDom =
          nextSibling?.tagName === 'P' && nextSibling.classList.contains('case-rich-image-caption');
        const [lineAfter] = quill.getLine(captionBlockIndex);
        const lineAfterDom = (lineAfter as { domNode?: HTMLElement } | undefined)?.domNode;
        const alreadyCaption =
          alreadyCaptionByDom ||
          (lineAfterDom?.tagName === 'P' && lineAfterDom.classList.contains('case-rich-image-caption'));
        if (alreadyCaption) {
          const dom = (alreadyCaptionByDom ? nextSibling : lineAfterDom) as HTMLElement | undefined;
          dom?.setAttribute('data-placeholder', 'Подпись к изображению…');
          quill.setSelection(captionBlockIndex, 0, 'silent');
          return;
        }

        quill.insertText(captionBlockIndex, '\n', 'user');
        quill.formatLine(captionBlockIndex, 1, 'caseImageCaption', true, 'user');

        const [line] = quill.getLine(captionBlockIndex);
        const lineDom = (line as { domNode?: HTMLElement } | undefined)?.domNode;
        if (lineDom?.tagName === 'P') {
          lineDom.classList.add('case-rich-image-caption');
          lineDom.setAttribute('data-placeholder', 'Подпись к изображению…');
          const size = imgEl.getAttribute('data-size');
          const align = imgEl.getAttribute('data-align');
          if (size) lineDom.setAttribute('data-size', size);
          if (align) lineDom.setAttribute('data-align', align);
        }
        quill.setSelection(captionBlockIndex, 0, 'silent');
      });
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
