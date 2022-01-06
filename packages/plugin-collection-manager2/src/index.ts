import path from 'path';
import { Plugin } from '@nocobase/server';
import { CollectionModel } from './models/collection';
import { FieldModel } from './models/field';
import { uid } from '@nocobase/utils';
import beforeInitOptions from './hooks/beforeInitOptions';

export default class CollectionManagerPlugin extends Plugin {
  async load() {
    this.app.db.registerModels({
      CollectionModel,
      FieldModel,
    });
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
    this.app.db.on('fields.beforeCreate', async (model, options) => {
      const type = model.get('type');
      await this.app.db.emitAsync(`fields.${type}.beforeInitOptions`, model, options);
    });
    for (const key in beforeInitOptions) {
      if (Object.prototype.hasOwnProperty.call(beforeInitOptions, key)) {
        const fn = beforeInitOptions[key];
        this.app.db.on(`fields.${key}.beforeInitOptions`, fn);
      }
    }
  }
}
