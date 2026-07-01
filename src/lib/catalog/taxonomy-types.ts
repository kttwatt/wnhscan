export type CatalogGroupRow = {
  id: string;
  name: string;
  code: string | null;
  sortOrder: number;
  subgroupCount: number;
};

export type CatalogSubgroupRow = {
  id: string;
  name: string;
  code: string | null;
  sortOrder: number;
  groupId: string;
  groupName: string;
  itemCount: number;
};

export type GroupInput = {
  name: string;
  code?: string;
  sortOrder?: string;
};

export type SubgroupInput = {
  name: string;
  code?: string;
  sortOrder?: string;
  groupId: string;
};
