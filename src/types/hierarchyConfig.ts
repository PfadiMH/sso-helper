export type GroupWithLevel = {
  group_id: number;
  roles: string[];
  profile: HyrarchyLevel;
};
export type HierarchyConfigJson = {
  groups: GroupWithLevel[];
};
export type HyrarchyLevel = "admin" | "leader" | "member" | "none";
