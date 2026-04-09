export type Bindings = {
    ENVIRONMENT: 'dev' | 'production';
    FUNCTION_MODE: 'local' | 'remote';
    BROWSERBASE_API_KEY: string;
    JUMO_X_FUNCTION_ID: string;
    JUMO_IG_FUNCTION_ID: string;
    JUMO_THREADS_FUNCTION_ID: string;
    JUMO_FB_FUNCTION_ID: string;
    GOOGLE_API_KEY: string;
}

export type BrowserbaseResult = {
    content?: string;
    author?: string;
    username?: string;
    likes?: number;
    links?: string[];
}
