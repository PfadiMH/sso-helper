function getEnvVariable(name: string, errorMessage: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(errorMessage);
  }
  return value;
}

export const authorizeBaseUrl = getEnvVariable(
  "AUTHORIZE_BASE_URL",
  "AUTHORIZE_BASE_URL environment variable is not set."
);
export const tokenEndpointUrl = getEnvVariable(
  "TOKEN_ENDPOINT_URL",
  "TOKEN_ENDPOINT_URL environment variable is not set."
);
export const userinfoEndpointUrl = getEnvVariable(
  "USERINFO_ENDPOINT_URL",
  "USERINFO_ENDPOINT_URL environment variable is not set."
);
export const proxyRedirectUri = getEnvVariable(
  "PROXY_REDIRECT_URI",
  "PROXY_REDIRECT_URI environment variable is not set. Should point to this server's /callback."
);
export const finalAppRedirectUrl = getEnvVariable(
  "FINAL_APP_REDIRECT_URL",
  "FINAL_APP_REDIRECT_URL environment variable is not set. The final destination for the client app."
);

const configurationJson = process.env.CONFIGURATION_JSON;
if (!configurationJson) {
  throw new Error("Configuration JSON is not defined");
}

export let configuration: any;
try {
  configuration = JSON.parse(configurationJson);
} catch (error) {
  console.error("Failed to parse CONFIGURATION_JSON:", error);
  throw new Error("Invalid CONFIGURATION_JSON format");
}

export {};
