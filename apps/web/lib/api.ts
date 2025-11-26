type FetchOptions = {
    method?:"GET" | "POST" | "PUT" | "DELETE"
    body?:any
    headers?:Record<string,string>
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") || null;

export async function api<T>(path: string, options: FetchOptions = {}) {
  const { method = "GET", body, headers = {} } = options;
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : `/api${path}`;

  const res = await fetch(url, {
        method,
        credentials: "include", // Include cookies in the request
        headers: {
            "Content-Type":"application/json",
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
        // Don't redirect here - let the components handle auth errors
        // This prevents infinite redirect loops
        const error: any = new Error(`API Error: ${res.statusText}`);
        error.status = res.status;
        throw error;
    }
    if (res.status === 204) return null as T;

    return res.json() as Promise<T>;
}