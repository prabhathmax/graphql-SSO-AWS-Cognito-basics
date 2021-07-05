import bcrypt from 'bcrypt';

const profileForAccount = async (knex, userId) =>
  knex('profiles')
    .select(['userId', 'firstName', 'lastName', 'middleName', 'imageUrl', 'createdAt', 'updatedAt'])
    .where({ userId })
    .first();

class AccountRepository {
  constructor(kenx) {
    this.database = kenx;
    this.accountColumns = ['userId', 'email', 'password', 'resetToken', 'createdAt', 'updatedAt'];
  }

  async add(info) {
    let user;
    const now = new Date();
    const saltRounds = 3;
    const password = await bcrypt.hash(info.password, saltRounds);
    await this.database.transaction(async (trx) => {
      const account = await this.database('accounts')
        .insert({
          email: info.email,
          password,
          createdAt: now,
          updatedAt: now,
        })
        .transacting(trx);
      await this.database('profiles')
        .insert({
          userId: account[0],
          firstName: info.firstName,
          lastName: info.lastName,
          middleName: info.middleName,
          createdAt: now,
          updatedAt: now,
        })
        .transacting(trx);
      await trx.commit();
      user = account;
    });
    return this.findAccountById(user[0]);
  }

  async findAccountById(userId) {
    const account = await this.database('accounts')
      .select(this.accountColumns)
      .where({ userId })
      .first();
    return {
      ...account,
      profile: await profileForAccount(this.database, userId),
    };
  }

  async all() {
    return this.database('accounts').select(this.accountColumns);
  }

  async profile(userId) {
    return profileForAccount(this.database, userId);
  }

  async findByEmail(email) {
    const account = await this.database('accounts')
      .select(this.accountColumns)
      .where({ email })
      .first();

    if (account) {
      return {
        ...account,
        profile: await profileForAccount(this.database, account.userId),
      };
    }

    return null;
  }

  async changeProfileImageUrl(userId, imageUrl) {
    return this.database('profiles').where({ userId }).update({
      imageUrl,
    });
  }
}

export default AccountRepository;
