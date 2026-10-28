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

- 1. Conflict-free Replicated Data Types (Yjs, Automerge)
- 2. Operational Transforms (ShareDB)

## Decision Outcome

Chosen option: 1. Conflict-free Replicated Data Types, because it best satisfies our most important driver, horizontal scaling, as it does not need to use a central server to order the transformations to create consistency. Instead of this, CRDT operations commute, so replicas can converge regardless of the update order.

The weaknesses of this option are acceptible due to the lack of document-level permissions needed, where all documents available to the user can be edited. The remaining weaknesses of the lack of history and the challenges of large document growth, are real, but will be mitigated during implementation to minimise the effects.

Topology decision: Yjs or Automerge?

 Yjs is more focused on high frequency editing workloads, small incremental updates, and efficient collaborative text editing, which will become a central part of the application in later tasks. Yjs provides state vectors and differential updates, so peers can exchange the missing changes rather than the entire document repeatedly. The update format of Yjs is designed to handle out-of-order delivery and duplicates, reducing the need for message ordering and deduplication. Yjs also has a mature ecosystem, with editor integrations and established persistence and transport providers, means less implementation effort. Although Automerge is also a valid decision, as it offers similar synchronization and eventual consistency capabilities, Yjs is preferred because its update model and ecosystem are particularly well suited to collaborative text editing.

### Consequences

- Good, because Horizontal scaling is vastly improved, and the server can be used as a relay with a persistence layer, rather than needing to order operations. This also means documents are not forced to remain in the server with the OT handler.
- Good, because clients can edit offline and merge on reconnect without any special handling needed.
- Good, because OT implementation in a multi-server setup is typically more complicated compared to CRDT implementation.
- Bad, because there is no ability for the server to validate the edits. This is acceptable as there is no implementation of document-level permissions.
- Bad, because history and edit are not free. CDRTs retain the metadata needed for convergence, but it is not human readable, and any implementation of edit history will require extra design

## AI Prompt Appendix

```
We are making a realtime markdown editing solution and am trying to decide between Conflict-free Replicated Data Types (CRDTs) like Yjs and automerge or Operational Transformation (OT) like ShareDB
```

The AI balanced suggestions between CRDTs and OT approaches, but leaned towards CRDTs unless central authority was a concern. It also mentioned considering document size, metadata, and server authority.


```
Our editor is not WYSIWYG, and we'd like to support only short periods of offline activity. Our app is designed for high availability and horizontal scaling.
```

The AI suggested that CRDTs biggest advantage was removed by this new information. The ease of horizontal scaling and the very high availability led towards it suggesting to remain with CDRTs over OT, however. After this, it suggested an architecture that would work well.  