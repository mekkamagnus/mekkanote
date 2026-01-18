CREATE TABLE `note_links` (
	`id` text PRIMARY KEY NOT NULL,
	`source_note_id` text NOT NULL,
	`target_note_id` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`source_note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
