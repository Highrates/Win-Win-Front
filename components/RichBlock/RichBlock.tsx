'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import styles from './RichBlock.module.css';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

type RichBlockProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function RichBlock({ value, onChange, placeholder }: RichBlockProps) {
  const [selectedMediaEl, setSelectedMediaEl] = useState<HTMLElement | null>(null);
  const [activeSizePreset, setActiveSizePreset] = useState<'small' | 'medium' | 'full' | null>(null);
  const [activeAlignPreset, setActiveAlignPreset] = useState<'left' | 'center' | 'right' | 'wrap' | null>(null);
  const quillEditorRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const rq = await import('react-quill');
      const Quill = rq.Quill;
      if (!Quill || !mounted) return;
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

  const insertImage = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      if (!src) return;
      const quill = quillEditorRef.current;
      if (!quill) return onChange(`${value}<p><img src="${src}" alt="uploaded-image" /></p>`);
      const range = quill.getSelection(true);
      const index = range ? range.index : quill.getLength();
      quill.insertEmbed(index, 'image', src, 'user');
      quill.setSelection(index + 1, 0);
    };
    reader.readAsDataURL(file);
  };

  const insertVideo = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      if (!src) return;
      const quill = quillEditorRef.current;
      if (!quill) return onChange(`${value}<p><video class="case-rich-media-video" controls src="${src}"></video></p>`);
      const range = quill.getSelection(true);
      const index = range ? range.index : quill.getLength();
      quill.insertEmbed(index, 'caseVideo', src, 'user');
      quill.setSelection(index + 1, 0);
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
  };

  return (
    <div className={styles.richEditorWrap} onClickCapture={handleEditorClickCapture}>
      <div className={styles.richMediaToolbar}>
        <span className={selectedMediaEl ? styles.mediaStatusOn : styles.mediaStatusOff}>
          {selectedMediaEl ? 'Выбрано медиа' : 'Не выбрано медиа'}
        </span>
        <label className={styles.richToolBtn} htmlFor="rich-image-picker">+ Изображение</label>
        <label className={styles.richToolBtn} htmlFor="rich-video-picker">+ Видео</label>
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
      <input id="rich-image-picker" type="file" accept="image/*" className={styles.hiddenPicker} onChange={(e) => {
        insertImage(e.target.files?.[0] ?? null);
        e.currentTarget.value = '';
      }} />
      <input id="rich-video-picker" type="file" accept="video/*" className={styles.hiddenPicker} onChange={(e) => {
        insertVideo(e.target.files?.[0] ?? null);
        e.currentTarget.value = '';
      }} />
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        onChangeSelection={(_range, _source, editor) => {
          quillEditorRef.current = editor;
        }}
        modules={modules}
        formats={formats as unknown as string[]}
        placeholder={placeholder}
      />
    </div>
  );
}
