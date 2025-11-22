import type {
  Model,
  ModelStatic,
  WhereOptions,
  FindOptions,
  CreateOptions,
  DestroyOptions,
  UpdateOptions,
  CountOptions,
} from "sequelize";

export class BaseService<
  TModel extends Model<TAttributes, TCreationAttrs>,
  TAttributes extends {},
  TCreationAttrs extends {},
> {
  protected model: ModelStatic<TModel>;

  constructor(model: ModelStatic<TModel>) {
    this.model = model;
  }

  /** Find a single record matching the given where condition */
  async getOne(
    query: WhereOptions<TAttributes>,
    options: Omit<FindOptions<TAttributes>, "where"> = {},
  ): Promise<TModel | null> {
    return this.model.findOne({ where: query, ...options });
  }

  /** Find multiple records; returns all if no condition is provided */
  async getMany(
    query?: WhereOptions<TAttributes>,
    options: Omit<FindOptions<TAttributes>, "where"> = {},
  ): Promise<TModel[]> {
    return this.model.findAll({ where: query ?? {}, ...options });
  }

  /** Find a record by its primary key */
  async getById(
    id: number | string,
    options: Omit<FindOptions<TAttributes>, "where"> = {},
  ): Promise<TModel | null> {
    return this.model.findByPk(id, options);
  }

  /** Count records matching a condition; counts all if no query is provided */
  async count(
    query?: WhereOptions<TAttributes>,
    options: Omit<CountOptions<TAttributes>, "where"> = {},
  ): Promise<number> {
    return this.model.count({ where: query ?? {}, ...options });
  }

  /** Check if at least one record exists that matches the condition */
  async exists(
    query: WhereOptions<TAttributes>,
    options: Omit<CountOptions<TAttributes>, "where"> = {},
  ): Promise<boolean> {
    const count = await this.model.count({ where: query, ...options });
    return count > 0;
  }

  /** Paginated list of records with total count and metadata */
  async paginate(
    query: WhereOptions<TAttributes> | undefined,
    page: number,
    pageSize: number,
    options: Omit<FindOptions<TAttributes>, "where"> = {},
  ): Promise<{
    rows: TModel[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const limit = pageSize;
    const offset = (page - 1) * pageSize;

    const { rows, count } = await this.model.findAndCountAll({
      where: query ?? {},
      limit,
      offset,
      ...options,
    });

    return {
      rows,
      count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize) || 1,
    };
  }

  /** Create a new record */
  async createOne(
    data: TCreationAttrs,
    options: CreateOptions<TAttributes> = {},
  ): Promise<TModel> {
    return this.model.create(data as any, options);
  }

  /** Update all records matching the condition */
  async updateMany(
    data: Partial<TAttributes>,
    query: WhereOptions<TAttributes>,
    options: Omit<UpdateOptions<TAttributes>, "where"> = {},
  ): Promise<[number]> {
    return this.model.update(data, { where: query, ...options });
  }

  /** Delete all records matching the condition */
  async deleteMany(
    query: WhereOptions<TAttributes>,
    options: Omit<DestroyOptions<TAttributes>, "where"> = {},
  ): Promise<number> {
    return this.model.destroy({ where: query, ...options });
  }
}
