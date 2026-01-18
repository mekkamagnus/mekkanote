import fs from 'fs/promises';
import path from 'path';

export class OrgFileService {
  private readonly baseDir: string;

  constructor(baseDir: string = './notes-org') {
    this.baseDir = baseDir;
  }

  /**
   * Saves a note as an .org file
   */
  async saveNote(id: string, title: string, content: string): Promise<void> {
    try {
      // Create directory structure: YYYY/MM/DD
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
      const day = String(now.getDate()).padStart(2, '0');
      
      const dirPath = path.join(this.baseDir, year, month, day);
      await fs.mkdir(dirPath, { recursive: true });

      // Create filename: YYYYMMDD-HHMMSS-id.org
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const fileName = `${year}${month}${day}-${hours}${minutes}${seconds}-${id}.org`;
      const filePath = path.join(dirPath, fileName);

      // Create org-mode content
      const orgContent = `#+TITLE: ${title}
#+DATE: ${now.toISOString().split('T')[0]}
#+AUTHOR: 
#+DESCRIPTION: 

${content}
`;

      // Write the file
      await fs.writeFile(filePath, orgContent, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save note as org file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reads a note from an .org file
   */
  async readNote(id: string): Promise<{ title: string; content: string } | null> {
    try {
      // Find the file by searching through the directory structure
      // This is a simplified approach - in a real implementation, you'd need a more efficient lookup
      const files = await this.findAllFiles();
      const targetFile = files.find(file => file.includes(`${id}.org`));

      if (!targetFile) {
        return null;
      }

      const content = await fs.readFile(targetFile, 'utf-8');
      
      // Parse the org-mode content
      const lines = content.split('\n');
      let title = '';
      let orgContent = '';

      let inMetadata = true;
      for (const line of lines) {
        if (line.startsWith('#+TITLE:')) {
          title = line.replace('#+TITLE:', '').trim();
        } else if (line.startsWith('#+')) {
          // Skip other metadata lines
          continue;
        } else {
          // Everything else is content
          if (inMetadata) {
            orgContent = line;
            inMetadata = false;
          } else {
            orgContent += '\n' + line;
          }
        }
      }

      return {
        title,
        content: orgContent.trim()
      };
    } catch (error) {
      throw new Error(`Failed to read note from org file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper method to find all .org files
   */
  private async findAllFiles(): Promise<string[]> {
    const walk = async (dir: string): Promise<string[]> => {
      const dirents = await fs.readdir(dir, { withFileTypes: true });
      const files = await Promise.all(dirents.map((dirent) => {
        const res = path.resolve(dir, dirent.name);
        return dirent.isDirectory() ? walk(res) : res;
      }));
      return files.flat().filter(file => file.endsWith('.org'));
    };

    return await walk(this.baseDir);
  }

  /**
   * Deletes a note's .org file
   */
  async deleteNote(id: string): Promise<boolean> {
    try {
      // Find the file by searching through the directory structure
      const files = await this.findAllFiles();
      const targetFile = files.find(file => file.includes(`${id}.org`));

      if (!targetFile) {
        return false;
      }

      // Delete the file
      await fs.unlink(targetFile);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete note org file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}