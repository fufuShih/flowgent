import { projectSchema, createProjectSchema, updateProjectSchema } from './schema';
import type { z } from 'zod';

export type Project = z.infer<typeof projectSchema>;
export type CreateProjectDto = z.infer<typeof createProjectSchema>;
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;
