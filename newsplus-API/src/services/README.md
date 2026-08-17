# Services

Business logic lives here. Auth depends on interfaces (`IUserRepository`, `IPasswordHasher`, `IMailer`, `ITokenIssuer`) so persistence and mail can be swapped without changing the use cases.