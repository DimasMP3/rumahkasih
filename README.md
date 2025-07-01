# Rumah Kasihku

Rumah Kasihku adalah situs web panti asuhan yang dibuat dengan Next.js, React, Tailwind CSS, dan Framer Motion. Situs web ini menyediakan informasi tentang panti asuhan, galeri kegiatan, dan formulir donasi.

## Struktur Folder

```
src/
  ├── app/                    # Direktori aplikasi Next.js
  │   ├── donate/            # Halaman donasi
  │   ├── globals.css        # CSS global
  │   ├── layout.tsx         # Layout utama
  │   └── page.tsx           # Halaman utama
  │
  ├── components/             # Komponen terorganisir
  │   ├── donate/            # Komponen untuk halaman donasi 
  │   ├── home/              # Komponen untuk halaman utama
  │   ├── layout/            # Komponen tata letak (header, footer)
  │   ├── providers/         # Konteks dan penyedia
  │   ├── ui/                # Komponen UI yang dapat digunakan kembali
  │   └── index.ts           # File ekspor komponen
  │
  └── lib/                    # Utilitas dan helper
      └── utils.ts           # Fungsi utilitas
```

## Teknologi yang Digunakan

- **Next.js**: Framework React untuk pengembangan web
- **React**: Pustaka JavaScript untuk membangun antarmuka pengguna
- **Tailwind CSS**: Framework CSS untuk styling yang cepat
- **Framer Motion**: Pustaka animasi untuk React
- **TypeScript**: Superset dari JavaScript dengan pengetikan statis

## Fitur Utama

1. **Halaman Utama**: Menampilkan informasi tentang panti asuhan, galeri, dan bagian donasi
2. **Formulir Donasi**: Formulir interaktif untuk menerima donasi
3. **Animasi**: Animasi halus menggunakan Framer Motion
4. **Responsif**: Desain yang responsif untuk semua ukuran perangkat

## Pengembangan

Untuk menjalankan proyek ini secara lokal:

1. Clone repositori
2. Instal dependensi: `npm install`
3. Jalankan server pengembangan: `npm run dev`
4. Buka `http://localhost:3000` di browser Anda

## Kontributor

- Developer Tim Rumah Kasihku

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

This application uses Next.js and is deployed with Vercel.

### Environment Variables

**Important:** You must configure the following environment variables in your Vercel project settings:

- `DIRECT_URL` - PostgreSQL database connection string
- `MIDTRANS_CLIENT_KEY` - Your Midtrans client key
- `MIDTRANS_SERVER_KEY` - Your Midtrans server key 
- `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` - Same as MIDTRANS_CLIENT_KEY, but exposed to the client
- `MIDTRANS_IS_PRODUCTION` - Set to 'false' for sandbox or 'true' for production

Without these environment variables, the build will fail.

## ESLint

This project uses ESLint for code quality. Some rules have been disabled to allow the project to build successfully:

- `@typescript-eslint/no-unused-vars` - Disabled to prevent build failures from unused variables
- `@typescript-eslint/no-explicit-any` - Disabled to allow the use of `any` type in specific circumstances

Consider addressing these issues properly in the future for better code quality.

## Database Setup and Midtrans Integration

### Environment Variables
To run this application, you need to create a `.env.local` file with the following variables:

```bash
# Database (Supabase)
DIRECT_URL=your_supabase_direct_url_here
DATABASE_URL=your_supabase_database_url_here

# Midtrans API Keys (Sandbox)
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_midtrans_client_key_here
MIDTRANS_SERVER_KEY=your_midtrans_server_key_here

# Set to false in production
IS_MIDTRANS_SANDBOX=true
```

### Running Migrations

After setting up your environment variables, run the following commands to apply database migrations:

```
npx drizzle-kit generate
npx drizzle-kit push:pg
```

### Database Schema

The donation schema includes the following tables:

#### Users Table
- `id` - Primary key
- `fullName` - User's full name
- `phone` - User's phone number

#### Donations Table
- `id` - Primary key
- `amount` - Donation amount
- `name` - Donor's name
- `email` - Donor's email
- `orderId` - Unique order ID for Midtrans
- `transactionId` - Transaction ID from Midtrans
- `paymentMethod` - Payment method (credit-card, bank-transfer, ewallet, etc.)
- `paymentType` - Specific payment type from Midtrans
- `paymentStatus` - Status of payment (pending, success, failed, expired, cancel, deny, challenge)
- `paymentDetails` - Additional payment details
- `createdAt` - Timestamp when donation was created
- `updatedAt` - Timestamp when donation was last updated
- `isRecurring` - Boolean indicating whether this is a recurring donation
- `message` - Optional message from the donor

### Midtrans Integration

This project uses Midtrans as the payment gateway. Follow these steps to integrate:

1. Sign up for a Midtrans account at [https://midtrans.com/](https://midtrans.com/)
2. Get your Client Key and Server Key from the Midtrans Dashboard
3. Add these keys to your `.env.local` file
4. For production, set `IS_MIDTRANS_SANDBOX=false` and update the keys

For more information, refer to the [Midtrans documentation](https://docs.midtrans.com/).
