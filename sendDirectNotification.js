import * as dotenv from "dotenv";
import { createClientContext, sendNotification } from "@azure/notification-hubs/api";
import { createAppleNotification } from "@azure/notification-hubs/models";

// Load the .env file if it exists
dotenv.config();

// Define connection string and hub name
const connectionString = process.env.NOTIFICATIONHUBS_CONNECTION_STRING || "<connection string>";
const hubName = process.env.NOTIFICATION_HUB_NAME || "<hub name>";

// Define message constants
const DUMMY_DEVICE = "00fc13adff785122b4ad28809a3420982341241421348097878e577c991de8f0";
const deviceHandle = process.env.APNS_DEVICE_TOKEN || DUMMY_DEVICE;

async function main() {
  const context = createClientContext(connectionString, hubName);

  const messageBody = `{ "aps" : { "alert" : "Hello" } }`;
  const notification = createAppleNotification({
    body: messageBody,
    headers: {
      "apns-priority": "10",
      "apns-push-type": "alert",
    },
  });

  // Send now
  const result = await sendNotification(context, notification, { deviceHandle });

  console.log(`Scheduled send Tracking ID: ${result.trackingId}`);
  console.log(`Scheduled send Correlation ID: ${result.correlationId}`);
  console.log(`Scheduled send Notification ID: ${result.notificationId}`);
}

main().catch((err) => {
  console.log("sendNotification Sample: Error occurred: ", err);
  process.exit(1);
});
