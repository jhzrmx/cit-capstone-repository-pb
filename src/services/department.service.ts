import { pb } from './pocketbase';
import type { Department } from '../types';

const COLLECTION = 'departments';

export const departmentService = {
  async getList(): Promise<Department[]> {
    const result = await pb.collection(COLLECTION).getFullList({ sort: 'name' });
    return result as unknown as Department[];
  },

  async getOne(id: string): Promise<Department> {
    const record = await pb.collection(COLLECTION).getOne(id);
    return record as unknown as Department;
  },

  async create(data: { name: string; code: string }): Promise<Department> {
    const record = await pb.collection(COLLECTION).create(data);
    return record as unknown as Department;
  },

  async update(id: string, data: { name?: string; code?: string }): Promise<Department> {
    const record = await pb.collection(COLLECTION).update(id, data);
    return record as unknown as Department;
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id);
  },
};
