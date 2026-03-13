import { pb } from './pocketbase';
import type { Author } from '../types';

const COLLECTION = 'authors';

export const authorService = {
  async create(input: { name: string; user?: string | null }): Promise<Author> {
    const body: Record<string, unknown> = { name: input.name.trim() };
    if (input.user) body.user = input.user;
    const record = await pb.collection(COLLECTION).create(body);
    return record as unknown as Author;
  },

  async createMany(inputs: { name: string; user?: string | null }[]): Promise<Author[]> {
    const created: Author[] = [];
    for (const input of inputs) {
      const a = await this.create(input);
      created.push(a);
    }
    return created;
  },
};
