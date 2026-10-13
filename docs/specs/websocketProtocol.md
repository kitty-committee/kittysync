# Websocket Protocol v0.1
Date: 13/10/2026

## What we need

+ way to connect and disconnect from server
+ way to specifiy which file editing when connecting
+ authenticate user before sending them the file
+ update users editing files 
+ save file message

## How to do

### Connect and disconnect
+ Connect and disconect via websocket protocol
+ Send filename in the connection url

### authenticate user (come back to)
+ First message authentiction
+ client sends auth message with JWT that server can verify

### send file
+ used for updating all files(for now)
+ sent by server to client with the md file
+ when sent after a save command send to all users

### save file
+ sent by clients
+ sends the current copy of the file to the server
+ server saves and then sends the above packet to all users with the newly saved file

### update users
+ sent by server 
+ sends list of usernames(for now)

### error handling
+ sent by either
+ for now just contains error message

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

###  Update User List Packet

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
