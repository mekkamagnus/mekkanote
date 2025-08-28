// src/server.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/deno';
import { FileSystemManager } from '../utils/file_system_manager.ts';
import { NoteValidation } from './validation/note_validation.ts';
import { isLeft, isRight } from '../utils/either.ts';

const fileSystemManager = new FileSystemManager("./notes");

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Notes API
app.get('/api/notes', async (c) => {
  try {
    // TODO: Implement list notes functionality
    return c.json({ notes: [], count: 0 });
  } catch (error) {
    console.error('Error listing notes:', error);
    return c.json({ error: 'Failed to list notes' }, 500);
  }
});

app.post('/api/notes', async (c) => {
  try {
    const { title = 'Untitled', content = '' } = await c.req.json();
    
    // Validate content
    const validation = NoteValidation.validateNoteContent(content);
    if (validation.isFailure()) {
      return c.json({ 
        error: 'Invalid note content', 
        details: validation.getErrors() 
      }, 400);
    }
    
    try {
      // Create note using FileSystemManager
      const taskEither = fileSystemManager.createOrgFile(title, content);
      const result = await taskEither();
      
      if (isLeft(result)) {
        return c.json({ error: result.left.message }, 500);
      }
      
      return c.json({ noteId: result.right }, 201);
    } catch (innerError) {
      console.error('Inner error:', innerError);
      throw innerError;
    }
  } catch (error) {
    console.error('Error creating note:', error);
    return c.json({ error: 'Failed to create note' }, 500);
  }
});

app.get('/api/notes/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await fileSystemManager.readOrgFile(id)();
    
    if (isLeft(result)) {
      return c.json({ error: result.left.message }, 404);
    }
    
    return c.json({ note: result.right });
  } catch (error) {
    console.error('Error getting note:', error);
    return c.json({ error: 'Failed to get note' }, 500);
  }
});

app.put('/api/notes/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { content, title } = await c.req.json();
    
    // Validate content
    const validation = NoteValidation.validateNoteContent(content);
    if (validation.isFailure()) {
      return c.json({ 
        error: 'Invalid note content', 
        details: validation.getErrors() 
      }, 400);
    }
    
    // Read existing note, update it, then write back
    const readResult = await fileSystemManager.readOrgFile(id)();
    if (isLeft(readResult)) {
      return c.json({ error: 'Note not found' }, 404);
    }
    
    const existingNote = readResult.right;
    const updatedNote = {
      ...existingNote,
      title: title || existingNote.title,
      content,
      updatedAt: new Date()
    };
    
    const writeResult = await fileSystemManager.writeOrgFile(updatedNote)();
    if (isLeft(writeResult)) {
      return c.json({ error: writeResult.left.message }, 500);
    }
    
    return c.json({ note: updatedNote });
  } catch (error) {
    console.error('Error updating note:', error);
    return c.json({ error: 'Failed to update note' }, 500);
  }
});

// UI Endpoints for HTMX
app.get('/api/ui/notes/list', async (c) => {
  try {
    // Load notes using FileSystemManager
    let notes = [];
    
    try {
      const orgFilesResult = await fileSystemManager.listOrgFiles()();
      
      if (isRight(orgFilesResult)) {
        const orgFiles = orgFilesResult.right;
        
        for (const orgFile of orgFiles) {
          try {
            const noteResult = await fileSystemManager.readOrgFile(orgFile.uuid)();
            if (isRight(noteResult)) {
              const note = noteResult.right;
              notes.push({
                id: note.uuid,
                title: note.title || 'Untitled',
                content: note.content,
                preview: note.content.slice(0, 200) + (note.content.length > 200 ? '...' : ''),
                lastModified: note.updatedAt.toISOString(),
                tags: note.metadata?.tags || [],
                isPinned: false
              });
            }
          } catch (error) {
            console.warn(`Error reading note ${orgFile.uuid}:`, error);
          }
        }
        
        // Sort notes by lastModified date (newest first)
        notes.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
      }
    } catch (error) {
      console.log('Error loading notes:', error);
      notes = [];
    }

    const formatTime = (dateStr) => {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const html = `
      <div style="background-color: var(--bg-primary); min-height: 100vh; display: flex; flex-direction: column;">
        <!-- Apple Notes Folder Title -->
        <div style="padding: 16px 16px 12px 16px; background-color: var(--bg-primary);">
          <h1 style="font-size: 2.125rem; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; color: var(--text-primary); margin: 0;">All iCloud</h1>
        </div>
        
        ${notes.length === 0 ? `
          <!-- Empty state -->
          <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 64px 32px;">
            <div style="text-align: center;">
              <div style="width: 64px; height: 64px; margin: 0 auto 16px; color: var(--text-tertiary); opacity: 0.5;">
                <svg fill="currentColor" viewBox="0 0 20 20" style="width: 100%; height: 100%;">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
              </div>
              <h3 style="font-size: 1.75rem; font-weight: 600; line-height: 1.25; margin-bottom: 8px; color: var(--text-primary);">No notes in this folder</h3>
              <p style="font-size: 0.9375rem; color: var(--text-secondary); margin-bottom: 16px; text-align: center;">Tap the ✏️ button to create<br />your first note</p>
            </div>
          </div>
        ` : `
          <!-- Pinned Section -->
          ${notes.filter(note => note.isPinned).length > 0 ? `
            <div style="padding: 0 16px 8px 16px;">
              <div style="font-size: 1.125rem; font-weight: 600; line-height: 1.25; margin-bottom: 12px; color: var(--text-primary); display: flex; align-items: center; justify-content: space-between;">
                Pinned
                <svg style="width: 16px; height: 16px; color: var(--text-tertiary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              ${notes.filter(note => note.isPinned).map((note) => `
                <div style="background-color: var(--bg-grouped); border-bottom: 0.5pt solid var(--border-secondary); padding: 16px 16px; margin-bottom: 2px; cursor: pointer; transition: background-color 0.15s ease-out;"
                     onmouseover="this.style.backgroundColor='var(--bg-secondary)'"
                     onmouseout="this.style.backgroundColor='var(--bg-grouped)'"
                     onclick="window.location.href='/api/ui/notes/${note.id}/edit'"
                     hx-get="/api/ui/notes/${note.id}/edit"
                     hx-target="#main-content"
                     hx-trigger="click">
                  
                  <div style="min-width: 0;">
                    <!-- Title and timestamp line -->
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 4px;">
                      <h3 style="font-size: 1.0625rem; font-weight: 600; line-height: 1.35; color: var(--text-primary); margin: 0; margin-right: 8px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ⭐ ${note.title}
                      </h3>
                      <time style="font-size: 0.8125rem; color: var(--text-tertiary); flex-shrink: 0;">
                        ${formatTime(note.lastModified)}
                      </time>
                    </div>
                    
                    <!-- Preview line -->
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px;">
                      <p style="font-size: 0.9375rem; color: var(--text-secondary); line-height: 1.4; margin: 0; margin-right: 8px; flex: 1; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                        ${note.preview}
                      </p>
                    </div>

                    <!-- Tags and folder line -->
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                      <div style="flex: 1;">
                        ${note.tags.length > 0 ? `
                          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                            ${note.tags.slice(0, 3).map(tag => `
                              <span style="background-color: var(--kelly-green); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">
                                #${tag}
                              </span>
                            `).join('')}
                            ${note.tags.length > 3 ? `<span style="font-size: 0.8125rem; color: var(--text-tertiary);">+${note.tags.length - 3}</span>` : ''}
                          </div>
                        ` : ''}
                      </div>
                      <div style="font-size: 0.8125rem; color: var(--text-tertiary); margin-left: 8px;">
                        📁 All iCloud
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <!-- Today Section -->
          <div style="padding: 0 16px 8px 16px;">
            <div style="font-size: 1.125rem; font-weight: 600; line-height: 1.25; margin-bottom: 12px; color: var(--text-primary);">Today</div>
            
            ${notes.filter(note => !note.isPinned).map((note) => `
              <div style="background-color: var(--bg-grouped); border-bottom: 0.5pt solid var(--border-secondary); padding: 16px 16px; margin-bottom: 2px; cursor: pointer; transition: background-color 0.15s ease-out;"
                   onmouseover="this.style.backgroundColor='var(--bg-secondary)'"
                   onmouseout="this.style.backgroundColor='var(--bg-grouped)'"
                   onclick="window.location.href='/api/ui/notes/${note.id}/edit'"
                   hx-get="/api/ui/notes/${note.id}/edit"
                   hx-target="#main-content"
                   hx-trigger="click">
                
                <div style="min-width: 0;">
                  <!-- Title and timestamp line -->
                  <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 4px;">
                    <h3 style="font-size: 1.0625rem; font-weight: 600; line-height: 1.35; color: var(--text-primary); margin: 0; margin-right: 8px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      ${note.title}
                    </h3>
                    <time style="font-size: 0.8125rem; color: var(--text-tertiary); flex-shrink: 0;">
                      ${formatTime(note.lastModified)}
                    </time>
                  </div>
                  
                  <!-- Preview line -->
                  <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px;">
                    <p style="font-size: 0.9375rem; color: var(--text-secondary); line-height: 1.4; margin: 0; margin-right: 8px; flex: 1; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                      ${note.preview}
                    </p>
                  </div>

                  <!-- Tags and folder line -->
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="flex: 1;">
                      ${note.tags.length > 0 ? `
                        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                          ${note.tags.slice(0, 3).map(tag => `
                            <span style="background-color: var(--kelly-green); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">
                              #${tag}
                            </span>
                          `).join('')}
                          ${note.tags.length > 3 ? `<span style="font-size: 0.8125rem; color: var(--text-tertiary);">+${note.tags.length - 3}</span>` : ''}
                        </div>
                      ` : ''}
                    </div>
                    <div style="font-size: 0.8125rem; color: var(--text-tertiary); margin-left: 8px;">
                      📁 All iCloud
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
        
        <!-- Footer with note count - Apple Notes style -->
        <div style="padding: 16px; border-top: 0.5pt solid var(--border-secondary); background-color: var(--bg-primary); display: flex; align-items: center; justify-content: space-between; margin-top: auto;">
          <span style="font-size: 0.8125rem; color: var(--text-tertiary);">${notes.length} Notes</span>
          <button class="touch-target" style="color: var(--kelly-green); background: transparent; border: none; border-radius: 8px; min-height: 44pt; min-width: 44pt; cursor: pointer;" 
                  aria-label="Create new note"
                  hx-post="/api/ui/notes/create"
                  hx-target="#main-content">
            <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    `;
    
    return c.html(html);
  } catch (error) {
    console.error('Error loading notes list UI:', error);
    return c.html(`
      <div class="error-container">
        <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h3 class="error-title">Something went wrong</h3>
        <p class="error-message">Failed to load notes. Please try again.</p>
        <button class="btn btn-primary" hx-get="/api/ui/notes/list" hx-target="#main-content">Retry</button>
      </div>
    `);
  }
});

app.post('/api/ui/notes/create', async (c) => {
  const newNoteId = Date.now().toString();
  const html = `
    <div class="editor-container">
      <div class="editor-toolbar">
        <button class="btn btn-ghost btn-sm"
                hx-get="/api/ui/notes/list"
                hx-target="#main-content"
                hx-trigger="click">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back
        </button>
        
        <div class="autosave-indicator" id="autosave-status">
          <span>New note</span>
        </div>
        
        <button class="btn btn-primary btn-sm"
                hx-post="/api/notes"
                hx-vals='{"content": ""}'
                hx-target="#toast-container"
                hx-trigger="click">
          Save
        </button>
      </div>
      
      <div class="editor-content">
        <textarea 
          class="editor-textarea" 
          placeholder="Start typing your note..."
          hx-post="/api/ui/notes/${newNoteId}/autosave"
          hx-trigger="keyup changed delay:2s"
          hx-target="#autosave-status"
          hx-vals='{"id": "${newNoteId}"}'
        ></textarea>
      </div>
    </div>
  `;
  
  return c.html(html);
});

// Org-mode parsing function
const parseOrgContent = (content) => {
  const lines = content.split('\n');
  let html = '';
  
  for (const line of lines) {
    if (line.match(/^(\*+)\s+(.+)$/)) {
      // Headlines
      const match = line.match(/^(\*+)\s+(.+)$/);
      const level = Math.min(match[1].length, 6);
      html += `<h${level} class="org-headline-${level}">${match[2]}</h${level}>`;
    } else if (line.match(/^(\s*)[-*+]\s+\[([ xX-])\]\s+(.+)$/)) {
      // Checkboxes
      const match = line.match(/^(\s*)[-*+]\s+\[([ xX-])\]\s+(.+)$/);
      const checked = match[2].toLowerCase() === 'x';
      const partial = match[2] === '-';
      const stateClass = checked ? 'checked' : partial ? 'partial' : '';
      html += `<div class="org-checkbox ${stateClass}" style="margin-left: ${match[1].length * 0.5}rem">
        <input type="checkbox" ${checked ? 'checked' : ''} ${partial ? 'indeterminate' : ''} disabled>
        <span class="ml-2">${match[3]}</span>
      </div>`;
    } else if (line.match(/^(\s*)[-*+]\s+(.+)$/)) {
      // List items
      const match = line.match(/^(\s*)[-*+]\s+(.+)$/);
      html += `<div class="org-list-item" style="margin-left: ${match[1].length * 0.5}rem">
        <span class="inline-block w-2 h-2 bg-kelly-green rounded-full mr-2"></span>${match[2]}
      </div>`;
    } else if (line.match(/^\s*\*(.+)\*/)) {
      // Bold text
      html += `<p class="mb-2">${line.replace(/\*([^*]+)\*/g, '<strong class="org-bold">$1</strong>')}</p>`;
    } else if (line.match(/^\s*\/(.+)\//)) {
      // Italic text
      html += `<p class="mb-2">${line.replace(/\/([^/]+)\//g, '<em class="org-italic">$1</em>')}</p>`;
    } else if (line.match(/^\s*~(.+)~/) || line.match(/^\s*=(.+)=/)) {
      // Code
      html += `<p class="mb-2">${line.replace(/[~=]([^~=]+)[~=]/g, '<code class="org-inline-code">$1</code>')}</p>`;
    } else if (line.trim() === '') {
      // Empty line
      html += '<br>';
    } else {
      // Regular paragraph
      html += `<p class="mb-2 leading-relaxed">${line}</p>`;
    }
  }
  
  return html;
};

app.get('/api/ui/notes/:id/edit', async (c) => {
  const id = c.req.param('id');
  // Mock note data with org-mode content
  const mockNote = {
    id,
    title: id === '1' ? 'Welcome to MekkaNote' : 'Grocery List',
    content: id === '1' 
      ? '* Welcome to MekkaNote\n\nThis is your first note. You can create, edit, and organize your notes here.\n\n** Features\n- [x] Org-mode syntax support\n- [x] Auto-save functionality\n- [x] Mobile-first design\n- [ ] Real-time sync\n\n*** Getting Started\nStart typing in *org-mode* format! You can use:\n- /italic text/\n- *bold text*\n- ~code snippets~\n- TODO items with checkboxes\n\n*Happy note-taking!*'
      : '* Grocery List\n\n** Today\'s Shopping\n- [ ] Fresh produce\n  - [ ] Apples (Gala or Fuji)\n  - [ ] Bananas (ripe for smoothies)\n  - [ ] Spinach (organic)\n- [ ] Dairy & Proteins\n  - [ ] Milk (oat milk preferred)\n  - [ ] Greek yogurt\n  - [ ] Free-range eggs\n- [ ] Pantry staples\n  - [ ] Whole grain bread\n  - [ ] Quinoa\n  - [ ] Olive oil\n\n** Notes\n- Check for *weekly specials*\n- Use /reusable bags/\n- Budget: ~$75-100~\n\n*Updated: ' + new Date().toDateString() + '*'
  };

  const html = `
    <div class="editor-container">
      <div class="editor-toolbar">
        <button class="btn btn-ghost btn-sm"
                hx-get="/api/ui/notes/list"
                hx-target="#main-content"
                hx-trigger="click">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back
        </button>
        
        <div class="flex items-center gap-2">
          <button id="edit-tab" class="btn btn-ghost btn-sm active" 
                  onclick="switchTab('edit')">Edit</button>
          <button id="preview-tab" class="btn btn-ghost btn-sm" 
                  onclick="switchTab('preview')">Preview</button>
        </div>
        
        <div class="autosave-indicator" id="autosave-status">
          <span>Saved</span>
        </div>
        
        <button class="btn btn-primary btn-sm"
                hx-put="/api/notes/${id}"
                hx-include="[name='content']"
                hx-target="#toast-container"
                hx-trigger="click">
          Save
        </button>
      </div>
      
      <div class="editor-content">
        <div id="edit-mode" class="h-full">
          <textarea 
            name="content"
            id="note-content"
            class="editor-textarea"
            hx-post="/api/ui/notes/${id}/autosave"
            hx-trigger="keyup changed delay:2s"
            hx-target="#autosave-status"
            oninput="updatePreview()"
            placeholder="Start typing in org-mode format..."
          >${mockNote.content}</textarea>
        </div>
        
        <div id="preview-mode" class="h-full p-4 overflow-y-auto hidden">
          <div id="preview-content" class="org-content prose max-w-none">
            ${parseOrgContent(mockNote.content)}
          </div>
        </div>
      </div>
    </div>
    
    <script>
      function switchTab(tab) {
        const editTab = document.getElementById('edit-tab');
        const previewTab = document.getElementById('preview-tab');
        const editMode = document.getElementById('edit-mode');
        const previewMode = document.getElementById('preview-mode');
        
        if (tab === 'edit') {
          editTab.classList.add('active');
          previewTab.classList.remove('active');
          editMode.classList.remove('hidden');
          previewMode.classList.add('hidden');
        } else {
          previewTab.classList.add('active');
          editTab.classList.remove('active');
          previewMode.classList.remove('hidden');
          editMode.classList.add('hidden');
          updatePreview();
        }
      }
      
      function updatePreview() {
        const content = document.getElementById('note-content').value;
        const previewContent = document.getElementById('preview-content');
        
        // Simple client-side org-mode parsing for real-time preview
        let html = '';
        const lines = content.split('\\n');
        
        for (const line of lines) {
          if (line.match(/^(\\*+)\\s+(.+)$/)) {
            const match = line.match(/^(\\*+)\\s+(.+)$/);
            const level = Math.min(match[1].length, 6);
            html += \`<h\${level} class="org-headline-\${level}">\${match[2]}</h\${level}>\`;
          } else if (line.match(/^(\\s*)[-*+]\\s+\\[([ xX-])\\]\\s+(.+)$/)) {
            const match = line.match(/^(\\s*)[-*+]\\s+\\[([ xX-])\\]\\s+(.+)$/);
            const checked = match[2].toLowerCase() === 'x';
            const partial = match[2] === '-';
            const stateClass = checked ? 'checked' : partial ? 'partial' : '';
            html += \`<div class="org-checkbox \${stateClass}" style="margin-left: \${match[1].length * 0.5}rem">
              <input type="checkbox" \${checked ? 'checked' : ''} \${partial ? 'indeterminate' : ''} disabled>
              <span class="ml-2">\${match[3]}</span>
            </div>\`;
          } else if (line.match(/^(\\s*)[-*+]\\s+(.+)$/)) {
            const match = line.match(/^(\\s*)[-*+]\\s+(.+)$/);
            html += \`<div class="org-list-item" style="margin-left: \${match[1].length * 0.5}rem">
              <span class="inline-block w-2 h-2 bg-kelly-green rounded-full mr-2"></span>\${match[2]}
            </div>\`;
          } else if (line.trim() === '') {
            html += '<br>';
          } else {
            // Process inline formatting
            let processedLine = line;
            processedLine = processedLine.replace(/\\*([^*]+)\\*/g, '<strong class="org-bold">$1</strong>');
            processedLine = processedLine.replace(/\\/([^/]+)\\//g, '<em class="org-italic">$1</em>');
            processedLine = processedLine.replace(/[~=]([^~=]+)[~=]/g, '<code class="org-inline-code">$1</code>');
            html += \`<p class="mb-2 leading-relaxed">\${processedLine}</p>\`;
          }
        }
        
        previewContent.innerHTML = html;
      }
      
      // Initialize preview
      updatePreview();
    </script>
  `;
  
  return c.html(html);
});

app.post('/api/ui/notes/:id/autosave', async (c) => {
  // Mock autosave response
  return c.html(`<span class="saving">Saving...</span>`);
});

app.get('/api/ui/drawer', async (c) => {
  const html = `
    <div class="drawer-overlay" hx-get="/api/ui/drawer/close" hx-target="#drawer-container" hx-trigger="click"></div>
    <div class="drawer-content">
      <div class="drawer-header">
        <h2 class="text-lg font-semibold text-black-olive">MekkaNote</h2>
        <button class="btn btn-ghost btn-sm absolute top-4 right-4"
                hx-get="/api/ui/drawer/close"
                hx-target="#drawer-container"
                hx-trigger="click">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <nav class="drawer-nav">
        <div class="drawer-nav-item active"
             hx-get="/api/ui/notes/list"
             hx-target="#main-content"
             hx-trigger="click">
          <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          All Notes
        </div>
        
        <div class="drawer-nav-item"
             hx-get="/api/ui/folders"
             hx-target="#main-content"
             hx-trigger="click">
          <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
          </svg>
          Folders
        </div>
        
        <div class="drawer-nav-item"
             hx-get="/api/ui/search"
             hx-target="#main-content"
             hx-trigger="click">
          <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          Search
        </div>
        
        <div class="drawer-nav-item"
             hx-get="/api/ui/settings"
             hx-target="#main-content"
             hx-trigger="click">
          <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          Settings
        </div>
      </nav>
    </div>
  `;
  
  return c.html(html);
});

app.get('/api/ui/drawer/close', async (c) => {
  return c.html('');
});

app.get('/api/ui/search', async (c) => {
  const html = `
    <div class="p-4">
      <h2 class="text-xl font-semibold text-black-olive mb-4">Search Notes</h2>
      
      <input type="text" 
             class="search-input"
             placeholder="Search in all notes..."
             hx-post="/api/ui/search/results"
             hx-trigger="keyup changed delay:500ms"
             hx-target="#search-results"
             name="query">
      
      <div id="search-results" class="search-results">
        <div class="empty-state">
          <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <h3 class="empty-title">Start typing to search</h3>
          <p class="empty-message">Search through all your notes</p>
        </div>
      </div>
    </div>
  `;
  
  return c.html(html);
});

app.get('/api/ui/folders', async (c) => {
  const mockFolders = [
    { id: 'all', name: 'All Notes', count: 2, icon: 'folder' },
    { id: 'personal', name: 'Personal', count: 1, icon: 'folder' },
    { id: 'work', name: 'Work', count: 1, icon: 'folder' }
  ];

  const html = `
    <div style="background-color: var(--bg-primary); min-height: 100vh;">
      <!-- Folder List Header -->
      <div style="padding: 16px; border-bottom: 0.5pt solid var(--border-secondary);">
        <h1 class="nav-header">Folders</h1>
      </div>
      
      <!-- Quick Actions Section -->
      <div style="padding: 16px; padding-bottom: 12px;">
        <div style="margin-bottom: 8px;">
          <div class="folder-item cursor-pointer touch-feedback" 
               style="background-color: var(--bg-grouped); border-radius: 8px; margin-bottom: 8px; padding: 12px 16px; display: flex; align-items: center;"
               hx-get="/api/ui/notes/list"
               hx-target="#main-content"
               hx-trigger="click">
            <div class="folder-item-icon" style="margin-right: 12px; width: 22pt; height: 22pt; color: var(--kelly-green);">
              <svg viewBox="0 0 20 20" fill="currentColor" style="width: 100%; height: 100%;">
                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
              </svg>
            </div>
            <span class="folder-name" style="flex: 1; text-align: left;">Quick Notes</span>
            <span class="folder-count" style="margin-right: 8pt;">1</span>
            <svg style="width: 20px; height: 20px; color: var(--text-tertiary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          
          <div class="folder-item cursor-pointer touch-feedback" 
               style="background-color: var(--bg-grouped); border-radius: 8px; margin-bottom: 8px; padding: 12px 16px; display: flex; align-items: center;"
               hx-get="/api/ui/notes/list"
               hx-target="#main-content"
               hx-trigger="click">
            <div class="folder-item-icon" style="margin-right: 12px; width: 22pt; height: 22pt; color: var(--kelly-green);">
              <svg viewBox="0 0 20 20" fill="currentColor" style="width: 100%; height: 100%;">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
            <span class="folder-name" style="flex: 1; text-align: left;">Shared</span>
            <span class="folder-count" style="margin-right: 8pt;">80</span>
            <svg style="width: 20px; height: 20px; color: var(--text-tertiary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
      
      <!-- iCloud Section -->
      <div style="padding: 0 16px 16px 16px;">
        <div class="section-header" style="font-size: 1.125rem; color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
          iCloud
          <svg style="width: 16px; height: 16px; color: var(--text-tertiary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        <div style="space-y: 8px;">
          ${mockFolders.map(folder => `
            <div class="folder-item cursor-pointer touch-feedback" 
                 style="background-color: var(--bg-grouped); border-radius: 8px; margin-bottom: 8px; padding: 12px 16px; display: flex; align-items: center;"
                 hx-get="/api/ui/notes/list"
                 hx-target="#main-content"
                 hx-trigger="click">
              <div class="folder-item-icon ${folder.id === 'personal' ? 'user-folder' : ''}" style="margin-right: 12px; width: 22pt; height: 22pt; color: ${folder.id === 'personal' ? 'var(--lion)' : 'var(--kelly-green)'};">
                <svg viewBox="0 0 20 20" fill="currentColor" style="width: 100%; height: 100%;">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
              </div>
              <span class="folder-name" style="flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${folder.name}</span>
              <span class="folder-count" style="margin-right: 8pt;">${folder.count}</span>
              <svg style="width: 16px; height: 16px; color: var(--text-tertiary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  
  return c.html(html);
});

app.get('/api/ui/settings', async (c) => {
  const html = `
    <div class="p-4">
      <h2 class="text-xl font-semibold text-black-olive mb-6">Settings</h2>
      
      <div class="settings-section">
        <h3 class="settings-title">Appearance</h3>
        <div class="settings-item">
          <span>Dark Mode</span>
          <input type="checkbox" class="toggle toggle-primary" />
        </div>
        <div class="settings-item">
          <span>Font Size</span>
          <select class="select select-sm">
            <option>Small</option>
            <option selected>Medium</option>
            <option>Large</option>
          </select>
        </div>
      </div>
      
      <div class="settings-section">
        <h3 class="settings-title">Sync</h3>
        <div class="settings-item">
          <span>Auto-save</span>
          <input type="checkbox" class="toggle toggle-primary" checked />
        </div>
        <div class="settings-item">
          <span>Backup to Cloud</span>
          <input type="checkbox" class="toggle toggle-primary" />
        </div>
      </div>
      
      <div class="settings-section">
        <h3 class="settings-title">About</h3>
        <div class="settings-item">
          <span>Version</span>
          <span class="text-ash-gray">1.0.0</span>
        </div>
      </div>
    </div>
  `;
  
  return c.html(html);
});

// Serve static files for frontend
app.get('/', serveStatic({ path: './public/index.html' }));
app.get('*', serveStatic({ root: './public' }));

// Error handling
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

app.notFound((c) => {
  return c.json({ error: 'Route not found' }, 404);
});

console.log('MekkaNote server starting on http://localhost:8000');

// Export for Deno Deploy or other runtimes
export default app;