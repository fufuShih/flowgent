import { Matrix } from './matrix.type';

export interface Project {
  id: string;
  name: string;
  matrices: Matrix[];
  created: Date;
  updated: Date;
}

export interface CreateProjectDto {
  name: string;
  matrices?: Matrix[];
}

export interface UpdateProjectDto {
  name?: string;
  matrices?: Matrix[];
}
