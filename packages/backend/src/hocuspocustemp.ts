import { Server } from '@hocuspocus/server'

const server = new Server({
    name: 'hocuspocus-temp-test',
    port: 1234,

})

await server.listen()