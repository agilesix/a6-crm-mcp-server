// Environment variable types for Google OAuth and Supabase
declare global {
  interface Env {
    // Google OAuth
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    HOSTED_DOMAIN?: string;
    COOKIE_ENCRYPTION_KEY: string;
    
    // Supabase
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    
    // Development environment
    ENVIRONMENT?: string;
  }
}

export {};