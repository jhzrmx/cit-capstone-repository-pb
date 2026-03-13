import { pb } from './pocketbase';
import type { Tag } from '../types';

const COLLECTION = 'tags';

export const tagService = {
  async getList(): Promise<Tag[]> {
    const result = await pb.collection(COLLECTION).getFullList({ sort: 'name' });
    return result as unknown as Tag[];
  },

  async getOne(id: string): Promise<Tag> {
    const record = await pb.collection(COLLECTION).getOne(id);
    return record as unknown as Tag;
  },

  async create(data: { name: string }): Promise<Tag> {
    const record = await pb.collection(COLLECTION).create(data);
    return record as unknown as Tag;
  },

  async update(id: string, data: { name?: string }): Promise<Tag> {
    const record = await pb.collection(COLLECTION).update(id, data);
    return record as unknown as Tag;
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id);
  },
};
