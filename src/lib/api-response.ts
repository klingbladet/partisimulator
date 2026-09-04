/** Builds a JSON error response in the shape every API route in this app uses. */
export function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}
