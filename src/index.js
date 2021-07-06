import { ApolloServer } from 'apollo-server';
import createSchema from './graphql';
import createContext from './context';
import cognitoAuthService from './domain/authentication/cognitoAuthService';

const getCurrentAccountId = async (headers, services, secrets) => {
  const matcher = /^Bearer .+$/gi;
  const { authorization = null } = headers;
  if (authorization && matcher.test(authorization)) {
    const [, token] = authorization.split(/\s+/);
    try {
      if (token) {
        return cognitoAuthService.cognitoAuth(token, services, secrets);
      }
    } catch (e) {
      // We do nothing so it returns null
    }
  }
  return null;
};

const port = /^\d+$/.test(process.env.PORT) ? Number(process.env.PORT) : 4000;
(async () => {
  const context = await createContext();
  const server = new ApolloServer({
    subscriptions: {
      path: '/subscriptions',
    },
    schema: createSchema(context),
    context: async ({ req, connection }) => {
      if (connection) {
        // Operation is a Subscription
        const currentEmail = await getCurrentAccountId(
          connection.context,
          context.services,
          context.secrets,
        );
        return {
          ...context,
          currentEmail,
        };
      }
      // Operation is a Query/Mutation
      const currentEmail = await getCurrentAccountId(
        req.headers,
        context.services,
        context.secrets,
      );
      return {
        ...context,
        currentEmail,
      };
    },
  });

  server.listen({ port }, () => {
    /* eslint-disable no-console */
    console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`);
    console.log(
      `🚀 Subscription Server ready at http://localhost:${port}${server.subscriptionsPath}`,
    );
  });
})().catch((error) => {
  /* eslint-disable no-console */
  console.log(error);
});
