import type {
  GetApiProjectsData,
  GetApiProjectsResponse,
  PostApiProjectsData,
  Project,
  GetApiProjectsByProjectIdData,
  PatchApiProjectsByProjectIdData,
  DeleteApiProjectsByProjectIdData,
} from '../openapi-client';
import {
  getApiProjects,
  postApiProjects,
  getApiProjectsByProjectId,
  patchApiProjectsByProjectId,
  deleteApiProjectsByProjectId,
} from '../openapi-client';
import { ServiceResponse } from './types';

export class ProjectService {
  static async getProjects(
    params?: GetApiProjectsData['query']
  ): Promise<ServiceResponse<Project[]>> {
    try {
      const response = await getApiProjects({
        query: params,
      });

      return {
        success: true,
        data: (response.data?.data ?? []) as Project[],
        pagination: response.data?.pagination,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch projects',
      };
    }
  }

  static async createProject(
    params: PostApiProjectsData['body']
  ): Promise<ServiceResponse<Project>> {
    try {
      const response = await postApiProjects({
        body: params,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create project',
      };
    }
  }

  static async getProject(
    projectId: GetApiProjectsByProjectIdData['path']['projectId']
  ): Promise<ServiceResponse<Project>> {
    try {
      const response = await getApiProjectsByProjectId({
        path: {
          projectId,
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch project',
      };
    }
  }

  static async updateProject(
    projectId: PatchApiProjectsByProjectIdData['path']['projectId'],
    params: PatchApiProjectsByProjectIdData['body']
  ): Promise<ServiceResponse<Project>> {
    try {
      const response = await patchApiProjectsByProjectId({
        path: {
          projectId,
        },
        body: params,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update project',
      };
    }
  }

  static async deleteProject(
    projectId: DeleteApiProjectsByProjectIdData['path']['projectId']
  ): Promise<ServiceResponse<void>> {
    try {
      await deleteApiProjectsByProjectId({
        path: {
          projectId,
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete project',
      };
    }
  }
}
