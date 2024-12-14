import { config } from './config';
import type { CreateProjectDto, UpdateProjectDto } from './project.type';

export const ProjectService = {
  getAll: () => config.adapter.getAllProjects(),
  getById: (id: string) => config.adapter.getProjectById(id),
  create: (data: CreateProjectDto) => config.adapter.createProject(data),
  update: (id: string, data: UpdateProjectDto) => config.adapter.updateProject(id, data),
  delete: (id: string) => config.adapter.deleteProject(id),
};
