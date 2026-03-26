'use client';

import textFieldStyles from '@/components/TextField/TextField.module.css';
import styles from '../page.module.css';

type CaseRoomTypeSelectProps = {
  roomTypes: readonly string[];
  selectedRooms: string[];
  roomsOpen: boolean;
  onToggleOpen: () => void;
  onToggleRoom: (room: string) => void;
  onRemoveRoom: (room: string) => void;
};

export function CaseRoomTypeSelect({
  roomTypes,
  selectedRooms,
  roomsOpen,
  onToggleOpen,
  onToggleRoom,
  onRemoveRoom,
}: CaseRoomTypeSelectProps) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>Выберите типы помещений</span>
      <div className={styles.multiSelect}>
        <button
          type="button"
          className={`${textFieldStyles.input} ${styles.multiSelectInput}`}
          onClick={onToggleOpen}
          aria-expanded={roomsOpen}
        >
          <span className={styles.chips}>
            {selectedRooms.length === 0 ? (
              <span className={styles.placeholder}>Выберите типы помещений</span>
            ) : (
              selectedRooms.map((room) => (
                <span key={room} className={styles.chip}>
                  {room}
                  <span
                    role="button"
                    tabIndex={0}
                    className={styles.chipRemove}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRoom(room);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemoveRoom(room);
                      }
                    }}
                  >
                    ×
                  </span>
                </span>
              ))
            )}
          </span>
          <img
            src="/icons/arrow.svg"
            alt=""
            width={22}
            height={22}
            aria-hidden
            className={`${styles.chevron} ${roomsOpen ? styles.chevronOpen : ''}`}
            style={{ transform: roomsOpen ? 'rotate(-90deg)' : 'rotate(90deg)' }}
          />
        </button>

        {roomsOpen ? (
          <div className={styles.options}>
            {roomTypes.map((room) => {
              const active = selectedRooms.includes(room);
              return (
                <button key={room} type="button" className={styles.option} onClick={() => onToggleRoom(room)}>
                  <span>{room}</span>
                  {active ? <span className={styles.check}>✓</span> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
