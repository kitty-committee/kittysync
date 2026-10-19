import type { UserDb } from "@kittysync/common";
import type { FastifyRequest } from "fastify";
import { v4, type UUIDTypes } from "uuid";
import { redis } from "../../app.ts";

/**
 * Base type of session tokens.
 */
export interface SessionToken {
    /**
     * Verify whether a session token is valid or not.
     */
    verify(): Promise<boolean>;
    /**
     * Extract the user associated with the token. May return undefined if the token is not valid.
     */
    extractUser(): Promise<UserDb | undefined>;
}

/**
 * Encapsulates a UUID session token
 */
export class UUIDSessionToken implements SessionToken {
    private token: UUIDTypes;

    private constructor(token: UUIDTypes) {
        this.token = token;
    }

    /**
     * Extract a UUID session token from a request. May be undefined if the request contains no token.
     * @param request - The request to attempt to extract a UUID session token from
     */
    static from(request: FastifyRequest): UUIDSessionToken | undefined {
        if (request.cookies["session"]) {
            return new UUIDSessionToken(request.cookies["session"]);
        } else return undefined;
    }

    /**
     * Create a new session token, pushing to redis.
     * @param user - The user to create a new token for
     * @returns The new token.
     * @throws Redis exception on failing to push.
     */
    static async new(user: UserDb): Promise<UUIDSessionToken> {
        const token = new UUIDSessionToken(v4());
        await redis.hset(`user_${token.token.toString()}`, user);
        await redis.expire(`user_${token.token.toString()}`, 86400);

        return token;
    }

    getToken(): UUIDTypes {
        return this.token;
    }

    async verify(): Promise<boolean> {
        return (await redis.exists(`user_${this.token.toString()}`)) == 1;
    }

    async extractUser(): Promise<UserDb | undefined> {
        if (!(await this.verify())) return undefined;
        else {
            const r = await redis.hgetall(`user_${this.token.toString()}`);
            if (r["username"] === undefined || r["id"] === undefined) return undefined;
            else {
                return { id: r["id"], username: r["username"] };
            }
        }
    }
}
