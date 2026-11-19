# Model overviews

## Connection model

This models the process of creating, maintaining, and closing a connection
to the real-time back end.

It describes the following system:

1. Client opens web-socket connection to the real-time server
2. An authentication hook runs on their request, verifying and extracting
   the user data from their JWT token.
3. `onmessage`, `onclose`, and `pong` event handlers are set up on the new
   web-socket.

### On web-socket message

When a web-socket message is received by the real-time back-end,
it checks whether or not it is a string message. Hocuspocus
accepts only binary messages, so string messages are rejected outright,
and the connection closed.

If the message is otherwise valid, it is passed on to the internal
Hocuspocus handler, which determines further actions (which will be modelled
in the state-sync, and awareness-sync models).

### On web-socket close

When a closing message is received, the web-socket is closed, and the internal
Hocuspocus contextual connection is also closed.

### Re-connection behaviour

If the client disconnects from the real-time back-end, a re-connection will
be attempted _up to five times_, after which the system will give up.

## State-sync model

This model is concerned with the synchronisation of document state across
nodes and clients. Note the following definitions:

- _**Node**_: A single instance of the back-end, a client connects to a
  node, and a node connects to other nodes to synchronise awareness and
  state.
- _**Client**_: A client is a user-agent device, which connects to a single
  node.

The state-sync model describes the following system:

1. Initial state of the document is fetched
2. If there is a change on the client-side:
3. The change is sent to the server
4. The document is locked
5. The new state is merged into the existing state
6. The document is unlocked
7. The new state is propagated to other nodes through Redis.
8. The new state is broadcasted to connected clients.

## Awareness-sync model

This model is concerned with the synchronisation of awareness states.

1. A client updates their awareness map
2. This update is sent to the server
3. On the server-side, if the update is coming from another node, simply
   propagate this update to all connected clients, otherwise, continue
   through validation steps.
4. Check that all updated states match the expected schema. If this check
   fails, drop the offending updates.
5. Stamp the context provided user data (server-provided) into the
   updates.
6. If a previous state exists for the client, check that the user specified
   in the old state matches the user specified in the new state. If this
   check fails, drop the offending updates.
7. For each removed client in this update, check that the user of the client
   being removed matches the user in the current context, if this fails,
   the entire update is rejected.
