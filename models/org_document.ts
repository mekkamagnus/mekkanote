export interface OrgDocument {
  uuid: string;
  title: string;
  content: string;
  ast: any; // Abstract Syntax Tree representation
  metadata: DocumentMetadata;
  createdAt: Date;
  updatedAt: Date;
  filePath: string;
}

export interface DocumentMetadata {
  tags: string[];
  properties: Record<string, string>;
  headlines: any[]; // Simplified for now
  links: any[]; // Simplified for now
  attachments: any[]; // Simplified for now
}
