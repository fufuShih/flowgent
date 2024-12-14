import type { Matrix } from '../matrix.type';
import type { Project, CreateProjectDto, UpdateProjectDto } from '../project.type';
import type { CreateMatrixDto, UpdateMatrixDto } from '../matrix.type';

export interface IStorageAdapter {
  // Project operations
  getAllProjects(): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | null>;
  createProject(data: CreateProjectDto): Promise<Project>;
  updateProject(id: string, data: UpdateProjectDto): Promise<Project | null>;
  deleteProject(id: string): Promise<boolean>;

  // Matrix operations
  getAllMatrices(projectId: string): Promise<Matrix[]>;
  getMatrixById(projectId: string, matrixId: string): Promise<Matrix | null>;
  createMatrix(projectId: string, data: CreateMatrixDto): Promise<Matrix>;
  updateMatrix(projectId: string, matrixId: string, data: UpdateMatrixDto): Promise<Matrix | null>;
  deleteMatrix(projectId: string, matrixId: string): Promise<boolean>;
}
