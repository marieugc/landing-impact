// Envoi d'une notification Web Push (RFC 8291 : chiffrement aes128gcm, RFC 8292 : VAPID),
// uniquement avec WebCrypto : fonctionne dans les Edge Functions Supabase (Deno) sans dépendance.

export type Abonnement = { endpoint: string; p256dh: string; auth: string };
export type Vapid = { publicKey: string; privateKey: string; subject: string };

const enc = new TextEncoder();

export function b64urlEnOctets(texte: string): Uint8Array {
  const b64 = texte.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (texte.length % 4)) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
export function octetsEnB64url(octets: Uint8Array): string {
  let bin = '';
  for (const o of octets) bin += String.fromCharCode(o);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function concat(...parts: Uint8Array[]): Uint8Array {
  const total = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let i = 0;
  for (const p of parts) { total.set(p, i); i += p.length; }
  return total;
}
async function hmac(cle: Uint8Array, donnees: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', cle, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, donnees));
}

// Jeton VAPID (JWT signé ES256) qui prouve au service de notification que l'envoi vient bien de nous
async function jetonVapid(endpoint: string, vapid: Vapid): Promise<string> {
  const pub = b64urlEnOctets(vapid.publicKey);
  const cle = await crypto.subtle.importKey('jwk', {
    kty: 'EC', crv: 'P-256', d: vapid.privateKey,
    x: octetsEnB64url(pub.slice(1, 33)), y: octetsEnB64url(pub.slice(33, 65)), ext: true
  }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const entete = octetsEnB64url(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const corps = octetsEnB64url(enc.encode(JSON.stringify({
    aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: vapid.subject
  })));
  const signature = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, cle, enc.encode(`${entete}.${corps}`)));
  return `${entete}.${corps}.${octetsEnB64url(signature)}`;
}

// Chiffre le message pour le téléphone de l'élève (seul son appareil peut le lire)
export async function chiffrer(abonnement: Abonnement, message: Uint8Array): Promise<Uint8Array> {
  const uaPublic = b64urlEnOctets(abonnement.p256dh);
  const secret = b64urlEnOctets(abonnement.auth);
  const ephemere = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']) as CryptoKeyPair;
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', ephemere.publicKey));
  const cleUa = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const partage = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: cleUa }, ephemere.privateKey, 256));

  const prkCle = await hmac(secret, partage);
  const ikm = await hmac(prkCle, concat(enc.encode('WebPush: info\0'), uaPublic, asPublic, new Uint8Array([1])));
  const sel = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(sel, ikm);
  const cek = (await hmac(prk, concat(enc.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, concat(enc.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12);

  const cleAes = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const chiffre = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cleAes, concat(message, new Uint8Array([2]))));
  const taille = new Uint8Array([0, 0, 0x10, 0]); // enregistrement de 4096 octets
  return concat(sel, taille, new Uint8Array([asPublic.length]), asPublic, chiffre);
}

// Envoie la notification ; renvoie le code HTTP (404 / 410 : abonnement expiré, à supprimer)
export async function envoyerPush(abonnement: Abonnement, donnees: unknown, vapid: Vapid): Promise<number> {
  const corps = await chiffrer(abonnement, enc.encode(JSON.stringify(donnees)));
  const reponse = await fetch(abonnement.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `vapid t=${await jetonVapid(abonnement.endpoint, vapid)}, k=${vapid.publicKey}`,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(24 * 3600),
      Urgency: 'normal'
    },
    body: corps
  });
  await reponse.body?.cancel();
  return reponse.status;
}
