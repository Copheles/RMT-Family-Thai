import type { AxiosError } from "axios";
import type { ValidationApiError } from "@/types/api";

export function getApiErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ValidationApiError>;
  const errors = axiosError.response?.data?.errors;
  if (errors) {
    const firstField = Object.keys(errors)[0];
    const firstMessage = firstField ? errors[firstField]?.[0] : undefined;
    if (firstMessage) {
      return firstMessage;
    }
  }
  return axiosError.response?.data?.message ?? axiosError.message ?? "Request failed";
}

