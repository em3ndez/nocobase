import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'collections',
  title: '数据表配置',
  sortable: 'sort',
  autoGenId: false,
  model: 'CollectionModel',
  timestamps: false,
  fields: [
    {
      type: 'uid',
      name: 'key',
      primaryKey: true,
    },
    {
      type: 'uid',
      name: 'name',
      unique: true,
      prefix: 't_',
    },
    {
      type: 'string',
      name: 'title',
      required: true,
    },
    {
      type: 'json',
      name: 'options',
      defaultValue: {},
    },
    {
      type: 'hasMany',
      name: 'fields',
      target: 'fields',
      sourceKey: 'name',
      targetKey: 'name',
      foreignKey: 'collectionName',
    },
  ],
} as CollectionOptions;
