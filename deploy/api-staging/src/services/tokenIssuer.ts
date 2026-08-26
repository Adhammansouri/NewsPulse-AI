export type TokenPayload = {
  sub: string;
};

export interface ITokenIssuer {
  sign(payload: TokenPayload): string;
}