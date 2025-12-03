// Project Timeline Data
let projectData = {
    startMonth: new Date(2024, 11, 1), // December 2024
    endMonth: new Date(2025, 11, 1),   // December 2025
    workstreams: []
};

// Edit mode state
let editMode = true; // Always editable now

// Empty default data - start fresh
const emptyData = {
    startMonth: new Date(2024, 11, 1), // December 2024
    endMonth: new Date(2025, 11, 1),   // December 2025
    workstreams: []
};

// Current program
let currentProgram = null;

// Initialize with empty data
projectData = emptyData;

// ==================== PROGRAM MANAGEMENT ====================

function getProgramList() {
    const saved = localStorage.getItem('programList');
    return saved ? JSON.parse(saved) : [];
}

function saveProgramList(programs) {
    localStorage.setItem('programList', JSON.stringify(programs));
}

function getProgramData(programId) {
    const saved = localStorage.getItem('program_' + programId);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return { ...emptyData };
        }
    }
    return { ...emptyData };
}

function saveProgramData(programId, data) {
    localStorage.setItem('program_' + programId, JSON.stringify(data));
}

function createProgram(name) {
    const programs = getProgramList();
    const id = 'prog_' + Date.now();
    
    programs.push({
        id: id,
        name: name,
        createdAt: new Date().toISOString()
    });
    
    saveProgramList(programs);
    saveProgramData(id, { ...emptyData });
    
    return id;
}

function deleteProgram(programId) {
    let programs = getProgramList();
    programs = programs.filter(p => p.id !== programId);
    saveProgramList(programs);
    localStorage.removeItem('program_' + programId);
}

function loadProgram(programId) {
    console.log('Loading program:', programId);
    currentProgram = programId;
    
    const data = getProgramData(programId);
    projectData = data;
    
    console.log('Program data loaded:', projectData.workstreams?.length || 0, 'workstreams');
    
    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('program', programId);
    window.history.replaceState({}, '', url);
    
    // Update selector
    const select = document.getElementById('programSelect');
    if (select) {
        select.value = programId;
    }
    
    initCalendarInputs();
    renderTimeline();
}

function renderProgramSelector() {
    const select = document.getElementById('programSelect');
    if (!select) return;
    
    const programs = getProgramList();
    
    select.innerHTML = '<option value="">-- Select Program --</option>';
    
    programs.forEach(prog => {
        const option = document.createElement('option');
        option.value = prog.id;
        option.textContent = prog.name;
        select.appendChild(option);
    });
    
    // Set selected value after all options are added
    if (currentProgram) {
        select.value = currentProgram;
    }
    
    console.log('Program selector rendered, current:', currentProgram, 'selected:', select.value);
}

function initProgramFromURL() {
    const params = new URLSearchParams(window.location.search);
    const programId = params.get('program');
    
    if (programId) {
        const programs = getProgramList();
        if (programs.find(p => p.id === programId)) {
            currentProgram = programId;
            projectData = getProgramData(programId);
        }
    }
}

// Program event listeners
document.getElementById('programSelect').addEventListener('change', function() {
    console.log('Program selected:', this.value);
    if (this.value) {
        loadProgram(this.value);
        showToast('📂 Loaded: ' + this.options[this.selectedIndex].text);
    } else {
        currentProgram = null;
        projectData = { ...emptyData, workstreams: [] };
        window.history.replaceState({}, '', window.location.pathname);
        initCalendarInputs();
        renderTimeline();
        showToast('📂 Switched to default view');
    }
});

document.getElementById('newProgramBtn').addEventListener('click', function() {
    const name = prompt('Enter program name:');
    if (name && name.trim()) {
        const id = createProgram(name.trim());
        renderProgramSelector();
        loadProgram(id);
        showToast('✅ Created: ' + name.trim());
    }
});

document.getElementById('deleteProgramBtn').addEventListener('click', function() {
    if (!currentProgram) {
        showToast('❌ No program selected');
        return;
    }
    
    const programs = getProgramList();
    const prog = programs.find(p => p.id === currentProgram);
    
    if (confirm(`Delete program "${prog.name}"? This cannot be undone.`)) {
        deleteProgram(currentProgram);
        currentProgram = null;
        projectData = { ...emptyData };
        window.history.replaceState({}, '', window.location.pathname);
        renderProgramSelector();
        renderTimeline();
        showToast('🗑️ Program deleted');
    }
});

// Generate months array
function getMonths() {
    const months = [];
    const start = new Date(projectData.startMonth);
    const end = new Date(projectData.endMonth);
    
    while (start <= end) {
        months.push(new Date(start));
        start.setMonth(start.getMonth() + 1);
    }
    return months;
}

// Render months header
function renderMonthsHeader() {
    const header = document.getElementById('monthsHeader');
    const months = getMonths();
    const today = new Date();
    
    header.innerHTML = months.map(month => {
        const monthName = month.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        const year = month.getFullYear().toString().slice(-2);
        const isCurrent = month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear();
        return `<div class="month-column ${isCurrent ? 'current' : ''}">${monthName} '${year}</div>`;
    }).join('');
}

// Calculate bar position and width
function calculateBarPosition(startDate, endDate) {
    const months = getMonths();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const monthWidth = 120; // --month-width
    const startMonthIndex = months.findIndex(m => 
        m.getMonth() === start.getMonth() && m.getFullYear() === start.getFullYear()
    );
    
    if (startMonthIndex === -1) return null;
    
    // Calculate start position within month
    const daysInStartMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const startDayOffset = (start.getDate() - 1) / daysInStartMonth * monthWidth;
    
    // Calculate total width
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const avgDaysPerMonth = 30;
    const width = (daysDiff / avgDaysPerMonth) * monthWidth;
    
    return {
        left: startMonthIndex * monthWidth + startDayOffset,
        width: Math.max(width, 30) // Minimum width
    };
}

// Get risk indicator
function getRiskIndicator(risk) {
    // Using different symbols/colors that don't clash with priorities
    switch(risk) {
        case 'high': return '⚠️';      // Warning triangle
        case 'medium': return '◆';     // Diamond
        case 'low': return '●';        // Circle
        default: return '';
    }
}

function getRiskStyle(risk) {
    switch(risk) {
        case 'high': return 'color: #ff6b6b; text-shadow: 0 0 8px #ff6b6b;';      // Bright red
        case 'medium': return 'color: #ffd93d; text-shadow: 0 0 8px #ffd93d;';   // Bright yellow
        case 'low': return 'color: #6bcb77; text-shadow: 0 0 8px #6bcb77;';      // Bright green
        default: return '';
    }
}

function getRiskLabel(risk) {
    switch(risk) {
        case 'high': return '⚠️ High Risk';
        case 'medium': return '◆ Medium Risk';
        case 'low': return '● Low Risk';
        default: return 'Risk';
    }
}

// ==================== STATUS ====================

const STATUS_OPTIONS = [
    { value: 'not-started', label: 'Not Started', color: '#6e7681' },
    { value: 'in-progress', label: 'In Progress', color: '#58a6ff' },
    { value: 'blocked', label: 'Blocked', color: '#da3633' },
    { value: 'at-risk', label: 'At Risk', color: '#d29922' },
    { value: 'completed', label: 'Completed', color: '#3fb950' },
    { value: 'canceled', label: 'Canceled', color: '#484f58' }
];

function getStatusLabel(status) {
    const opt = STATUS_OPTIONS.find(o => o.value === status);
    return opt ? opt.label : 'Not Started';
}

function getStatusColor(status) {
    const opt = STATUS_OPTIONS.find(o => o.value === status);
    return opt ? opt.color : '#6e7681';
}

function getStatusEmoji(status) {
    switch(status) {
        case 'in-progress': return '🔵';
        case 'blocked': return '🔴';
        case 'at-risk': return '🟠';
        case 'completed': return '🟢';
        case 'canceled': return '⚫';
        default: return '⚪';
    }
}

function toggleTaskDetails(taskId) {
    const detailsRow = document.getElementById('taskDetails-' + taskId);
    if (detailsRow) {
        detailsRow.classList.toggle('expanded');
    }
}

// Toggle status dropdown menu
function toggleStatusMenu(event, taskId) {
    event.stopPropagation();
    
    // Close all other open menus
    document.querySelectorAll('.status-dropdown-menu.open').forEach(menu => {
        menu.classList.remove('open');
    });
    
    const menu = document.getElementById('statusMenu-' + taskId);
    if (menu) {
        menu.classList.toggle('open');
    }
}

// Select status and close menu
function selectStatus(taskId, status) {
    updateTask(taskId, 'status', status);
    
    // Close the menu
    document.querySelectorAll('.status-dropdown-menu.open').forEach(menu => {
        menu.classList.remove('open');
    });
}

// Close status menu when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.status-badge-wrapper')) {
        document.querySelectorAll('.status-dropdown-menu.open').forEach(menu => {
            menu.classList.remove('open');
        });
    }
});

function renderStatusCircle(taskId, status) {
    const currentStatus = status || 'not-started';
    const label = getStatusLabel(currentStatus);
    const color = getStatusColor(currentStatus);
    
    return `
        <div class="status-wrapper">
            <div class="status-circle ${currentStatus}" 
                 style="background: ${color}; border-color: ${color};"
                 onclick="toggleStatusDropdown(event, ${taskId})"
                 title="${label}">
            </div>
            <div class="status-tooltip" style="border-color: ${color}; color: ${color};">
                ${label}
            </div>
            <div class="status-select" id="statusSelect-${taskId}">
                ${STATUS_OPTIONS.map(opt => `
                    <div class="status-option" onclick="setTaskStatus(${taskId}, '${opt.value}')">
                        <span class="status-dot" style="background: ${opt.color};"></span>
                        ${opt.label}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function toggleStatusDropdown(event, taskId) {
    event.stopPropagation();
    
    // Close all other dropdowns
    document.querySelectorAll('.status-select.active').forEach(el => {
        el.classList.remove('active');
    });
    
    const dropdown = document.getElementById('statusSelect-' + taskId);
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

function setTaskStatus(taskId, status) {
    updateTaskNoRender(taskId, 'status', status);
    
    // Close dropdown and update circle
    document.querySelectorAll('.status-select.active').forEach(el => {
        el.classList.remove('active');
    });
    
    // Re-render to show updated status
    renderTimeline();
    showToast('✅ Status updated: ' + getStatusLabel(status));
}

// Close status dropdown when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.status-wrapper')) {
        document.querySelectorAll('.status-select.active').forEach(el => {
            el.classList.remove('active');
        });
    }
});

// ==================== DRAGGABLE RISK INDICATOR ====================

let isDraggingRisk = false;
let dragRiskTaskId = null;
let dragRiskBar = null;

function startDragRisk(event, taskId) {
    event.preventDefault();
    event.stopPropagation();
    
    isDraggingRisk = true;
    dragRiskTaskId = taskId;
    dragRiskBar = event.target.closest('.gantt-bar');
    
    document.addEventListener('mousemove', dragRisk);
    document.addEventListener('mouseup', stopDragRisk);
}

function dragRisk(event) {
    if (!isDraggingRisk || !dragRiskBar) return;
    
    const barRect = dragRiskBar.getBoundingClientRect();
    const barWidth = barRect.width;
    const mouseX = event.clientX - barRect.left;
    
    // Calculate percentage position (clamped between 0 and 100)
    let percentage = (mouseX / barWidth) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    
    // Update visual position immediately
    const riskIndicator = dragRiskBar.querySelector('.risk-indicator');
    if (riskIndicator) {
        riskIndicator.style.left = percentage + '%';
    }
}

function stopDragRisk(event) {
    if (!isDraggingRisk || !dragRiskBar) return;
    
    const barRect = dragRiskBar.getBoundingClientRect();
    const barWidth = barRect.width;
    const mouseX = event.clientX - barRect.left;
    
    // Calculate final percentage
    let percentage = (mouseX / barWidth) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    
    // Save the position
    updateTask(dragRiskTaskId, 'riskPosition', Math.round(percentage));
    
    isDraggingRisk = false;
    dragRiskTaskId = null;
    dragRiskBar = null;
    
    document.removeEventListener('mousemove', dragRisk);
    document.removeEventListener('mouseup', stopDragRisk);
}


// Find task by ID
function findTask(taskId) {
    for (const ws of projectData.workstreams) {
        if (ws.tasks) {
            const task = ws.tasks.find(t => t.id === taskId);
            if (task) return { task, workstream: ws };
        }
        if (ws.subgroups) {
            for (const sg of ws.subgroups) {
                const task = sg.tasks.find(t => t.id === taskId);
                if (task) return { task, workstream: ws, subgroup: sg };
            }
        }
    }
    return null;
}

// Update task field
function updateTask(taskId, field, value) {
    const result = findTask(taskId);
    if (result) {
        result.task[field] = value;
        
        // Auto-extend calendar range if dates are outside current range
        if (field === 'start' || field === 'end') {
            const taskDate = new Date(value);
            const currentStart = new Date(projectData.startMonth);
            const currentEnd = new Date(projectData.endMonth);
            
            if (taskDate < currentStart) {
                projectData.startMonth = new Date(taskDate.getFullYear(), taskDate.getMonth(), 1);
                initCalendarInputs();
            }
            if (taskDate > currentEnd) {
                projectData.endMonth = new Date(taskDate.getFullYear(), taskDate.getMonth(), 1);
                initCalendarInputs();
            }
        }
        
        saveData();
        renderTimeline();
        showToast('✅ Updated!');
    }
}

// Update task without re-rendering (for edit panel)
function updateTaskNoRender(taskId, field, value) {
    const result = findTask(taskId);
    if (result) {
        result.task[field] = value;
        
        // Auto-extend calendar range if dates are outside current range
        if (field === 'start' || field === 'end') {
            const taskDate = new Date(value);
            const currentStart = new Date(projectData.startMonth);
            const currentEnd = new Date(projectData.endMonth);
            
            if (taskDate < currentStart) {
                projectData.startMonth = new Date(taskDate.getFullYear(), taskDate.getMonth(), 1);
            }
            if (taskDate > currentEnd) {
                projectData.endMonth = new Date(taskDate.getFullYear(), taskDate.getMonth(), 1);
            }
        }
        
        saveData();
    }
}

// Pin edit panel open on click
function pinEditPanel(taskId, event) {
    event.stopPropagation();
    
    // Close any other open panels
    document.querySelectorAll('.bar-edit-panel.pinned').forEach(panel => {
        panel.classList.remove('pinned');
    });
    
    // Pin this panel
    const panel = document.getElementById('editPanel-' + taskId);
    if (panel) {
        panel.classList.add('pinned');
    }
}

// Close edit panel
function closeEditPanel(taskId) {
    const panel = document.getElementById('editPanel-' + taskId);
    if (panel) {
        panel.classList.remove('pinned');
    }
}

// Apply changes and close panel
function applyAndClose(taskId) {
    closeEditPanel(taskId);
    initCalendarInputs();
    renderTimeline();
    showToast('✅ Changes saved!');
}

// Close panels when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.bar-edit-panel') && !e.target.closest('.gantt-bar')) {
        document.querySelectorAll('.bar-edit-panel.pinned').forEach(panel => {
            panel.classList.remove('pinned');
        });
    }
});

// ==================== COMMENTS ====================

function addComment(taskId) {
    const textarea = document.getElementById('newComment-' + taskId);
    const text = textarea.value.trim();
    
    if (!text) {
        showToast('❌ Please enter a comment');
        return;
    }
    
    const result = findTask(taskId);
    if (result) {
        if (!result.task.comments) {
            result.task.comments = [];
        }
        
        result.task.comments.push({
            text: text,
            date: new Date().toISOString()
        });
        
        saveData();
        
        // Update comments list without closing panel
        const commentsList = document.getElementById('comments-' + taskId);
        const commentCount = document.querySelector(`#editPanel-${taskId} .comment-count`);
        
        if (commentsList) {
            const newComment = document.createElement('div');
            newComment.className = 'comment-item';
            newComment.innerHTML = `
                <div class="comment-meta">
                    <span class="comment-date">Just now</span>
                    <button class="comment-delete" onclick="deleteComment(${taskId}, ${result.task.comments.length - 1})" title="Delete">✕</button>
                </div>
                <div class="comment-text">${escapeHtml(text)}</div>
            `;
            commentsList.appendChild(newComment);
        }
        
        if (commentCount) {
            commentCount.textContent = result.task.comments.length;
        }
        
        textarea.value = '';
        showToast('💬 Comment added!');
    }
}

function deleteComment(taskId, commentIndex) {
    const result = findTask(taskId);
    if (result && result.task.comments) {
        result.task.comments.splice(commentIndex, 1);
        saveData();
        
        // Refresh the panel
        const panel = document.getElementById('editPanel-' + taskId);
        if (panel && panel.classList.contains('pinned')) {
            renderTimeline();
            // Re-pin the panel after render
            setTimeout(() => {
                const newPanel = document.getElementById('editPanel-' + taskId);
                if (newPanel) {
                    newPanel.classList.add('pinned');
                }
            }, 50);
        }
        
        showToast('🗑️ Comment deleted');
    }
}

function formatCommentDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

// Delete task
function deleteTask(taskId) {
    console.log('Delete task called with ID:', taskId);
    if (!confirm('Delete this task?')) return;
    
    const id = Number(taskId);
    
    for (const ws of projectData.workstreams) {
        if (ws.tasks) {
            const idx = ws.tasks.findIndex(t => Number(t.id) === id);
            if (idx !== -1) {
                ws.tasks.splice(idx, 1);
                saveData();
                renderTimeline();
                showToast('🗑️ Task deleted');
                return;
            }
        }
        if (ws.subgroups) {
            for (const sg of ws.subgroups) {
                const idx = sg.tasks.findIndex(t => Number(t.id) === id);
                if (idx !== -1) {
                    sg.tasks.splice(idx, 1);
                    saveData();
                    renderTimeline();
                    showToast('🗑️ Task deleted');
                    return;
                }
            }
        }
    }
    console.log('Task not found with ID:', id);
}

// Delete workstream
function deleteWorkstream(wsId) {
    if (!confirm('Delete this workstream and all its tasks?')) return;
    
    const idx = projectData.workstreams.findIndex(ws => ws.id === wsId);
    if (idx !== -1) {
        projectData.workstreams.splice(idx, 1);
        saveData();
        renderTimeline();
        showToast('🗑️ Workstream deleted');
    }
}

// Update workstream name
function updateWorkstreamName(wsId, newName) {
    const ws = projectData.workstreams.find(w => w.id === wsId);
    if (ws) {
        ws.name = newName;
        saveData();
    }
}

// Render a task row with inline editing
function renderTaskRow(task, isSubTask = false, isSubSubTask = false) {
    const pos = calculateBarPosition(task.start, task.end);
    const labelClass = isSubSubTask ? 'sub-sub-task' : (isSubTask ? 'sub-task' : '');
    const months = getMonths();
    
    return `
        <div class="task-row" data-task-id="${task.id}">
            <div class="task-label ${labelClass}">
                <div class="status-badge-wrapper" id="statusWrapper-${task.id}">
                    <span class="status-badge ${task.status || 'not-started'}" 
                          onclick="toggleStatusMenu(event, ${task.id})">
                        ${getStatusEmoji(task.status)}
                    </span>
                    <div class="status-dropdown-menu" id="statusMenu-${task.id}">
                        <div class="status-dropdown-item" onclick="selectStatus(${task.id}, 'not-started')">
                            <span class="status-dot not-started"></span> Not Started
                        </div>
                        <div class="status-dropdown-item" onclick="selectStatus(${task.id}, 'in-progress')">
                            <span class="status-dot in-progress"></span> In Progress
                        </div>
                        <div class="status-dropdown-item" onclick="selectStatus(${task.id}, 'blocked')">
                            <span class="status-dot blocked"></span> Blocked
                        </div>
                        <div class="status-dropdown-item" onclick="selectStatus(${task.id}, 'at-risk')">
                            <span class="status-dot at-risk"></span> At Risk
                        </div>
                        <div class="status-dropdown-item" onclick="selectStatus(${task.id}, 'completed')">
                            <span class="status-dot completed"></span> Completed
                        </div>
                        <div class="status-dropdown-item" onclick="selectStatus(${task.id}, 'canceled')">
                            <span class="status-dot canceled"></span> Canceled
                        </div>
                    </div>
                </div>
                <input type="text" class="inline-edit task-name-edit" value="${escapeHtml(task.name)}" 
                       onchange="updateTask(${task.id}, 'name', this.value)" title="${escapeHtml(task.name)}">
                <div class="task-meta">
                    <input type="text" class="owner-input" value="${escapeHtml(task.owner || '')}" 
                           placeholder="Owner" onchange="updateTask(${task.id}, 'owner', this.value)" title="Owner">
                    <select class="inline-select priority-select ${task.priority.toLowerCase()}" 
                            onchange="updateTask(${task.id}, 'priority', this.value)">
                        <option value="P0" ${task.priority === 'P0' ? 'selected' : ''}>P0</option>
                        <option value="P1" ${task.priority === 'P1' ? 'selected' : ''}>P1</option>
                        <option value="P2" ${task.priority === 'P2' ? 'selected' : ''}>P2</option>
                    </select>
                    <select class="inline-select size-select" 
                            onchange="updateTask(${task.id}, 'size', this.value)">
                        <option value="S" ${task.size === 'S' ? 'selected' : ''}>S</option>
                        <option value="M" ${task.size === 'M' ? 'selected' : ''}>M</option>
                        <option value="L" ${task.size === 'L' ? 'selected' : ''}>L</option>
                    </select>
                    <input type="date" class="inline-date" value="${task.start}" 
                           onchange="updateTask(${task.id}, 'start', this.value)" title="Start date">
                    <input type="date" class="inline-date" value="${task.end}" 
                           onchange="updateTask(${task.id}, 'end', this.value)" title="End date">
                    <button class="btn-delete-task" onclick="deleteTask(${task.id})" title="Delete task">🗑️</button>
                </div>
            </div>
            <div class="task-timeline">
                ${months.map(() => '<div class="timeline-cell"></div>').join('')}
                ${pos ? `
                    <div class="gantt-bar ${task.priority.toLowerCase()}" 
                         style="left: ${pos.left}px; width: ${pos.width}px;"
                         onclick="pinEditPanel(${task.id}, event)">
                        ${task.risk && task.risk !== 'none' ? `
                            <span class="risk-indicator" 
                                  data-task-id="${task.id}"
                                  style="left: ${task.riskPosition || 50}%; ${getRiskStyle(task.risk)}"
                                  draggable="false"
                                  onmousedown="startDragRisk(event, ${task.id})"
                                  title="${task.riskText ? '' : getRiskLabel(task.risk)}">
                                ${getRiskIndicator(task.risk)}
                                ${task.riskText ? `
                                    <div class="risk-tooltip ${task.risk}">
                                        <div class="risk-tooltip-header">${getRiskLabel(task.risk)}</div>
                                        <div class="risk-tooltip-text">${escapeHtml(task.riskText)}</div>
                                    </div>
                                ` : ''}
                            </span>
                        ` : ''}
                        <div class="bar-pattern">
                            ${Array(Math.floor(pos.width / 10)).fill('<div class="bar-segment"></div>').join('')}
                        </div>
                        
                        <!-- Click Edit Panel -->
                        <div class="bar-edit-panel" id="editPanel-${task.id}" onclick="event.stopPropagation()">
                            <h4>
                                <span>✏️ ${escapeHtml(task.name)}</span>
                                <button class="panel-close-btn" onclick="closeEditPanel(${task.id})" title="Close">✕</button>
                            </h4>
                            <div class="bar-edit-row">
                                <div class="bar-edit-group">
                                    <label>Start Date</label>
                                    <input type="date" value="${task.start}" 
                                           onchange="updateTaskNoRender(${task.id}, 'start', this.value)">
                                </div>
                                <div class="bar-edit-group">
                                    <label>End Date</label>
                                    <input type="date" value="${task.end}" 
                                           onchange="updateTaskNoRender(${task.id}, 'end', this.value)">
                                </div>
                            </div>
                            <div class="bar-edit-row">
                                <div class="bar-edit-group">
                                    <label>Priority</label>
                                    <select onchange="updateTaskNoRender(${task.id}, 'priority', this.value)">
                                        <option value="P0" ${task.priority === 'P0' ? 'selected' : ''}>P0 - Critical</option>
                                        <option value="P1" ${task.priority === 'P1' ? 'selected' : ''}>P1 - High</option>
                                        <option value="P2" ${task.priority === 'P2' ? 'selected' : ''}>P2 - Medium</option>
                                    </select>
                                </div>
                                <div class="bar-edit-group">
                                    <label>Size</label>
                                    <select onchange="updateTaskNoRender(${task.id}, 'size', this.value)">
                                        <option value="S" ${task.size === 'S' ? 'selected' : ''}>Small</option>
                                        <option value="M" ${task.size === 'M' ? 'selected' : ''}>Medium</option>
                                        <option value="L" ${task.size === 'L' ? 'selected' : ''}>Large</option>
                                    </select>
                                </div>
                            </div>
                            <div class="bar-edit-row">
                                <div class="bar-edit-group">
                                    <label>Owner</label>
                                    <input type="text" value="${escapeHtml(task.owner || '')}" 
                                           placeholder="Enter owner"
                                           onchange="updateTaskNoRender(${task.id}, 'owner', this.value)">
                                </div>
                                <div class="bar-edit-group">
                                    <label>Status</label>
                                    <select onchange="updateTaskNoRender(${task.id}, 'status', this.value)">
                                        ${STATUS_OPTIONS.map(opt => `
                                            <option value="${opt.value}" ${task.status === opt.value ? 'selected' : ''}>
                                                ${opt.label}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                            <div class="bar-edit-row">
                                <div class="bar-edit-group">
                                    <label>Risk Level</label>
                                    <select onchange="updateTaskNoRender(${task.id}, 'risk', this.value)">
                                        <option value="none" ${!task.risk || task.risk === 'none' ? 'selected' : ''}>None</option>
                                        <option value="low" ${task.risk === 'low' ? 'selected' : ''}>● Low</option>
                                        <option value="medium" ${task.risk === 'medium' ? 'selected' : ''}>◆ Medium</option>
                                        <option value="high" ${task.risk === 'high' ? 'selected' : ''}>⚠️ High</option>
                                    </select>
                                </div>
                            </div>
                            <div class="bar-edit-row">
                                <div class="bar-edit-group" style="flex: 1;">
                                    <label>Risk Description</label>
                                    <textarea rows="2" placeholder="Describe the risk..."
                                              onchange="updateTaskNoRender(${task.id}, 'riskText', this.value)">${escapeHtml(task.riskText || '')}</textarea>
                                </div>
                            </div>
                            
                            <!-- Comments Section -->
                            <div class="comments-section">
                                <div class="comments-header">
                                    <label>💬 Comments</label>
                                    <span class="comment-count">${(task.comments || []).length}</span>
                                </div>
                                <div class="comments-list" id="comments-${task.id}">
                                    ${(task.comments || []).map((comment, idx) => `
                                        <div class="comment-item">
                                            <div class="comment-meta">
                                                <span class="comment-date">${formatCommentDate(comment.date)}</span>
                                                <button class="comment-delete" onclick="deleteComment(${task.id}, ${idx})" title="Delete">✕</button>
                                            </div>
                                            <div class="comment-text">${escapeHtml(comment.text)}</div>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="add-comment">
                                    <textarea id="newComment-${task.id}" rows="2" placeholder="Add a comment..."></textarea>
                                    <button class="btn-add-comment" onclick="addComment(${task.id})">+ Add</button>
                                </div>
                            </div>
                            
                            <div class="bar-edit-actions">
                                <button class="btn-apply" onclick="applyAndClose(${task.id})">✓ Apply & Close</button>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Update workstream owner
function updateWorkstreamOwner(wsId, owner) {
    const ws = projectData.workstreams.find(w => w.id === wsId);
    if (ws) {
        ws.owner = owner;
        saveData();
    }
}

// Render workstream with editable header
function renderWorkstream(workstream, index) {
    const months = getMonths();
    
    let tasksHtml = '';
    
    if (workstream.tasks) {
        tasksHtml = workstream.tasks.map(task => renderTaskRow(task)).join('');
    }
    
    if (workstream.subgroups) {
        workstream.subgroups.forEach(subgroup => {
            tasksHtml += `
                <div class="task-row subgroup-header">
                    <div class="task-label sub-task" style="font-weight: 500; color: var(--accent-purple);">
                        ${escapeHtml(subgroup.name)}
                    </div>
                    <div class="task-timeline">
                        ${months.map(() => '<div class="timeline-cell"></div>').join('')}
                    </div>
                </div>
            `;
            tasksHtml += subgroup.tasks.map(task => renderTaskRow(task, true)).join('');
        });
    }
    
    return `
        <div class="workstream-row" data-workstream-id="${workstream.id}">
            <div class="workstream-header">
                <div class="workstream-label">
                    <span class="workstream-number">${index + 1}</span>
                    <input type="text" class="inline-edit workstream-name-edit" value="${escapeHtml(workstream.name)}"
                           onchange="updateWorkstreamName(${workstream.id}, this.value)" title="Click to edit workstream name">
                    <input type="text" class="owner-input" value="${escapeHtml(workstream.owner || '')}" 
                           placeholder="Owner" onchange="updateWorkstreamOwner(${workstream.id}, this.value)" 
                           title="Workstream Owner" style="margin-left: 8px;">
                    <div class="workstream-actions">
                        <button onclick="addTaskToWorkstream(${workstream.id})" title="Add Task">➕</button>
                        <button onclick="deleteWorkstream(${workstream.id})" title="Delete Workstream">🗑️</button>
                    </div>
                </div>
                <div class="workstream-timeline">
                    ${months.map(() => '<div class="timeline-cell"></div>').join('')}
                </div>
            </div>
            ${tasksHtml}
        </div>
    `;
}

// Render entire timeline
function renderTimeline() {
    renderMonthsHeader();
    
    const body = document.getElementById('timelineBody');
    body.innerHTML = projectData.workstreams.map((ws, i) => renderWorkstream(ws, i)).join('');
}

// Modal functions
function openModal(title = 'Add Task') {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('taskModal').classList.add('active');
}

function closeModal() {
    document.getElementById('taskModal').classList.remove('active');
    document.getElementById('taskForm').reset();
    document.getElementById('riskTextGroup').style.display = 'none';
    document.getElementById('taskRiskText').value = '';
}

function openWorkstreamModal() {
    document.getElementById('workstreamModal').classList.add('active');
}

function closeWorkstreamModal() {
    document.getElementById('workstreamModal').classList.remove('active');
    document.getElementById('workstreamForm').reset();
}

// Add task to workstream
let currentWorkstreamId = null;

function addTaskToWorkstream(workstreamId) {
    currentWorkstreamId = workstreamId;
    openModal('Add Task');
}

// Show/hide risk text based on risk selection
document.getElementById('taskRisk').addEventListener('change', function() {
    const riskTextGroup = document.getElementById('riskTextGroup');
    if (this.value !== 'none') {
        riskTextGroup.style.display = 'block';
    } else {
        riskTextGroup.style.display = 'none';
        document.getElementById('taskRiskText').value = '';
    }
});

// Save task
document.getElementById('taskForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const task = {
        id: Date.now(),
        name: document.getElementById('taskName').value,
        priority: document.getElementById('taskPriority').value,
        size: document.getElementById('taskSize').value,
        start: document.getElementById('taskStart').value,
        end: document.getElementById('taskEnd').value,
        status: document.getElementById('taskStatus').value,
        risk: document.getElementById('taskRisk').value,
        riskText: document.getElementById('taskRiskText').value,
        owner: document.getElementById('taskOwner').value
    };
    
    // Auto-extend calendar range if task dates are outside
    const startDate = new Date(task.start);
    const endDate = new Date(task.end);
    const currentStart = new Date(projectData.startMonth);
    const currentEnd = new Date(projectData.endMonth);
    
    let rangeChanged = false;
    if (startDate < currentStart) {
        projectData.startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        rangeChanged = true;
    }
    if (endDate > currentEnd) {
        projectData.endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        rangeChanged = true;
    }
    if (rangeChanged) {
        initCalendarInputs();
    }
    
    if (currentWorkstreamId) {
        const workstream = projectData.workstreams.find(ws => ws.id === currentWorkstreamId);
        if (workstream) {
            if (!workstream.tasks) workstream.tasks = [];
            workstream.tasks.push(task);
        }
    }
    
    saveData();
    renderTimeline();
    closeModal();
    showToast('✅ Task added!');
});

// Add workstream
document.getElementById('workstreamForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const workstream = {
        id: Date.now(),
        name: document.getElementById('workstreamName').value,
        owner: document.getElementById('workstreamOwner').value,
        tasks: []
    };
    
    projectData.workstreams.push(workstream);
    
    saveData();
    renderTimeline();
    closeWorkstreamModal();
    showToast('✅ Workstream added!');
});

// Calendar range change handlers
function updateCalendarRange() {
    const startInput = document.getElementById('startMonth');
    const endInput = document.getElementById('endMonth');
    
    if (startInput.value && endInput.value) {
        const [startYear, startMonth] = startInput.value.split('-').map(Number);
        const [endYear, endMonth] = endInput.value.split('-').map(Number);
        
        projectData.startMonth = new Date(startYear, startMonth - 1, 1);
        projectData.endMonth = new Date(endYear, endMonth - 1, 1);
        
        saveData();
        renderTimeline();
        showToast('📅 Calendar range updated!');
    }
}

function initCalendarInputs() {
    const startInput = document.getElementById('startMonth');
    const endInput = document.getElementById('endMonth');
    
    // Set initial values
    const startDate = new Date(projectData.startMonth);
    const endDate = new Date(projectData.endMonth);
    
    startInput.value = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
    endInput.value = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Add event listeners
    startInput.addEventListener('change', updateCalendarRange);
    endInput.addEventListener('change', updateCalendarRange);
}

// ==================== EXPORT FUNCTIONS ====================

// Export to CSV for Google Sheets
function exportToCSV() {
    let csvContent = "Workstream,Workstream Owner,Task,Task Owner,Priority,Size,Start Date,End Date,Risk\n";
    
    projectData.workstreams.forEach(ws => {
        if (ws.tasks) {
            ws.tasks.forEach(task => {
                csvContent += `"${ws.name}","${ws.owner || ''}","${task.name}","${task.owner || ''}","${task.priority}","${task.size}","${task.start}","${task.end}","${task.risk || 'none'}"\n`;
            });
        }
        if (ws.subgroups) {
            ws.subgroups.forEach(sg => {
                sg.tasks.forEach(task => {
                    csvContent += `"${ws.name} > ${sg.name}","${ws.owner || ''}","${task.name}","${task.owner || ''}","${task.priority}","${task.size}","${task.start}","${task.end}","${task.risk || 'none'}"\n`;
                });
            });
        }
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-timeline.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('📊 Exported to CSV! Open in Google Sheets');
}

// Export to JSON
function exportToJSON() {
    const dataStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-timeline.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Data exported as JSON!');
}

// Import data
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    if (file.name.endsWith('.json')) {
        reader.onload = function(e) {
            try {
                projectData = JSON.parse(e.target.result);
                saveData();
                renderTimeline();
                showToast('✅ Data imported successfully!');
            } catch (error) {
                showToast('❌ Error importing JSON file');
                console.error(error);
            }
        };
        reader.readAsText(file);
    } else if (file.name.endsWith('.csv')) {
        reader.onload = function(e) {
            try {
                importCSV(e.target.result);
                showToast('✅ CSV imported successfully!');
            } catch (error) {
                showToast('❌ Error importing CSV file');
                console.error(error);
            }
        };
        reader.readAsText(file);
    }
}

// Import CSV
function importCSV(csvContent) {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    // Clear existing data
    projectData.workstreams = [];
    const workstreamMap = new Map();
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV line (handling quoted values)
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!values || values.length < 6) continue;
        
        const wsName = values[0].replace(/"/g, '');
        const taskName = values[1].replace(/"/g, '');
        const priority = values[2].replace(/"/g, '');
        const size = values[3].replace(/"/g, '');
        const start = values[4].replace(/"/g, '');
        const end = values[5].replace(/"/g, '');
        const risk = values[6] ? values[6].replace(/"/g, '') : 'none';
        
        // Find or create workstream
        if (!workstreamMap.has(wsName)) {
            const ws = {
                id: Date.now() + i,
                name: wsName,
                tasks: []
            };
            workstreamMap.set(wsName, ws);
            projectData.workstreams.push(ws);
        }
        
        const workstream = workstreamMap.get(wsName);
        workstream.tasks.push({
            id: Date.now() + i * 1000 + Math.random() * 1000,
            name: taskName,
            priority: priority,
            size: size,
            start: start,
            end: end,
            risk: risk
        });
    }
    
    saveData();
    renderTimeline();
}

// Event listeners
document.getElementById('addWorkstreamBtn').addEventListener('click', openWorkstreamModal);

document.getElementById('exportCSVBtn').addEventListener('click', exportToCSV);

document.getElementById('importBtn').addEventListener('click', function() {
    document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', importData);

document.getElementById('importGoogleBtn').addEventListener('click', openGoogleModal);

// ==================== GOOGLE SHEETS IMPORT ====================

function openGoogleModal() {
    document.getElementById('googleSheetsModal').classList.add('active');
}

function closeGoogleModal() {
    document.getElementById('googleSheetsModal').classList.remove('active');
}

function switchImportTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.import-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.import-tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
}

async function importFromGoogleUrl() {
    const url = document.getElementById('googleSheetUrl').value.trim();
    
    if (!url) {
        showToast('❌ Please enter a Google Sheets URL');
        return;
    }
    
    // Check if it's a valid Google Sheets publish URL
    if (!url.includes('docs.google.com/spreadsheets') || !url.includes('pub')) {
        showToast('❌ Please use a "Publish to web" CSV URL');
        return;
    }
    
    try {
        showToast('⏳ Fetching data from Google Sheets...');
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const csvText = await response.text();
        parseAndImportCSV(csvText);
        
        closeGoogleModal();
        showToast('✅ Imported from Google Sheets!');
    } catch (error) {
        console.error('Import error:', error);
        showToast('❌ Failed to fetch. Make sure the sheet is published to web.');
    }
}

function importFromPaste() {
    const pasteData = document.getElementById('pasteData').value.trim();
    
    if (!pasteData) {
        showToast('❌ Please paste some data');
        return;
    }
    
    parseAndImportCSV(pasteData);
    closeGoogleModal();
    showToast('✅ Data imported successfully!');
}

function parseAndImportCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        showToast('❌ Not enough data to import');
        return;
    }
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    // Group tasks by workstream
    const workstreamMap = new Map();
    
    dataLines.forEach((line, index) => {
        // Handle both comma and tab separated
        const delimiter = line.includes('\t') ? '\t' : ',';
        const cells = line.split(delimiter).map(cell => cell.replace(/^"|"$/g, '').trim());
        
        if (cells.length >= 2) {
            const [workstreamName, taskName, owner, priority, size, start, end, risk] = cells;
            
            if (!workstreamMap.has(workstreamName)) {
                workstreamMap.set(workstreamName, {
                    id: Date.now() + index,
                    name: workstreamName,
                    owner: '',
                    tasks: []
                });
            }
            
            if (taskName) {
                workstreamMap.get(workstreamName).tasks.push({
                    id: Date.now() + index + 1000,
                    name: taskName,
                    owner: owner || '',
                    priority: priority || 'P1',
                    size: size || 'M',
                    start: formatDateForInput(start) || getDefaultStartDate(),
                    end: formatDateForInput(end) || getDefaultEndDate(),
                    risk: (risk || 'none').toLowerCase(),
                    riskText: ''
                });
            }
        }
    });
    
    // Add to project data
    workstreamMap.forEach(ws => {
        projectData.workstreams.push(ws);
    });
    
    // Extend calendar range if needed
    extendCalendarForAllTasks();
    
    saveData();
    initCalendarInputs();
    renderTimeline();
}

function formatDateForInput(dateStr) {
    if (!dateStr) return null;
    
    // Try to parse various date formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }
    
    // Try MM/DD/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const [month, day, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return null;
}

function getDefaultStartDate() {
    const date = new Date();
    return date.toISOString().split('T')[0];
}

function getDefaultEndDate() {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
}

function extendCalendarForAllTasks() {
    projectData.workstreams.forEach(ws => {
        if (ws.tasks) {
            ws.tasks.forEach(task => {
                const startDate = new Date(task.start);
                const endDate = new Date(task.end);
                const currentStart = new Date(projectData.startMonth);
                const currentEnd = new Date(projectData.endMonth);
                
                if (startDate < currentStart) {
                    projectData.startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                }
                if (endDate > currentEnd) {
                    projectData.endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
                }
            });
        }
    });
}

function downloadTemplate() {
    const template = `Workstream,Task,Owner,Priority,Size,Start Date,End Date,Risk
Project Alpha,Design Phase,John,P0,L,2025-01-01,2025-02-15,medium
Project Alpha,Development,Sarah,P0,L,2025-02-01,2025-04-30,high
Project Alpha,Testing,Mike,P1,M,2025-04-15,2025-05-31,low
Project Beta,Planning,Jane,P1,S,2025-01-15,2025-02-01,none
Project Beta,Implementation,Team,P1,L,2025-02-01,2025-05-01,medium`;
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-timeline-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('📥 Template downloaded!');
}

// Save to localStorage (program-aware)
function saveData() {
    console.log('Saving data for program:', currentProgram);
    if (currentProgram) {
        saveProgramData(currentProgram, projectData);
        console.log('Saved to program_' + currentProgram);
    } else {
        localStorage.setItem('projectTimeline', JSON.stringify(projectData));
        console.log('Saved to default projectTimeline');
    }
}

// Load from localStorage
function loadData() {
    // First check URL for program
    initProgramFromURL();
    
    if (!currentProgram) {
        // Load default/legacy data
        const saved = localStorage.getItem('projectTimeline');
        if (saved) {
            try {
                projectData = JSON.parse(saved);
            } catch (e) {
                console.log('Starting fresh');
                projectData = { ...emptyData };
            }
        } else {
            projectData = { ...emptyData };
        }
    }
    
    // Render program selector
    renderProgramSelector();
    
    console.log('Loaded program:', currentProgram, 'with', projectData.workstreams?.length || 0, 'workstreams');
}

// Toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Utility function
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initCalendarInputs();
    renderTimeline();
});
