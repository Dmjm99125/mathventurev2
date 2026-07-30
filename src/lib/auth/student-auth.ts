export type StudentSessionPayload = {
  status: "ok";
  email: string;
  tokenHash: string;
  verifyType: "email";
};

export type StudentRegisterResponse =
  | StudentSessionPayload
  | { status: "already_registered" };

export type StudentLoginResponse =
  | StudentSessionPayload
  | { status: "invalid_credentials" };

export function isStudentSessionPayload(value: unknown): value is StudentSessionPayload {
  return typeof value === "object"
    && value !== null
    && (value as StudentSessionPayload).status === "ok"
    && typeof (value as StudentSessionPayload).tokenHash === "string";
}

export function buildVerifyOtpParams(payload: StudentSessionPayload) {
  return { token_hash: payload.tokenHash, type: payload.verifyType } as const;
}
