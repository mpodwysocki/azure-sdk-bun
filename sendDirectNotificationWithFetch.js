import * as dotenv from "dotenv";
import { createToken } from "./auth/sasTokenProvider";
import { parseNotificationHubsConnectionString } from "./auth/connectionStringUtils";

// Load the .env file if it exists
dotenv.config();

// Define API version
const API_VERSION = "2020-06";

// Define connection string and hub name
const connectionString = process.env.NOTIFICATIONHUBS_CONNECTION_STRING || "<connection string>";
const hubName = process.env.NOTIFICATION_HUB_NAME || "<hub name>";

// Define message constants
const DUMMY_DEVICE = "00fc13adff785122b4ad28809a3420982341241421348097878e577c991de8f0";
const deviceHandle = process.env.APNS_DEVICE_TOKEN || DUMMY_DEVICE;

async function main() {
  const connectionStringInfo = parseNotificationHubsConnectionString(connectionString);
  const url = getRequestUrl(connectionStringInfo);

  const headers = createHeaders(connectionStringInfo);

  const body = `{ "aps" : { "alert" : "Hello" } }`;
  const method = "POST";

  const response = await fetch(url, {
    body,
    headers,
    method
  });

  const { trackingId, correlationId } = processResponse(response);

  console.log("HTTP Status: ", response.status);
  console.log(`Tracking ID: ${trackingId}`);
  console.log(`Correlation ID: ${correlationId}`);
}

main().catch((err) => {
  console.log("Sample: Error occurred: ", err);
  process.exit(1);
});

function processResponse(response) {
  if (!response.ok) {
    throw new Error(`Failed to send notification: ${response.status} ${response.statusText}`);
  }

  const trackingId = response.headers.get("trackingid") || undefined;
  const correlationId = response.headers.get("x-ms-correlation-request-id") || undefined;
  return { trackingId, correlationId };
}

function createHeaders(connectionStringInfo) {
  const authorization = createToken(
    connectionStringInfo.sharedAccessKeyName,
    connectionStringInfo.sharedAccessKey,
    connectionStringInfo.endpoint);
  const headers = new Headers();
  headers.set("Authorization", authorization.token);
  headers.set("x-ms-version", API_VERSION);
  headers.set("Content-Type", "application/json");
  headers.set("apns-priority", "10");
  headers.set("apns-push-type", "alert");
  headers.set("ServiceBusNotification-Format", "apple");
  headers.set("ServiceBusNotification-DeviceHandle", deviceHandle);
  return headers;
}

function getRequestUrl(connectionStringInfo) {
  const url = new URL(connectionStringInfo.endpoint.replace("sb://", "https://"));
  url.pathname = `${hubName}/messages`;
  url.searchParams.set("api-version", API_VERSION);
  url.searchParams.set("direct", "true");
  return url;
}

