CREATE TABLE `note_embeddings` (
	`id` text PRIMARY KEY NOT NULL,
	`note_id` text NOT NULL,
	`embedding` text NOT NULL,
	`model_name` text DEFAULT 'text-embedding-3-small' NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
