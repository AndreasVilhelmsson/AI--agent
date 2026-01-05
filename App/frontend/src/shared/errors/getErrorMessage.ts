import axios from "axios";

export function getErrorMessage(error: unknown, fallback = "Unexpected error") {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data ??
      error.message ??
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
