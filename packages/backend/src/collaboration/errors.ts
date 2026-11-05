/**
 * Thrown if a websocket manages to reach hocuspocus unauthenticated
 */
export class NotAuthenticated extends Error {
    constructor() {
        super("Connection is not authenticated!");
    }
}

export class DocumentNotFound extends Error {
    constructor() {
        super("The specified document does not exist!");
    }
}
