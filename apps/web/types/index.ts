export interface User {
    id : string;
    email: string;
    name:string;
    avatar_url?:string;
    provider:string;
    created_at:string
}