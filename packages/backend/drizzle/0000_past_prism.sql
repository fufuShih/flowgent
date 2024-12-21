DO $$ BEGIN
 CREATE TYPE "connection_type" AS ENUM('default', 'success', 'error', 'condition');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "matrix_status" AS ENUM('active', 'inactive', 'draft', 'error');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "node_type" AS ENUM('trigger', 'action', 'condition', 'subMatrix', 'transformer', 'loop');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "trigger_status" AS ENUM('active', 'inactive', 'error');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "trigger_type" AS ENUM('webhook', 'schedule', 'event', 'manual', 'email', 'database');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"matrix_id" integer NOT NULL,
	"source_id" integer NOT NULL,
	"target_id" integer NOT NULL,
	"type" "connection_type" DEFAULT 'default' NOT NULL,
	"condition" jsonb DEFAULT '{}',
	"created" timestamp DEFAULT now() NOT NULL,
	"updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "matrix" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "matrix_status" DEFAULT 'draft' NOT NULL,
	"is_sub_matrix" boolean DEFAULT false NOT NULL,
	"config" jsonb DEFAULT '{}' NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"matrix_id" integer NOT NULL,
	"type" "node_type" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"config" jsonb DEFAULT '{}' NOT NULL,
	"position" jsonb DEFAULT '{"x": 0, "y": 0}' NOT NULL,
	"sub_matrix_id" integer,
	"created" timestamp DEFAULT now() NOT NULL,
	"updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created" timestamp DEFAULT now() NOT NULL,
	"updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "triggers" (
	"id" serial PRIMARY KEY NOT NULL,
	"node_id" integer NOT NULL,
	"type" "trigger_type" NOT NULL,
	"name" text NOT NULL,
	"status" "trigger_status" DEFAULT 'inactive' NOT NULL,
	"config" jsonb DEFAULT '{}' NOT NULL,
	"last_triggered" timestamp,
	"next_trigger" timestamp,
	"created" timestamp DEFAULT now() NOT NULL,
	"updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connections" ADD CONSTRAINT "connections_matrix_id_matrix_id_fk" FOREIGN KEY ("matrix_id") REFERENCES "matrix"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connections" ADD CONSTRAINT "connections_source_id_nodes_id_fk" FOREIGN KEY ("source_id") REFERENCES "nodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "connections" ADD CONSTRAINT "connections_target_id_nodes_id_fk" FOREIGN KEY ("target_id") REFERENCES "nodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matrix" ADD CONSTRAINT "matrix_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nodes" ADD CONSTRAINT "nodes_matrix_id_matrix_id_fk" FOREIGN KEY ("matrix_id") REFERENCES "matrix"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nodes" ADD CONSTRAINT "nodes_sub_matrix_id_matrix_id_fk" FOREIGN KEY ("sub_matrix_id") REFERENCES "matrix"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "triggers" ADD CONSTRAINT "triggers_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "nodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
