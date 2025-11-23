export interface User {
    id : string;
    email: string;
    name:string;
    avatar_url?:string;
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
