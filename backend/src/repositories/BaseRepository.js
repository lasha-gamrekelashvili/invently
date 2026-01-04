import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BaseRepository {
  constructor(model) {
    this.model = model;
    this.prisma = prisma;
  }

  async findById(id, options = {}) {
    return await this.model.findUnique({
      where: { id },
      ...options,
    });
  }

  async findFirst(where, options = {}) {
    return await this.model.findFirst({
      where,
      ...options,
    });
  }

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

  async update(id, data, options = {}) {
    return await this.model.update({
      where: { id },
      data,
      ...options,
    });
  }

  async delete(id) {
    return await this.model.delete({
      where: { id },
    });
  }

  async count(where = {}) {
    return await this.model.count({ where });
  }

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
