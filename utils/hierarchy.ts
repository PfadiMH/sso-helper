type HyrarchyLevel = "admin" | "leader" | "member" | "none";

const hierarchyLevelMap: Record<HyrarchyLevel, number> = {
  admin: 3,
  leader: 2,
  member: 1,
  none: 0,
};

export function calculateHierarchyLevel(
  hierarchyLevels: HyrarchyLevel[]
): HyrarchyLevel {
  const maxLevel = Math.max(
    ...hierarchyLevels.map((level) => hierarchyLevelMap[level])
  );
  let hierarchyLevel: HyrarchyLevel;
  switch (maxLevel) {
    case 3:
      hierarchyLevel = "admin";
      break;
    case 2:
      hierarchyLevel = "leader";
      break;
    case 1:
      hierarchyLevel = "member";
      break;
    default:
      hierarchyLevel = "none";
  }
  return hierarchyLevel;
}
