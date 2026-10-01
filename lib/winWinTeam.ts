export type TeamBranchMember = {
  id: string;
  name: string;
  city: string;
};

export type TeamBranchCard = {
  id: string;
  name: string;
  city: string;
  branchCount: number;
  avatarSrc: string;
  members: TeamBranchMember[];
};

export type WinWinTeamL2Dto = {
  id: string;
  userId: string;
  name: string;
  city: string | null;
  avatarUrl: string | null;
  isPartner: boolean;
  joinedAt: string;
};

export type WinWinTeamL1Dto = {
  id: string;
  userId: string;
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

export function russianPluralChelovek(count: number): string {
  const n = Math.abs(Math.floor(Number(count)));
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return 'человек';
  if (mod10 === 1) return 'человек';
  if (mod10 >= 2 && mod10 <= 4) return 'человека';
  return 'человек';
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

/** Клиентский поиск по L1-ветке и участникам L2. */
export function filterTeamBranchCards(cards: TeamBranchCard[], search: string): TeamBranchCard[] {
  const q = search.trim().toLowerCase();
  if (!q) return cards;
  return cards.filter((c) => {
    const hay = `${c.name} ${c.city} ${c.members.map((m) => `${m.name} ${m.city}`).join(' ')}`.toLowerCase();
    return hay.includes(q);
  });
}
