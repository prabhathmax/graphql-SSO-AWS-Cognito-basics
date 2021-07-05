class AccountService {
  constructor(AccountRepository) {
    this.repository = AccountRepository;
  }

  async addAccount(info) {
    return this.repository.add(info);
  }

  async findAll() {
    return this.repository.all();
  }

  async findProfile(userId) {
    return this.repository.profile(userId);
  }

  async findByEmail(email) {
    return this.repository.findByEmail(email);
  }

  async getChangeProfileImageUrl(userId, image) {
    return this.repository.changeProfileImageUrl(userId, image);
  }
}

export default AccountService;
