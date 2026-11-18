// define structure
sig JWT {}
sig Client { 
    token : one JWT 
}

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
        stutter
    )
}

pred stutter{
    connected' = connected
}

pred connect[c : Client, fn: FileName, u: URL]{
    c->JWT in authenticated //gaurd
    fn->File in files
    u.server.connected' = u.server.connected + c
}
