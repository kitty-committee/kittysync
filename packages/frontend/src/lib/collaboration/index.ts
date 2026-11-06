import { HocuspocusProviderWebsocket } from "@hocuspocus/provider";

export function createWebsocket() {
    return new HocuspocusProviderWebsocket({
        url: "/api/collaboration",
        maxAttempts: 5,
    });
}
