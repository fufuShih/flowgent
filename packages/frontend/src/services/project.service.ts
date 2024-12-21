import {
  getApiProject,
  postApiProject,
  getApiProjectById,
  putApiProjectById,
  deleteApiProjectById,
} from '../openapi-client';
import type { Project, CreateProjectDto } from './types';

export class ProjectService {
  static async getAll(): Promise<Project[]> {
    const response = await getApiProject();
    return response.data as Project[];
  }

  static async create(data: CreateProjectDto): Promise<Project> {
    return postApiProject({ body: data }) as Promise<Project>;
  }

  static async getById(id: string): Promise<Project | null> {
    return getApiProjectById({ path: { id: Number(id) } });
  }

  static async update(id: string, project: Project): Promise<Project> {
    return putApiProjectById({
      path: { id: Number(id) },
      body: project,
    }) as Promise<Project>;
  }

  static async delete(id: string): Promise<void> {
    return deleteApiProjectById({ path: { id: Number(id) } });
  }
}
