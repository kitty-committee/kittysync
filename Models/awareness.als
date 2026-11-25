sig User {}
sig CusorPlacement {}

sig awarenessState {
    user: one User,
    var cusor: one CusorPlacement
}

sig Update{
    map : Client -> one awarenessState,
    var from : one object
}

abstract sig object{
    var map: Client-> one awarenessState
}

sig Client extends object{
    cUser : one User
}

sig Node extends object{
    clients: set Client,
}

one sig Redis {
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
    always(all u:User | one c: Client | u in c.cUser)
}
fact all_states_are_different{
    always(all disj a,b:awarenessState | (a.user!=b.user) or (a.cusor!=b.cusor) )
}

fact all_updates_are_different{
    always{
        all disj x,y :Update | x.map != y.map
    }
}

fact init_all_objects_share_the_same_map{
    all x,y: object | x.map = y.map
}

fact init_all_updates_have_a_different_map{
    all u: Update, o:object | u.map!=o.map
}

fact init_all_updates_originate_from_a_client {
    Update.from in Client
}

fact init {
    no queue
    no issued
    some Client
    some Update
}

run default {} for 3 but exactly 2 Client

// need to make all clients in a map map to different states  

// fact transisitons {
//     always(
//         (some)
//     )
// }
