CREATE TABLE `analyst_snapshots` (
	`key` text PRIMARY KEY NOT NULL,
	`parent` text,
	`request_id` text,
	`action_hash` text,
	`body` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `snapshot_request` ON `analyst_snapshots` (`parent`,`request_id`);