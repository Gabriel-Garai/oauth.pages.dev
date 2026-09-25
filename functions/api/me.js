export function onRequestGet() {
  return Response.json(
    {
      authenticated: false
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
