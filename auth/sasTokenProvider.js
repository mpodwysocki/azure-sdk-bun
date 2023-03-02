// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { signString } from "./hmacSha256.js";

/**
 * Creates the sas token based on the provided information.
 * @param keyName - The shared access key name.
 * @param key - The shared access key.
 * @param expiry - The time period in unix time after which the token will expire.
 * @param audience - The audience for which the token is desired.
 * @internal
 */
export function createToken(
  keyName,
  key,
  audience
) {
  const expiry = Math.floor(Date.now() / 1000) + 3600;
  audience = encodeURIComponent(audience.toLowerCase());
  keyName = encodeURIComponent(keyName);
  const stringToSign = audience + "\n" + expiry;
  const sig = signString(key, stringToSign);

  return {
    token: `SharedAccessSignature sr=${audience}&sig=${sig}&se=${expiry}&skn=${keyName}`,
    expiresOnTimestamp: expiry,
  };
}
