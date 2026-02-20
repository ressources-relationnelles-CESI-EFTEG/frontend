type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
type RequestBody = BodyInit | object | null;

interface RequestOptions<TBody extends RequestBody = RequestBody> {
  method?: HttpMethod;
  body?: TBody;
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: HeadersInit;
}

export async function apiRequest<TResponse, TBody extends RequestBody = RequestBody>(
  path: string,
  options: RequestOptions<TBody> = {},
): Promise<TResponse> {
  const config = useRuntimeConfig();
  const baseURL = config.public.apiBase;

  return $fetch<TResponse>(path, {
    baseURL,
    method: options.method ?? 'GET',
    body: options.body,
    query: options.query,
    headers: options.headers,
  });
}
