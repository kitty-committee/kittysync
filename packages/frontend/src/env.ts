import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
    AUTHCAT_CLIENT_ID: {
        public: true,
    },
});
