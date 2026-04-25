'use client';

import type { CoverGrid, CoverGridFieldProps } from '@/components/CoverGridField';
import { CoverGridField } from '@/components/CoverGridField';

export type CaseCoverGridPickerProps = CoverGridFieldProps;
export type { CoverGrid };

export function CaseCoverGridPicker(props: CaseCoverGridPickerProps) {
  return <CoverGridField {...props} />;
}
