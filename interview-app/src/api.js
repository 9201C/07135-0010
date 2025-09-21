const BASE_URL = "https://comp2140a2.uqcloud.net/api";
const TOKEN    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic3R1ZGVudCIsInVzZXJuYW1lIjoiczQ5NzE1MTQifQ.khswZacWZLxEseg6eBQuyq5iKwfrxmwFbiA6g2wQsVY";

export async function api(path, { method="GET", body, headers={} } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} – ${text}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}


export const get  = (p) => api(p);
export const post = (p, b) => api(p, { method: "POST", body: b });
export const patch= (p, b) => api(p, { method: "PATCH", body: b });
export const del  = (p) => api(p, { method: "DELETE" });
