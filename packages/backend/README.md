# @kittysync/backend

The backend for the KittySync web application, written using [fastify](https://fastify.dev/).

> [!WARNING]
> Vite is configured to proxy only routes starting with `/api/*` to the backend during development. As a result **all endpoints must begin with this prefix**.

## Authentication

Authentication / user data related endpoints are all rooted at `/api/auth`.

### `/api/auth/user`

#### GET

Search for users by a named field.

##### Request query parameters

- `username`: [PostgreSQL _LIKE_ clause parameter](https://www.w3schools.com/postgresql/postgresql_like.php).

##### Response

A JSON formatted list of users:

```json
[
  {
    id: <uuid_string>,
    username: <username>
  }, ...
]
```

#### POST

Create a new user.

##### Request body

```json
{
  "username": <username>,
  "password": <password>
}
```

##### Response

Empty `HTTP 200` on success, HTTP error code otherwise.

### `/api/auth/session`

#### GET

Get the user data attached to a session token. Can also be used to validate a session token.

##### Request

Session token must be passed in a cookie named session:

```
Cookie: session=<session_token>
```

##### Response

JSON object containing the authenticated user's data:

```json
{
  id: <uuid_string>,
  username: <username_string>
}
```

... or a 401 error, indicating the session token is invalid.

#### POST

Create a new session. Effectively a login endpoint.

##### Request body

```json
{
  "username": <username>,
  "password": <password>
}
```

##### Response

`HTTP 200` on success, with a `Set-Cookie` header which will set the session cookie on the user agent,
`HTTP 401` if the supplied credentials do not match a user, HTTP error code otherwise.
