export interface User {
    id : string;
    email: string;
    name:string;
    avatar_url?: string | { String: string; Valid: boolean } | null;
    provider:string;
    created_at:string
}

export interface Project {
    id: string;
    user_id: string;
    name: string;
    description: { String: string; Valid: boolean };
    data: any;
    is_public: boolean;
    last_saved_at: string;
    created_at: string;
    updated_at: string;
}

export interface ShareLinkInfo {
    projectId: string;
    token: string;
    roomKey: string;
    createdAt: string;
    createdBy: string;
    expiresAt?: string | null;
}

export interface JoinShareLinkInfo {
    projectId: string;
    projectName: string;
    roomKey: string;
    token: string;
    ownerId: string;
    expiresAt?: string | null;
}
