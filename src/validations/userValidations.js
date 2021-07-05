import errors from '../utils/errorMessages';

exports.emailExists = async (email, services) => {
  const account = await services.account.emailExists(email);
  if (account) {
    throw new Error(`${errors.emailExists}`);
  }
};

exports.emailExistsForSelfProfileEdit = async (email, currentAccountId, services) => {
  const available = await services.account.isEmailAvailable(email, currentAccountId);
  if (!available) {
    throw new Error(`${errors.emailExists}`);
  }
};
