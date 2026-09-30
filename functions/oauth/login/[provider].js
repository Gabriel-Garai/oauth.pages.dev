function base64url(bytes) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function randomValue() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64url(new Uint8Array(hash));
}

export async function onRequestGet(context) {
  const provider = context.params.provider;

  if (provider !== "google" && provider !== "github") {
    return new Response("Not Found", {
      status: 404,
    });
  }

  const transactionId = randomValue();
  const state = randomValue();
  const codeVerifier = randomValue();

  const codeChallenge = await sha256(codeVerifier);
  const idHash = await sha256(transactionId);
  const stateHash = await sha256(state);

  const nonce = provider === "google"
    ? randomValue()
    : null;

  const expiresAt = Math.floor(Date.now() / 1000) + 600;

  await context.env.DB.prepare(`
    INSERT INTO oauth_transactions
      (id_hash, provider, state_hash, nonce, code_verifier, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
    .bind(
      idHash,
      provider,
      stateHash,
      nonce,
      codeVerifier,
      expiresAt
    )
    .run();

  let authorizationUrl;

  if (provider === "google") {
    const params = new URLSearchParams({
      client_id: context.env.GOOGLE_CLIENT_ID,
      redirect_uri: `${context.env.PUBLIC_BASE_URL}/oauth/callback/google`,
      response_type: "code",
      scope: "openid email profile",
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    authorizationUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  if (provider === "github") {
    const params = new URLSearchParams({
      client_id: context.env.GITHUB_CLIENT_ID,
      redirect_uri: `${context.env.PUBLIC_BASE_URL}/oauth/callback/github`,
      response_type: "code",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    authorizationUrl =
      `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizationUrl,
      "Set-Cookie":
        `__Host-oauth-tx=${transactionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      "Cache-Control": "no-store",
    },
  });
}
