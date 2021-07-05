/* eslint-disable no-param-reassign */
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { defaultFieldResolver, DirectiveLocation, GraphQLDirective, GraphQLString } from 'graphql';
import { ForbiddenError, AuthenticationError } from 'apollo-server';

const HasPermissionDirectiveWrapped = Symbol('HasPermissionDirective wrapped');
const HasPermissionDirectiveMeta = Symbol('HasPermissionDirectiveMeta');

const createHasPermissionDirective = (roleService, permissionService) =>
  class HasPermissionDirective extends SchemaDirectiveVisitor {
    static getDirectiveDeclaration(directiveName) {
      return new GraphQLDirective({
        name: directiveName,
        locations: [DirectiveLocation.OBJECT, DirectiveLocation.FIELD_DEFINITION],
        args: {
          permission: {
            type: GraphQLString,
          },
        },
      });
    }

    visitObject(type) {
      this.ensureFieldsWrapped(type);
      type[HasPermissionDirectiveMeta] = { permission: this.args.permission };
    }

    visitFieldDefinition(field, details) {
      this.ensureFieldsWrapped(details.objectType);
      field[HasPermissionDirectiveMeta] = { permission: this.args.permission };
    }

    ensureFieldsWrapped(objectType) {
      if (objectType[HasPermissionDirectiveWrapped]) {
        return;
      }

      objectType[HasPermissionDirectiveWrapped] = true;

      const fields = objectType.getFields();

      Object.values(fields).forEach((field) => {
        const { resolve = defaultFieldResolver } = field;

        field.resolve = async function resolveFun(...args) {
          const meta = field[HasPermissionDirectiveMeta] || objectType[HasPermissionDirectiveMeta];

          if (!meta) {
            return resolve.apply(this, args);
          }

          const context = args[2];
          if (!context.currentAccountId) {
            throw new AuthenticationError('Not authenticated');
          }

          const { permission } = meta;

          const roles = await roleService.findForAccountId(context.currentAccountId);
          const permissions = new Set(
            (await Promise.all(roles.map((r) => permissionService.findForRole(r.roleId))))
              .flat()
              .map((rr) => rr.name),
          );

          if (!permissions.has(permission)) {
            throw new ForbiddenError('Not authorized to access this resource');
          }

          return resolve.apply(this, args);
        };
      });
    }
  };

export default createHasPermissionDirective;
