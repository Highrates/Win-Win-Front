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
  email?: string | null;
  referralInviteCodeExempt?: boolean;
  designerSlug?: string | null;
  designerSiteVisible?: boolean;
};
