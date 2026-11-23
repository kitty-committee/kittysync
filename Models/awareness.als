abstract sig object {
    var states: set awarenessMap
}

sig Client extends object{}

sig Node extends object {
    connected : set object
}

sig awarenessMap{
    user: one Client
    here: lone Client
    removed: lone Client
}

fact init {
    some Node
    some Client
}

fact transitions{
    always(
        (some from: Client, to: Node, state:awarenessMap | updateFromClientToNode[from,to,state]) or
        (some from: Node, state:awarenessMap, set to: Object | updateFromNodeToX[from,to,state]) or
        or stutter
    )
}

pred updateFromClientToNode[from: Client, to: Node, state:awarenessMap]{
    from in to.connected
    (state.here and not state.removed) or (state.removed and not state.here)
    (awarenessMap.user = to.states.user) or (awarenessMap not in to.states)
    (awarenessMap.removed = from) or no awarenessMap.removed
    after updateFromNodeToX[to, awarenessMap,to.connected]
}

