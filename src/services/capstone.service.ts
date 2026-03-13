import { pb } from './pocketbase';
import { authorService } from './author.service';
import type { Capstone, CapstoneCreateInput, CapstoneUpdateInput } from '../types';

const COLLECTION = 'capstones';
const EXPAND = 'authors,authors.user,tags,approved_by,created_by';

export const capstoneService = {
  async getList(params: {
    page?: number;
    perPage?: number;
    filter?: string;
    sort?: string;
    expand?: string;
  }): Promise<{ items: Capstone[]; total: number }> {
    const { page = 1, perPage = 20, filter = '', sort = '-created', expand = EXPAND } = params;
    const result = await pb.collection(COLLECTION).getList(page, perPage, { filter, sort, expand });
    return {
      items: result.items as unknown as Capstone[],
      total: result.totalItems,
    };
  },

  /** Public/student: only approved capstones, with optional lexical search, tag and year range filter */
  async search(params: {
    query?: string;
    tagIds?: string[];
    yearFrom?: number | null;
    yearTo?: number | null;
    page?: number;
    perPage?: number;
  }): Promise<{ items: Capstone[]; total: number }> {
    const { query = '', tagIds = [], yearFrom = null, yearTo = null, page = 1, perPage = 20 } = params;
    const parts: string[] = ["status = 'approved'"];
    if (query.trim()) {
      const q = query.trim().replace(/"/g, '\\"');
      parts.push(`(title ~ "${q}" || abstract ~ "${q}")`);
    }
    if (tagIds.length > 0) {
      const tagFilter = tagIds.map((id) => `tags.id ?= "${id}"`).join(' || ');
      parts.push(`(${tagFilter})`);
    }
    if (yearFrom != null) parts.push(`year >= ${yearFrom}`);
    if (yearTo != null) parts.push(`year <= ${yearTo}`);
    const filter = parts.join(' && ');
    return this.getList({ page, perPage, filter });
  },

  async getOne(id: string): Promise<Capstone> {
    const record = await pb.collection(COLLECTION).getOne(id, { expand: EXPAND });
    return record as unknown as Capstone;
  },

  async create(input: CapstoneCreateInput): Promise<Capstone> {
    const authorRecords = await authorService.createMany(
      input.authors.map((a) => ({ name: a.name, user: a.user ?? null }))
    );
    const authorIds = authorRecords.map((a) => a.id);

    const formData = new FormData();
    formData.set('title', input.title);
    formData.set('abstract', input.abstract);
    formData.set('repository_link', input.repository_link);
    formData.set('year', String(input.year));
    formData.set('status', input.status ?? 'pending');
    const firstUserAuthor = authorRecords.find((a) => a.user);
    const createdBy = input.created_by ?? firstUserAuthor?.user ?? pb.authStore.record?.id ?? '';
    if (createdBy) formData.set('created_by', createdBy);
    authorIds.forEach((id) => formData.append('authors', id));
    input.tags.forEach((id) => formData.append('tags', id));
    if (input.pdf_file) formData.set('pdf_file', input.pdf_file);

    const record = await pb.collection(COLLECTION).create(formData);
    return record as unknown as Capstone;
  },

  async update(id: string, input: CapstoneUpdateInput): Promise<Capstone> {
    const body: Record<string, unknown> = { ...input };
    if (input.authors !== undefined) body.authors = input.authors;
    if (input.tags !== undefined) body.tags = input.tags;
    const record = await pb.collection(COLLECTION).update(id, body);
    return record as unknown as Capstone;
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id);
  },

  /** Student: my submissions (created_by = current user) */
  async getMySubmissions(): Promise<Capstone[]> {
    const userId = pb.authStore.record?.id;
    if (!userId) return [];
    const { items } = await this.getList({
      filter: `created_by = "${userId}"`,
      perPage: 100,
    });
    return items;
  },

  /** Faculty: pending submissions */
  async getPendingSubmissions(): Promise<Capstone[]> {
    const { items } = await this.getList({
      filter: "status = 'pending'",
      sort: '-created',
      perPage: 100,
    });
    return items;
  },

  async approve(id: string): Promise<Capstone> {
    const userId = pb.authStore.record?.id ?? '';
    return this.update(id, { status: 'approved', approved_by: userId } as CapstoneUpdateInput);
  },

  async reject(id: string): Promise<Capstone> {
    return this.update(id, { status: 'rejected' } as CapstoneUpdateInput);
  },
};
