// ============================================
// PORTFOLIO BUILDER - DAY 1
// Features: Drag & Drop, Inline Editing, Local Storage
// ============================================

// ---------- STATE MANAGEMENT ----------
let components = [];  // Array to store all components on canvas

// Helper function to generate unique IDs
function generateId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// ---------- RENDER FUNCTION ----------
function renderCanvas() {
    const canvas = document.getElementById('canvas');
    
    // If no components, show placeholder
    if (components.length === 0) {
        canvas.innerHTML = `
            <div class="canvas-placeholder">
                <i class="fas fa-arrow-left"></i>
                <p>Drag components here</p>
            </div>
        `;
        return;
    }
    
    // Build HTML for all components
    let html = '';
    components.forEach((comp, index) => {
        html += `<div class="canvas-item" data-index="${index}">`;
        html += `<div class="item-header">`;
        html += `<span><i class="fas fa-${comp.type === 'header' ? 'heading' : comp.type === 'paragraph' ? 'paragraph' : 'image'}"></i> ${comp.type}</span>`;
        html += `<div class="item-controls">`;
        html += `<button class="delete-btn" data-index="${index}" title="Delete"><i class="fas fa-times"></i></button>`;
        html += `</div></div>`;
        
        // Render based on component type
        if (comp.type === 'header') {
            html += `<h2 contenteditable="true" data-index="${index}" data-field="content">${comp.content}</h2>`;
        } else if (comp.type === 'paragraph') {
            html += `<p contenteditable="true" data-index="${index}" data-field="content">${comp.content}</p>`;
        } else if (comp.type === 'image') {
            html += `<img src="${comp.content}" alt="Portfolio image" style="max-width:100%;">`;
            html += `<p style="font-size:0.8rem; color:#94a3b8; margin-top:0.3rem;"><i class="fas fa-link"></i> Image URL (edit in code)</p>`;
        }
        
        html += `</div>`;
    });
    
    canvas.innerHTML = html;
    
    // Add event listeners for contenteditable
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
        el.addEventListener('blur', function(e) {
            const index = this.dataset.index;
            const field = this.dataset.field;
            if (index !== undefined && components[index]) {
                components[index][field] = this.innerText;
                // Auto-save to localStorage on edit
                saveToStorage();
            }
        });
    });
}

// ---------- ADD COMPONENT ----------
function addComponent(type) {
    // Create default content based on type
    let content = '';
    if (type === 'header') content = 'Your Name or Title';
    else if (type === 'paragraph') content = 'Write something about yourself, your skills, or your projects. Click to edit this text.';
    else if (type === 'image') content = 'https://via.placeholder.com/600x300/2563eb/ffffff?text=Your+Image+Here';
    
    const newComponent = {
        id: generateId(),
        type: type,
        content: content
    };
    
    components.push(newComponent);
    renderCanvas();
    saveToStorage();
}

// ---------- DELETE COMPONENT ----------
function deleteComponent(index) {
    components.splice(index, 1);
    renderCanvas();
    saveToStorage();
}

// ---------- DRAG AND DROP ----------
// Make components draggable
document.querySelectorAll('.component').forEach(comp => {
    comp.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', comp.dataset.type);
        e.dataTransfer.effectAllowed = 'copy';
    });
});

// Canvas drop zone
const canvas = document.getElementById('canvas');

canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    canvas.classList.add('drag-over');
});

canvas.addEventListener('dragleave', () => {
    canvas.classList.remove('drag-over');
});

canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    canvas.classList.remove('drag-over');
    
    const type = e.dataTransfer.getData('text/plain');
    if (type && ['header', 'paragraph', 'image'].includes(type)) {
        addComponent(type);
    }
});

// Prevent default drag on window
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());

// ---------- EVENT DELEGATION FOR DELETE BUTTONS ----------
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
        const btn = e.target.closest('.delete-btn');
        const index = btn.dataset.index;
        if (index !== undefined) {
            deleteComponent(parseInt(index));
        }
    }
});

// ---------- LOCAL STORAGE ----------
const STORAGE_KEY = 'portfolioBuilder_day1';

function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(components));
        showToast('Saved to browser!');
    } catch (error) {
        console.error('Save failed:', error);
    }
}

function loadFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            components = JSON.parse(saved);
            renderCanvas();
            showToast('Loaded from browser!');
        } else {
            showToast('No saved portfolio found');
        }
    } catch (error) {
        console.error('Load failed:', error);
        showToast('Error loading data');
    }
}

function clearCanvas() {
    if (components.length > 0 && confirm('Are you sure you want to clear the canvas?')) {
        components = [];
        renderCanvas();
        saveToStorage();
        showToast('Canvas cleared');
    }
}

// Simple toast notification (bonus feature!)
function showToast(message) {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1e293b;
            color: white;
            padding: 12px 24px;
            border-radius: 40px;
            font-size: 0.9rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 1000;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 2000);
}

// ---------- TEMPLATE (Starter content) ----------
function loadStarterTemplate() {
    components = [
        {
            id: generateId(),
            type: 'header',
            content: 'My Portfolio'
        },
        {
            id: generateId(),
            type: 'paragraph',
            content: 'Hi! I\'m a student passionate about design and development. This is my portfolio built with a drag-and-drop tool I created.'
        },
        {
            id: generateId(),
            type: 'image',
            content: 'https://via.placeholder.com/600x300/7c3aed/ffffff?text=My+Project'
        },
        {
            id: generateId(),
            type: 'paragraph',
            content: 'I love creating things that live on the internet. Check out my work below!'
        }
    ];
    renderCanvas();
    saveToStorage();
}

// ---------- BUTTON EVENT LISTENERS ----------
document.addEventListener('DOMContentLoaded', () => {
    // Set up button listeners
    document.getElementById('saveBtn').addEventListener('click', saveToStorage);
    document.getElementById('loadBtn').addEventListener('click', loadFromStorage);
    document.getElementById('clearBtn').addEventListener('click', clearCanvas);
    
    // Load starter template
    loadStarterTemplate();
    
    // Add keyboard shortcut for delete (bonus!)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'Del') {
            // Find selected item (if we had selection - for Day 2)
            // For now, just a placeholder
        }
    });
});

// Log to console that Day 1 is ready
console.log('✅ Portfolio Builder Day 1 loaded!');