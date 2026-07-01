export type CatalogItem = {
  id: string;
  code: string;
  name: string;
  barcode: string;
  unit: string;
  price?: string;
  /** Department codes from `departments.code` */
  departmentIds: string[];
  group: string;
  subgroup: string;
  subgroupId?: string;
};

export type CatalogItemInput = {
  code: string;
  name: string;
  barcode: string;
  unit: string;
  price?: string;
  group: string;
  subgroup: string;
};

export type CatalogGroupOption = {
  id: string;
  name: string;
};

export type CatalogSubgroupOption = {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
};

export type TrashCatalogItem = CatalogItem & {
  deletedAt: string;
};
