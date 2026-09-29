export type CoverGridValue = '4:3' | '16:9';

export type ProfileDto = {
  firstName: string | null;
  lastName: string | null;
  city: string | null;
  services: unknown;
  aboutHtml: string | null;
  coverLayout: string | null;
  coverImageUrls: unknown;
  avatarUrl: string | null;
  profileOnboardingPending: boolean;
  winWinPartnerApproved?: boolean;
  winWinReferralCode?: string | null;
  partnerApplicationSubmittedAt?: string | null;
  partnerApplicationRejectedAt?: string | null;
  partnerApplicationReferralCode?: string | null;
  email?: string | null;
  referralInviteCodeExempt?: boolean;
  designerSlug?: string | null;
  designerSiteVisible?: boolean;
  designerLikesUserCount?: number | null;
  designerCasesCount?: number | null;
  designerOwnCatalogBonusPercent?: number;
};

/** Тело PATCH `/api/user/profile` (согласовано с Nest UpdateUserProfileDto). */
export type ProfilePatch = {
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  services?: string[] | null;
  aboutHtml?: string | null;
  coverLayout?: CoverGridValue | null;
  coverImageUrls?: string[] | null;
  avatarUrl?: string | null;
};
