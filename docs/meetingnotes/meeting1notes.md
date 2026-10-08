# Initial Meeting
Date 08/10/2026

## General stuff

+ Official name KittySync
+ Nathan has added an ADR template
+ licensing: add page with every library we used plus all the license.


## Application stack

+ Svelte frontend 
    - 4 people have experience with svelte, everyone with js 
+ Node backend  
    - makes sense to use the same language for front and back
    - experience with node already
    - we want something with high availablity 
    - using load balancer
    - use redis for inter-server communication to maintain high availabity while using 
    - use yjs for crdts not using ot as crdts has better offline disconnect behaviour
    - fastify framwork
+ SQL backend
    - need eventual consistency for databases
    - postgres as can be used for eventual consistency
+ RTT
    - websockets now change to sockets.io later if we need
+ Code editor component
    - code mirror - use later on if required by client
    - text area - use for now maybe switch to a code editor component later
 
 
