import { ApolloServer } from 'apollo-server';
import jwt from 'jsonwebtoken';
import createSchema from './graphql';
import createContext from './context';

const getCurrentAccountId = async (headers, jwtSecret) => {
  const matcher = /^Bearer .+$/gi;
  const { authorization = null } = headers;
  if (authorization && matcher.test(authorization)) {
    const [, token] = authorization.split(/\s+/);
    try {
      const secret = await jwtSecret.get();
      const { id: accountId = null } = jwt.verify(token, secret);
      return accountId;
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
        const currentAccountId = await getCurrentAccountId(connection.context, context.secrets.jwt);
        return {
          ...context,
          currentAccountId,
        };
      }
      // Operation is a Query/Mutation
      const currentAccountId = await getCurrentAccountId(req.headers, context.secrets.jwt);
      return {
        ...context,
        currentAccountId,
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
