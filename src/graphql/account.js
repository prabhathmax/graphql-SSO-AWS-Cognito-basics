import { gql } from 'apollo-server';
import { DateTimeMock, EmailAddressMock } from 'graphql-scalars';
import { GraphQLUpload } from 'graphql-upload';
import s3Helper from '../helpers/s3Helper';
import validations from '../validations/userValidations';
import successMessages from '../utils/successMessages';

const typeDefs = gql`
  scalar DateTimeMock
  scalar EmailAddressMock
  scalar Upload

  type Account {
    userId: Int!
    email: String!
    createdAt: DateTimeMock!
    updatedAt: DateTimeMock
    profile: Profile!
  }
  type Profile {
    userId: Int!
    firstName: String!
    lastName: String!
    middleName: String
    createdAt: DateTimeMock!
    updatedAt: DateTimeMock
  }
  type AuthenticationInfo {
    token: String!
    account: Account!
  }
  type UserImageUpload {
    message: String
    url: String
  }
  input CreateAccountInput {
    email: EmailAddressMock!
    password: String
    firstName: String!
    lastName: String!
    middleName: String
  }
  extend type Mutation {
    addAccountWithProfile(info: CreateAccountInput!): Account!
    login(email: String!, password: String!): AuthenticationInfo
    uploadUserImage(inputFile: Upload): UserImageUpload!
  }
  extend type Query {
    allAccounts: [Account]!
      @authenticated
      @hasPermission(permission: "all_users")
      @hasRole(role: "admin")
  }
`;

const resolvers = {
  DateTimeMock,
  EmailAddressMock,
  Upload: GraphQLUpload,
  Account: {
    async profile(account, __, { services }) {
      return services.account.findProfile(account.userId);
    },
  },
  Mutation: {
    async addAccountWithProfile(_, { info }, { services, log }) {
      log.access.info({
        message: `Mutation: addAccountWithProfile Description: User registration mutation triggred.`,
      });
      await validations.emailExists(info.email, services); // validate email exists
      return services.account.addAccount(info);
    },
    async login(_, { email, password }, { services }) {
      const { token } = await services.authentication.login(email, password);
      const account = await services.account.findByEmail(email);
      return { token, account };
    },
    async uploadUserImage(_, { inputFile }, { services, secrets, currentAccountId }) {
      const { filename, mimetype, stream } = await inputFile;
      const { bucket, region } = await secrets.s3.get();
      const s3Url = await s3Helper.uploadFileToS3UsingStream(
        mimetype,
        filename.split('.').pop(),
        stream,
        {
          bucket,
          region,
          path: `jollycoding/usersImages/${currentAccountId}`,
        },
        filename.split('.')[0],
      );
      await services.account.getChangeProfileImageUrl(currentAccountId, s3Url.url);
      return {
        message: successMessages.userImageUpdated,
        url: s3Url.url,
      };
    },
  },
  Query: {
    async allAccounts(_, __, { services, log }) {
      log.access.info({
        message: `Query: allAccounts Description: View all accounts query triggred.`,
      });
      return services.account.findAll();
    },
  },
};

export default { typeDefs, resolvers };
