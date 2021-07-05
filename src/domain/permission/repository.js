class PermissionRepository {
  constructor(knex) {
    this.database = knex;
    this.columns = [
      'permissions.permissionId',
      'name',
      'displayName',
      'description',
      'createdAt',
      'updatedAt',
    ];
  }

  async findForRole(roleId) {
    return this.database('permissionRole')
      .select(this.columns)
      .where({ roleId })
      .leftOuterJoin('permissions', 'permissionRole.permissionId', 'permissions.permissionId');
  }
}

export default PermissionRepository;
