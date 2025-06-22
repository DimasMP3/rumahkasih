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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
