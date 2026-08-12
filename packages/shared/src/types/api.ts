export type HealthData = {
  status: string;
  app: string;
  version: string;
  phase: string;
  openai: boolean;
};

export type ApiSuccessResponse<T> = {
  status: "success";
  data: T;
};

/** @deprecated Use HealthData inside ApiSuccessResponse */
export type HealthResponse = HealthData;
