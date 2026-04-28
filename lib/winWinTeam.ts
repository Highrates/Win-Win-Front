import type { TeamBranchCard, TeamBranchMember } from '@/lib/account/teamTeammateLeadMock';

export type WinWinTeamL2Dto = {
  id: string;
  userId: string;
  email: string | null;
  name: string;
  city: string | null;
  avatarUrl: string | null;
  isPartner: boolean;
  joinedAt: string;
};

export type WinWinTeamL1Dto = {
  id: string;
  userId: string;
  email: string | null;
  name: string;
  city: string | null;
  avatarUrl: string | null;
  isPartner: boolean;
  joinedAt: string;
  l2: WinWinTeamL2Dto[];
};

export type WinWinTeamOverviewDto = {
  inviter: null | { userId: string; name: string; designerSlug: string | null };
  counts: { total: number; level1: number; level2: number };
  l1: WinWinTeamL1Dto[];
};

export function formatTeamCity(city: string | null | undefined): string {
  const t = (city ?? '').trim();
  return t ? (t.startsWith('г.') ? t : `г. ${t}`) : 'Город не указан';
}

export function mapWinWinL1ToBranchCards(l1: WinWinTeamL1Dto[]): TeamBranchCard[] {
  return l1.map((row) => ({
    id: row.id,
    name: row.name,
    city: formatTeamCity(row.city),
    avatarSrc: row.avatarUrl?.trim() ? row.avatarUrl.trim() : '/images/placeholder.svg',
    branchCount: row.l2.length,
    members: row.l2.map(
      (m): TeamBranchMember => ({
        id: m.id,
        name: m.name,
        city: formatTeamCity(m.city),
      }),
    ),
  }));
}
