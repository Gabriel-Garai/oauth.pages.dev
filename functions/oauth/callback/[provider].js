export async function onRequestGet(context) {
  const provider = context.params.provider;

  return new Response(
    `Callback provider: ${provider}`
  );
}
