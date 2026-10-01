import { describe, expect, it } from 'vitest';
import {
  filterTeamBranchCards,
  formatTeamCity,
  mapWinWinL1ToBranchCards,
  russianPluralChelovek,
  type TeamBranchCard,
  type WinWinTeamL1Dto,
} from './winWinTeam';

function l1(partial: Partial<WinWinTeamL1Dto> & Pick<WinWinTeamL1Dto, 'id' | 'name'>): WinWinTeamL1Dto {
  return {
    userId: `user-${partial.id}`,
    email: null,
    city: null,
    avatarUrl: null,
    isPartner: true,
    joinedAt: '2026-01-01T00:00:00.000Z',
    l2: [],
    ...partial,
  };
}

describe('formatTeamCity', () => {
  it('prefixes city and handles empty', () => {
    expect(formatTeamCity('Москва')).toBe('г. Москва');
    expect(formatTeamCity('г. Казань')).toBe('г. Казань');
    expect(formatTeamCity(null)).toBe('Город не указан');
  });
});

describe('russianPluralChelovek', () => {
  it('declines for common counts', () => {
    expect(russianPluralChelovek(1)).toBe('человек');
    expect(russianPluralChelovek(2)).toBe('человека');
    expect(russianPluralChelovek(5)).toBe('человек');
    expect(russianPluralChelovek(11)).toBe('человек');
  });
});

describe('mapWinWinL1ToBranchCards', () => {
  it('maps L1/L2 with placeholder avatar and city formatting', () => {
    const cards = mapWinWinL1ToBranchCards([
      l1({
        id: 'b1',
        name: 'Анна',
        city: 'Казань',
        avatarUrl: '  ',
        l2: [
          {
            id: 'm1',
            userId: 'u2',
            email: null,
            name: 'Игорь',
            city: 'г. Уфа',
            avatarUrl: null,
            isPartner: false,
            joinedAt: '2026-02-01T00:00:00.000Z',
          },
        ],
      }),
    ]);

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      id: 'b1',
      name: 'Анна',
      city: 'г. Казань',
      avatarSrc: '/images/placeholder.svg',
      branchCount: 1,
    });
    expect(cards[0].members).toEqual([{ id: 'm1', name: 'Игорь', city: 'г. Уфа' }]);
  });
});

describe('filterTeamBranchCards', () => {
  const cards: TeamBranchCard[] = [
    {
      id: 'b1',
      name: 'Анна Смирнова',
      city: 'г. Казань',
      avatarSrc: '/images/placeholder.svg',
      branchCount: 1,
      members: [{ id: 'm1', name: 'Игорь Зайцев', city: 'г. Уфа' }],
    },
    {
      id: 'b2',
      name: 'Пётр Орлов',
      city: 'г. Москва',
      avatarSrc: '/images/placeholder.svg',
      branchCount: 0,
      members: [],
    },
  ];

  it('returns all cards for blank search', () => {
    expect(filterTeamBranchCards(cards, '  ')).toEqual(cards);
  });

  it('matches L1 name/city and L2 member', () => {
    expect(filterTeamBranchCards(cards, 'казань').map((c) => c.id)).toEqual(['b1']);
    expect(filterTeamBranchCards(cards, 'зайцев').map((c) => c.id)).toEqual(['b1']);
    expect(filterTeamBranchCards(cards, 'москва').map((c) => c.id)).toEqual(['b2']);
    expect(filterTeamBranchCards(cards, 'нет такого')).toEqual([]);
  });
});
