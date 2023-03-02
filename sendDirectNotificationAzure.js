import * as dotenv from "dotenv";
import * as https from "node:https";
import { createToken } from "./auth/sasTokenProvider.js";
import { parseNotificationHubsConnectionString } from "./auth/connectionStringUtils.js";

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

  const { trackingId, correlationId } = await sendRequest(url, headers, body, method);

  console.log(`Tracking ID: ${trackingId}`);
  console.log(`Correlation ID: ${correlationId}`);
}

main().catch((err) => {
  console.log("Sample: Error occurred: ", err);
  process.exit(1);
});

async function sendRequest(url, headers, body, method) {
  const agent = new https.Agent({

  });

  const options = {
    agent,
    hostname: url.hostname,
    path: `${url.pathname}${url.search}`,
    port: url.port,
    method: method,
    headers: headers
  };

  return new Promise((resolve, reject) => {
    const request = https.request(url, options, (response) => {
      const res = processResponse(response);
      res.body = "";

      response.on("data", (data) => {
        res.body += data;
      });

      response.on("end", () => {
        resolve(res);
      });
    });

    request.on("error", (err) => {
      reject(err);
    });

    request.write(body);
    request.end();
  });
}

function createHeaders(connectionStringInfo) {
  const authorization = createToken(
    connectionStringInfo.sharedAccessKeyName,
    connectionStringInfo.sharedAccessKey,
    connectionStringInfo.endpoint);
  const headers = {
    "Authorization": authorization.token,
    "x-ms-version": API_VERSION,
    "Content-Type": "application/json",
    "apns-priority": "10",
    "apns-push-type": "alert",
    "ServiceBusNotification-Format": "apple",
    "ServiceBusNotification-DeviceHandle": deviceHandle
  };

  return headers;
}

function getRequestUrl(connectionStringInfo) {
  const url = new URL(connectionStringInfo.endpoint.replace("sb://", "https://"));
  url.pathname = `${hubName}/messages`;
  url.searchParams.set("api-version", API_VERSION);
  url.searchParams.set("direct", "true");
  return url;
}

function processResponse(response) {
  return {
    correlationId: response.headers["x-ms-correlation-request-id"],
    trackingId: response.headers["trackingid"],
    statusCode: response.statusCode
  }
}
