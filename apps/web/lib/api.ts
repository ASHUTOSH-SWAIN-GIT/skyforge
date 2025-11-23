type FetchOptions = {
    method?:"GET" | "POST" | "PUT" | "DELETE"
    body?:any
    headers?:Record<string,string>
}

export async function api <T>(path :string,options:FetchOptions = {}){
    const { method= "GET" , body , headers = {} } = options;

    const res =  await fetch(`/api${path}` , {
        method,
        credentials: "include", // Include cookies in the request
        headers: {
            "Content-Type":"application/json",
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
        // Handle 401 (Unauthorized) by redirecting to login
        if (res.status === 401) {
          window.location.href = "/login";
          throw new Error("Unauthorized");
        }
        throw new Error(`API Error: ${res.statusText}`);
    }
    if (res.status === 204) return null as T;

    return res.json() as Promise<T>;
}