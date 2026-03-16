// ============================================
// PORTFOLIO BUILDER - DAY 3 (FINAL - WITH WORKING IMAGES)
// Features: Export, Image Upload, Responsive Preview, Auto-save, New Components
// ============================================

// ---------- STATE MANAGEMENT ----------
let components = [];
let selectedIndex = -1;
let previewMode = 'desktop';
let autoSaveTimer = null;

let history = {
    past: [],
    future: []
};

// Helper function to generate unique IDs
function generateId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// ---------- AUTO SAVE ----------
function setupAutoSave() {
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    autoSaveTimer = setInterval(() => {
        if (components.length > 0) {
            saveToStorage(true);
            updateAutoSaveIndicator('saved');
        }
    }, 3000);
}

function updateAutoSaveIndicator(status) {
    const dot = document.querySelector('.auto-save-dot');
    const text = document.getElementById('autoSaveText');
    if (!dot || !text) return;
    
    if (status === 'saving') {
        dot.classList.add('saving');
        text.textContent = 'Saving...';
    } else if (status === 'saved') {
        dot.classList.remove('saving');
        text.textContent = 'All changes saved';
        
        setTimeout(() => {
            text.textContent = 'Auto-saving';
        }, 2000);
    }
}

// ---------- HISTORY MANAGEMENT ----------
function pushToHistory() {
    history.past.push(JSON.parse(JSON.stringify(components)));
    history.future = [];
    updateHistoryButtons();
    updateAutoSaveIndicator('saving');
}

function undo() {
    if (history.past.length === 0) return;
    
    history.future.push(JSON.parse(JSON.stringify(components)));
    components = JSON.parse(JSON.stringify(history.past.pop()));
    
    selectedIndex = -1;
    renderCanvas();
    updateHistoryButtons();
    showToast('Undo');
}

function redo() {
    if (history.future.length === 0) return;
    
    history.past.push(JSON.parse(JSON.stringify(components)));
    components = JSON.parse(JSON.stringify(history.future.pop()));
    
    selectedIndex = -1;
    renderCanvas();
    updateHistoryButtons();
    showToast('Redo');
}

function updateHistoryButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) undoBtn.disabled = history.past.length === 0;
    if (redoBtn) redoBtn.disabled = history.future.length === 0;
}

// ---------- RENDER FUNCTION ----------
function renderCanvas() {
    const canvas = document.getElementById('canvasContainer');
    if (!canvas) {
        console.error('Canvas container not found!');
        return;
    }
    
    if (components.length === 0) {
        canvas.innerHTML = `
            <div class="canvas-placeholder">
                <i class="fas fa-arrow-left"></i>
                <p>Drag components here</p>
            </div>
        `;
        selectedIndex = -1;
        updatePropertyEditor();
        return;
    }
    
    let html = '';
    components.forEach((comp, index) => {
        const isSelected = (index === selectedIndex) ? 'selected' : '';
        
        html += `<div class="canvas-item ${isSelected}" data-index="${index}" data-id="${comp.id}">`;
        html += `<div class="item-header">`;
        html += `<span><i class="fas fa-${getIconForType(comp.type)}"></i> ${comp.type}</span>`;
        html += `<div class="item-controls">`;
        html += `<button class="move-up" data-index="${index}" title="Move up (↑)"><i class="fas fa-chevron-up"></i></button>`;
        html += `<button class="move-down" data-index="${index}" title="Move down (↓)"><i class="fas fa-chevron-down"></i></button>`;
        html += `<button class="duplicate-btn" data-index="${index}" title="Duplicate (Ctrl+D)"><i class="far fa-copy"></i></button>`;
        html += `<button class="delete-btn" data-index="${index}" title="Delete (Del)"><i class="fas fa-times"></i></button>`;
        html += `</div></div>`;
        
        html += renderComponentByType(comp);
        
        html += `</div>`;
    });
    
    canvas.innerHTML = html;
    
    // Add click listeners to canvas items for selection
    document.querySelectorAll('.canvas-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // Don't select if clicking on button
            if (e.target.closest('button')) return;
            
            const index = item.dataset.index;
            if (index !== undefined) {
                selectedIndex = parseInt(index);
                renderCanvas(); // Re-render to show selection
            }
        });
    });
    
    applyPreviewMode();
    
    if (selectedIndex >= 0 && components[selectedIndex]) {
        showPropertyEditor(selectedIndex);
    } else {
        updatePropertyEditor();
    }
}

function getIconForType(type) {
    const icons = {
        'header': 'heading',
        'paragraph': 'paragraph',
        'image': 'image',
        'skill': 'chart-bar',
        'contact': 'address-card'
    };
    return icons[type] || 'cube';
}

function renderComponentByType(comp) {
    const style = `text-align: ${comp.align || 'left'}; color: ${comp.color || '#1e293b'}; font-size: ${comp.fontSize || 16}px;`;
    
    switch(comp.type) {
        case 'header':
const level = comp.level || '2';
return `
<h${level}
contenteditable="true"
oninput="updateText(${selectedIndex}, this.innerText)"
style="${style} margin:0.5rem 0; outline:none;">
${comp.content}
</h${level}>
`;

case 'paragraph':
return `
<p
contenteditable="true"
oninput="updateText(${selectedIndex}, this.innerText)"
style="${style} margin:0.5rem 0; outline:none;">
${comp.content}
</p>
`;
            
        case 'image':
            return `
                <img src="${comp.content}" alt="${comp.caption || 'Portfolio image'}" style="max-width:100%; border-radius:12px;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'600\' height=\'300\' viewBox=\'0 0 600 300\'%3E%3Crect width=\'600\' height=\'300\' fill=\'%232563eb\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'white\' font-family=\'Arial\' font-size=\'24\'%3EImage Not Found%3C/text%3E%3C/svg%3E'">
                ${comp.caption ? `<p style="text-align:center; color:#64748b; font-size:0.9rem; margin-top:0.3rem;">${comp.caption}</p>` : ''}
            `;
            
        case 'skill':
            return renderSkillBar(comp);
            
        case 'contact':
            return renderContactInfo(comp);
            
        default:
            return '';
    }
}

function renderSkillBar(comp) {
    const skills = comp.skills || [
        { name: 'HTML/CSS', percent: 80 },
        { name: 'JavaScript', percent: 60 },
        { name: 'Design', percent: 70 }
    ];
    
    let html = '<div style="padding:0.5rem;">';
    skills.forEach(skill => {
        html += `
            <div class="skill-item">
                <div class="skill-header">
                    <span>${skill.name}</span>
                    <span>${skill.percent}%</span>
                </div>
                <div class="skill-bar-bg">
                    <div class="skill-bar-fill" style="width:${skill.percent}%; background:${comp.barColor || '#2563eb'};"></div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function renderContactInfo(comp) {
    const contacts = comp.contacts || [
        { type: 'email', value: 'student@example.com', icon: 'envelope' },
        { type: 'linkedin', value: 'linkedin.com/in/student', icon: 'linkedin' },
        { type: 'github', value: 'github.com/student', icon: 'github' }
    ];
    
    let html = '<div style="padding:0.5rem;">';
    contacts.forEach(contact => {
        const icon = contact.icon || getIconForContact(contact.type);
        const link = getContactLink(contact);
        const iconPrefix = (contact.type === 'email' || contact.type === 'phone') ? 'fas' : 'fab';
        html += `
            <div class="contact-item">
                <i class="${iconPrefix} fa-${icon}"></i>
                <a href="${link}" target="_blank">${contact.value}</a>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function getIconForContact(type) {
    const icons = {
        'email': 'envelope',
        'phone': 'phone-alt',
        'linkedin': 'linkedin',
        'github': 'github',
        'twitter': 'twitter',
        'instagram': 'instagram'
    };
    return icons[type] || 'link';
}

function getContactLink(contact) {
    if (contact.type === 'email') return `mailto:${contact.value}`;
    if (contact.type === 'phone') return `tel:${contact.value}`;
    if (contact.value.startsWith('http')) return contact.value;
    return `https://${contact.value}`;
}

// ---------- PROPERTY EDITOR ----------
function showPropertyEditor(index) {
    const comp = components[index];
    if (!comp) return;
    
    let editorHtml = `<div class="property-group">`;
    editorHtml += `<h4><i class="fas fa-edit"></i> Edit ${comp.type}</h4>`;
    
    switch(comp.type) {
        case 'header':
            editorHtml += `
                <div class="property-row">
                    <label>Text</label>
                    <input type="text" class="property-input" id="prop-text" value="${escapeHtml(comp.content)}">
                </div>
                <div class="property-row">
                    <label>Level</label>
                    <select class="property-select" id="prop-level">
                        <option value="1" ${comp.level === '1' ? 'selected' : ''}>H1 - Large</option>
                        <option value="2" ${comp.level === '2' || !comp.level ? 'selected' : ''}>H2 - Medium</option>
                        <option value="3" ${comp.level === '3' ? 'selected' : ''}>H3 - Small</option>
                    </select>
                </div>
            `;
            break;
            
        case 'paragraph':
            editorHtml += `
                <div class="property-row">
                    <label>Text</label>
                    <textarea class="property-input" id="prop-text" rows="4">${escapeHtml(comp.content)}</textarea>
                </div>
            `;
            break;
            
        case 'image':
            editorHtml += `
                <div class="upload-area" id="imageUploadArea">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Click to upload image</p>
                    <p class="small">or drag & drop</p>
                </div>
                <div class="property-row">
                    <label>Image URL</label>
                    <input type="text" class="property-input" id="prop-src" value="${escapeHtml(comp.content)}">
                </div>
                <div class="property-row">
                    <label>Caption</label>
                    <input type="text" class="property-input" id="prop-caption" value="${escapeHtml(comp.caption || '')}">
                </div>
                <div class="property-row">
                    <img src="${comp.content}" style="max-width:100%; border-radius:12px; max-height:150px; object-fit:cover;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'150\' viewBox=\'0 0 200 150\'%3E%3Crect width=\'200\' height=\'150\' fill=\'%23e2e8f0\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%2394a3b8\' font-family=\'Arial\' font-size=\'14\'%3ENo Image%3C/text%3E%3C/svg%3E'">
                </div>
            `;
            break;
            
        case 'skill':
            editorHtml += `
                <div class="property-row">
                    <label>Bar Color</label>
                    <input type="color" class="color-picker" id="prop-barColor" value="${comp.barColor || '#2563eb'}">
                </div>
                <div class="property-row">
                    <label>Skills (JSON format)</label>
                    <textarea class="property-input" id="prop-skills" rows="6">${JSON.stringify(comp.skills || [
                        {name: 'HTML/CSS', percent: 80},
                        {name: 'JavaScript', percent: 60}
                    ], null, 2)}</textarea>
                </div>
                <p class="small">Format: [{"name":"Skill","percent":80}]</p>
            `;
            break;
            
        case 'contact':
            editorHtml += `
                <div class="property-row">
                    <label>Contacts (JSON format)</label>
                    <textarea class="property-input" id="prop-contacts" rows="8">${JSON.stringify(comp.contacts || [
                        {type: 'email', value: 'student@example.com'},
                        {type: 'linkedin', value: 'linkedin.com/in/student'}
                    ], null, 2)}</textarea>
                </div>
                <p class="small">Format: [{"type":"email","value":"email@example.com"}]</p>
            `;
            break;
    }
    
    // Common properties for text-based components
    if (comp.type !== 'skill' && comp.type !== 'contact') {
        editorHtml += `
            <div class="property-row">
                <label>Alignment</label>
                <select class="property-select" id="prop-align">
                    <option value="left" ${comp.align === 'left' || !comp.align ? 'selected' : ''}>Left</option>
                    <option value="center" ${comp.align === 'center' ? 'selected' : ''}>Center</option>
                    <option value="right" ${comp.align === 'right' ? 'selected' : ''}>Right</option>
                </select>
            </div>
            <div class="property-row">
                <label>Color</label>
                <input type="color" class="color-picker" id="prop-color" value="${comp.color || '#1e293b'}">
            </div>
            <div class="property-row">
                <label>Font Size: <span id="fontSizeValue">${comp.fontSize || 16}</span>px</label>
                <input type="range" class="range-slider" id="prop-fontSize" min="12" max="72" value="${comp.fontSize || 16}" oninput="document.getElementById('fontSizeValue').innerText = this.value">
            </div>
        `;
    }
    
    editorHtml += `
        <button class="apply-btn" id="applyPropsBtn">
            <i class="fas fa-check"></i> Apply Changes
        </button>
    `;
    
    document.getElementById('propertyEditor').innerHTML = editorHtml;
    
    if (comp.type === 'image') {
        setupImageUpload(index);
    }
    
    document.getElementById('applyPropsBtn').addEventListener('click', () => {
        applyPropertyChanges(index);
    });
}

function updatePropertyEditor() {
    const editor = document.getElementById('propertyEditor');
    if (editor) {
        editor.innerHTML = `
            <div class="properties-placeholder">
                <i class="fas fa-mouse-pointer"></i>
                <p>Select a component to edit</p>
                <p class="small">Click on any item in canvas</p>
            </div>
        `;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function applyPropertyChanges(index) {
    const comp = components[index];
    if (!comp) return;
    
    switch(comp.type) {
        case 'header':
        case 'paragraph':
            comp.content = document.getElementById('prop-text')?.value || comp.content;
            if (comp.type === 'header') {
                comp.level = document.getElementById('prop-level')?.value || '2';
            }
            break;
            
        case 'image':
            comp.content = document.getElementById('prop-src')?.value || comp.content;
            comp.caption = document.getElementById('prop-caption')?.value || '';
            break;
            
        case 'skill':
            comp.barColor = document.getElementById('prop-barColor')?.value || '#2563eb';
            try {
                const skillsText = document.getElementById('prop-skills')?.value || '[]';
                comp.skills = JSON.parse(skillsText);
            } catch (e) {
                showToast('Invalid JSON format');
                return;
            }
            break;
            
        case 'contact':
            try {
                const contactsText = document.getElementById('prop-contacts')?.value || '[]';
                comp.contacts = JSON.parse(contactsText);
            } catch (e) {
                showToast('Invalid JSON format');
                return;
            }
            break;
    }
    
    if (comp.type !== 'skill' && comp.type !== 'contact') {
        comp.align = document.getElementById('prop-align')?.value || 'left';
        comp.color = document.getElementById('prop-color')?.value || '#1e293b';
        comp.fontSize = document.getElementById('prop-fontSize')?.value || 16;
    }
    
    pushToHistory();
    renderCanvas();
    showToast('Changes applied!');
}

// ---------- IMAGE UPLOAD ----------
function setupImageUpload(index) {
    const uploadArea = document.getElementById('imageUploadArea');
    if (!uploadArea) return;
    
    let fileInput = document.getElementById('imageFileInput');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.id = 'imageFileInput';
        uploadArea.appendChild(fileInput);
    }
    
    const newFileInput = fileInput; // Avoid closure issues
    
    // Remove old listeners by cloning and replacing
    const newUploadArea = uploadArea.cloneNode(true);
    uploadArea.parentNode.replaceChild(newUploadArea, uploadArea);
    
    newUploadArea.addEventListener('click', () => {
        newFileInput.click();
    });
    
    newUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        newUploadArea.style.background = '#eef2ff';
        newUploadArea.style.borderColor = '#2563eb';
    });
    
    newUploadArea.addEventListener('dragleave', () => {
        newUploadArea.style.background = '#f8fafc';
        newUploadArea.style.borderColor = '#cbd5e1';
    });
    
    newUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        newUploadArea.style.background = '#f8fafc';
        newUploadArea.style.borderColor = '#cbd5e1';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file, index);
        }
    });
    
    newFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file, index);
        }
    });
}

function handleImageUpload(file, index) {
    showToast('Uploading...');
    
    const reader = new FileReader();
    reader.onload = (e) => {
        components[index].content = e.target.result;
        renderCanvas();
        showToast('Image uploaded!');
        pushToHistory();
    };
    reader.readAsDataURL(file);
}

// ---------- RESPONSIVE PREVIEW ----------
function setupPreviewToggles() {
    document.querySelectorAll('.preview-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.preview-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            previewMode = btn.dataset.view;
            applyPreviewMode();
        });
    });
}

function applyPreviewMode() {
    const canvas = document.getElementById('canvasContainer');
    if (!canvas) return;
    
    canvas.classList.remove('preview-desktop', 'preview-tablet', 'preview-mobile');
    canvas.classList.add(`preview-${previewMode}`);
}

// ---------- COMPONENT OPERATIONS ----------
function addComponent(type) {
    let newComponent = {
        id: generateId(),
        type: type,
        align: 'left',
        color: '#1e293b',
        fontSize: 16
    };
    
    switch(type) {
        case 'header':
            newComponent.content = 'Your Name or Title';
            newComponent.level = '2';
            newComponent.fontSize = 32;
            break;
            
        case 'paragraph':
            newComponent.content = 'Write something about yourself, your skills, or your projects.';
            break;
            
        case 'image':
            newComponent.content = 'https://picsum.photos/600/300?random=1';
            newComponent.caption = 'Project screenshot';
            break;
            
        case 'skill':
            newComponent.skills = [
                { name: 'HTML/CSS', percent: 80 },
                { name: 'JavaScript', percent: 60 },
                { name: 'Design', percent: 70 }
            ];
            newComponent.barColor = '#2563eb';
            break;
            
        case 'contact':
            newComponent.contacts = [
                { type: 'email', value: 'student@example.com', icon: 'envelope' },
                { type: 'linkedin', value: 'linkedin.com/in/student', icon: 'linkedin' },
                { type: 'github', value: 'github.com/student', icon: 'github' }
            ];
            break;
    }
    
    components.push(newComponent);
    selectedIndex = components.length - 1;
    pushToHistory();
    renderCanvas();
    saveToStorage();
}

function deleteComponent(index) {
    if (index < 0 || index >= components.length) return;
    
    components.splice(index, 1);
    if (selectedIndex === index) {
        selectedIndex = -1;
    } else if (selectedIndex > index) {
        selectedIndex--;
    }
    
    pushToHistory();
    renderCanvas();
    saveToStorage();
}

function duplicateComponent(index) {
    const original = components[index];
    if (!original) return;
    
    const copy = JSON.parse(JSON.stringify(original));
    copy.id = generateId();
    
    if (copy.type !== 'image') {
        copy.content = `Copy of ${original.content}`;
    }
    
    components.splice(index + 1, 0, copy);
    selectedIndex = index + 1;
    pushToHistory();
    renderCanvas();
    saveToStorage();
    showToast('Duplicated!');
}

function moveUp(index) {
    if (index <= 0) return;
    
    [components[index - 1], components[index]] = [components[index], components[index - 1]];
    
    if (selectedIndex === index) {
        selectedIndex = index - 1;
    } else if (selectedIndex === index - 1) {
        selectedIndex = index;
    }
    
    pushToHistory();
    renderCanvas();
    saveToStorage();
}

function moveDown(index) {
    if (index >= components.length - 1) return;
    
    [components[index], components[index + 1]] = [components[index + 1], components[index]];
    
    if (selectedIndex === index) {
        selectedIndex = index + 1;
    } else if (selectedIndex === index + 1) {
        selectedIndex = index;
    }
    
    pushToHistory();
    renderCanvas();
    saveToStorage();
}

// ---------- EXPORT FUNCTIONS ----------
function exportAsHTML(includeImages = true) {
    showToast('Generating HTML...');
    
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Portfolio</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
        body { background: #f8fafc; padding: 2rem; }
        .portfolio { max-width: 1000px; margin: 0 auto; }
        .item { background: white; border-radius: 24px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #eef2f6; }
        h1, h2, h3 { margin: 0.5rem 0; }
        p { line-height: 1.6; }
        img { max-width: 100%; border-radius: 16px; }
        .skill-item { margin-bottom: 1rem; }
        .skill-header { display: flex; justify-content: space-between; margin-bottom: 0.3rem; }
        .skill-bar-bg { background: #e2e8f0; height: 8px; border-radius: 20px; }
        .skill-bar-fill { height: 8px; border-radius: 20px; }
        .contact-item { display: flex; align-items: center; gap: 0.8rem; padding: 0.5rem; }
        .contact-item i { width: 24px; color: #2563eb; }
        .contact-item a { color: #1e293b; text-decoration: none; }
        .contact-item a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="portfolio">`;
    
    components.forEach(comp => {
        html += `<div class="item">`;
        
        const style = `text-align: ${comp.align || 'left'}; color: ${comp.color || '#1e293b'}; font-size: ${comp.fontSize || 16}px;`;
        
        switch(comp.type) {
            case 'header':
                const level = comp.level || '2';
                html += `<h${level} style="${style}">${comp.content}</h${level}>`;
                break;
                
            case 'paragraph':
                html += `<p style="${style}">${comp.content}</p>`;
                break;
                
            case 'image':
                html += `<img src="${comp.content}" alt="${comp.caption || ''}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'600\' height=\'300\' viewBox=\'0 0 600 300\'%3E%3Crect width=\'600\' height=\'300\' fill=\'%232563eb\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'white\' font-family=\'Arial\' font-size=\'24\'%3EImage%3C/text%3E%3C/svg%3E'">`;
                if (comp.caption) {
                    html += `<p style="text-align:center; color:#64748b;">${comp.caption}</p>`;
                }
                break;
                
            case 'skill':
                if (comp.skills) {
                    comp.skills.forEach(skill => {
                        html += `
                            <div class="skill-item">
                                <div class="skill-header">
                                    <span>${skill.name}</span>
                                    <span>${skill.percent}%</span>
                                </div>
                                <div class="skill-bar-bg">
                                    <div class="skill-bar-fill" style="width:${skill.percent}%; background:${comp.barColor || '#2563eb'};"></div>
                                </div>
                            </div>
                        `;
                    });
                }
                break;
                
            case 'contact':
                if (comp.contacts) {
                    comp.contacts.forEach(contact => {
                        const icon = contact.icon || getIconForContact(contact.type);
                        const link = getContactLink(contact);
                        const iconPrefix = (contact.type === 'email' || contact.type === 'phone') ? 'fas' : 'fab';
                        html += `
                            <div class="contact-item">
                                <i class="${iconPrefix} fa-${icon}"></i>
                                <a href="${link}" target="_blank">${contact.value}</a>
                            </div>
                        `;
                    });
                }
                break;
        }
        
        html += `</div>`;
    });
    
    html += `
    </div>
</body>
</html>`;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-portfolio.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Portfolio exported!');
}

// ---------- TEMPLATES ----------
function loadCreativeTemplate() {
    components = [
        {
            id: generateId(),
            type: 'header',
            content: 'Alex Rivera',
            align: 'center',
            color: '#7c3aed',
            fontSize: 48,
            level: '1'
        },
        {
            id: generateId(),
            type: 'paragraph',
            content: 'Multimedia artist & creative coder',
            align: 'center',
            color: '#4b5563',
            fontSize: 20
        },
        {
            id: generateId(),
            type: 'image',
            content: 'https://picsum.photos/800/400?random=1',
            caption: 'Interactive installation, 2024'
        },
        {
            id: generateId(),
            type: 'skill',
            skills: [
                { name: 'After Effects', percent: 85 },
                { name: 'Processing', percent: 70 },
                { name: 'TouchDesigner', percent: 60 }
            ],
            barColor: '#7c3aed'
        }
    ];
    selectedIndex = -1;
    renderCanvas();
    pushToHistory();
    saveToStorage();
    showToast('Creative template loaded!');
}

function loadTechTemplate() {
    components = [
        {
            id: generateId(),
            type: 'header',
            content: 'Sam Chen',
            align: 'left',
            color: '#0f172a',
            fontSize: 40,
            level: '1'
        },
        {
            id: generateId(),
            type: 'paragraph',
            content: 'Full-stack developer · React · Node.js · Python',
            align: 'left',
            color: '#334155',
            fontSize: 18
        },
        {
            id: generateId(),
            type: 'skill',
            skills: [
                { name: 'JavaScript', percent: 90 },
                { name: 'React', percent: 85 },
                { name: 'Node.js', percent: 80 },
                { name: 'Python', percent: 75 }
            ],
            barColor: '#2563eb'
        },
        {
            id: generateId(),
            type: 'contact',
            contacts: [
                { type: 'github', value: 'github.com/samchen', icon: 'github' },
                { type: 'linkedin', value: 'linkedin.com/in/samchen', icon: 'linkedin' },
                { type: 'email', value: 'sam@example.com', icon: 'envelope' }
            ]
        }
    ];
    selectedIndex = -1;
    renderCanvas();
    pushToHistory();
    saveToStorage();
    showToast('Tech template loaded!');
}

function loadBusinessTemplate() {
    components = [
        {
            id: generateId(),
            type: 'header',
            content: 'Jordan Taylor',
            align: 'left',
            color: '#1e293b',
            fontSize: 42,
            level: '1'
        },
        {
            id: generateId(),
            type: 'paragraph',
            content: 'Marketing professional · Brand strategist · Content creator',
            align: 'left',
            color: '#475569',
            fontSize: 18
        },
        {
            id: generateId(),
            type: 'image',
            content: 'https://picsum.photos/600/300?random=2',
            caption: 'Social media campaign 2024'
        },
        {
            id: generateId(),
            type: 'paragraph',
            content: '5+ years experience in digital marketing. Helped brands grow their online presence by 200%.',
            align: 'left',
            color: '#334155',
            fontSize: 16
        },
        {
            id: generateId(),
            type: 'contact',
            contacts: [
                { type: 'linkedin', value: 'linkedin.com/in/jordantaylor', icon: 'linkedin' },
                { type: 'email', value: 'jordan@example.com', icon: 'envelope' },
                { type: 'twitter', value: 'twitter.com/jordan', icon: 'twitter' }
            ]
        }
    ];
    selectedIndex = -1;
    renderCanvas();
    pushToHistory();
    saveToStorage();
    showToast('Business template loaded!');
}

// ---------- DRAG AND DROP ----------
function setupDragAndDrop() {
    document.querySelectorAll('.component').forEach(comp => {
        comp.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', comp.dataset.type);
            e.dataTransfer.effectAllowed = 'copy';
        });
    });

    const canvas = document.getElementById('canvasContainer');
    if (!canvas) return;

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
        if (type) {
            addComponent(type);
        }
    });

    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => e.preventDefault());
}

// ---------- KEYBOARD SHORTCUTS ----------
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }
        
        if (e.key === 'Delete' && selectedIndex >= 0) {
            e.preventDefault();
            deleteComponent(selectedIndex);
        }
        
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            if (selectedIndex >= 0) {
                duplicateComponent(selectedIndex);
            }
        }
        
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            undo();
        }
        
        if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            redo();
        }
        
        if (e.key === 'ArrowUp' && selectedIndex >= 0) {
            e.preventDefault();
            moveUp(selectedIndex);
        }
        
        if (e.key === 'ArrowDown' && selectedIndex >= 0) {
            e.preventDefault();
            moveDown(selectedIndex);
        }
    });
}

// ---------- LOCAL STORAGE ----------
const STORAGE_KEY = 'portfolioBuilder_day3';

function saveToStorage(silent = false) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(components));
        if (!silent) showToast('Saved to browser!');
    } catch (error) {
        console.error('Save failed:', error);
        if (!silent) showToast('Save failed!');
    }
}

function loadFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            components = JSON.parse(saved);
            selectedIndex = -1;
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
        selectedIndex = -1;
        renderCanvas();
        saveToStorage();
        showToast('Canvas cleared');
    }
}

// ---------- TOAST NOTIFICATION ----------
function showToast(message) {
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
            pointer-events: none;
        `;
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 2000);
}

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Portfolio Builder Day 3...');
    
    // Setup buttons
    document.getElementById('saveBtn')?.addEventListener('click', () => saveToStorage());
    document.getElementById('loadBtn')?.addEventListener('click', loadFromStorage);
    document.getElementById('clearBtn')?.addEventListener('click', clearCanvas);
    document.getElementById('undoBtn')?.addEventListener('click', undo);
    document.getElementById('redoBtn')?.addEventListener('click', redo);
    
    // Export buttons
    document.getElementById('exportHtmlBtn')?.addEventListener('click', () => exportAsHTML(false));
    document.getElementById('exportWithImagesBtn')?.addEventListener('click', () => exportAsHTML(true));
    
    // Template buttons
    document.getElementById('templateCreative')?.addEventListener('click', loadCreativeTemplate);
    document.getElementById('templateTech')?.addEventListener('click', loadTechTemplate);
    document.getElementById('templateBusiness')?.addEventListener('click', loadBusinessTemplate);
    
    // Setup features
    setupDragAndDrop();
    setupKeyboardShortcuts();
    setupPreviewToggles();
    setupAutoSave();
    
    // Load saved portfolio or default template
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        components = JSON.parse(saved);
    } else {
        loadCreativeTemplate();
    }
    
    selectedIndex = -1;
    renderCanvas();
    pushToHistory();
    
    console.log('✅ Portfolio Builder Day 3 loaded successfully!');
});

// Helper functions for export
window.getIconForContact = getIconForContact;
window.getContactLink = getContactLink;

function updateText(index, value) {
    if(index < 0) return;

    components[index].content = value;

    saveToStorage(true);
}