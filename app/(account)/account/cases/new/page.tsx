'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { CaseBasicFields } from './components/CaseBasicFields';
import { CaseCoverGridPicker } from './components/CaseCoverGridPicker';
import { CaseRichDescription } from './components/CaseRichDescription';
import { CaseRoomTypeSelect } from './components/CaseRoomTypeSelect';
import styles from './page.module.css';

const ROOM_TYPES = [
  'Гостиная',
  'Кухня',
  'Столовая',
  'Спальня',
  'Детская',
  'Кабинет',
  'Прихожая',
  'Ванная',
] as const;

export default function NewCasePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [richContent, setRichContent] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [coverGrid, setCoverGrid] = useState<'4:3' | '16:9'>('4:3');
  const [cover43a, setCover43a] = useState<File | null>(null);
  const [cover43b, setCover43b] = useState<File | null>(null);
  const [cover169, setCover169] = useState<File | null>(null);
  const [cover43aPreview, setCover43aPreview] = useState<string | null>(null);
  const [cover43bPreview, setCover43bPreview] = useState<string | null>(null);
  const [cover169Preview, setCover169Preview] = useState<string | null>(null);

  const toggleRoom = (room: string) => {
    setSelectedRooms((prev) => (prev.includes(room) ? prev.filter((x) => x !== room) : [...prev, room]));
  };

  const removeRoom = (room: string) => {
    setSelectedRooms((prev) => prev.filter((x) => x !== room));
  };

  useEffect(() => {
    if (!cover43a) {
      setCover43aPreview(null);
      return;
    }
    const url = URL.createObjectURL(cover43a);
    setCover43aPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cover43a]);

  useEffect(() => {
    if (!cover43b) {
      setCover43bPreview(null);
      return;
    }
    const url = URL.createObjectURL(cover43b);
    setCover43bPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cover43b]);

  useEffect(() => {
    if (!cover169) {
      setCover169Preview(null);
      return;
    }
    const url = URL.createObjectURL(cover169);
    setCover169Preview(url);
    return () => URL.revokeObjectURL(url);
  }, [cover169]);

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <Link href="/account/cases" className={styles.backLink}>
          <img src="/icons/arrow-right.svg" alt="" width={12} height={7} className={styles.backArrow} aria-hidden />
          <span className={styles.backText}>Вернуться к кейсам</span>
        </Link>
        <Button variant="primary">Сохранить</Button>
      </div>

      <div className={styles.form}>
        <CaseBasicFields
          title={title}
          onTitleChange={setTitle}
          description={description}
          onDescriptionChange={setDescription}
        />

        <CaseRoomTypeSelect
          roomTypes={ROOM_TYPES}
          selectedRooms={selectedRooms}
          roomsOpen={roomsOpen}
          onToggleOpen={() => setRoomsOpen((prev) => !prev)}
          onToggleRoom={toggleRoom}
          onRemoveRoom={removeRoom}
        />

        <CaseCoverGridPicker
          coverGrid={coverGrid}
          onCoverGridChange={setCoverGrid}
          cover43a={cover43a}
          cover43b={cover43b}
          cover169={cover169}
          cover43aPreview={cover43aPreview}
          cover43bPreview={cover43bPreview}
          cover169Preview={cover169Preview}
          onFileChange={{
            onChange43a: setCover43a,
            onChange43b: setCover43b,
            onChange169: setCover169,
          }}
          onFileRemove={{
            onRemove43a: () => setCover43a(null),
            onRemove43b: () => setCover43b(null),
            onRemove169: () => setCover169(null),
          }}
        />

        <CaseRichDescription value={richContent} onChange={setRichContent} />
      </div>
    </div>
  );
}
