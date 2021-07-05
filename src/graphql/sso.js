import { gql } from 'apollo-server';
import successMessages from '../utils/successMessages';
import cognitoHelper from '../helpers/cognitoHelper';

const typeDefs = gql`
  type RegisterAccount {
    message: String!
  }
  type ResendAccountConfirmation {
    message: String!
  }
  type PasswordResetRequest {
    message: String!
  }
  type ConfirmPasswordResetRequest {
    message: String!
  }
  type AuthenticationInfoSso {
    accessToken: String!
    refreshToken: String!
    idToken: String!
  }
  input UserRegistrationSsoInput {
    email: EmailAddressMock!
    password: String
    firstName: String
    lastName: String
    phone: String
    middleName: String
    address1: String
    address2: String
    city: String
    state: String
    zip: String
  }
  extend type Mutation {
    userSignUp(info: UserRegistrationSsoInput!): RegisterAccount!
    loginSso(email: String!, password: String!): AuthenticationInfoSso!
    resendConfirmation(email: EmailAddressMock!): ResendAccountConfirmation!
    passwordReset(email: EmailAddressMock!): PasswordResetRequest!
    confirmForgotPasswordRequest(
      email: EmailAddressMock!
      token: String!
      password: String!
    ): ConfirmPasswordResetRequest!
  }
`;

const resolvers = {
  Mutation: {
    async userSignUp(_, { info }, { log, secrets }) {
      log.access.info({
        message: `Mutation: userSignUp Description: User registration sso mutation.`,
      });
      const cognitoSecrets = await secrets.cognito.get();
      await cognitoHelper.signUp(
        info.email,
        info.password,
        {
          UserPoolId: cognitoSecrets.cognitoPoolId,
          ClientId: cognitoSecrets.cognitoClientId,
        },
        info,
      );
      return {
        message: successMessages.userSignUp,
      };
    },
    async loginSso(_, { email, password }, { log, secrets }) {
      log.access.info({
        message: `Mutation: loginSso Description: User login mutation.`,
      });
      const cognitoSecrets = await secrets.cognito.get();
      return cognitoHelper.signIn(email, password, {
        UserPoolId: cognitoSecrets.cognitoPoolId,
        ClientId: cognitoSecrets.cognitoClientId,
      });
    },
    async resendConfirmation(_, { email }, { secrets, log }) {
      log.access.info({
        message: `Mutation: resendConfirmation Description: ResendConfirmation`,
      });
      const cognitoSecrets = await secrets.cognito.get();
      const cognito = await cognitoHelper.cognitoIdentityServiceProvider(cognitoSecrets);
      const params = {
        ClientId: cognitoSecrets.cognitoClientId,
        Username: email,
      };
      await cognito.resendConfirmationCode(params).promise();

      return {
        message: successMessages.resendConfirmation,
      };
    },
    async passwordReset(_, { email }, { secrets, log }) {
      log.access.info({
        message: `Mutation: passwordReset Description: Password reset request`,
      });
      const cognitoSecrets = await secrets.cognito.get();
      const cognito = await cognitoHelper.cognitoIdentityServiceProvider(cognitoSecrets);
      await cognito
        .forgotPassword({
          ClientId: cognitoSecrets.cognitoClientId,
          Username: email,
        })
        .promise();
      return {
        message: successMessages.passwordResetRequest,
      };
    },
    async confirmForgotPasswordRequest(_, { email, token, password }, { secrets, log }) {
      log.access.info({
        message: `Mutation: confirmForgotPassword Description: Password reset using token`,
      });
      const cognitoSecrets = await secrets.cognito.get();
      const cognito = await cognitoHelper.cognitoIdentityServiceProvider(cognitoSecrets);
      await cognito
        .confirmForgotPassword({
          ClientId: cognitoSecrets.cognitoClientId,
          ConfirmationCode: token,
          Username: email,
          Password: password,
        })
        .promise();
      return {
        message: successMessages.confirmPasswordReset,
      };
    },
  },
};

export default { typeDefs, resolvers };
