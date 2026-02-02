import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Base repository with common CRUD operations
 */
export class BaseRepository {
  constructor(model) {
    this.model = model;
    this.prisma = prisma;
  }

  /**
   * Finds a record by ID
   */
  async findById(id, options = {}) {
    return await this.model.findUnique({
      where: { id },
      ...options,
    });
  }

  /**
   * Finds the first record matching the where clause
   */
  async findFirst(where, options = {}) {
    return await this.model.findFirst({
      where,
      ...options,
    });
  }

  /**
   * Finds multiple records matching the where clause
   */
  async findMany(where = {}, options = {}) {
    return await this.model.findMany({
      where,
      ...options,
    });
  }

  async create(data, options = {}) {
    return await this.model.create({
      data,
      ...options,
    });
  }

  /**
   * Updates a record by ID
   */
  async update(id, data, options = {}) {
    return await this.model.update({
      where: { id },
      data,
      ...options,
    });
  }

  /**
   * Deletes a record by ID
   */
  async delete(id) {
    return await this.model.delete({
      where: { id },
    });
  }

  /**
   * Counts records matching the where clause
   */
  async count(where = {}) {
    return await this.model.count({ where });
  }

  /**
   * Paginates records matching the where clause
   */
  async paginate(where = {}, page = 1, limit = 10, options = {}) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
        ...options,
      }),
      this.model.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}

export default prisma;
