import { Matrix } from './matrix.type';

export interface Project {
  id: string;
  name: string;
  matrices: Matrix[];
  created: Date;
  updated: Date;
}
