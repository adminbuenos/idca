export type CreateEmployeeLoginResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };