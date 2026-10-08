# Initial Meeting
Date 08/10/2026

## general stuff

+ Official name Kittysync
+ Nathan has added an adr template
+ licensing: add page with every library we used plus all the liscence
+ PM: Brooke



## Application stack

+ Svelt frontend 
    - 4 people have experience with svelt, everyone with js 
+ Node backend  
    - makes sense to use the same language for front and back
    - experience with node already
    - we want something with high availablity 
    - using load balancer
    - use redis for interserver communication to maintain high availabity while using 
    - use yjs for crdts not using ot as crdts has better offline disconnect behaviour
    - fastify framwork
+ SQL backend
    - need eventual consistency for databases
    - postgres as can be used for eventual consistency
    - orm - Drizzle
+ RTT
    - websockets now change to sockets.io later if we need
+ Code editor component
    - code mirror - use later on if required by client
    - text area - use for now maybe switch to a code editor component later

# Decomposing issues

+ Authentication
    - auth frontend
    - auth backend
+ Document persistence
    - ask client about per user perms
    - mark down rendering
+ Bi-directional websocket comms
    - need to agree upon a protocol
    - RT backend 
    - RT frontend
 
# Issue role allocation

+ ADR: Brooke
+ RTCA: Brooke
+ Auth frontend: Rose
+ Auth Backend: Nathan
+ realtime back: Jessie
+ realtime front: naomi
+ document list: tyler
+ docker : brooke
+ ci/cd: brooke
+ unit tests: everyone
