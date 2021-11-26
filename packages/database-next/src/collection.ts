import { Sequelize, ModelCtor, Model } from 'sequelize';
import { EventEmitter } from 'events';
import { Database } from './database';
import { Field } from './fields';
import _ from 'lodash';
import { Repository } from './repository';
import lodash from 'lodash';
import { SyncOptions } from 'sequelize/types/lib/sequelize';

export interface CollectionOptions {
  name: string;
  tableName?: string;
  fields?: any;
  [key: string]: any;
}

interface FieldOptions {
  name: string;
  type: any;

  [key: string]: any;
}

export interface CollectionContext {
  database: Database;
}

export class Collection<
  TModelAttributes extends {} = any,
  TCreationAttributes extends {} = TModelAttributes,
> extends EventEmitter {
  options: CollectionOptions;
  context: CollectionContext;
  fields: Map<string, any> = new Map<string, any>();
  model: ModelCtor<Model<TModelAttributes, TCreationAttributes>>;
  repository: Repository<TModelAttributes, TCreationAttributes>;

  get name() {
    return this.options.name;
  }

  constructor(options: CollectionOptions, context?: CollectionContext) {
    super();
    this.options = options;
    this.context = context;

    this.defineSequelizeModel();
    this.bindFieldEventListener();

    // set collection fields
    if (options.fields) {
      this.setFields(options.fields);
    }

    // add collection repository
    this.repository = new Repository(this);
  }

  private bindFieldEventListener() {
    this.on('field.afterAdd', (field: Field) => field.bind());
    this.on('field.afterRemove', (field) => field.unbind());
  }

  private defineSequelizeModel() {
    // define sequelize model
    const { name, tableName } = this.options;

    // we will set model fields using setField, not here
    this.model = this.context.database.sequelize.define(name, null, {
      ..._.omit(this.options, ['name', 'fields']),
      tableName: tableName || name,
    });
  }

  forEachField(callback: (field: Field) => void) {
    return [...this.fields.values()].forEach(callback);
  }

  findField(callback: (field: Field) => boolean) {
    return [...this.fields.values()].find(callback);
  }

  hasField(name: string) {
    return this.fields.has(name);
  }

  getField(name: string) {
    return this.fields.get(name);
  }

  addField(name: string, options: Omit<FieldOptions, 'name'>): Field {
    const { database } = this.context;

    const field = database.buildField(
      { name, ...options },
      {
        ...this.context,
        collection: this,
      },
    );

    this.fields.set(name, field);
    this.emit('field.afterAdd', field);
    return field;
  }

  setFields(options: FieldOptions[]) {
    this.cleanFields();

    for (const field of options) {
      this.addField(field.name, lodash.omit(field, 'name'));
    }
  }

  protected cleanFields() {
    const fieldNames = this.fields.keys();
    for (const fieldName of fieldNames) {
      this.removeField(fieldName);
    }
  }

  removeField(name) {
    const field = this.fields.get(name);
    const bool = this.fields.delete(name);
    if (bool) {
      this.emit('field.afterRemove', field);
    }
    return bool;
  }

  updateOptions(options: CollectionOptions) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  updateField(name: string, options: FieldOptions) {
    const existField = this.getField(name);
    if (!existField) {
      throw new Error(`field ${name} not exists`);
    }

    this.removeField(name);
    this.addField(options.name, options);
  }

  async sync(syncOptions?: SyncOptions) {
    await this.model.sync(syncOptions);
    const associations = this.model.associations;
    for (const associationKey in associations) {
      const association = associations[associationKey];
      await association.target.sync(syncOptions);
      if ((<any>association).through) {
        await (<any>association).through.model.sync(syncOptions);
      }
    }
  }
}
