export interface UpstreamUserinfoData {
  sub: string;
  first_name: string;
  last_name: string;
  nickname: string;
  company_name: any;
  company: boolean;
  email: string;
  address_care_of: any;
  street: string;
  housenumber: string;
  postbox: any;
  zip_code: string;
  town: string;
  country: string;
  gender: string;
  birthday: string;
  primary_group_id: number;
  title: any;
  salutation: string;
  language: string;
  prefers_digital_correspondence: boolean;
  kantonalverband_id: number;
  address: string;
  roles: UpstreamRole[];
}

export interface UpstreamRole {
  group_id: number;
  group_name: string;
  role: string;
  role_class: string;
  role_name: string;
  permissions: string[];
}

type TranslatedUserinfoData = {
  sub: string;
  first_name: string;
  last_name: string;
  nickname: string;
  company_name: any;
  company: boolean;
  email: string;
  address_care_of: any;
  street: string;
  housenumber: string;
  postbox: any;
  zip_code: string;
  town: string;
  country: string;
  gender: string;
  birthday: string;
  primary_group_id: number;
  title: any;
  salutation: string;
  language: string;
  prefers_digital_correspondence: boolean;
  kantonalverband_id: number;
  address: string;
  groups: number[];
  roles: UpstreamRole[];
  hirarchy_level: HyrarchyLevel;
};

const configurationJson = process.env.CONFIGURATION_JSON;
if (!configurationJson) {
  throw new Error("Configuration JSON is not defined");
}

type HyrarchyLevel = "admin" | "leader" | "member" | "none";

const hierarchyLevelMap: Record<HyrarchyLevel, number> = {
  admin: 3,
  leader: 2,
  member: 1,
  none: 0,
};

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
const configuration: ConfigurationJson = JSON.parse(configurationJson || "{}");

export function translateUserinfoData(
  userinfo: UpstreamUserinfoData
): TranslatedUserinfoData {
  // --- Translate Userinfo Data ---

  // 1. Extract the group IDs from the userinfo data
  const groupIds = userinfo.roles.map((role) => role.group_id);

  // 2. Find the matching groups from the configuration
  const matchingGroups = configuration.groups.filter((group) =>
    groupIds.includes(group.group_id)
  );

  // 3. Determine the highest hierarchy level from the matching groups
  const hierarchyLevels: HyrarchyLevel[] = matchingGroups.map(
    (group) => group.profile
  );

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
    roles: userinfo.roles,
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
