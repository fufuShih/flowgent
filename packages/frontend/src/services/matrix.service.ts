import { Matrix, CreateMatrixDto, UpdateMatrixDto } from './matrix.type';
import { ProjectService } from './project.service';

export const MatrixService = {
  getAll(projectId: string): Matrix[] {
    const project = ProjectService.getById(projectId);
    return project?.matrices || [];
  },

  getById(projectId: string, matrixId: string): Matrix | null {
    const matrices = this.getAll(projectId);
    return matrices.find(m => m.id === matrixId) || null;
  },

  create(projectId: string, data: CreateMatrixDto): Matrix {
    const project = ProjectService.getById(projectId);
    if (!project) throw new Error('Project not found');

    const newMatrix: Matrix = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      nodes: data.nodes || [],
      edges: data.edges || [],
      created: new Date(),
      updated: new Date()
    };

    project.matrices.push(newMatrix);
    ProjectService.update(projectId, { matrices: project.matrices });

    return newMatrix;
  },

  update(projectId: string, matrixId: string, data: UpdateMatrixDto): Matrix | null {
    const project = ProjectService.getById(projectId);
    if (!project) throw new Error('Project not found');

    const index = project.matrices.findIndex(m => m.id === matrixId);
    if (index === -1) return null;

    project.matrices[index] = {
      ...project.matrices[index],
      ...data,
      updated: new Date()
    };

    ProjectService.update(projectId, { matrices: project.matrices });
    return project.matrices[index];
  },

  delete(projectId: string, matrixId: string): boolean {
    const project = ProjectService.getById(projectId);
    if (!project) return false;

    const originalLength = project.matrices.length;
    project.matrices = project.matrices.filter(m => m.id !== matrixId);

    if (project.matrices.length === originalLength) return false;

    ProjectService.update(projectId, { matrices: project.matrices });
    return true;
  }
};
