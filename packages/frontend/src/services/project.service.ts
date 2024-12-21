import {
  getApiProject,
  postApiProject,
  getApiProjectById,
  putApiProjectById,
  deleteApiProjectById,
  type GetApiProjectResponse,
} from '../openapi-client';
import type { Project } from '../openapi-client/types.gen';

export class ProjectService {
  static async getAllProjects(): Promise<GetApiProjectResponse> {
    const response = await getApiProject();
    return response;
  }

  static async createProject(project: { name: string; description?: string }) {
    return postApiProject({ body: project });
  }

  static async getProjectById(id: number): Promise<Project | null> {
    return getApiProjectById({ path: { id } });
  }

  static async updateProject(id: number, project: Project) {
    return putApiProjectById({ path: { id }, body: project });
  }

  static async deleteProject(id: number) {
    return deleteApiProjectById({ path: { id } });
  }
}
