import { assertEquals, assertMatch, assertThrows } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { describe, it, beforeEach, afterEach } from "https://deno.land/std@0.192.0/testing/bdd.ts";
import { stub } from "https://deno.land/std@0.192.0/testing/mock.ts";

// Assuming FileSystemManager will be implemented in utils/file_system_manager.ts
import { FileSystemManager } from '../utils/file_system_manager.ts';
import { OrgDocument } from '../models/org_document.ts';
import { AppError } from '../models/app_error.ts';

describe('FileSystemManager', () => {
  let writeTextFileStub: any;
  let readTextFileStub: any;
  let statStub: any;
  let mkdirStub: any;

  beforeEach(() => {
    writeTextFileStub = stub(Deno, 'writeTextFile', () => Promise.resolve());
    readTextFileStub = stub(Deno, 'readTextFile', () => Promise.resolve(''));
    statStub = stub(Deno, 'stat', () => Promise.resolve({
      isFile: true,
      isDirectory: false,
      isSymlink: false,
      size: 100,
      mtime: new Date(),
      birthtime: new Date(),
      dev: 0,
      ino: 0,
      mode: 0,
      nlink: 0,
      uid: 0,
      gid: 0,
      rdev: 0,
      blksize: 0,
      blocks: 0,
      atime: new Date(),
      ctime: new Date(),
      isBlockDevice: false,
      isCharDevice: false,
      isFifo: false,
      isSocket: false,
    }));
    mkdirStub = stub(Deno, 'mkdir', () => Promise.resolve());
  });

  afterEach(() => {
    writeTextFileStub.restore();
    readTextFileStub.restore();
    statStub.restore();
    mkdirStub.restore();
  });

  it('should save an OrgDocument as an individual .org file with correct naming convention', async () => {
    const doc: OrgDocument = {
      uuid: 'test-uuid',
      title: 'My Test Note',
      content: 'Some content',
      ast: {}, // Mock AST
      metadata: { tags: [], properties: {}, headlines: [], links: [], attachments: [] },
      createdAt: new Date('2025-01-01T10:00:00Z'),
      updatedAt: new Date('2025-01-01T10:00:00Z'),
      filePath: '', // Will be set by the manager
    };

    const manager = new FileSystemManager();
    const result = await manager.writeOrgFile(doc)(); // Execute the TaskEither

    assertEquals(result._tag, 'Right');
    assertEquals(writeTextFileStub.calls.length, 1);

    const filePath = writeTextFileStub.calls[0].args[0];
    assertMatch(filePath, /\/\d{8}-\d{6}-test-uuid\.org$/); // YYYYMMDD-HHMMSS-uuid.org

    const fileContent = writeTextFileStub.calls[0].args[1];
    assertMatch(fileContent, /^#\+TITLE: My Test Note\n#\+UUID: test-uuid\n#\+CREATED: \[2025-01-01 Wed 10:00\]\n#\+UPDATED: \[2025-01-01 Wed 10:00\]\n\nSome content$/);
  });

  it('should use UTF-8 encoding for all files', async () => {
    const doc: OrgDocument = {
      uuid: 'test-uuid-utf8',
      title: 'UTF-8 Test Note',
      content: 'Some content with special characters: éàçü',
      ast: {},
      metadata: { tags: [], properties: {}, headlines: [], links: [], attachments: [] },
      createdAt: new Date(),
      updatedAt: new Date(),
      filePath: '',
    };

    const manager = new FileSystemManager();
    await manager.writeOrgFile(doc)();

    assertEquals(writeTextFileStub.calls.length, 1);
    const options = writeTextFileStub.calls[0].args[2]; // Assuming options is the third argument
    assertEquals(options && options.encoding, 'utf-8');
  });

  it('should return an AppError if file writing fails', async () => {
    writeTextFileStub.restore(); // Remove the successful stub
    writeTextFileStub = stub(Deno, 'writeTextFile', () => Promise.reject(new Error('Disk full')));

    const doc: OrgDocument = {
      uuid: 'fail-uuid',
      title: 'Fail Note',
      content: 'Content',
      ast: {},
      metadata: { tags: [], properties: {}, headlines: [], links: [], attachments: [] },
      createdAt: new Date(),
      updatedAt: new Date(),
      filePath: '',
    };

    const manager = new FileSystemManager();
    const result = await manager.writeOrgFile(doc)();

    assertEquals(result._tag, 'Left');
    if (result._tag === 'Left') {
      if (result.left.originalError) {
        assertEquals(result.left.originalError.message, 'Disk full');
      }
      assertEquals(result.left.code, 'FILE_WRITE_ERROR');
      assertEquals(result.left.message, 'Failed to write Org file');
    }
  });

  // Test for readOrgFile
  it('should read an existing .org file and parse its content', async () => {
    const fileContent = `#\+TITLE: Existing Note\n#\+UUID: existing-uuid\n#\+CREATED: \[2025-01-02 Thu 11:00\]\n#\+UPDATED: \[2025-01-02 Thu 11:00\]\n\nExisting content.`;
    readTextFileStub.restore();
    readTextFileStub = stub(Deno, 'readTextFile', () => Promise.resolve(fileContent));

    const manager = new FileSystemManager();
    const result = await manager.readOrgFile('existing-uuid')();

    assertEquals(result._tag, 'Right');
    assertEquals(readTextFileStub.calls.length, 1);
    assertMatch(readTextFileStub.calls[0].args[0], /\/\d{8}-\d{6}-existing-uuid\.org$/);

    if (result._tag === 'Right') {
      const doc = result.right;
      assertEquals(doc.title, 'Existing Note');
      assertEquals(doc.uuid, 'existing-uuid');
      assertEquals(doc.content, 'Existing content.');
      // More assertions for metadata, dates etc.
    }
  });

  it('should return an AppError if file reading fails', async () => {
    readTextFileStub.restore();
    readTextFileStub = stub(Deno, 'readTextFile', () => Promise.reject(new Error('File not found')));

    const manager = new FileSystemManager();
    const result = await manager.readOrgFile('non-existent-uuid')();

    assertEquals(result._tag, 'Left');
    if (result._tag === 'Left') {
      if (result.left.originalError) {
        assertEquals(result.left.originalError.message, 'File not found');
      }
      assertEquals(result.left.code, 'FILE_READ_ERROR');
      assertEquals(result.left.message, 'Failed to read Org file');
    }
  });

  // Test for createOrgFile
  it('should create a new org file with provided title and content', async () => {
    const manager = new FileSystemManager();
    const result = await manager.createOrgFile('New Note Title', 'Initial content')();

    assertEquals(result._tag, 'Right');
    assertEquals(writeTextFileStub.calls.length, 1);
    const filePath = writeTextFileStub.calls[0].args[0];
    assertMatch(filePath, /\/\d{8}-\d{6}-[a-f0-9-]+\.org$/); // UUID should be generated

    const fileContent = writeTextFileStub.calls[0].args[1];
    assertMatch(fileContent, /^#\+TITLE: New Note Title\n#\+UUID: [a-f0-9-]+\n#\+CREATED: \[.+\].+\n#\+UPDATED: \[.+\].+\n\nInitial content$/);
  });

  // Test for listOrgFiles
  it('should list all org files in the notes directory', async () => {
    const readdirStub = stub(Deno, 'readDir', () => {
      const entries = [
        { name: '20250101-100000-uuid1.org', isFile: true, isDirectory: false, isSymlink: false },
        { name: '20250102-110000-uuid2.org', isFile: true, isDirectory: false, isSymlink: false },
        { name: 'other-file.txt', isFile: true, isDirectory: false, isSymlink: false },
      ];
      return (async function* () {
        for (const entry of entries) {
          yield entry;
        }
      })();
    });

    const manager = new FileSystemManager();
    const result = await manager.listOrgFiles()();

    assertEquals(result._tag, 'Right');
    if (result._tag === 'Right') {
      assertEquals(result.right.length, 2);
      assertEquals(result.right[0].uuid, 'uuid1');
      assertEquals(result.right[1].uuid, 'uuid2');
    }

    readdirStub.restore();
  });

  it('should return an AppError if listing org files fails', async () => {
    const readdirStub = stub(Deno, 'readDir', () => { throw new Error('Permission denied'); });

    const manager = new FileSystemManager();
    const result = await manager.listOrgFiles()();

    assertEquals(result._tag, 'Left');
    if (result._tag === 'Left') {
      if (result.left.originalError) {
        assertEquals(result.left.originalError.message, 'Permission denied');
      }
      assertEquals(result.left.code, 'FILE_LIST_ERROR');
      assertEquals(result.left.message, 'Failed to list Org files');
    }

    readdirStub.restore();
  });
});