import { gql, PubSub } from 'apollo-server';

const POST_ADDED = 'POST_ADDED';
const pubsub = new PubSub();

const typeDefs = gql`
  type Post {
    author: String
    comment: String
  }
  input AddPost {
    author: String
    comment: String
  }
  extend type Mutation {
    addPost(info: AddPost!): Post
  }
  extend type Subscription {
    postAdded: Post
  }
`;

const resolvers = {
  Mutation: {
    addPost(_, { info }) {
      pubsub.publish(POST_ADDED, { postAdded: info });
      return {
        author: info.author,
        comment: info.comment,
      };
    },
  },
  Subscription: {
    postAdded: {
      // Additional event labels can be passed to asyncIterator creation
      subscribe: () => pubsub.asyncIterator([POST_ADDED]),
    },
  },
};

export default { typeDefs, resolvers };
