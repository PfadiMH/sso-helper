import axios from "axios";
import { Request, Response } from "express";
import { userinfoEndpointUrl } from "../config";
import { translateUserinfoData } from "../utils/transaltor";

export const userinfo = async (req: Request, res: Response) => {
  console.log(
    `[${new Date().toISOString()}] Received GET /userinfo request from Keycloak:`,
    req.query
  );
  const accessToken = req.headers["authorization"]?.split(" ")[1];
  if (!accessToken) {
    console.error(
      `[${new Date().toISOString()}] Error: Missing access token in Authorization header.`
    );
    return res.status(401).json({
      error: "invalid_token",
      error_description: "Missing access token in Authorization header.",
    });
  }
  try {
    const userinfoResponse = await axios.get(userinfoEndpointUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      validateStatus: (status) => status >= 200 && status < 600,
    });

    console.log(
      `[${new Date().toISOString()}] Received response from actual userinfo endpoint (Status: ${
        userinfoResponse.status
      }):`,
      userinfoResponse.data
    );

    // -- Response Transformation --
    const transformedUserinfo = translateUserinfoData(userinfoResponse.data);

    res.status(userinfoResponse.status).json(transformedUserinfo);
  } catch (error: any) {
    console.error(
      `[${new Date().toISOString()}] Error during userinfo proxy call to ${
        userinfoEndpointUrl ?? ""
      }:`,
      error.message,
      error.stack
    );
    res.status(500).json({
      error: "proxy_internal_error",
      error_description: `Failed to communicate with upstream userinfo endpoint: ${
        userinfoEndpointUrl ?? ""
      }: ${error.message}`,
    });
  }
};
