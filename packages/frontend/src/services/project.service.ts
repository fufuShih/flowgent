import {
  getApiProject,
  postApiProject,
  getApiProjectById,
  putApiProjectById,
  deleteApiProjectById,
  type GetApiProjectResponse,
} from '../openapi-client';
import type { Project, CreateProjectDto } from './types';

export class ProjectService {
  static async getAll(): Promise<Project[]> {
    const response = (await getApiProject()) as GetApiProjectResponse;
    return response.data?.data || [];
  }

  static async create(data: CreateProjectDto): Promise<Project> {
    const response = await postApiProject({
      body: data,
    });
    return response.data as Project;
  }

  static async getById(id: string): Promise<Project | null> {
    const response = await getApiProjectById({
      path: { id: Number(id) },
    });
    return response.data as Project | null;
  }

  static async update(id: string, project: Project): Promise<Project> {
    const response = await putApiProjectById({
      path: { id: Number(id) },
      body: project,
    });
    return response.data as Project;
  }

  static async delete(id: string): Promise<void> {
    await deleteApiProjectById({
      path: { id: Number(id) },
    });
  }
}
