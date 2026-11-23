// define structure
sig JWT {}
sig Client { 
    token : one JWT 
}

var sig setup in Client {} 

sig Server {
    files : set File,
    var connected: set Client,
    authenticated : some JWT
}
sig URL {
    server: one Server
}

sig FileName { file: one File}
sig File{}

abstract sig Message {}
sig StringMessage extends Message {}
sig ObjectMessage extends Message {}

// inital state
fact {
    one URL // probably unconstrain later?
    no connected
    some files
    one Client // probably unconstrain this later?
}

// state transisitions
fact {
    always(
        (some c : Client, fn : FileName, u: URL | connect[c,fn,u]) or
        (some c : Client | disconnect[c] or setup[c]) or
        (some c : Client, m : Message | onMessageGood[c,m] or onMessageBad[c,m])  
        stutter
    )
}

pred stutter{
    connected' = connected
    setup' = setup
}

pred connect[c : Client, fn: FileName, u: URL]{
    c->JWT in authenticated //guard
    fn->File in files
    u.server.connected' = u.server.connected + c
    setup' = setup
}

pred disconnect [c : Client]{
    c in connected
    connected = connected - c
    setup' = setup - c
}

pred setup [c : Client] {
    c not in setup
    c in connected
    setup' = setup + c
    connected' = connected
}

pred onMessageGood[c: Client, m: Message]{
    c in setup
    m in ObjectMessage
    connected' = connected
    setup' = setup
    // send message to hocupocus
}
pred onMessageBad[c: Client, m: Message]{
    c in setup
    m in StringMessage
    after disconnect 
}

