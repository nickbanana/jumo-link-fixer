export type Bindings = {
    ENVIRONMENT: 'dev' | 'production';
    FUNCTION_MODE: 'local' | 'remote';
    BROWSERBASE_API_KEY: string;
    JUMO_X_FUNCTION_ID: string;
    JUMO_IG_FUNCTION_ID: string;
    JUMO_THREADS_FUNCTION_ID: string;
    JUMO_FB_FUNCTION_ID: string;
    GOOGLE_API_KEY: string;
    DISCORD_PUBLIC_KEY: string;
    DISCORD_APPLICATION_ID: string;
    jumo_link_queues: Queue<PreviewJob>;
}

// Discord /preview 指令丟進 Queue 的工作內容，由 consumer 擷取後 PATCH 回覆。
export type PreviewJob = {
    applicationId: string;
    token: string;
    rawUrl: string;
    isSpoiler?: boolean;
}

// 單一媒體項目：帶類型（圖片/影片）與可存取的 URL，與 Function 端 shared.ts 保持一致。
export type MediaItem = { type: 'image' | 'video'; url: string };

export type BrowserbaseResult = {
    content?: string;
    author?: string;
    username?: string;
    likes?: number;
    permalink?: string;
    media?: MediaItem[];
}
