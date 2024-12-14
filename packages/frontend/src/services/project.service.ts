import { Project, CreateProjectDto, UpdateProjectDto } from './project.type';

export const ProjectService = {
  getAll: (): Project[] => {
    const projects = localStorage.getItem('projects');
    return projects ? JSON.parse(projects) : [];
  },

  getById: (id: string): Project | null => {
    const projects = ProjectService.getAll();
    return projects.find(p => p.id === id) || null;
  },

  create: (data: CreateProjectDto): Project => {
    const projects = ProjectService.getAll();
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: data.name,
      matrices: data.matrices || [],
      created: new Date(),
      updated: new Date()
    };

    projects.push(newProject);
    localStorage.setItem('projects', JSON.stringify(projects));
    return newProject;
  },

  update: (id: string, data: UpdateProjectDto): Project | null => {
    const projects = ProjectService.getAll();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return null;

    projects[index] = {
      ...projects[index],
      ...data,
      updated: new Date()
    };

    localStorage.setItem('projects', JSON.stringify(projects));
    return projects[index];
  },

  delete: (id: string): boolean => {
    const projects = ProjectService.getAll();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem('projects', JSON.stringify(filtered));
    return filtered.length < projects.length;
  }
};
