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

export class DocumentIdConflict extends Error {
    constructor() {
        super("Conflict between document ID's!");
    }
}
