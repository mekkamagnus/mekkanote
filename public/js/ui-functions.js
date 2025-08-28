// UI Functions - Pure CSS Apple Notes Implementation
// Replacing HTMX with simple fetch-based functions

// Simple loading management
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'flex';
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
}

// Load notes function
async function loadNotes() {
    showLoading();
    try {
        const response = await fetch('/api/ui/notes/list');
        const html = await response.text();
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = html;
        }
        updateActiveTab('notes');
    } catch (error) {
        console.error('Failed to load notes:', error);
    }
    hideLoading();
}

// Load search function
async function loadSearch() {
    showLoading();
    try {
        const response = await fetch('/api/ui/search');
        const html = await response.text();
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = html;
        }
        updateActiveTab('search');
    } catch (error) {
        console.error('Failed to load search:', error);
    }
    hideLoading();
}

// Load folders function  
async function loadFolders() {
    showLoading();
    try {
        const response = await fetch('/api/ui/folders');
        const html = await response.text();
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = html;
        }
        updateActiveTab('folders');
    } catch (error) {
        console.error('Failed to load folders:', error);
    }
    hideLoading();
}

// Load settings function
async function loadSettings() {
    showLoading();
    try {
        const response = await fetch('/api/ui/settings');
        const html = await response.text();
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = html;
        }
        updateActiveTab('settings');
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
    hideLoading();
}

// Update active tab styling
function updateActiveTab(activeTab) {
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTabElement = document.querySelector(`.tab-button[data-tab="${activeTab}"]`);
    if (activeTabElement) {
        activeTabElement.classList.add('active');
    }
}

// Initialize app on load
document.addEventListener('DOMContentLoaded', function() {
    // Load notes by default
    loadNotes();
    
    // Ensure Notes tab is properly activated on load
    updateActiveTab('notes');
});

// UI Functions - Functional Programming Patterns
// Following functional patterns from docs/functional-patterns-guidelines.md

// Pure functional utilities
const pipe = (...fns) => (value) => fns.reduce((acc, fn) => fn(acc), value);

const curry = (fn) => (...args) => 
    args.length >= fn.length 
        ? fn(...args) 
        : (...nextArgs) => curry(fn)(...args, ...nextArgs);

// Either type for error handling
const Either = {
    Left: (value) => ({
        isLeft: () => true,
        isRight: () => false,
        fold: (f, g) => f(value),
        map: () => Either.Left(value),
        flatMap: () => Either.Left(value),
        value
    }),
    
    Right: (value) => ({
        isLeft: () => false,
        isRight: () => true,
        fold: (f, g) => g(value),
        map: (f) => Either.Right(f(value)),
        flatMap: (f) => f(value),
        value
    }),
    
    fromNullable: (value) => 
        value == null ? Either.Left(null) : Either.Right(value),
    
    tryCatch: (fn) => {
        try {
            return Either.Right(fn());
        } catch (error) {
            return Either.Left(error);
        }
    }
};

// Option type for null safety
const Option = {
    None: () => ({
        isSome: () => false,
        isNone: () => true,
        fold: (defaultValue, f) => defaultValue,
        map: () => Option.None(),
        flatMap: () => Option.None(),
        filter: () => Option.None(),
        getOrElse: (defaultValue) => defaultValue
    }),
    
    Some: (value) => ({
        isSome: () => true,
        isNone: () => false,
        fold: (defaultValue, f) => f(value),
        map: (f) => Option.Some(f(value)),
        flatMap: (f) => f(value),
        filter: (predicate) => predicate(value) ? Option.Some(value) : Option.None(),
        getOrElse: () => value,
        value
    }),
    
    fromNullable: (value) => 
        value == null ? Option.None() : Option.Some(value)
};

// Validation applicative for error accumulation
const Validation = {
    Success: (value) => ({
        isSuccess: () => true,
        isFailure: () => false,
        fold: (f, g) => g(value),
        map: (f) => Validation.Success(f(value)),
        ap: (validationF) => 
            validationF.isSuccess() 
                ? Validation.Success(validationF.value(value))
                : validationF,
        getErrors: () => [],
        getValue: () => value,
        value
    }),
    
    Failure: (errors) => ({
        isSuccess: () => false,
        isFailure: () => true,
        fold: (f, g) => f(errors),
        map: () => Validation.Failure(errors),
        ap: (validationF) => 
            validationF.isFailure() 
                ? Validation.Failure([...errors, ...validationF.getErrors()])
                : Validation.Failure(errors),
        getErrors: () => errors,
        getValue: () => { throw new Error('Cannot get value from Failure'); },
        errors
    })
};

// DOM utilities using functional patterns
const DOM = {
    // Safe element selection
    selectElement: curry((selector, parent = document) => 
        Option.fromNullable(parent.querySelector(selector))
    ),
    
    selectElements: curry((selector, parent = document) => 
        Array.from(parent.querySelectorAll(selector))
    ),
    
    // Functional event handling
    addEventListener: curry((event, handler, element) => {
        element.addEventListener(event, handler);
        return () => element.removeEventListener(event, handler);
    }),
    
    // Safe attribute operations
    getAttribute: curry((attr, element) => 
        Option.fromNullable(element.getAttribute(attr))
    ),
    
    setAttribute: curry((attr, value, element) => {
        element.setAttribute(attr, value);
        return element;
    }),
    
    // Safe property access
    getProperty: curry((prop, element) => 
        Option.fromNullable(element[prop])
    ),
    
    setProperty: curry((prop, value, element) => {
        element[prop] = value;
        return element;
    }),
    
    // Class manipulation
    addClass: curry((className, element) => {
        element.classList.add(className);
        return element;
    }),
    
    removeClass: curry((className, element) => {
        element.classList.remove(className);
        return element;
    }),
    
    toggleClass: curry((className, element) => {
        element.classList.toggle(className);
        return element;
    })
};

// HTMX functional utilities
const HTMX = {
    // Safe HTMX operations
    trigger: curry((selector, event) => 
        DOM.selectElement(selector)
            .map(element => {
                htmx.trigger(element, event);
                return element;
            })
    ),
    
    // Functional HTMX configuration
    configRequest: (config) => (evt) => {
        Object.keys(config).forEach(key => {
            evt.detail.headers[key] = config[key];
        });
    },
    
    // Safe content swapping
    swapContent: curry((target, content) => 
        DOM.selectElement(target)
            .map(element => {
                element.innerHTML = content;
                htmx.process(element);
                return element;
            })
    ),
    
    // Form validation with Validation applicative
    validateForm: (formElement) => {
        const formData = new FormData(formElement);
        const data = Object.fromEntries(formData);
        
        // Example validation composition
        const validateTitle = (title) => 
            title && title.trim().length > 0 
                ? Validation.Success(title.trim())
                : Validation.Failure(['Title is required']);
                
        const validateContent = (content) => 
            content && content.trim().length > 0 
                ? Validation.Success(content.trim())
                : Validation.Failure(['Content is required']);
        
        // Apply validations using applicative functor
        return Validation.Success((title) => (content) => ({ title, content }))
            .ap(validateTitle(data.title || ''))
            .ap(validateContent(data.content || ''));
    }
};

// UI State management with functional patterns
const UIState = {
    // Immutable state updates using lenses
    createState: (initialState) => {
        let currentState = initialState;
        const subscribers = [];
        
        return {
            get: () => currentState,
            
            // Lens-based updates
            update: (lens, newValue) => {
                currentState = lens.set(newValue)(currentState);
                subscribers.forEach(fn => fn(currentState));
                return currentState;
            },
            
            // Functional updates
            modify: (updateFn) => {
                currentState = updateFn(currentState);
                subscribers.forEach(fn => fn(currentState));
                return currentState;
            },
            
            subscribe: (fn) => {
                subscribers.push(fn);
                return () => {
                    const index = subscribers.indexOf(fn);
                    if (index > -1) subscribers.splice(index, 1);
                };
            }
        };
    },
    
    // Simple lens implementation
    lens: (getter, setter) => ({
        get: getter,
        set: (value) => (obj) => setter(value, obj),
        modify: (f) => (obj) => setter(f(getter(obj)), obj)
    }),
    
    // Property lens
    prop: (property) => UIState.lens(
        obj => obj[property],
        (value, obj) => ({ ...obj, [property]: value })
    )
};

// Auto-save functionality with functional patterns
const AutoSave = {
    // Debounced auto-save using function composition
    createAutoSave: (saveFunction, delay = 2000) => {
        let timeoutId = null;
        
        const debouncedSave = (data) => {
            if (timeoutId) clearTimeout(timeoutId);
            
            timeoutId = setTimeout(() => {
                saveFunction(data)
                    .then(result => {
                        console.log('Auto-save successful:', result);
                        AutoSave.updateStatus('saved');
                    })
                    .catch(error => {
                        console.error('Auto-save failed:', error);
                        AutoSave.updateStatus('error');
                    });
            }, delay);
        };
        
        return {
            save: debouncedSave,
            cancel: () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
            }
        };
    },
    
    // Status updates using DOM utilities
    updateStatus: (status) => {
        const statusMap = {
            saving: { text: 'Saving...', class: 'saving' },
            saved: { text: 'Saved', class: 'saved' },
            error: { text: 'Error saving', class: 'error' }
        };
        
        DOM.selectElement('#autosave-status')
            .map(element => {
                const config = statusMap[status];
                element.textContent = config.text;
                element.className = `autosave-indicator ${config.class}`;
                return element;
            });
    }
};

// Org-mode utilities with functional parsing
const OrgMode = {
    // Parse org-mode content using functional composition
    parseContent: (content) => {
        const lines = content.split('\n');
        
        const parseHeadline = (line) => {
            const match = line.match(/^(\*+)\s+(.+)$/);
            return match ? {
                type: 'headline',
                level: match[1].length,
                text: match[2],
                raw: line
            } : null;
        };
        
        const parseListItem = (line) => {
            const match = line.match(/^(\s*)[-*+]\s+(.+)$/);
            return match ? {
                type: 'list-item',
                indent: match[1].length,
                text: match[2],
                raw: line
            } : null;
        };
        
        const parseCheckbox = (line) => {
            const match = line.match(/^(\s*)[-*+]\s+\[([ Xx-])\]\s+(.+)$/);
            return match ? {
                type: 'checkbox',
                indent: match[1].length,
                state: match[2],
                text: match[3],
                raw: line
            } : null;
        };
        
        // Functional parsing pipeline
        const parseLine = (line) => 
            parseHeadline(line) || 
            parseCheckbox(line) || 
            parseListItem(line) || 
            { type: 'text', text: line, raw: line };
        
        return lines.map(parseLine);
    },
    
    // Render org-mode elements
    renderElement: (element) => {
        switch (element.type) {
            case 'headline':
                return `<h${element.level} class="org-headline-${element.level}">${element.text}</h${element.level}>`;
            case 'checkbox':
                const checked = element.state === 'x' || element.state === 'X';
                const partial = element.state === '-';
                const stateClass = checked ? 'checked' : partial ? 'partial' : '';
                return `<div class="org-checkbox ${stateClass}" style="margin-left: ${element.indent * 0.5}rem">
                    <input type="checkbox" ${checked ? 'checked' : ''} ${partial ? 'indeterminate' : ''}>
                    <span>${element.text}</span>
                </div>`;
            case 'list-item':
                return `<div class="org-list-item" style="margin-left: ${element.indent * 0.5}rem">
                    ${element.text}
                </div>`;
            default:
                return `<p>${element.text}</p>`;
        }
    }
};

// Error handling with functional patterns
const ErrorHandler = {
    // Global error handler using Either
    handleError: (error, context = 'Unknown') => {
        const errorMessage = {
            message: error.message || 'Unknown error',
            context,
            timestamp: new Date().toISOString(),
            stack: error.stack
        };
        
        console.error('Application Error:', errorMessage);
        
        // Show user-friendly error
        ErrorHandler.showToast(
            'Something went wrong. Please try again.',
            'error'
        );
        
        return Either.Left(errorMessage);
    },
    
    // Toast notifications
    showToast: (message, type = 'info') => {
        DOM.selectElement('#toast-container')
            .map(container => {
                const toast = document.createElement('div');
                toast.className = `alert alert-${type}`;
                toast.innerHTML = `
                    <span>${message}</span>
                    <button class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()">×</button>
                `;
                container.appendChild(toast);
                
                // Auto-remove after 5 seconds
                setTimeout(() => toast.remove(), 5000);
                return container;
            });
    }
};

// Initialize application with functional patterns
const App = {
    init: () => {
        // Global HTMX configuration
        htmx.config.historyCacheSize = 0;
        htmx.config.refreshOnHistoryMiss = true;
        
        // Functional event handlers
        const setupGlobalEvents = () => {
            // Configure HTMX requests
            document.body.addEventListener('htmx:configRequest', 
                HTMX.configRequest({
                    'X-Requested-With': 'HTMX',
                    'Content-Type': 'application/json'
                })
            );
            
            // Handle loading states functionally
            document.body.addEventListener('htmx:beforeRequest', () => 
                DOM.selectElement('#loading')
                    .map(DOM.setProperty('style.display', 'flex'))
            );
            
            document.body.addEventListener('htmx:afterRequest', () => 
                DOM.selectElement('#loading')
                    .map(DOM.setProperty('style.display', 'none'))
            );
            
            // Auto-focus inputs after content loads
            document.body.addEventListener('htmx:afterSettle', (evt) => 
                DOM.selectElement('input[type="text"], textarea', evt.target)
                    .map(element => element.focus())
            );
            
            // Global error handling
            window.addEventListener('error', (evt) => 
                ErrorHandler.handleError(evt.error, 'Global Error')
            );
            
            window.addEventListener('unhandledrejection', (evt) => 
                ErrorHandler.handleError(evt.reason, 'Unhandled Promise Rejection')
            );
        };
        
        // Initialize auto-save for editor
        const setupAutoSave = () => {
            const saveNote = (data) => 
                fetch('/api/notes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            
            const autoSave = AutoSave.createAutoSave(saveNote);
            
            // Attach to editor textareas
            DOM.selectElements('.editor-textarea')
                .forEach(textarea => {
                    DOM.addEventListener('input', (evt) => {
                        AutoSave.updateStatus('saving');
                        autoSave.save({ content: evt.target.value });
                    }, textarea);
                });
        };
        
        // Initialize drawer functionality
        const setupDrawer = () => {
            // Handle drawer toggle
            document.body.addEventListener('htmx:afterSettle', (evt) => {
                if (evt.target.id === 'drawer-container') {
                    const overlay = evt.target.querySelector('.drawer-overlay');
                    const content = evt.target.querySelector('.drawer-content');
                    if (overlay && content) {
                        overlay.classList.add('active');
                        content.classList.add('active');
                        
                        // Close drawer when clicking overlay
                        overlay.addEventListener('click', () => {
                            overlay.classList.remove('active');
                            content.classList.remove('active');
                            setTimeout(() => evt.target.innerHTML = '', 300);
                        });
                    }
                }
            });
        };
        
        // Initialize functional utilities
        pipe(
            setupGlobalEvents,
            setupAutoSave,
            setupDrawer,
            () => console.log('MekkaNote initialized with functional patterns')
        )();
        
        return Either.Right('Application initialized successfully');
    }
};

// Export for module use (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Either,
        Option,
        Validation,
        DOM,
        HTMX,
        UIState,
        AutoSave,
        OrgMode,
        ErrorHandler,
        App,
        pipe,
        curry
    };
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
} else {
    App.init();
}