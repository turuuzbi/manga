This is a project that I am working on with my relative. It is a manga reading website and she does the translations while I handle the coding, deployment, and website management. Currently working on the very basics of the website, such as:
- Adding the landing page
- Connecting my database
- e.t.c.

I have high hopes this will be a well done project.

## Setup

1. Copy `.env.example` to `.env.local` and fill in your Postgres, Clerk, and Cloudflare R2 values.
2. Generate the Prisma client with `npx prisma generate`.
3. Create or update your database schema with `npx prisma migrate dev`.
4. In Clerk, create a webhook that points to `/api/webhooks/clerk` and copy its signing secret into `CLERK_WEBHOOK_SIGNING_SECRET`.
5. In Cloudflare R2, create a bucket, generate API tokens, and set `R2_PUBLIC_URL` to your public bucket domain or `r2.dev` URL.

### Notes

- Local users are stored in Postgres and synced from Clerk using the webhook route.
- `lib/r2.ts` uploads files to Cloudflare R2 and returns a public URL you can store in Prisma.
- Admin authorization can be based on the `role` field in the `User` table.
