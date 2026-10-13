# TechShop

[**Live demo →**](https://tech-shop-teal.vercel.app)

A modern technology store portfolio demo by **Emre Karayaman**. Explore 24 products with 61 product photographs, filter by category, compare prices, and complete a simulated purchase with persistent order history.

> This is a portfolio demonstration. Prices, inventory, shipping and tax are illustrative. No real payment is collected and no goods are shipped. Use fictional delivery details.


## Stack

- **Storefront:** React, React Router, Redux Toolkit / RTK Query, Vite, React Bootstrap and custom responsive CSS.
- **API:** Express on a Vercel Node.js Function in Frankfurt.
- **Database:** Neon Postgres, provisioned through Vercel Marketplace in Frankfurt.
- **Images:** Static catalog assets on Vercel; admin uploads re-encoded as WebP and stored in Vercel Blob.
- **Authentication:** Random server-side sessions stored as SHA-256 digests in Postgres. HTTP-only, secure, same-site cookies. Bcrypt password hashing. Database-backed request limits.

The original 2023 MERN implementation was modernized for Vercel. The unavailable historical MongoDB cluster is not required. This version creates a new, independent database; it does not claim to recover historical users, products or orders.

## Features

- Search, six category filters, server pagination and price/name sorting.
- Product photo galleries, stock-aware carts and accessible responsive layouts.
- Account creation, sign-in, logout, profile updates and password changes requiring the current password.
- Atomic server-side checkout: product prices are loaded from Postgres, stock rows are locked and decremented together with order insertion, and request keys prevent duplicate orders.
- Demo checkout explicitly marks `demoCompleted`; it never marks a simulated payment as `isPaid`.
- Order ownership enforced on reads and demo completion; admin-only product, user and delivery management.
- Product reviews allowed only after completing a corresponding demo order.
- Admin uploads require authentication and admin role, accept JPEG/PNG/WebP, cap at 3 MB, validate pixel count and re-encode to WebP before storage.

## Local setup

Requires Node.js 22.12+ and npm. Before local development, connect a separate Neon branch and Blob store to the project’s **Development** environment, then pull those environment variables. The deployed Production / Preview connections do not automatically create Development credentials. Never seed a production database for local tests.

```sh
npm ci
vercel link --project tech-shop --scope karayamans-projects
vercel env pull .env.local
npm run db:migrate
npm run dev
```

`.env.example` documents required and optional keys. `DATABASE_URL` is required. Blob uploads need the connected store's `BLOB_STORE_ID` and Vercel OIDC credentials, or a development `BLOB_READ_WRITE_TOKEN`. `ADMIN_EMAIL` and `ADMIN_PASSWORD` optionally create a private administrator during migration; they are never exposed to the browser or committed.

Development URLs: storefront `http://127.0.0.1:5173`, API `http://127.0.0.1:5000`.

## Deploy

The repository root is the Vercel project root. Vercel uses `npm ci`, `npm run build`, and `frontend/dist`. `api/index.js` is the API Function; all `/api/*` requests are routed to it. Frontend routes fall back to the SPA document.

Connect Neon and Blob to the project **before** the build. The build runs the versioned schema migration and idempotent catalog seed before compiling the frontend. Existing products, stock, users and orders are preserved on rebuilds. Neon preview branches should remain isolated from production.

```sh
npm test
npm run build:frontend
npm audit
```

Validation performed on the deployed application: 27 customer/security checks, 15 administrator/storage checks, 4 focused business-rule tests, successful Vite build and zero reported npm audit vulnerabilities. Tests used fictional accounts and demo orders; no real payments were submitted.

`GET /api/health` verifies the actual database connection. `GET /api/config` describes the demo rules. Build fails when the database is unavailable rather than publishing a nonfunctional storefront.

## Catalog sources

Product images and initial illustrative prices are sourced from the [DummyJSON product dataset](https://dummyjson.com/docs/products), intended for e-commerce prototypes. Images are copied into `frontend/public/catalog` so page rendering does not depend on its API. Brand names identify sample products; this project is not affiliated with those brands. The sample catalog is not a current pricing or availability claim. Existing repository image uploads are preserved in `frontend/public/uploads`.

## License

Application code: [MIT](LICENSE). Third-party product imagery belongs to its respective rights holders and is used for this portfolio demo.
