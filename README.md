# Rumah Kasihku

## Description
Rumah Kasihku is a charity website for an orphanage built with modern web technologies. The platform provides information about the orphanage, showcases activities through a gallery, and features a donation system integrated with Midtrans payment gateway to facilitate financial support for the children.

## Technologies Used
- **Next.js**: React framework for server-rendered applications
- **React**: JavaScript library for building user interfaces
- **TypeScript**: Typed JavaScript for enhanced code quality
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library for React
- **Drizzle ORM**: TypeScript ORM for SQL databases
- **Supabase**: PostgreSQL database provider
- **Midtrans**: Payment gateway integration for donations

## Features
1. **Responsive Design**: Optimized for all device sizes
2. **Interactive Homepage**:
   - Hero section with engaging visuals
   - About section detailing the orphanage's mission
   - Gallery showcasing children's activities
   - Donation section with quick access to contribute
3. **Donation System**:
   - User-friendly donation form
   - Multiple payment method options (bank transfer, e-wallet, QRIS)
   - Secure payment processing
   - Donation tracking and management
4. **Smooth Animations**: Enhanced user experience with Framer Motion
5. **Database Integration**: Structured data storage for donations and user information

## Setup Instructions

### Prerequisites
- Node.js 16.x or higher
- npm or yarn package manager
- Supabase account
- Midtrans account

### Environment Variables
Create a `.env.local` file with the following variables:

```bash
# Database (Supabase)
DIRECT_URL=your_supabase_direct_url_here
DATABASE_URL=your_supabase_database_url_here

# Midtrans API Keys
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_midtrans_client_key_here
MIDTRANS_SERVER_KEY=your_midtrans_server_key_here

# Set to false in production
IS_MIDTRANS_SANDBOX=true
```

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/rumahkasihku.git
   cd rumahkasihku
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up the database
   ```bash
   npx drizzle-kit generate
   npx drizzle-kit push:pg
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## AI Support
Rumah Kasihku leverages AI technology in several ways to enhance the platform:

1. **Content Generation**: AI assists in creating compelling content for the website, ensuring the message about the orphanage's mission is clear and impactful.

2. **Image Optimization**: The gallery images are processed using AI to ensure optimal quality and loading performance.

3. **Form Assistance**: The donation form utilizes AI to provide smart suggestions and validation, making the donation process more intuitive.

4. **Personalization**: AI helps tailor the user experience based on visitor interaction patterns, showing the most relevant content.

5. **Analytics**: AI-powered analytics provide insights into donation patterns and website usage to continuously improve the platform.

## Deployment

This application is deployed with Vercel. For production deployment, update the following environment variables in your Vercel project settings:

- `DIRECT_URL` - PostgreSQL database connection string
- `DATABASE_URL` - Supabase connection string
- `MIDTRANS_CLIENT_KEY` - Your Midtrans client key
- `MIDTRANS_SERVER_KEY` - Your Midtrans server key 
- `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` - Same as MIDTRANS_CLIENT_KEY, but exposed to the client
- `IS_MIDTRANS_SANDBOX` - Set to 'false' for production

## Database Schema

### Users Table
- `id` - Primary key
- `fullName` - User's full name
- `phone` - User's phone number

### Donations Table
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

## Contributors
- Developer Team Rumah Kasihku
