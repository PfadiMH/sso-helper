import fs from "fs/promises";
import { HierarchyConfigJson } from "../types/hierarchyConfig";

export async function getHierarchyConfig(): Promise<HierarchyConfigJson> {
  try {
    const data = await fs.readFile("./hierarchy_config.json", "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading hierarchy_config.json:", error);
    console.error("PLEASE CHECK IF THE FILE EXISTS AND IS VALID JSON.");
    console.error(
      "USERS WILL BE UNABLE TO LOGIN WITHOUT A VALID CONFIGURATION."
    );
    // If the file doesn't exist or there's an error, create a default config
    const defaultConfig = {
      groups: [
        {
          group_id: 12460,
          roles: ["Group::AbteilungsGremium::Leitung"],
          profile: "admin",
        },
      ],
    };
    await saveHierarchyConfig(defaultConfig);
    return defaultConfig;
  }
}

export async function saveHierarchyConfig(config) {
  try {
    await fs.writeFile(
      "./hierarchy_config.json",
      JSON.stringify(config, null, 2)
    );
  } catch (error) {
    console.error("Error writing hierarchy_config.json:", error);
  }
}
