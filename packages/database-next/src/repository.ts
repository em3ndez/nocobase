import {
  Op,
  Model,
  ModelCtor,
  Association,
  FindOptions as SequelizeFindOptions,
  BulkCreateOptions,
  DestroyOptions as SequelizeDestroyOptions,
  CreateOptions as SequelizeCreateOptions,
  UpdateOptions as SequelizeUpdateOptions,
  Sequelize,
} from 'sequelize';

import { Collection } from './collection';
import _, { omit } from 'lodash';
import { Database } from './database';
import { updateAssociations } from './update-associations';
import { RelationField } from './fields';
import FilterParser from './filterParser';
import { OptionsParser } from './optionsParser';
import { RelationRepository } from './relation-repository/relation-repository';
import { HasOneRepository } from './relation-repository/hasone-repository';
import { BelongsToRepository } from './relation-repository/belongs-to-repository';
import { BelongsToManyRepository } from './relation-repository/belongs-to-many-repository';
import { HasManyRepository } from './relation-repository/hasmany-repository';
import { UpdateGuard } from './update-guard';
import lodash from 'lodash';

const debug = require('debug')('noco-database');

export interface IRepository {}

interface CreateManyOptions extends BulkCreateOptions {}

export type Filter = any;
export type Appends = string[];
export type Expect = string[];
export type Fields = string[];
export type Sort = string[];

interface CountOptions
  extends Omit<SequelizeCreateOptions, 'distinct' | 'where' | 'include'> {
  filter?: Filter;
}

interface CommonFindOptions {
  filter?: Filter;
  fields?: Fields;
  appends?: Appends;
  expect?: Expect;
  sort?: Sort;
}

export interface FindOptions extends SequelizeFindOptions, CommonFindOptions {
  filterByPk?: string | number;
}

interface FindOneOptions extends FindOptions, CommonFindOptions {}

interface CreateOptions {
  // 数据
  values?: any;
  // 字段白名单
  whitelist?: string[];
  // 字段黑名单
  blacklist?: string[];
  // 关系数据默认会新建并建立关联处理，如果是已存在的数据只关联，但不更新关系数据
  // 如果需要更新关联数据，可以通过 updateAssociationValues 指定
  updateAssociationValues?: string[];
}

interface UpdateOptions extends SequelizeUpdateOptions {
  values?: any;
  whitelist?: any;
  blacklist?: any;
}

interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: any;
}

interface RelatedQueryOptions {
  database: Database;
  field: RelationField;
  source: {
    idOrInstance: any;
    collection: Collection;
  };
  target: {
    association: Association & {
      accessors: any;
    };
    collection: Collection;
  };
}

type Identity = string | number;

type ID = Identity;

class RelationRepositoryBuilder<R extends RelationRepository> {
  collection: Collection;
  associationName: string;
  constructor(collection: Collection, associationName: string) {
    this.collection = collection;
    this.associationName = associationName;
  }
  of(id: string | number): R {
    const association =
      this.collection.model.associations[this.associationName];

    const builder = {
      HasOne: () => HasOneRepository,
      BelongsTo: () => BelongsToRepository,
      BelongsToMany: () => BelongsToManyRepository,
      HasMany: () => HasManyRepository,
    };

    const klass = builder[association.associationType]();
    return new klass(this.collection, this.associationName, id);
  }
}

export class Repository<
  TModelAttributes extends {} = any,
  TCreationAttributes extends {} = TModelAttributes,
> implements IRepository
{
  database: Database;
  collection: Collection;
  model: ModelCtor<Model>;

  constructor(collection: Collection) {
    this.database = collection.context.database;
    this.collection = collection;
    this.model = collection.model;
  }

  /**
   * return count by filter
   */
  async count(countOptions?: CountOptions) {
    let options = countOptions ? lodash.clone(countOptions) : {};

    if (countOptions?.filter) {
      options = {
        ...options,
        ...this.parseFilter(countOptions.filter),
      };
    }

    return await this.collection.model.count({
      ...options,
      distinct: true,
    });
  }

  /**
   * find
   * @param options
   */
  async find(options?: FindOptions) {
    const model = this.collection.model;

    const opts = {
      subQuery: false,
      ...this.buildQueryOptions(options),
    };

    if (opts.include && opts.include.length > 0) {
      const ids = (
        await model.findAll({
          ...opts,
          includeIgnoreAttributes: false,
          attributes: [model.primaryKeyAttribute],
          group: `${model.name}.${model.primaryKeyAttribute}`,
        })
      ).map((row) => row.get(model.primaryKeyAttribute));

      const where = {
        [model.primaryKeyAttribute]: {
          [Op.in]: ids,
        },
      };

      return await model.findAll({
        ...omit(opts, ['limit', 'offset']),
        where,
      });
    }

    return await model.findAll({
      ...opts,
    });
  }

  /**
   * find and count
   * @param options
   */
  async findAndCount(options?: FindOptions) {
    const model = this.collection.model;

    const opts = {
      subQuery: false,
      ...this.buildQueryOptions(options),
    };

    return await model.findAndCountAll({
      ...opts,
    });
  }

  /**
   * Find By Id
   *
   */
  findById(id: ID) {
    return this.collection.model.findByPk(id);
  }

  /**
   * Find one record from database
   *
   * @param options
   */
  async findOne(options?: FindOneOptions) {
    const rows = await this.find({ ...options, limit: 1 });
    return rows.length == 1 ? rows[0] : null;
  }

  /**
   * Save instance to database
   *
   * @param values
   * @param options
   */
  async create(options: CreateOptions): Promise<Model> {
    const guard = UpdateGuard.fromOptions(this.model, options);
    const values = guard.sanitize(options.values);

    const instance = await this.model.create<any>(values);

    if (!instance) {
      return;
    }

    await updateAssociations(instance, values);
    return instance;
  }

  /**
   * Save Many instances to database
   *
   * @param records
   * @param options
   */
  async createMany(
    records: TCreationAttributes[],
    options?: CreateManyOptions,
  ) {
    const instances = await this.collection.model.bulkCreate(records, options);

    for (let i = 0; i < instances.length; i++) {
      await updateAssociations(instances[i], records[i]);
    }

    return instances;
  }

  /**
   * Update model value
   *
   * @param values
   * @param options
   */
  async update(values: any, options: Identity | Model | UpdateOptions) {
    if (options instanceof Model) {
      await options.update(values);
      await updateAssociations(options, values);
      return options;
    }

    let instance: Model;

    if (typeof options === 'string' || typeof options === 'number') {
      instance = await this.model.findByPk(options);
    } else {
      // @ts-ignore
      instance = await this.findOne(options);
    }

    await instance.update(values);
    await updateAssociations(instance, values);
    return instance;
  }

  async destroy(options: Identity | Identity[] | DestroyOptions) {
    if (typeof options === 'number' || typeof options === 'string') {
      return await this.model.destroy({
        where: {
          [this.model.primaryKeyAttribute]: options,
        },
      });
    }
    if (Array.isArray(options)) {
      return await this.model.destroy({
        where: {
          [this.model.primaryKeyAttribute]: {
            [Op.in]: options,
          },
        },
      });
    }
    const opts = this.buildQueryOptions(options);
    return await this.model.destroy(opts);
  }

  /**
   * @param association target association
   */
  relation<R extends RelationRepository>(
    association: string,
  ): RelationRepositoryBuilder<R> {
    return new RelationRepositoryBuilder<R>(this.collection, association);
  }

  protected buildQueryOptions(options: any) {
    const parser = new OptionsParser(
      this.collection.model,
      this.collection.context.database,
      options,
    );
    const params = parser.toSequelizeParams();
    return { ...options, ...params };
  }

  protected parseFilter(filter: Filter) {
    const parser = new FilterParser(
      this.collection.model,
      this.collection.context.database,
      filter,
    );
    return parser.toSequelizeParams();
  }
}
