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

export type ApiFailResponse = {
  status: "fail";
  message: string;
};

/** @deprecated Use HealthData inside ApiSuccessResponse */
export type HealthResponse = HealthData;
