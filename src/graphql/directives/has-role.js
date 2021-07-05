/* eslint-disable no-param-reassign */
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { defaultFieldResolver, DirectiveLocation, GraphQLDirective, GraphQLString } from 'graphql';
import { ForbiddenError, AuthenticationError } from 'apollo-server';

const HasRoleDirectiveWrapped = Symbol('HasRoleDirective wrapped');
const HasRoleDirectiveMeta = Symbol('HasRoleDirectiveMeta');

const createHasRoleDirective = (roleService) =>
  class HasRoleDirective extends SchemaDirectiveVisitor {
    static getDirectiveDeclaration(directiveName) {
      return new GraphQLDirective({
        name: directiveName,
        locations: [DirectiveLocation.OBJECT, DirectiveLocation.FIELD_DEFINITION],
        args: {
          role: {
            type: GraphQLString,
          },
        },
      });
    }

    visitObject(type) {
      this.ensureFieldsWrapped(type);
      type[HasRoleDirectiveMeta] = { role: this.args.role };
    }

    visitFieldDefinition(field, details) {
      this.ensureFieldsWrapped(details.objectType);
      field[HasRoleDirectiveMeta] = { role: this.args.role };
    }

    ensureFieldsWrapped(objectType) {
      if (objectType[HasRoleDirectiveWrapped]) {
        return;
      }

      objectType[HasRoleDirectiveWrapped] = true;

      const fields = objectType.getFields();

      Object.values(fields).forEach((field) => {
        const { resolve = defaultFieldResolver } = field;

        field.resolve = async function resolveFun(...args) {
          const meta = field[HasRoleDirectiveMeta] || objectType[HasRoleDirectiveMeta];

          if (!meta) {
            return resolve.apply(this, args);
          }

          const { role } = meta;
          const context = args[2];
          if (!context.currentAccountId) {
            throw new AuthenticationError('Not authenticated');
          }

          const roles = await roleService.findForAccountId(context.currentAccountId);

          if (!roles.find((r) => r.name === role)) {
            throw new ForbiddenError('Not authorized to access this resource');
          }

          return resolve.apply(this, args);
        };
      });
    }
  };

export default createHasRoleDirective;
