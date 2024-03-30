// Original is taken and modified from: https://github.com/postalserver/postal/issues/432#issuecomment-730454586
// modified for clarity and to remove unnecessary code, credits at the end of the file

// Modified version of https://github.com/un/inbox/blob/main/apps/mail-bridge/utils/validatePostalWebhookSignature.ts
import crypto from 'crypto';

export async function validatePostalWebhookSignature(
  body: string,
  postalSignature: string,
  postalWebhookPKs: string[]
): Promise<boolean> {
  for (const postalWebhookPK of postalWebhookPKs) {
    // convert postal public key to PEM (X.509) format
    const publicKey =
      '-----BEGIN PUBLIC KEY-----\r\n' +
      chunkSplit(postalWebhookPK, 64, '\r\n') +
      '-----END PUBLIC KEY-----';
    const verifier = crypto.createVerify('SHA1');
    verifier.update(jsonToRubyString(body));

    // if verification passes for any key, return true
    if (verifier.verify(publicKey, postalSignature, 'base64')) {
      return true;
    }
  }

  // if none of the keys pass verification, return false
  return false;
}

function chunkSplit(key: string, chunkSize: number, newLineReturn: string) {
  if (!key) return false;
  newLineReturn = newLineReturn || '\r\n';
  if (chunkSize < 1) {
    return false;
  }
  const chunked = key
    .match(new RegExp('.{0,' + chunkSize + '}', 'g'))!
    .join(newLineReturn);
  return chunked;
}

function jsonToRubyString(jsonString: string) {
  const json = JSON.stringify(jsonString);
  return json.replace(
    /[\u2028\u2029&><]/gu,
    (c) => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4)
  );
}
