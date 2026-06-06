export type UserGroupRow = {
  id: string;
  name: string;
  label: string;
  slug: string | null;
  sortOrder: number;
  referralProgramProfileId: string;
  designerBonusProfileId: string;
  pricingProfileId: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

export type UserGroupDetailRow = UserGroupRow & {
  referralProgramProfileName: string;
  designerBonusProfileName: string;
};

export type UserGroupMemberRow = {
  id: string;
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  assignedAt: string;
};

export type UserGroupMembership = {
  groupId: string | null;
  groupName: string | null;
  groupLabel: string | null;
};
