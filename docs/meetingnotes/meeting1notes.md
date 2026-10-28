# Initial Meeting

Date 08/10/2026

## general stuff

- Official name Kittysync
- Nathan has added an adr template
- Licensing: add page with every library we used plus all the licence
- PM: Brooke

## Application stack

- Svelt frontend
    - 4 people have experience with svelt, everyone with js
- Node backend
    - Makes sense to use the same language for front and back
    - Experience with node already
    - We want something with high availablity
    - Using load balancer
    - Use Redis for inter-server communication to maintain high availabity
    - Use yjs for crdts not using ot as crdts has better offline disconnect behaviour
    - Fastify framework
- SQL backend
    - Need eventual consistency for databases
    - Postgres as can be used for eventual consistency
    - Orm - Drizzle can provide this
- RTT
    - Websockets now change to sockets.io later if we need
- Code editor component
    - CodeMirror - use later on if required by client
    - textarea- use for now maybe switch to a code editor component later

# Decomposing issues

- Authentication
    - Auth frontend
    - Auth backend
- Document persistence
    - Ask client about per user perms
    - Markdown rendering
- Bi-directional websocket comms
    - Need to agree upon a protocol
    - RT backend
    - RT frontend

# Issue role allocation

- ADR: Brooke
- RTCA: Brooke
- Auth frontend: Rose
- Auth Backend: Nathan
- Realtime back: Jessie
- Realtime front: naomi
- Document list: tyler
- Docker : brooke
- ci/cd: brooke
- Unit tests: everyone
