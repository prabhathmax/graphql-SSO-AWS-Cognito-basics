import { gql, makeExecutableSchema } from 'apollo-server';
import merge from 'lodash.merge';
import AuthenticatedDirective from './directives/authenticated';
import createHasRoleDirective from './directives/has-role';
import createHasPermissionDirective from './directives/has-permission';
import post from './post';
import sso from './sso';

const defaultTypeDefs = gql`
  directive @authenticated on OBJECT | FIELD_DEFINITION
  directive @hasRole(role: String!) on OBJECT | FIELD_DEFINITION
  directive @hasPermission(permission: String!) on OBJECT | FIELD_DEFINITION

  type Query {
    _empty: String
  }
  type Mutation {
    _empty: String
  }

  type Subscription {
    _empty: String
  }
`;

const createSchema = (context) =>
  makeExecutableSchema({
    typeDefs: [defaultTypeDefs, post.typeDefs, sso.typeDefs],
    resolvers: merge({}, post.resolvers, sso.resolvers),
    schemaDirectives: {
      authenticated: AuthenticatedDirective,
      hasRole: createHasRoleDirective(context.services.role),
      hasPermission: createHasPermissionDirective(
        context.services.role,
        context.services.permission,
      ),
    },
  });

export default createSchema;
