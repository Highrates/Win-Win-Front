export type ReferralProgramProfileRow = {
  id: string;
  name: string;
  sortOrder: number;
  isDefault: boolean;
  enabled: boolean;
  level1Percent: number;
  level2Percent: number;
  minimumOrderSiteTotalRub: number;
  createdAt: string;
  updatedAt: string;
};

export type DesignerBonusProfileRow = {
  id: string;
  name: string;
  sortOrder: number;
  isDefault: boolean;
  designerOwnCatalogBonusPercent: number;
  designerOwnMinimumCatalogSiteTotalRub: number;
  createdAt: string;
  updatedAt: string;
};
