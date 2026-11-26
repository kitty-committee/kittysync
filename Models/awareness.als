sig User {}
sig CusorPlacement {}

sig awarenessState {
    user: one User,
    cusor: one CusorPlacement
}

sig Update{
    map :  Client -> one awarenessState,
    originate : one Client
}

abstract sig updateCarrying{

}
abstract sig mapStoring extends updateCarrying{
    var map: Client-> one awarenessState
}

sig Client extends mapStoring{
    user : one User
}

sig Node extends mapStoring{
    clients: set Client,
    var queue: (Client + Redis)-> Update,
    var issued: set Update
}

one sig Redis extends updateCarrying{
    nodes : set Node,
    var queue: Node -> Update,
    var issued: set Update
}

fact all_clients_belong_to_one_node{
    always(all c :Client | one clients.c)
}

fact all_nodes_belong_to_one_redis{
    always(all n : Node | one nodes.n)
}

fact all_users_belong_to_one_client{
    always(all u:User | one c: Client | u in c.user)
}
fact all_states_are_different{
    always(all disj a,b:awarenessState | (a.user!=b.user) or (a.cusor!=b.cusor) )
}

fact all_updates_are_different{
    always{
        all disj x,y :Update | x.map != y.map
    }
}

fact all_client_in_map_are_correct{
    all c:Client | c.(mapStoring.map).user = c.user && c.(Update.map).user = c.user
}

fact init_all_mapStorings_share_the_same_map{
    all x,y: mapStoring | x.map = y.map
}

fact init_all_updates_have_a_different_map{
    all u: Update, o:mapStoring | u.map!=o.map
}


fact init {
    no Redis.queue
    no Redis.issued
    no Node.issued
    no Node.queue
    some Client
    some Update
}

fact transisitons {
    always(
        (some u: Update, c:Client,n:Node | userUpdatesMap[u,c,n] or nodeDeliver[u,c,n]) or 
        (some u: Update, n:Node | nodeUpdatesRedis[u,n] or redisDeliver[u,n]) or
        stutter
    )
}

pred stutter {
    mapStoring.map' = mapStoring.map
    Redis.queue' = Redis.queue
    Redis.issued' = Redis.issued
    Node.queue' = Node.queue
    Node.issued' = Node.issued
}

pred userUpdatesMap[u:Update, c: Client , n: Node]{
    u.originate = c
    u.map != c.map
    c in n.clients

    // validate schema
    Client.(u.map).user in User
    Client.(u.map).cusor in CusorPlacement
    // need to deal with rest of validation

    c.map' = u.map
    n.map' = u.map
    mapStoring.map' = mapStoring.map
    Redis.queue' = Redis.queue
    Redis.issued' = Redis.issued
    n.queue' = n.queue +(n.clients + Redis)-> u
    n.issued' = n.issued + u
    Node.queue' = Node.queue'
    Node.issued' = Node.issued'
}

pred nodeUpdatesRedis[u:Update, n:Node]{
    Redis->u in n.queue

    Redis.issued' = Redis.issued + u
    Redis.queue' = Redis.queue + (Redis.nodes - n)-> u
    mapStoring.map' = mapStoring.map
    n.queue' = n.queue - (Redis->u)
    Node.issued' = Node.issued
    Node.queue' = Node.queue'
}

pred redisDeliver[u:Update, n: Node]{
    n->u in Redis.queue

    n.queue' = n.queue + n.clients -> u
    n.issued' = n.issued+ u
    n.map' = u.map
    Redis.queue' = Redis.queue-(n->u)
    Redis.issued' = Redis.issued

    Node.queue' = Node.queue
    Node.issued' = Node.issued
    mapStoring.map' = mapStoring.map
}

pred nodeDeliver[u:Update, c: Client, n:Node]{
    c->u in n.queue

    n.queue' = n.queue - c->u
    c.map' = u.map
    n.issued' = n.issued'
    Redis.queue' = Redis.queue'
    Redis.issued' = Redis.issued'

    Node.queue' = Node.queue
    Node.issued' = Node.issued
    mapStoring.map' = mapStoring.map
}


fact ensure_all_updates_happen{
  all n : Node, u : Update | always ( u in n.(Redis.queue) implies eventually (u not in n.(Redis.queue)) )
  all n: Node, u:Update, c:Client | always(c->u in n.queue implies eventually c->u not in n.queue)
}

// check for eventual consistency 
pred consistent{
    all disj x,y: mapStoring | x.map=y.map
}

assert eventuallyConsistent{
    eventually always consistent
}
// check empty queues implies consistency
check eventuallyConsistent for 3 Node, 3 Client, 2 Update, 3 User, 5 CusorPlacement, 5 awarenessState, 1..6 steps

assert emptyQueueConsistency{
    always((no Redis.queue and no Node.queue) implies consistent)
}
check emptyQueueConsistency for 3 Node, 3 Client, 2 Update, 3 User, 5 CusorPlacement, 5 awarenessState, 1..6 steps

// check there is no possible non eventually conistent setup
run {eventually not consistent} for 3 Node, 3 Client, 2 Update, 3 User, 5 CusorPlacement, 5 awarenessState, 1..6 steps

run default{}  for 6 but exactly 2 Node, exactly 4 Client