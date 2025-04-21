import { configuration } from "../config";
import {
  TranslatedUserinfoData,
  UpstreamRole,
  UpstreamUserinfoData,
} from "../types/userinfo";
import { calculateHierarchyLevel } from "./hierarchy";

type HyrarchyLevel = "admin" | "leader" | "member" | "none";

// --- Configuration JSON ---
// This JSON should be defined in the environment variable CONFIGURATION_JSON
type GroupWithLevel = {
  group_id: number;
  roles: string[];
  profile: HyrarchyLevel;
};
type ConfigurationJson = {
  groups: GroupWithLevel[];
};

export function translateUserinfoData(
  userinfo: UpstreamUserinfoData
): TranslatedUserinfoData {
  // --- Translate Userinfo Data ---
  const roles: UpstreamRole[] = userinfo.roles;

  // 1. Extract the group IDs from the userinfo data
  const groupIds = roles.map((role) => role.group_id);

  // 2. Find the matching groups from the configuration
  const matchingGroups = configuration.groups.filter((group) =>
    groupIds.includes(group.group_id)
  );

  // 3. Determine the highest hierarchy level from the matching groups
  const hierarchyLevels: HyrarchyLevel[] = matchingGroups.map(
    (group) => group.profile
  );

  const hierarchyLevel = calculateHierarchyLevel(hierarchyLevels);

  // 4. Create the translated userinfo object
  const translatedUserinfo: TranslatedUserinfoData = {
    sub: userinfo.sub,
    first_name: userinfo.first_name,
    last_name: userinfo.last_name,
    nickname: userinfo.nickname,
    company_name: userinfo.company_name,
    company: userinfo.company,
    email: userinfo.email,
    address_care_of: userinfo.address_care_of,
    street: userinfo.street,
    housenumber: userinfo.housenumber,
    postbox: userinfo.postbox,
    zip_code: userinfo.zip_code,
    town: userinfo.town,
    country: userinfo.country,
    roles: roles,
    groups: groupIds,
    hirarchy_level: hierarchyLevel,
    birthday: userinfo.birthday,
    primary_group_id: userinfo.primary_group_id,
    title: userinfo.title,
    salutation: userinfo.salutation,
    address: userinfo.address,
    gender: userinfo.gender,
    kantonalverband_id: userinfo.kantonalverband_id,
    language: userinfo.language,
    prefers_digital_correspondence: userinfo.prefers_digital_correspondence,
  };
  return translatedUserinfo;
}
