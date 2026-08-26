export function successResponse<T>(data: T) {
  return {
    status: "success" as const,
    data,
  };
}

export function failResponse(message: string) {
  return {
    status: "fail" as const,
    message,
  };
}
