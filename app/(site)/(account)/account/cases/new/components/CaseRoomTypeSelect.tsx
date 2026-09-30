'use client';

import { MultiSelectField } from '@/components/MultiSelectField';

type CaseRoomTypeSelectProps = {
  roomTypes: readonly string[];
  selectedRooms: string[];
  roomsOpen: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
  onToggleRoom: (room: string) => void;
  onRemoveRoom: (room: string) => void;
};

export function CaseRoomTypeSelect({
  roomTypes,
  selectedRooms,
  roomsOpen,
  onToggleOpen,
  onClose,
  onToggleRoom,
  onRemoveRoom,
}: CaseRoomTypeSelectProps) {
  return (
    <MultiSelectField
      label="Выберите типы помещений"
      placeholder="Выберите типы помещений"
      options={roomTypes}
      selected={selectedRooms}
      open={roomsOpen}
      onToggleOpen={onToggleOpen}
      onClose={onClose}
      onToggleOption={onToggleRoom}
      onRemoveOption={onRemoveRoom}
    />
  );
}
