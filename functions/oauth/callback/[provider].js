export async function onRequestGet(context) {
  const provider = context.params.provider;
  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (provider !== "google" && provider !== "github") {
    return new Response("Provider inválido", {
      status: 400,
    });
  }

  if (!code || !state) {
    return new Response("Código ou state ausente", {
      status: 400,
    });
  }

  const cookies = context.request.headers.get("Cookie") || "";
  const stateCookie = cookies
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("oauth_state="));

  const savedState = stateCookie
    ? stateCookie.substring("oauth_state=".length)
    : null;

  if (!savedState || savedState !== state) {
    return new Response("State inválido", {
      status: 400,
    });
  }

  return new Response(`Callback recebido: ${provider}`, {
    status: 200,
  });
}
