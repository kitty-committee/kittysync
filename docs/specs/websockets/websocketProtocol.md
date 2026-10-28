# Websocket Protocol v0.1.1

Date: 13/10/2026

## What we need

- Way to connect and disconnect from server
- Way to specifiy which file editing when connecting
- Authenticate user before sending them the file
- Update users editing files
- Save file message

## How to do

### Connect and disconnect

- Connect and disconect via websocket protocol
- Send filename in the connection url, the route then reads the fileID query parameter

### send file

- Used for updating files
- Sent by server to client with the md file
- When sent after a save command send to all users connected to the selected file

### save file

- Sent by clients
- Sends the current copy of the file to the server
- Server saves and then sends the above packet to all users with the newly saved file

### update users

- Sent by server
- Sends list of usernames(for now)

### error handling

- Sent by either
- For now just contains error message

### ws open

- Sent by client to let server know its ready to recive data

## Implementation

### Default JSON Packet

```ts
{
    "type": string,
    "data": object,
}
```

### Update File packet

```ts
{
    "type": "updateFile",
    "data": {
        "file": string
    },
}
```

### Save File packet

```ts
{
    "type": "saveFile",
    "data": {
        "file": string
    },
}
```

### Update User List Packet

```ts
{
    "type": "updateUsers",
    "data": {
        "userList": string[]
    },
}
```

### Error packet

```ts
{
    "type": "error",
    "data": {
        "message": string
    },
}
```

### Open packet

```ts
{
    "type": "open",
    "data": null
}
```
