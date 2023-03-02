// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { createHmac } from "crypto";

export function signString(key, toSign) {
  const hmac = createHmac("sha256", key).update(toSign).digest("base64");
  return encodeURIComponent(hmac);
}
