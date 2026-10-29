export async function post(path, body, token) {
  let r;
  try {
    r = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("net");
  }
  const d = await r.json().catch(() => null);
  if (!r.ok || !d)
    throw new Error(r.status === 404 || !d ? "net" : d.error || "server");
  return d;
}
