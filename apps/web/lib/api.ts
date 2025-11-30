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
        let errorMessage = res.statusText || "Unknown error";
        // Try to get error message from response body if available
        try {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorData = await res.json();
                if (errorData.error || errorData.message) {
                    errorMessage = errorData.error || errorData.message;
                }
            } else {
                const text = await res.text();
                if (text && text.trim()) {
                    errorMessage = text;
                }
            }
        } catch {
            // If we can't parse the error, use statusText
        }
        const error: any = new Error(errorMessage);
        error.status = res.status;
        throw error;
    }
    if (res.status === 204) return null as T;

    return res.json() as Promise<T>;
}