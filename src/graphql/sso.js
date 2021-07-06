import { gql } from 'apollo-server';
import { EmailAddressMock, DateTimeMock } from 'graphql-scalars';
import { GraphQLUpload } from 'graphql-upload';
import successMessages from '../utils/successMessages';
import cognitoHelper from '../helpers/cognitoHelper';

const typeDefs = gql`
  scalar DateTimeMock
  scalar EmailAddressMock
  scalar Upload

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
  type UserSignOut {
    message: String!
  }
  type UserPasswordChange {
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
    signOut: UserSignOut!
    passwordChange(token: String!, newPassword: String!, oldPassword: String!): UserPasswordChange!
  }
`;

const resolvers = {
  DateTimeMock,
  EmailAddressMock,
  Upload: GraphQLUpload,
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
    async logOut(_, __, { secrets, log, email }) {
      log.access.info({
        message: `Mutation: logOut UserId: ${email} Description: logOut by user`,
      });
      const cognitoSecrets = await secrets.cognito.get();
      const cognito = await cognitoHelper.cognitoIdentityServiceProvider(cognitoSecrets);
      await cognito
        .adminUserGlobalSignOut({
          UserPoolId: cognitoSecrets.cognitoPoolId,
          Username: email,
        })
        .promise();
      return {
        message: successMessages.userSignOut,
      };
    },
  },
  async passwordChange(_, { token, newPassword, oldPassword }, { secrets, log, currentEmail }) {
    log.access.info({
      message: `Mutation: passwordChange email: ${currentEmail} Description: Change user password`,
    });
    const cognitoSecrets = await secrets.cognito.get();
    const cognito = await cognitoHelper.cognitoIdentityServiceProvider(cognitoSecrets);
    await cognito
      .changePassword({
        AccessToken: token,
        PreviousPassword: oldPassword,
        ProposedPassword: newPassword,
      })
      .promise();
    return {
      message: successMessages.userPasswordChanged,
    };
  },
};

export default { typeDefs, resolvers };
