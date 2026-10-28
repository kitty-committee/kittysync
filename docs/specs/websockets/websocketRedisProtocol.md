# Websocket Redis Protocol v0.1

## What is this?

This protocol defines how packets being published on the ws-channel redis channel should be formed

## Packet Specification

### General Packet structure

```ts
{
    command:string,
    data:object
}
```

### Add New User to file

Packet sent to update file maps on all servers of a new user being added to a file
userID may become a UUID

```ts
{
    command:"addUserFile",
    data:{
        fileID:string,
        userID:string
    }
}
```

### Remove User from file

Packet sent to update file maps on all servers of a user being removed from a file
userID may become a UUID

```ts
{
    command:"removeUserFile",
    data:{
        fileID:string,
        userID:string
    }
}
```

### Save file

Packet sent to save a file on all servers

```ts
{
    command:"saveFile",
    data:{
        fileID:string,
        fileData:string
    }
}
```
