import { createSigner, createVerifier } from "fast-jwt";
import { configuration } from "../../configuration.ts";
import type { UserDb } from "@kittysync/common";
import { redis } from "../../app.ts";

/**
 * Base type of session token providers.
 */
export interface TokenProvider {
    /**
     * Create a new session token for the given user.
     * @param {UserDb} user - The user to create a new token for
     * @returns {Promise<string>} The new token.
     */
    new: (user: UserDb) => Promise<string>;

    /**
     * Verify whether a session token is valid or not.
     * @param {string} token - The token to verify
     * @returns {Promise<boolean>} True if the token is valid, false otherwise.
     */
    verify(token: string): Promise<boolean>;

    /**
     * Extract the user associated with the token. May return null if the token is not valid.
     * @param {string} token - The token to decode
     * @returns {Promise<UserDb | null>} The user associated with the token, or null if the token is not valid.
     */
    decode(token: string): Promise<UserDb | null>;
}

/**
 * Represents a UUID session token provider
 */
export class UuidTokenProvider implements TokenProvider {
    /**
     * Create a new session token, pushing to redis.
     * @param {UserDb} user - The user to create a new token for
     * @returns {Promise<string>} The new token.
     * @throws Redis exception on failing to push.
     */
    async new(user: UserDb): Promise<string> {
        const token = crypto.randomUUID();
        await redis.hsetex(
            `user_${token}`,
            "FNX",
            "EX",
            configuration.tokenLifetime,
            "FIELDS",
            2,
            "id",
            user.id,
            "username",
            user.username,
        );
        return token;
    }

    /**
     * Verify whether a session token is valid or not.
     * @param {string} token - The token to verify
     * @returns {Promise<boolean>} True if the token is valid, false otherwise.
     * @throws Redis exception on failing to pull
     */
    async verify(token: string): Promise<boolean> {
        return (await redis.exists(`user_${token}`)) == 1;
    }

    /**
     * Extract the user associated with the token. May return null if the token is not valid.
     * @param {string} token - The token to decode
     * @returns {Promise<UserDb | null>} The user associated with the token, or null if the token is not valid.
     * @throws Redis exception on failing to pull
     */
    async decode(token: string): Promise<UserDb | null> {
        if (!(await this.verify(token))) return null;
        else {
            const r = await redis.hgetall(`user_${token}`);
            if (r["username"] === undefined || r["id"] === undefined) return null;
            else return { id: r["id"], username: r["username"] };
        }
    }
}

/**
 * Represents a JWT session token provider
 */
export class JwtTokenProvider implements TokenProvider {
    private verifier = createVerifier({ key: configuration.secretKey, algorithms: ["HS256"] });
    private signer = createSigner({
        expiresIn: configuration.tokenLifetime * 1000,
        key: configuration.secretKey,
        algorithm: "HS256",
    });

    new(user: UserDb): Promise<string> {
        return Promise.resolve(this.signer(user));
    }

    verify(token: string): Promise<boolean> {
        try {
            this.verifier(token);
            return Promise.resolve(true);
        } catch {
            return Promise.resolve(false);
        }
    }

    decode(token: string): Promise<UserDb | null> {
        try {
            const decoded = this.verifier(token) as UserDb;
            return Promise.resolve({
                username: decoded.username,
                id: decoded.id,
            });
        } catch {
            return Promise.resolve(null);
        }
    }
}

export const TOKEN_PROVIDER: TokenProvider = new JwtTokenProvider(); // new UuidTokenProvider();
