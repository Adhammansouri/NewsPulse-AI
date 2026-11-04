import type { AuthUser, LoginData } from "../types/auth.js";
import { InvalidCredentialsError, UnauthorizedError } from "../utils/errors.js";
import { normalizeEmail } from "../utils/identifier.js";
import type { IPasswordHasher } from "../utils/passwordHasher.js";
import { toAuthUser } from "../model/user.js";
import type { IMailer } from "./mailer.js";
import type { ITokenIssuer } from "./tokenIssuer.js";
import type { IUserRepository } from "./userRepository.js";

const DUMMY_HASH = "00".repeat(16) + ":" + "00".repeat(64);

type AuthServiceDeps = {
  users: IUserRepository;
  hasher: IPasswordHasher;
  mailer: IMailer;
  tokens: ITokenIssuer;
};

export class AuthService {
  constructor(private readonly deps: AuthServiceDeps) {}

  async login(identifier: string, password: string): Promise<LoginData> {
    const user = await this.deps.users.findByLoginIdentifier(identifier);
    const hash = user?.passwordHash ?? DUMMY_HASH;
    const matches = await this.deps.hasher.verify(password, hash);

    if (!user || !matches) {
      throw new InvalidCredentialsError();
    }

    return {
      token: this.deps.tokens.sign({ sub: user.id }),
      user: toAuthUser(user),
    };
  }

  async getUserById(id: string): Promise<AuthUser> {
    const user = await this.deps.users.findById(id);
    if (!user) throw new UnauthorizedError();
    return toAuthUser(user);
  }

  /** Every account, as the public user shape (S15 team directory). */
  async listUsers(): Promise<AuthUser[]> {
    return (await this.deps.users.listAll()).map(toAuthUser);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.deps.users.findByEmail(normalizeEmail(email));
    if (!user?.email) return;

    await this.deps.mailer.send({
      to: user.email,
      subject: "Newsplus password reset",
      text: "A password reset was requested for this account.",
    });
  }
}