import { APP_CONFIG } from '../constants/config';

export const API_BASE_URL = APP_CONFIG.API_BASE_URL;

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    token,
    headers,
    body,
    ...requestOptions
  } = options;

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...requestOptions,

      // IMPORTANT:
      // Convert JavaScript object body into JSON
      body:
        body !== undefined && body !== null
          ? typeof body === 'string'
            ? body
            : JSON.stringify(body)
          : undefined,

      headers: {
        'Content-Type': 'application/json',

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...headers,
      },
    },
  );

  // Handle unsuccessful responses
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const errorData = await response.json();

      if (errorData?.detail) {
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else {
          errorMessage = JSON.stringify(errorData.detail);
        }
      }
    } catch {
      // Response was not JSON
    }

    throw new Error(errorMessage);
  }

  // Handle empty response
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}