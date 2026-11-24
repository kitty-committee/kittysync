/**
 * state.als
 *
 * An Alloy 6.2.0 model checking eventual consistency of a real-time collaboration
 * document editing application with multiple, horizontally scalable nodes
 * connected through a single Redis instance.
 *
 * In this model, updates originate from clients, and are applied to the origin node,
 * and then passed to a queue managed by Redis. Further steps then involve
 * other nodes pulling this update from the Redis instance and applying it to themselves.
 *
 * Through this model, eventual consistency of document state is achieved.
 */

sig Client {}
sig Document {}

sig Update {
    doc : one Document,
    ver : one Int
}

sig Database {
    var state : Document -> lone Int
}

sig Node {
   clients : set Client,
   db : one Database
}

one sig Redis {
    nodes: set Node,
    var queue : Node -> Update, // Links a set of nodes which need an update to said update
    var issued : set Update
}

// Assert that all clients belong to exactly one node
fact {
    all c : Client | one n : Node | c in n.clients
}

// Assert that all databases belong to exactly one node
fact {
    all d : Database | one n : Node | d in n.db
}

// Assert that all nodes are connected to our redis instance
fact {
    all n : Node | one r : Redis | n in r.nodes
}

fact {
    all u : Update | u.ver >= 0
}

fact init {
  no state
  no Redis.queue
  no Redis.issued
}

pred newer [d : Database, u : Update] {
  no d.state[u.doc] or u.ver > d.state[u.doc]
}

fun applied [d : Database, u : Update] : Database -> Document -> Int {
  (state - d -> u.doc -> Int /* Removes the current state of the document */) + d -> u.doc -> u.ver /* ... and replace it with the new state */
}

pred edit [c : Client, u : Update] {
  u not in Redis.issued
  let n = clients.c {
    newer[n.db, u]
    state' = applied[n.db, u]
    Redis.issued' = Redis.issued + u
    Redis.queue' = Redis.queue + (Redis.nodes - n) -> u
  }
}

pred deliver [n : Node, u : Update] {
  u in n.(Redis.queue)
  newer[n.db, u]
  state' = applied[n.db, u]
  Redis.queue' = Redis.queue - n -> u
  Redis.issued' = Redis.issued
}

pred deliverDiscard [n : Node, u : Update] {
    u in n.(Redis.queue)
    not newer[n.db, u]
    state' = state
    Redis.queue' = Redis.queue - n -> u
    Redis.issued' = Redis.issued
  }

pred stutter {
    state' = state
    Redis.queue' = Redis.queue
    Redis.issued' = Redis.issued
}

fact transitions {
  always (
    (some c : Client, u : Update | edit [c, u]) or
    (some n : Node, u : Update | deliver[n, u] or deliverDiscard[n, u]) or
    stutter
  )
}

// Ensure that updates are always resolved, preventing infinite stutters
fact {
  all n : Node, u : Update | always ( u in n.(Redis.queue) implies eventually (u not in n.(Redis.queue)) )
}

// Consistency: The state contained within all databases is the same
pred consistent {
    all disj a, b : Database | a.state = b.state
}

// The system should be eventually consistent
assert eventuallyConsistent { eventually always consistent }
check eventuallyConsistent for 2 Node, 2 Client, 2 Database, 2 Document, 4 Update, 4 Int, 1..6 steps

// The system should be consistent when no updates are in-flight
assert emptyConsistency { always ( no Redis.queue implies consistent ) }
check emptyConsistency for 2 Node, 2 Client, 2 Database, 2 Document, 4 Update, 4 Int, 1..6 steps

// Check if there is an instance in which nodes diverge
run { eventually not consistent } for 2 Node, 2 Client, 2 Database, 2 Document, 4 Update, 4 Int, 1..6 steps

// Monotonicity: A database's version of a document should never decrease.
assert monotonic {
    always all d : Database, doc : Document |
      some d.state[doc] implies
        (some (d.state[doc])' and (d.state[doc])' >= d.state[doc])
}

check monotonic for 3 but 2 Node, 2 Client, 2 Database, 1 Document, 3 Update, 3 Int, 1..6 steps

// Convergence: Two identical updates from two different nodes eventually results in the same state
pred inFlightTogether [c1 : Client, u1 : Update, c2 : Client, u2 : Update] {
  u1.doc = u2.doc
  u1.ver = u2.ver  // Updates are identical
  clients.c1 != clients.c2  // Clients are from different nodes
  // Eventually, u1 is submitted, and at some point afterwards,
  // while there are still nodes waiting for u1, u2 is submitted
  eventually (
    edit[c1, u1] and
    after ((some Redis.queue.u1) until edit[c2, u2])
  )
}

assert convergence {
  all disj c1, c2 : Client, disj u1, u2 : Update |
    inFlightTogether [c1, u1, c2, u2] implies
    eventually always (
      consistent and
      (all d : Database | d.state[u1.doc] >= u1.ver)
    )
}
check convergence for 3 but 2 Node, 2 Client, 2 Database, 1 Document, 3 Update, 3 Int, 1..6 steps
