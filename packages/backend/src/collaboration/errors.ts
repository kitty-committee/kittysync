export class HocuspocusError extends Error {
    readonly reason;

    constructor(message: string) {
        super(message);
        this.reason = message;
    }
}

/**
 * Thrown if a websocket manages to reach hocuspocus unauthenticated
 */
export class NotAuthenticated extends HocuspocusError {
    constructor() {
        super("Connection is not authenticated!");
    }
}

export class DocumentNotFound extends HocuspocusError {
    constructor() {
        super("The specified document does not exist!");
    }
}

export class DocumentIdConflict extends HocuspocusError {
    constructor() {
        super("Conflict between document ID's!");
    }
}

export class UpdateForbidden extends HocuspocusError {
    constructor() {
        super("The update attempted to modify data the specified user does not have access to!");
    }
}
