export async function onRequestGet(context) {
  const provider = context.params.provider;

  if (provider !== "google" && provider !== "github") {
    return new Response("Provider inválido", {
      status: 400,
    });
  }

  const state = crypto.randomUUID();

  let authorizationUrl;

  if (provider === "google") {
    const params = new URLSearchParams({
      client_id: context.env.GOOGLE_CLIENT_ID,
      redirect_uri: `${context.env.PUBLIC_BASE_URL}/oauth/callback/google`,
      response_type: "code",
      scope: "openid email profile",
      state,
    });

    authorizationUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  if (provider === "github") {
    const params = new URLSearchParams({
      client_id: context.env.GITHUB_CLIENT_ID,
      redirect_uri: `${context.env.PUBLIC_BASE_URL}/oauth/callback/github`,
      scope: "read:user user:email",
      state,
    });

    authorizationUrl =
      `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizationUrl,
      "Set-Cookie": `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}
