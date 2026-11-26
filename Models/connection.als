
/**
 * JWT and Client signatures.
 *
 * These represent JWT tokens, and clients which might
 * connect to a server.
 */
abstract sig JWT {}
sig InvalidJWT extends JWT {}
sig ValidJWT extends JWT {}

sig Client {
    token : one JWT,
    var messages : set Message,
    var connectionAttempts: one Int
}

// Ensure that all tokens belong to some client.
// Notably we do not enforce that a token belongs to only one client,
// because in reality multiple clients could have the same token.
// (they shouldn't, but they *could*)
fact allTokensBelongToSomeClient {
  all t : JWT | some c : Client | t in c.token
}

/**
 * A real-time backend server node.
 */
sig Node {
    var clients: set Client,
    var connecting: set Client,
    var refused: set Client,
    var handledMessages: set Message
}

/**
 * Represents the kind of messages that a client could send to a
 * real-time backend server.
 */
abstract sig Message {}
sig StringMessage extends Message {}
sig ObjectMessage extends Message {}

fact init {
  no clients
  no connecting
  no refused
  all c : Client | c.connectionAttempts = 0
}

fact transitions {
  always (
    (one c : Client, n : Node | startConnecting[c, n] or connectionAttempt[c, n] or disconnect[c, n]) or
    (one c : Client, n : Node, m : Message | sendMessage[c, n, m]) or
    stutter
  )
}

pred stutter {
  connectionAttempts' = connectionAttempts
  clients' = clients
  connecting' = connecting
  refused' = refused
  messages' = messages
  handledMessages' = handledMessages
}

/**
 * Set a client to start connecting to a node
 */
pred startConnecting [c : Client, n : Node] {
  c not in n.connecting
  c not in n.refused
  connectionAttempts' = connectionAttempts ++ c -> 0
  connecting' = connecting + n -> c
  clients' = clients
  refused' = refused
  handledMessages' = handledMessages
  messages' = messages
}

/**
 * Attempt to connect a client to a node
 */
pred connectionAttempt [c : Client, n : Node] {
  c in n.connecting
  c not in n.refused
  c.connectionAttempts >= 5 implies {
    stopConnecting[c, n]
  } else {
    c.token in ValidJWT implies {
      connectionSuccess[c, n]
    }
    else {
      connectionFailed[c, n]
    }
  }
}

/**
 * Handle the case where the client's attempt to connect
 * to a node is successful.
 */
pred connectionSuccess [c : Client, n : Node] {
  c in n.connecting
  c not in n.refused
  c.connectionAttempts < 5
  clients' = clients + n -> c
  connecting' = connecting - n -> c
  connectionAttempts' = connectionAttempts
  refused' = refused
  handledMessages' = handledMessages
  messages' = messages
}

/**
 * Handle the case where the client's attempt to connect
 * to a node is unsuccessful.
 */
pred connectionFailed [c : Client, n : Node] {
    c in n.connecting
    c not in n.refused
    c.connectionAttempts < 5
    connectionAttempts' = connectionAttempts ++ c -> plus[c.connectionAttempts, 1]
    clients' = clients
    connecting' = connecting
    refused' = refused
    handledMessages' = handledMessages
    messages' = messages
}

/**
 * Stop a client connecting to a node.
 */
pred stopConnecting [c : Client, n : Node] {
  c in n.connecting
  c not in n.refused
  connecting' = connecting - n -> c
  clients' = clients
  connectionAttempts' = connectionAttempts
  refused' = refused + n -> c
  handledMessages' = handledMessages
  messages' = messages
}

/**
 * Disconnect a client from a node
 */
pred disconnect [c : Client, n : Node] {
    c in n.clients
    clients' = clients - n -> c
    connecting' = connecting
    connectionAttempts' = connectionAttempts
    refused' = refused
    handledMessages' = handledMessages
    messages' = messages
}

/**
 * Send a message from a connected client to its connected node
 */
pred sendMessage [c : Client, n : Node, m : Message] {
    c in n.clients
    m in c.messages
    connecting' = connecting
    connectionAttempts' = connectionAttempts
    refused' = refused
    handledMessages' = handledMessages + n -> m
    messages' = messages - c -> m
    m in StringMessage implies { disconnect[c, n] } else { clients' = clients }
}


/**
 * Predicates and checks
 *
 * The following section will specify predicates which should hold true in our system,
 * and will be tested on execution.
 */

// Ensure that infinite stutters in the connection process cannot happen,
// i.e. the system will always attempt to resolve connections in some way
fact {
  all n : Node, c : Client | always ( c in n.connecting  implies eventually (c not in n.connecting) )
}
fact {
  all n : Node, c : Client | always ( c not in n.connecting  implies eventually ((c in n.connecting) or (c in n.refused)) )
}

assert validTokensWillEventuallyConnect {
  all c : Client, n : Node | c.token in ValidJWT implies
    eventually c in n.clients
}
check validTokensWillEventuallyConnect

assert invalidTokensAreEventuallyRefused {
    all c : Client, n : Node | c.token in InvalidJWT implies
      eventually c in n.refused
}
check invalidTokensAreEventuallyRefused

assert connectionsAreReattempted {
    all c : Client | c.connectionAttempts = 1 implies
      eventually c.connectionAttempts > 1
}
check connectionsAreReattempted

// Now check message delivery
// This fact ensures that where a message exists, it will always be delivered to a node
fact {
  all m : Message, n : Node | m not in n.handledMessages implies eventually always ( m in n.handledMessages )
}

assert stringMessagesCauseDisconnect {
  all c : Client, n : Node, m : Message | c in n.clients and m in StringMessage implies eventually (c not in n.clients)
}
check stringMessagesCauseDisconnect
