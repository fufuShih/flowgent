// This file is auto-generated by @hey-api/openapi-ts

export type Connection = {
    /**
     * The connection ID
     */
    id?: number;
    /**
     * The matrix ID this connection belongs to
     */
    matrixId?: number;
    /**
     * Source node ID
     */
    sourceId: number;
    /**
     * Target node ID
     */
    targetId: number;
    /**
     * Connection type
     */
    type: 'default' | 'success' | 'error' | 'condition';
    /**
     * Connection configuration
     */
    config?: {
        [key: string]: unknown;
    };
    created?: Date;
    updated?: Date;
};

/**
 * Connection type
 */
export type type = 'default' | 'success' | 'error' | 'condition';

export type Error = {
    success?: boolean;
    error?: string;
};

export type Matrix = {
    /**
     * The matrix ID
     */
    id: number;
    /**
     * The project ID this matrix belongs to
     */
    projectId: number;
    /**
     * Matrix name
     */
    name: string;
    /**
     * Matrix description
     */
    description?: (string) | null;
    /**
     * Matrix status
     */
    status: 'active' | 'inactive' | 'draft' | 'error';
    /**
     * Matrix configuration
     */
    config?: {
        [key: string]: unknown;
    };
    /**
     * Matrix version number
     */
    version: number;
    /**
     * ID of the parent matrix (if this is a sub-matrix)
     */
    parentMatrixId?: (number) | null;
    created: Date;
    updated: Date;
};

/**
 * Matrix status
 */
export type status = 'active' | 'inactive' | 'draft' | 'error';

export type Node = {
    /**
     * The node ID
     */
    id?: number;
    /**
     * The matrix ID this node belongs to
     */
    matrixId: number;
    /**
     * Node type
     */
    type: 'trigger' | 'action' | 'condition' | 'subMatrix' | 'transformer' | 'loop' | 'monitor';
    /**
     * Node name
     */
    name: string;
    /**
     * Node description
     */
    description?: (string) | null;
    config?: {
        x?: number;
        y?: number;
        inPorts?: Array<{
            [key: string]: unknown;
        }>;
        outPorts?: Array<{
            [key: string]: unknown;
        }>;
    };
    /**
     * ID of sub-matrix (if type is subMatrix)
     */
    subMatrixId?: (number) | null;
    /**
     * Version of the node type
     */
    typeVersion?: number;
    /**
     * Whether the node is disabled
     */
    disabled?: boolean;
    created?: Date;
    updated?: Date;
};

/**
 * Node type
 */
export type type2 = 'trigger' | 'action' | 'condition' | 'subMatrix' | 'transformer' | 'loop' | 'monitor';

export type Project = {
    /**
     * The project ID
     */
    id: number;
    /**
     * The project name
     */
    name: string;
    /**
     * The project description
     */
    description?: (string) | null;
    /**
     * Creation timestamp
     */
    created: Date;
    /**
     * Last update timestamp
     */
    updated: Date;
};

export type Success = {
    success?: boolean;
    data?: {
        [key: string]: unknown;
    };
};

export type GetApiMatrixProjectByProjectIdData = {
    path: {
        /**
         * Project ID
         */
        projectId: number;
    };
    query?: {
        /**
         * Items per page
         */
        limit?: number;
        /**
         * Page number
         */
        page?: number;
        /**
         * Filter by status
         */
        status?: 'active' | 'inactive' | 'draft' | 'error';
        /**
         * Filter by version
         */
        version?: number;
    };
};

export type GetApiMatrixProjectByProjectIdResponse = ({
    data?: Array<Matrix>;
    pagination?: {
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
    };
});

export type GetApiMatrixProjectByProjectIdError = (unknown);

export type PostApiMatrixProjectByProjectIdData = {
    body: {
        name: string;
        description?: string;
        status?: 'active' | 'inactive' | 'draft' | 'error';
        config?: {
            [key: string]: unknown;
        };
        parentMatrixId?: number;
    };
    path: {
        /**
         * Project ID
         */
        projectId: number;
    };
};

export type PostApiMatrixProjectByProjectIdResponse = (Matrix);

export type PostApiMatrixProjectByProjectIdError = (unknown);

export type GetApiMatrixByMatrixIdData = {
    path: {
        /**
         * Matrix ID
         */
        matrixId: number;
    };
    query?: {
        /**
         * Include connections in response
         */
        includeConnections?: boolean;
        /**
         * Include nodes in response
         */
        includeNodes?: boolean;
    };
};

export type GetApiMatrixByMatrixIdResponse = ((Matrix & {
    nodes?: Array<Node>;
    connections?: Array<Connection>;
}));

export type GetApiMatrixByMatrixIdError = (unknown);

export type PatchApiMatrixByMatrixIdData = {
    body: {
        name?: string;
        description?: string;
        status?: 'active' | 'inactive' | 'draft' | 'error';
        config?: {
            [key: string]: unknown;
        };
        version?: number;
    };
    path: {
        /**
         * Matrix ID
         */
        matrixId: number;
    };
};

export type PatchApiMatrixByMatrixIdResponse = (Matrix);

export type PatchApiMatrixByMatrixIdError = (unknown);

export type DeleteApiMatrixByMatrixIdData = {
    path: {
        /**
         * Matrix ID
         */
        matrixId: number;
    };
};

export type DeleteApiMatrixByMatrixIdResponse = (void);

export type DeleteApiMatrixByMatrixIdError = (unknown);

export type PostApiMatrixByMatrixIdCloneData = {
    path: {
        /**
         * Matrix ID to clone
         */
        matrixId: number;
    };
};

export type PostApiMatrixByMatrixIdCloneResponse = (Matrix);

export type PostApiMatrixByMatrixIdCloneError = (unknown);

export type GetApiMatrixByMatrixIdWorkflowData = {
    path: {
        matrixId: number;
    };
};

export type PostApiMatrixByMatrixIdNodesData = {
    body: Array<Node>;
    path: {
        /**
         * Matrix ID
         */
        matrixId: number;
    };
};

export type PostApiMatrixByMatrixIdNodesResponse = (Array<Node>);

export type PostApiMatrixByMatrixIdNodesError = (unknown);

export type PatchApiMatrixByMatrixIdConnectionsData = {
    body: Array<(Connection & unknown)>;
    path: {
        matrixId: number;
    };
};

export type DeleteApiMatrixByMatrixIdConnectionsData = {
    body: {
        connectionIds: Array<(number)>;
    };
    path: {
        matrixId: number;
    };
};

export type GetApiProjectsData = {
    query?: {
        /**
         * Number of items per page
         */
        limit?: number;
        /**
         * Page number
         */
        page?: number;
        /**
         * Search term for project name
         */
        search?: string;
    };
};

export type GetApiProjectsResponse = ({
    data?: Array<Project>;
    pagination?: {
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
    };
});

export type GetApiProjectsError = (unknown);

export type PostApiProjectsData = {
    body: {
        name: string;
        description?: string;
    };
};

export type PostApiProjectsResponse = (Project);

export type PostApiProjectsError = (unknown);

export type GetApiProjectsByProjectIdData = {
    path: {
        /**
         * Project ID
         */
        projectId: number;
    };
};

export type GetApiProjectsByProjectIdResponse = (Project);

export type GetApiProjectsByProjectIdError = (unknown);

export type PatchApiProjectsByProjectIdData = {
    body: {
        name?: string;
        description?: string;
    };
    path: {
        /**
         * Project ID
         */
        projectId: number;
    };
};

export type PatchApiProjectsByProjectIdResponse = (Project);

export type PatchApiProjectsByProjectIdError = (unknown);

export type DeleteApiProjectsByProjectIdData = {
    path: {
        /**
         * Project ID
         */
        projectId: number;
    };
};

export type DeleteApiProjectsByProjectIdResponse = (void);

export type DeleteApiProjectsByProjectIdError = (unknown);

export type GetApiMatrixProjectByProjectIdResponseTransformer = (data: any) => Promise<GetApiMatrixProjectByProjectIdResponse>;

export type MatrixModelResponseTransformer = (data: any) => Matrix;

export const MatrixModelResponseTransformer: MatrixModelResponseTransformer = data => {
    if (data?.created) {
        data.created = new Date(data.created);
    }
    if (data?.updated) {
        data.updated = new Date(data.updated);
    }
    return data;
};

export const GetApiMatrixProjectByProjectIdResponseTransformer: GetApiMatrixProjectByProjectIdResponseTransformer = async (data) => {
    if (Array.isArray(data?.data)) {
        data.data.forEach(MatrixModelResponseTransformer);
    }
    return data;
};

export type PostApiMatrixProjectByProjectIdResponseTransformer = (data: any) => Promise<PostApiMatrixProjectByProjectIdResponse>;

export const PostApiMatrixProjectByProjectIdResponseTransformer: PostApiMatrixProjectByProjectIdResponseTransformer = async (data) => {
    MatrixModelResponseTransformer(data);
    return data;
};

export type PatchApiMatrixByMatrixIdResponseTransformer = (data: any) => Promise<PatchApiMatrixByMatrixIdResponse>;

export const PatchApiMatrixByMatrixIdResponseTransformer: PatchApiMatrixByMatrixIdResponseTransformer = async (data) => {
    MatrixModelResponseTransformer(data);
    return data;
};

export type PostApiMatrixByMatrixIdCloneResponseTransformer = (data: any) => Promise<PostApiMatrixByMatrixIdCloneResponse>;

export const PostApiMatrixByMatrixIdCloneResponseTransformer: PostApiMatrixByMatrixIdCloneResponseTransformer = async (data) => {
    MatrixModelResponseTransformer(data);
    return data;
};

export type PostApiMatrixByMatrixIdNodesResponseTransformer = (data: any) => Promise<PostApiMatrixByMatrixIdNodesResponse>;

export type NodeModelResponseTransformer = (data: any) => Node;

export const NodeModelResponseTransformer: NodeModelResponseTransformer = data => {
    if (data?.created) {
        data.created = new Date(data.created);
    }
    if (data?.updated) {
        data.updated = new Date(data.updated);
    }
    return data;
};

export const PostApiMatrixByMatrixIdNodesResponseTransformer: PostApiMatrixByMatrixIdNodesResponseTransformer = async (data) => {
    if (Array.isArray(data)) {
        data.forEach(NodeModelResponseTransformer);
    }
    return data;
};

export type GetApiProjectsResponseTransformer = (data: any) => Promise<GetApiProjectsResponse>;

export type ProjectModelResponseTransformer = (data: any) => Project;

export const ProjectModelResponseTransformer: ProjectModelResponseTransformer = data => {
    if (data?.created) {
        data.created = new Date(data.created);
    }
    if (data?.updated) {
        data.updated = new Date(data.updated);
    }
    return data;
};

export const GetApiProjectsResponseTransformer: GetApiProjectsResponseTransformer = async (data) => {
    if (Array.isArray(data?.data)) {
        data.data.forEach(ProjectModelResponseTransformer);
    }
    return data;
};

export type PostApiProjectsResponseTransformer = (data: any) => Promise<PostApiProjectsResponse>;

export const PostApiProjectsResponseTransformer: PostApiProjectsResponseTransformer = async (data) => {
    ProjectModelResponseTransformer(data);
    return data;
};

export type GetApiProjectsByProjectIdResponseTransformer = (data: any) => Promise<GetApiProjectsByProjectIdResponse>;

export const GetApiProjectsByProjectIdResponseTransformer: GetApiProjectsByProjectIdResponseTransformer = async (data) => {
    ProjectModelResponseTransformer(data);
    return data;
};

export type PatchApiProjectsByProjectIdResponseTransformer = (data: any) => Promise<PatchApiProjectsByProjectIdResponse>;

export const PatchApiProjectsByProjectIdResponseTransformer: PatchApiProjectsByProjectIdResponseTransformer = async (data) => {
    ProjectModelResponseTransformer(data);
    return data;
};