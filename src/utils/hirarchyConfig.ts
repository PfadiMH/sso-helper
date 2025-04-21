import fs from "fs/promises";

async function getHierarchyConfig() {
  try {
    const data = await fs.readFile("../config/hierarchy_config.json", "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // if file not found save an empty config
    if (error.code === "ENOENT") {
      const defaultConfig = {};
      await saveHierarchyConfig(defaultConfig);
      return defaultConfig;
    }

    console.error("Error reading hierarchy_config.json:", error);
    return null;
  }
}

async function saveHierarchyConfig(config) {
  try {
    await fs.writeFile(
      "../config/hierarchy_config.json",
      JSON.stringify(config, null, 2)
    );
  } catch (error) {
    console.error("Error writing hierarchy_config.json:", error);
  }
}
