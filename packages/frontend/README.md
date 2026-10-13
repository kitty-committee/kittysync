# @kittysync/frontend

The frontend for the KittySync web application, written using [SvelteKit](https://svelte.dev/docs/kit/introduction).

This project uses Svelte Kit's [static site generation](https://svelte.dev/docs/kit/adapter-static), as a result serverside functionality cannot be used. If you find yourself writing anything `.server.ts`, then it will likely not work.

The routes directory has the layout seen below. These folders have plumbing to make authentication and server-side-rendering configuration automatic in the relevant locations.

```
routes # contains all non-app pages e.g. homepage
└── app # contains all pages accessible without being logged in e.g. signup
    └── (authenticated) # all pages that you must be logged in to view
```

Vite is configured to proxy requests to the `/api/` path to make developing features that integrate with the backend seamless.
