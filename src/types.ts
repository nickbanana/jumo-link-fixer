export type Bindings = {
    ENVIRONMENT: 'dev' | 'staging' | 'production';
    BROWSERBASE_API_KEY: string;
    BROWSERBASE_FUNCTION_ID: string;
}

export type BrowserbaseResult = {
    content?: string;
    author?: string;
    likes?: number;
    links?: string[];
}
