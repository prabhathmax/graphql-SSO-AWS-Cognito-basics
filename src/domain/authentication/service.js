import { compare } from 'bcrypt';
import jwt from 'jsonwebtoken';

export default class AuthenticationService {
  constructor(accountService, jwtSecret) {
    this.accountService = accountService;
    this.jwtSecret = jwtSecret;
  }

  async login(email, password) {
    const account = await this.accountService.findByEmail(email);
    if (!account) {
      throw new Error(`No user found for email: ${email}`);
    }

    if (!(account && (await compare(password, account.password)))) {
      throw new Error('Invalid email and/or password');
    }

    const secret = await this.jwtSecret.get();
    return {
      token: jwt.sign({ email, id: account.userId }, secret),
      userId: account.userId,
    };
  }
}
