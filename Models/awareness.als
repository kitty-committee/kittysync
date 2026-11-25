sig User {}
sig CusorPlacement {}

sig awarenessState {
    user: one User,
    cusor: one CusorPlacement
}

sig Update{
    map :  Client -> one awarenessState,
    var from : lone updateCarrying,
    var to : lone updateCarrying 
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

fact init_all_updates_originate_from_a_client {
    Update.from in Client
    all u:Update | u.from = u.to
    all u: Update | one u.from
}


fact init {
    no queue
    no issued
    some Client
    some Update
}

fact transisitons {
    always(
        (some u: Update | userUpdatesMap[u] or nodeUpdatesRedis[u]) or 
        stutter
    )
}

pred stutter {
    Update.from' = Update.from
    Update.to' = Update.to
    mapStoring.map' = mapStoring.map
    Redis.queue' = Redis.queue
    Redis.issued' = Redis.issued
}

pred userUpdatesMap[u:Update]{
    u.from = u.to
    u.from in Client
    u.map != u.from.map
    let node = clients.(u.from){
        u.from.map' = u.map
        u.to' = node
        u.from' = u.from
        Redis.queue' = Redis.queue
        Redis.issued' = Redis.issued
    }
}

pred nodeUpdatesRedis[u:Update]{
    u.from in Client
    u.to in Node
    // validate schema
    Client.(u.map).user in User
    Client.(u.map).cusor in CusorPlacement
    // need to deal with rest of validation
    u.from' = u.to
    u.to' = Redis
    Redis.issued' = Redis.issued + u
    Redis.queue' = Redis.queue + (Redis.nodes -> u)
    mapStoring.map' = mapStoring.map
}


run default {} for 3 