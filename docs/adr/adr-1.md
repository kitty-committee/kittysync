---
# Source: <https://github.com/adr/madr/blob/4.0.0/template/adr-template.md?plain=1>
# These are optional metadata elements. Feel free to remove any of them

status: "accepted"
date: 2026-10-08
decision-makers: Brooke Reavell, Tyler Gillett, Jessie Williamson, Nathan Baines, Naomi Holland, Rosalina Bowen
consulted: None.
informed: Brooke Reavell, Tyler Gillett, Jessie Williamson, Nathan Baines, Naomi Holland, Rosalina Bowen
---

# Concurrency Architecture

## Context and Problem Statement

{Describe the context and problem statement, e.g., in free form using two to three sentences or in the form of an illustrative story. You may want to articulate the problem in form of a question and add links to collaboration boards or issue management systems.}

Should we use CRDTs (Conflict-free Replicated Data Types) or OT (Operational Transformation) when handling eventual consistency in a real-time collaborative markdown editor?


## Decision Drivers

- Document Sizes
- Undo/Redo operations
- persistence and history
- Horizontal scaling
- No document-level Permissions needed

## Considered Options

- 1. Conflict-free Replicated Data Types
- 2. Operational Transforms

## Decision Outcome

Chosen option: 1. Conflict-free Replicated Data Types, because it best satisfies our most important driver, horizontal scaling, as it does not need to use a central server to order the transformations to create consistency. Instead of this, CRDT operations commute, so replicas can converge regardless of the update order.

The weaknesses of this option are acceptible due to the lack of document-level permissions needed, where all documents available to the user can be edited. The remaining weaknesses of the lack of history and the challenges of large document growth, are real, but will be mitigated during implementation to minimise the effects.

### Consequences

- Good, because Horizontal scaling is vastly improved, and the server can be used as a relay with a persistence layer, rather than needing to order operations. This also means documents are not forced to remain in the server with the OT handler.
- Good, because clients can edit offline and merge on reconnect without any special handling needed.
- Good, because OT implementation in a multi-server setup is typically more complicated compared to CRDT implementation.
- Bad, because there is no ability for the server to validate the edits. This is acceptable as there is no implementation of document-level permissions.
- Bad, because history and edit are not free. CDRTs retain the metadata needed for convergence, but it is not human readable, and any implementation of edit history will require extra design
