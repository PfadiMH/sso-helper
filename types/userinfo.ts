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

export type TranslatedUserinfoData = {
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

type HyrarchyLevel = "admin" | "leader" | "member" | "none";
