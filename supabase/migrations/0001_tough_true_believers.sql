CREATE TYPE "public"."payment_method" AS ENUM('credit-card', 'bank-transfer', 'ewallet', 'cstore', 'gopay', 'shopeepay', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'success', 'failed', 'expired', 'cancel', 'deny', 'challenge');--> statement-breakpoint
CREATE TABLE "donations" (
	"id" serial PRIMARY KEY NOT NULL,
	"amount" integer NOT NULL,
	"name" text NOT NULL,
	"email" varchar(256) NOT NULL,
	"order_id" varchar(64) NOT NULL,
	"transaction_id" varchar(64),
	"payment_method" "payment_method" NOT NULL,
	"payment_type" varchar(32),
	"payment_status" "payment_status" DEFAULT 'pending',
	"payment_details" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"is_recurring" boolean DEFAULT false,
	"message" text,
	CONSTRAINT "donations_order_id_unique" UNIQUE("order_id")
);
