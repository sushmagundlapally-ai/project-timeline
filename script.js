/**
 * Project Timeline - Workstream & Task Tracker
 * 
 * Created by: Sushma Gundlapally
 * Copyright © 2025 Sushma Gundlapally. All rights reserved.
 * 
 * Features:
 * - Visual Gantt chart for workstreams and tasks
 * - AI-powered health scoring and executive summaries
 * - Drag-and-drop task reordering
 * - Multi-program management
 * - Google Sheets import/export
 * - Risk tracking and status management
 */

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
    if (!e.target.closest('.dependency-wrapper')) {
        document.querySelectorAll('.dependency-menu.open').forEach(menu => {
            menu.classList.remove('open');
        });
    }
});

// ==================== DEPENDENCIES ====================

function toggleDependencyMenu(event, taskId) {
    event.stopPropagation();
    
    // Close all other open menus
    document.querySelectorAll('.dependency-menu.open').forEach(menu => {
        menu.classList.remove('open');
    });
    
    const menu = document.getElementById('depMenu-' + taskId);
    if (menu) {
        menu.classList.toggle('open');
    }
}

function saveDependency(taskId) {
    const depType = document.getElementById('depType-' + taskId).value;
    const depRow = document.getElementById('depRow-' + taskId).value;
    
    const result = findTask(taskId);
    if (result) {
        result.task.depType = depType;
        result.task.depRow = depRow ? parseInt(depRow) : null;
        saveData();
        renderTimeline();
        
        if (depType && depRow) {
            showToast(`🔗 Linked to Row ${depRow}`);
            highlightRow(parseInt(depRow));
        } else {
            showToast('🔗 Dependency removed');
        }
    }
    
    // Close menu
    document.querySelectorAll('.dependency-menu.open').forEach(menu => {
        menu.classList.remove('open');
    });
}

function highlightRow(rowNum) {
    // Find and highlight the target row briefly
    const rows = document.querySelectorAll('.task-row');
    rows.forEach(row => {
        const rowNumEl = row.querySelector('.row-number');
        if (rowNumEl && parseInt(rowNumEl.textContent) === rowNum) {
            row.classList.add('highlight-dep');
            setTimeout(() => {
                row.classList.remove('highlight-dep');
            }, 2000);
        }
    });
}

// Assign row numbers before rendering
function assignRowNumbers() {
    let rowNum = 1;
    projectData.workstreams.forEach(ws => {
        if (ws.tasks) {
            ws.tasks.forEach(task => {
                task.rowNum = rowNum++;
            });
        }
        if (ws.subgroups) {
            ws.subgroups.forEach(sg => {
                sg.tasks.forEach(task => {
                    task.rowNum = rowNum++;
                });
            });
        }
    });
}

// Get dependency icon based on type
function getDependencyIcon(task) {
    if (task.depType === 'parallel') {
        return '∥';
    } else if (task.depType === 'dependency') {
        return '∞';
    }
    return '○';
}

// ==================== BULK UPLOAD ====================

let bulkUploadWorkstreamId = null;

function openBulkUploadModal(workstreamId) {
    bulkUploadWorkstreamId = workstreamId;
    document.getElementById('bulkUploadModal').classList.add('active');
    document.getElementById('bulkTasksData').value = '';
    document.getElementById('bulkTasksData').focus();
}

function closeBulkUploadModal() {
    document.getElementById('bulkUploadModal').classList.remove('active');
    bulkUploadWorkstreamId = null;
}

function processBulkUpload() {
    const textarea = document.getElementById('bulkTasksData');
    const data = textarea.value.trim();
    
    if (!data) {
        showToast('❌ Please enter task data');
        return;
    }
    
    if (!bulkUploadWorkstreamId) {
        showToast('❌ No workstream selected');
        return;
    }
    
    const workstream = projectData.workstreams.find(ws => ws.id === bulkUploadWorkstreamId);
    if (!workstream) {
        showToast('❌ Workstream not found');
        return;
    }
    
    if (!workstream.tasks) {
        workstream.tasks = [];
    }
    
    // Parse the input - support various formats
    const lines = data.split('\n').filter(line => line.trim());
    let addedCount = 0;
    
    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.toLowerCase().startsWith('task') || trimmedLine.startsWith('#')) {
            return; // Skip headers or comments
        }
        
        // Detect delimiter (tab, comma, or pipe)
        let delimiter = '\t';
        if (!line.includes('\t')) {
            if (line.includes('|')) {
                delimiter = '|';
            } else if (line.includes(',')) {
                delimiter = ',';
            }
        }
        
        const cells = line.split(delimiter).map(c => c.replace(/^"|"$/g, '').trim());
        
        // Parse fields: Task Name, Owner, Priority, Size, Start Date, End Date, Risk, Description
        const taskName = cells[0] || '';
        const owner = cells[1] || '';
        const priority = (cells[2] || 'P1').toUpperCase();
        const size = (cells[3] || 'M').toUpperCase();
        const startDate = formatDateForInput(cells[4]) || getDefaultStartDate();
        const endDate = formatDateForInput(cells[5]) || getDefaultEndDate();
        const risk = (cells[6] || 'none').toLowerCase();
        const description = cells[7] || '';
        
        if (taskName) {
            workstream.tasks.push({
                id: Date.now() + index + Math.random() * 1000,
                name: taskName,
                description: description,
                owner: owner,
                priority: ['P0', 'P1', 'P2'].includes(priority) ? priority : 'P1',
                size: ['S', 'M', 'L'].includes(size) ? size : 'M',
                start: startDate,
                end: endDate,
                risk: ['none', 'low', 'medium', 'high'].includes(risk) ? risk : 'none',
                status: 'not-started',
                riskText: '',
                comments: []
            });
            addedCount++;
        }
    });
    
    if (addedCount > 0) {
        extendCalendarForAllTasks();
        saveData();
        initCalendarInputs();
        renderTimeline();
        closeBulkUploadModal();
        showToast(`✅ Added ${addedCount} task${addedCount > 1 ? 's' : ''} to workstream!`);
    } else {
        showToast('❌ No valid tasks found in input');
    }
}

// ==================== VIEW TASK DETAILS ====================

function viewTaskDetails(taskId) {
    const result = findTask(taskId);
    if (!result) return;
    
    const task = result.task;
    document.getElementById('viewTaskTitle').textContent = task.name;
    document.getElementById('viewTaskDescription').textContent = task.description || 'No description added.';
    document.getElementById('viewTaskOwner').textContent = task.owner || 'Unassigned';
    document.getElementById('viewTaskPriority').textContent = task.priority;
    document.getElementById('viewTaskSize').textContent = task.size;
    document.getElementById('viewTaskStatus').textContent = getStatusLabel(task.status);
    document.getElementById('viewTaskDates').textContent = `${task.start} → ${task.end}`;
    document.getElementById('viewTaskRisk').textContent = task.risk === 'none' ? 'None' : getRiskLabel(task.risk);
    document.getElementById('viewTaskRiskText').textContent = task.riskText || 'No risk details.';
    
    // Show/hide risk section based on risk level
    const riskSection = document.getElementById('viewRiskSection');
    if (task.risk && task.risk !== 'none') {
        riskSection.style.display = 'block';
    } else {
        riskSection.style.display = 'none';
    }
    
    // Comments
    const commentsContainer = document.getElementById('viewTaskComments');
    if (task.comments && task.comments.length > 0) {
        commentsContainer.innerHTML = task.comments.map(c => `
            <div class="view-comment">
                <span class="view-comment-date">${formatCommentDate(c.date)}</span>
                <span class="view-comment-text">${escapeHtml(c.text)}</span>
            </div>
        `).join('');
    } else {
        commentsContainer.innerHTML = '<div class="no-comments">No comments yet.</div>';
    }
    
    document.getElementById('viewTaskModal').classList.add('active');
}

function closeViewTaskModal() {
    document.getElementById('viewTaskModal').classList.remove('active');
}

// ==================== DRAG AND DROP ====================

let draggedTaskId = null;

function handleDragStart(event, taskId) {
    draggedTaskId = taskId;
    event.target.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', taskId);
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    const taskRow = event.target.closest('.task-row');
    if (taskRow && !taskRow.classList.contains('dragging')) {
        // Remove drag-over from all rows
        document.querySelectorAll('.task-row.drag-over').forEach(row => {
            row.classList.remove('drag-over');
        });
        taskRow.classList.add('drag-over');
    }
}

function handleDrop(event, targetTaskId) {
    event.preventDefault();
    
    if (draggedTaskId === targetTaskId) return;
    
    // Find source and target tasks
    const sourceTask = findTask(draggedTaskId);
    const targetTask = findTask(targetTaskId);
    
    if (!sourceTask || !targetTask) return;
    
    // Find workstreams
    const sourceWs = projectData.workstreams.find(ws => 
        ws.tasks && ws.tasks.some(t => t.id === draggedTaskId)
    );
    const targetWs = projectData.workstreams.find(ws => 
        ws.tasks && ws.tasks.some(t => t.id === targetTaskId)
    );
    
    if (!sourceWs || !targetWs) return;
    
    // Remove from source
    const sourceIndex = sourceWs.tasks.findIndex(t => t.id === draggedTaskId);
    const [movedTask] = sourceWs.tasks.splice(sourceIndex, 1);
    
    // Insert at target position
    const targetIndex = targetWs.tasks.findIndex(t => t.id === targetTaskId);
    targetWs.tasks.splice(targetIndex, 0, movedTask);
    
    saveData();
    renderTimeline();
    showToast('✅ Task moved!');
}

function handleDragEnd(event) {
    draggedTaskId = null;
    event.target.classList.remove('dragging');
    document.querySelectorAll('.task-row.drag-over').forEach(row => {
        row.classList.remove('drag-over');
    });
}

// ==================== WORKSTREAM DRAG AND DROP ====================

let draggedWorkstreamId = null;

function startWorkstreamDrag(event, workstreamId) {
    event.stopPropagation();
    draggedWorkstreamId = workstreamId;
    
    const wsRow = document.querySelector(`.workstream-row[data-workstream-id="${workstreamId}"]`);
    if (wsRow) {
        wsRow.classList.add('ws-dragging');
    }
    
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', 'ws-' + workstreamId);
}

function handleWorkstreamDragStart(event, workstreamId) {
    // Prevent if not clicking drag handle
    if (!event.target.classList.contains('ws-drag-handle')) {
        event.preventDefault();
        return false;
    }
    startWorkstreamDrag(event, workstreamId);
}

function handleWorkstreamDragOver(event) {
    if (!draggedWorkstreamId) return;
    
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    const wsRow = event.target.closest('.workstream-row');
    if (wsRow && !wsRow.classList.contains('ws-dragging')) {
        document.querySelectorAll('.workstream-row.ws-drag-over').forEach(row => {
            row.classList.remove('ws-drag-over');
        });
        wsRow.classList.add('ws-drag-over');
    }
}

function handleWorkstreamDrop(event, targetWorkstreamId) {
    if (!draggedWorkstreamId) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    if (draggedWorkstreamId === targetWorkstreamId) {
        handleWorkstreamDragEnd(event);
        return;
    }
    
    // Find indices
    const sourceIndex = projectData.workstreams.findIndex(ws => ws.id === draggedWorkstreamId);
    const targetIndex = projectData.workstreams.findIndex(ws => ws.id === targetWorkstreamId);
    
    if (sourceIndex === -1 || targetIndex === -1) {
        handleWorkstreamDragEnd(event);
        return;
    }
    
    // Remove and insert
    const [movedWorkstream] = projectData.workstreams.splice(sourceIndex, 1);
    projectData.workstreams.splice(targetIndex, 0, movedWorkstream);
    
    draggedWorkstreamId = null;
    
    saveData();
    renderTimeline();
    showToast('✅ Workstream moved with all tasks!');
}

function handleWorkstreamDragEnd(event) {
    draggedWorkstreamId = null;
    document.querySelectorAll('.workstream-row.ws-dragging').forEach(row => {
        row.classList.remove('ws-dragging');
    });
    document.querySelectorAll('.workstream-row.ws-drag-over').forEach(row => {
        row.classList.remove('ws-drag-over');
    });
}

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
        <div class="task-row" data-task-id="${task.id}" data-workstream-id="${task.wsId}" draggable="true"
             ondragstart="handleDragStart(event, ${task.id})"
             ondragover="handleDragOver(event)"
             ondrop="handleDrop(event, ${task.id})"
             ondragend="handleDragEnd(event)">
            <div class="task-label ${labelClass}">
                <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
                <span class="row-number">${task.rowNum || ''}</span>
                <div class="dependency-wrapper" id="depWrapper-${task.id}">
                    <span class="dependency-badge ${task.depType || ''}" 
                          onclick="toggleDependencyMenu(event, ${task.id})"
                          title="${task.depType === 'parallel' ? 'Parallel: Row ' + task.depRow : task.depType === 'dependency' ? 'Depends on: Row ' + task.depRow : 'Add dependency'}">
                        ${getDependencyIcon(task)}
                    </span>
                    ${task.depType && task.depRow ? `
                        <span class="dep-arrow ${task.depRow < task.rowNum ? 'up' : 'down'}" 
                              onclick="highlightRow(${task.depRow})"
                              title="Go to Row ${task.depRow}">
                            ${task.depRow < task.rowNum ? '↑' : '↓'}
                            <span class="dep-arrow-label">${task.depRow}</span>
                        </span>
                    ` : ''}
                    <div class="dependency-menu" id="depMenu-${task.id}">
                        <div class="dep-menu-header">Link to Row</div>
                        <div class="dep-menu-row">
                            <select id="depType-${task.id}" class="dep-type-select">
                                <option value="" ${!task.depType ? 'selected' : ''}>None</option>
                                <option value="parallel" ${task.depType === 'parallel' ? 'selected' : ''}>∥ Parallel</option>
                                <option value="dependency" ${task.depType === 'dependency' ? 'selected' : ''}>∞ Depends On</option>
                            </select>
                        </div>
                        <div class="dep-menu-row">
                            <input type="number" id="depRow-${task.id}" class="dep-row-input" 
                                   placeholder="Row #" value="${task.depRow || ''}" min="1">
                        </div>
                        <button class="dep-save-btn" onclick="saveDependency(${task.id})">Save</button>
                    </div>
                </div>
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
                <div class="task-name-wrapper">
                    <input type="text" class="inline-edit task-name-edit" value="${escapeHtml(task.name)}" 
                           onchange="updateTask(${task.id}, 'name', this.value)" title="${escapeHtml(task.name)}">
                    <button class="btn-view-task" onclick="viewTaskDetails(${task.id})" title="View full details">👁️</button>
                    <div class="task-name-tooltip">${escapeHtml(task.name)}${task.description ? '<br><span class="tooltip-desc">' + escapeHtml(task.description) + '</span>' : ''}</div>
                </div>
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
                                    <label>Description</label>
                                    <textarea rows="2" placeholder="Task description..."
                                              onchange="updateTaskNoRender(${task.id}, 'description', this.value)">${escapeHtml(task.description || '')}</textarea>
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
        <div class="workstream-row" data-workstream-id="${workstream.id}"
             ondragover="handleWorkstreamDragOver(event)"
             ondrop="handleWorkstreamDrop(event, ${workstream.id})"
             ondragend="handleWorkstreamDragEnd(event)">
            <div class="workstream-header">
                <div class="workstream-label">
                    <span class="ws-drag-handle" draggable="true" 
                          ondragstart="startWorkstreamDrag(event, ${workstream.id})"
                          title="Drag to reorder workstream">⋮⋮</span>
                    <span class="workstream-number">${index + 1}</span>
                    <input type="text" class="inline-edit workstream-name-edit" value="${escapeHtml(workstream.name)}"
                           onchange="updateWorkstreamName(${workstream.id}, this.value)" title="Click to edit workstream name">
                    <input type="text" class="owner-input" value="${escapeHtml(workstream.owner || '')}" 
                           placeholder="Owner" onchange="updateWorkstreamOwner(${workstream.id}, this.value)" 
                           title="Workstream Owner" style="margin-left: 8px;">
                    <div class="workstream-actions">
                        <button onclick="addTaskToWorkstream(${workstream.id})" title="Add Task">➕</button>
                        <button onclick="openBulkUploadModal(${workstream.id})" title="Bulk Upload Tasks">📋</button>
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
    assignRowNumbers();
    renderMonthsHeader();
    
    const body = document.getElementById('timelineBody');
    body.innerHTML = projectData.workstreams.map((ws, i) => renderWorkstream(ws, i)).join('');
    
    // Update health score display
    updateHealthScoreDisplay();
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
        description: document.getElementById('taskDescription').value,
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

// ==================== HEALTH SCORE DISPLAY ====================

function updateHealthScoreDisplay() {
    const scoreEl = document.getElementById('healthScoreValue');
    const statusEl = document.getElementById('healthScoreStatus');
    const circleEl = document.getElementById('healthScoreCircle');
    
    if (!scoreEl || !statusEl || !circleEl) return;
    
    // Calculate health score
    const healthData = calculateHealthScore();
    
    // Update display
    scoreEl.textContent = healthData.score;
    statusEl.textContent = healthData.status;
    
    // Update colors
    statusEl.className = 'health-score-status ' + healthData.className;
    circleEl.style.setProperty('--health-color', healthData.color);
    circleEl.style.setProperty('--health-pct', healthData.score + '%');
}

function calculateHealthScore() {
    let statusCounts = {
        'not-started': 0,
        'in-progress': 0,
        'blocked': 0,
        'at-risk': 0,
        'completed': 0,
        'canceled': 0
    };
    
    let riskCounts = { low: 0, medium: 0, high: 0 };
    let totalTasks = 0;
    let overdueTasks = 0;
    const today = new Date();
    
    // Analyze all workstreams and tasks
    if (projectData.workstreams) {
        projectData.workstreams.forEach(ws => {
            if (ws.tasks) {
                ws.tasks.forEach(task => {
                    totalTasks++;
                    
                    if (task.status && statusCounts.hasOwnProperty(task.status)) {
                        statusCounts[task.status]++;
                    }
                    
                    if (task.risk && task.risk !== 'none') {
                        riskCounts[task.risk] = (riskCounts[task.risk] || 0) + 1;
                    }
                    
                    // Check overdue
                    if (task.endDate && task.status !== 'completed' && task.status !== 'canceled') {
                        if (new Date(task.endDate) < today) {
                            overdueTasks++;
                        }
                    }
                });
            }
        });
    }
    
    if (totalTasks === 0) {
        return { score: '--', status: 'No Tasks', className: '', color: '#6e7681' };
    }
    
    // Calculate percentages
    const completedPct = (statusCounts.completed / totalTasks) * 100;
    const blockedPct = (statusCounts.blocked / totalTasks) * 100;
    const atRiskPct = (statusCounts['at-risk'] / totalTasks) * 100;
    const highRiskPct = (riskCounts.high / totalTasks) * 100;
    
    // Health Score Algorithm
    let healthScore = 100;
    healthScore -= blockedPct * 2;
    healthScore -= atRiskPct * 1.5;
    healthScore -= highRiskPct * 1;
    healthScore -= overdueTasks * 3;
    healthScore += completedPct * 0.3;
    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));
    
    // Determine status
    let status, className, color;
    if (healthScore >= 80) {
        status = '🟢 Healthy';
        className = 'healthy';
        color = '#3fb950';
    } else if (healthScore >= 60) {
        status = '🟡 Needs Attention';
        className = 'attention';
        color = '#d29922';
    } else if (healthScore >= 40) {
        status = '🟠 At Risk';
        className = 'at-risk';
        color = '#db6d28';
    } else {
        status = '🔴 Critical';
        className = 'critical';
        color = '#f85149';
    }
    
    return { score: healthScore, status, className, color };
}

// ==================== EXECUTIVE SUMMARY ====================

function openExecSummary() {
    const modal = document.getElementById('execSummaryModal');
    const dateEl = document.getElementById('execDate');
    const programEl = document.getElementById('execProgram');
    const textEl = document.getElementById('execSummaryText');
    
    console.log('Opening exec summary modal...');
    
    // Set date
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = '📅 ' + today.toLocaleDateString('en-US', options);
    
    // Set program name
    const programs = getProgramList();
    const currentProg = programs.find(p => p.id === currentProgram);
    programEl.textContent = currentProg ? '📁 ' + currentProg.name : '📁 Default Program';
    
    // Generate summary
    textEl.value = generateExecSummary();
    textEl.readOnly = true;
    
    modal.classList.add('active');
    console.log('Modal should be visible now');
}

function closeExecSummary() {
    document.getElementById('execSummaryModal').classList.remove('active');
}

function generateExecSummary() {
    const today = new Date();
    const programs = getProgramList();
    const currentProg = programs.find(p => p.id === currentProgram);
    const programName = currentProg ? currentProg.name : 'Project Timeline';
    
    // ==================== NLP ANALYSIS ENGINE ====================
    
    // Count statuses
    let statusCounts = {
        'not-started': 0,
        'in-progress': 0,
        'blocked': 0,
        'at-risk': 0,
        'completed': 0,
        'canceled': 0
    };
    
    let riskCounts = { low: 0, medium: 0, high: 0 };
    let priorityCounts = { P0: 0, P1: 0, P2: 0 };
    let totalTasks = 0;
    let blockedTasks = [];
    let atRiskTasks = [];
    let upcomingDeadlines = [];
    let overdueTasks = [];
    let p0InProgress = [];
    let workstreamHealth = [];
    
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    // Analyze all workstreams and tasks
    if (projectData.workstreams) {
        projectData.workstreams.forEach(ws => {
            let wsStats = { name: ws.name, total: 0, completed: 0, blocked: 0, atRisk: 0, highRisk: 0 };
            
            if (ws.tasks) {
                ws.tasks.forEach(task => {
                    totalTasks++;
                    wsStats.total++;
                    
                    // Count statuses
                    if (task.status && statusCounts.hasOwnProperty(task.status)) {
                        statusCounts[task.status]++;
                        if (task.status === 'completed') wsStats.completed++;
                        if (task.status === 'blocked') wsStats.blocked++;
                        if (task.status === 'at-risk') wsStats.atRisk++;
                    }
                    
                    // Count risks
                    if (task.risk && task.risk !== 'none') {
                        riskCounts[task.risk] = (riskCounts[task.risk] || 0) + 1;
                        if (task.risk === 'high') wsStats.highRisk++;
                    }
                    
                    // Count priorities
                    if (task.priority) {
                        priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
                    }
                    
                    // Track blocked tasks
                    if (task.status === 'blocked') {
                        blockedTasks.push({ name: task.name, workstream: ws.name, risk: task.riskText, priority: task.priority });
                    }
                    
                    // Track at-risk tasks
                    if (task.status === 'at-risk' || task.risk === 'high') {
                        atRiskTasks.push({ name: task.name, workstream: ws.name, risk: task.riskText, priority: task.priority });
                    }
                    
                    // Track P0 in progress (critical path)
                    if (task.priority === 'P0' && task.status === 'in-progress') {
                        p0InProgress.push({ name: task.name, workstream: ws.name, endDate: task.endDate });
                    }
                    
                    // Track overdue tasks
                    if (task.endDate && task.status !== 'completed' && task.status !== 'canceled') {
                        const endDate = new Date(task.endDate);
                        if (endDate < today) {
                            overdueTasks.push({ 
                                name: task.name, 
                                workstream: ws.name, 
                                daysOverdue: Math.floor((today - endDate) / (1000 * 60 * 60 * 24)),
                                priority: task.priority
                            });
                        }
                    }
                    
                    // Track upcoming deadlines
                    if (task.endDate) {
                        const endDate = new Date(task.endDate);
                        if (endDate >= today && endDate <= oneWeekFromNow && task.status !== 'completed') {
                            upcomingDeadlines.push({ 
                                name: task.name, 
                                workstream: ws.name, 
                                date: endDate.toLocaleDateString(),
                                status: task.status,
                                priority: task.priority
                            });
                        }
                    }
                });
            }
            
            workstreamHealth.push(wsStats);
        });
    }
    
    // ==================== SMART ANALYSIS ====================
    
    // Calculate health score (0-100)
    const completedPct = totalTasks > 0 ? (statusCounts.completed / totalTasks) * 100 : 0;
    const blockedPct = totalTasks > 0 ? (statusCounts.blocked / totalTasks) * 100 : 0;
    const atRiskPct = totalTasks > 0 ? (statusCounts['at-risk'] / totalTasks) * 100 : 0;
    const highRiskPct = totalTasks > 0 ? (riskCounts.high / totalTasks) * 100 : 0;
    
    // Health Score Algorithm: Start at 100, deduct for issues
    let healthScore = 100;
    healthScore -= blockedPct * 2;        // -2 points per % blocked
    healthScore -= atRiskPct * 1.5;       // -1.5 points per % at-risk
    healthScore -= highRiskPct * 1;       // -1 point per % high-risk
    healthScore -= overdueTasks.length * 3; // -3 points per overdue task
    healthScore += completedPct * 0.3;    // Bonus for completion
    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));
    
    // Determine health status
    let healthStatus, healthEmoji, healthColor;
    if (healthScore >= 80) {
        healthStatus = 'Healthy'; healthEmoji = '🟢'; healthColor = 'green';
    } else if (healthScore >= 60) {
        healthStatus = 'Needs Attention'; healthEmoji = '🟡'; healthColor = 'yellow';
    } else if (healthScore >= 40) {
        healthStatus = 'At Risk'; healthEmoji = '🟠'; healthColor = 'orange';
    } else {
        healthStatus = 'Critical'; healthEmoji = '🔴'; healthColor = 'red';
    }
    
    // Generate smart recommendations
    let recommendations = [];
    
    if (blockedTasks.length > 0) {
        const p0Blocked = blockedTasks.filter(t => t.priority === 'P0').length;
        if (p0Blocked > 0) {
            recommendations.push(`🚨 URGENT: ${p0Blocked} P0 critical task(s) are blocked. Immediate escalation recommended.`);
        } else {
            recommendations.push(`⚠️ ${blockedTasks.length} task(s) are blocked. Review blockers in next standup.`);
        }
    }
    
    if (overdueTasks.length > 0) {
        const maxOverdue = Math.max(...overdueTasks.map(t => t.daysOverdue));
        recommendations.push(`📅 ${overdueTasks.length} task(s) are overdue (up to ${maxOverdue} days). Consider timeline adjustment.`);
    }
    
    if (riskCounts.high > 2) {
        recommendations.push(`🔺 High concentration of high-risk items (${riskCounts.high}). Risk mitigation meeting suggested.`);
    }
    
    if (statusCounts['in-progress'] > totalTasks * 0.6) {
        recommendations.push(`📊 ${Math.round(statusCounts['in-progress'] / totalTasks * 100)}% of tasks in-progress. Consider completing items before starting new ones.`);
    }
    
    if (priorityCounts.P0 > priorityCounts.P1 + priorityCounts.P2) {
        recommendations.push(`🎯 Heavy P0 load (${priorityCounts.P0} critical tasks). Review prioritization to prevent burnout.`);
    }
    
    if (upcomingDeadlines.filter(d => d.priority === 'P0').length >= 3) {
        recommendations.push(`⏰ ${upcomingDeadlines.filter(d => d.priority === 'P0').length} P0 deadlines in next 7 days. Resource focus required.`);
    }
    
    if (recommendations.length === 0) {
        recommendations.push(`✅ Program is on track. Continue monitoring progress.`);
    }
    
    // ==================== GENERATE NARRATIVE ====================
    
    // Opening narrative
    let openingNarrative = '';
    if (healthScore >= 80) {
        openingNarrative = `The ${programName} program is performing well and is on track to meet its objectives. With ${Math.round(completedPct)}% of tasks completed and minimal blockers, the team is maintaining good momentum.`;
    } else if (healthScore >= 60) {
        openingNarrative = `The ${programName} program requires attention. While progress is being made with ${Math.round(completedPct)}% completion, there are ${statusCounts.blocked + statusCounts['at-risk']} items that need immediate focus to maintain timeline commitments.`;
    } else if (healthScore >= 40) {
        openingNarrative = `The ${programName} program is at risk. With only ${Math.round(completedPct)}% of tasks completed and ${statusCounts.blocked} blocked items, immediate intervention is recommended to get back on track.`;
    } else {
        openingNarrative = `The ${programName} program is in critical condition and requires urgent executive attention. Multiple blockers and high-risk items are impacting delivery. A recovery plan should be established immediately.`;
    }
    
    // Risk narrative
    let riskNarrative = '';
    if (riskCounts.high > 0 || blockedTasks.length > 0 || overdueTasks.length > 0) {
        let riskParts = [];
        if (riskCounts.high > 0) {
            riskParts.push(`${riskCounts.high} high-risk item${riskCounts.high > 1 ? 's' : ''} identified that could impact delivery`);
        }
        if (blockedTasks.length > 0) {
            const p0Blocked = blockedTasks.filter(t => t.priority === 'P0').length;
            if (p0Blocked > 0) {
                riskParts.push(`${p0Blocked} critical P0 task${p0Blocked > 1 ? 's are' : ' is'} currently blocked`);
            } else {
                riskParts.push(`${blockedTasks.length} task${blockedTasks.length > 1 ? 's are' : ' is'} blocked and awaiting resolution`);
            }
        }
        if (overdueTasks.length > 0) {
            const maxOverdue = Math.max(...overdueTasks.map(t => t.daysOverdue));
            riskParts.push(`${overdueTasks.length} task${overdueTasks.length > 1 ? 's are' : ' is'} overdue by up to ${maxOverdue} days`);
        }
        riskNarrative = 'Key concerns: ' + riskParts.join('; ') + '.';
    } else {
        riskNarrative = 'No significant risks or blockers identified at this time.';
    }
    
    // Progress narrative
    let progressNarrative = '';
    const inProgressCount = statusCounts['in-progress'];
    if (inProgressCount > 0) {
        progressNarrative = `Currently, ${inProgressCount} task${inProgressCount > 1 ? 's are' : ' is'} actively in progress`;
        if (p0InProgress.length > 0) {
            progressNarrative += `, including ${p0InProgress.length} critical P0 item${p0InProgress.length > 1 ? 's' : ''} on the critical path`;
        }
        progressNarrative += '.';
    }
    
    // Deadline narrative
    let deadlineNarrative = '';
    if (upcomingDeadlines.length > 0) {
        const p0Deadlines = upcomingDeadlines.filter(d => d.priority === 'P0').length;
        deadlineNarrative = `Looking ahead, ${upcomingDeadlines.length} task${upcomingDeadlines.length > 1 ? 's have' : ' has'} deadlines in the next 7 days`;
        if (p0Deadlines > 0) {
            deadlineNarrative += `, with ${p0Deadlines} being critical priority`;
        }
        deadlineNarrative += '. Close monitoring recommended.';
    }
    
    // Workstream narrative
    let wsNarrative = '';
    if (workstreamHealth.length > 0) {
        const healthyWs = workstreamHealth.filter(ws => ws.blocked === 0 && ws.highRisk === 0);
        const troubledWs = workstreamHealth.filter(ws => ws.blocked > 0 || ws.highRisk > 0);
        
        if (troubledWs.length > 0) {
            wsNarrative = `Workstream analysis shows ${troubledWs.length} workstream${troubledWs.length > 1 ? 's' : ''} requiring attention: ${troubledWs.map(w => w.name).join(', ')}.`;
        } else if (healthyWs.length === workstreamHealth.length) {
            wsNarrative = `All ${workstreamHealth.length} workstreams are progressing without major issues.`;
        }
    }
    
    // ==================== BUILD SUMMARY ====================
    
    let summary = `══════════════════════════════════════════════════════════════
                    EXECUTIVE SUMMARY
══════════════════════════════════════════════════════════════
📁 Program: ${programName}
📅 Date: ${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

┌─────────────────────────────────────────────────────────────┐
│  ${healthEmoji} PROGRAM HEALTH: ${healthStatus.toUpperCase()} (Score: ${healthScore}/100)
└─────────────────────────────────────────────────────────────┘

📝 SUMMARY
──────────
${openingNarrative}

${riskNarrative}

${progressNarrative}

${deadlineNarrative}

${wsNarrative}

📊 STATUS OVERVIEW
──────────────────
Total Tasks: ${totalTasks}
`;

    // Visual progress bar
    const progressBar = '█'.repeat(Math.floor(completedPct / 5)) + '░'.repeat(20 - Math.floor(completedPct / 5));
    summary += `Progress: [${progressBar}] ${Math.round(completedPct)}%\n\n`;

    summary += `  ✅ Completed:   ${statusCounts.completed.toString().padStart(3)} (${Math.round(completedPct)}%)
  🔄 In Progress: ${statusCounts['in-progress'].toString().padStart(3)} (${totalTasks > 0 ? Math.round(statusCounts['in-progress'] / totalTasks * 100) : 0}%)
  ⏳ Not Started: ${statusCounts['not-started'].toString().padStart(3)}
  🚫 Blocked:     ${statusCounts.blocked.toString().padStart(3)} ${statusCounts.blocked > 0 ? '⚠️' : ''}
  ⚠️ At Risk:     ${statusCounts['at-risk'].toString().padStart(3)}
  ❌ Canceled:    ${statusCounts.canceled.toString().padStart(3)}

🎯 PRIORITY MATRIX
──────────────────
  🔴 P0 Critical: ${priorityCounts.P0} ${priorityCounts.P0 > 5 ? '(heavy load)' : ''}
  🟠 P1 High:     ${priorityCounts.P1}
  🟢 P2 Medium:   ${priorityCounts.P2}

⚡ RISK ASSESSMENT
──────────────────
  🔺 High Risk:   ${riskCounts.high} ${riskCounts.high > 2 ? '⚠️ Elevated' : ''}
  🔶 Medium Risk: ${riskCounts.medium}
  🔷 Low Risk:    ${riskCounts.low}
`;

    // Smart Recommendations
    summary += `
💡 AI RECOMMENDATIONS
──────────────────────
`;
    recommendations.forEach((rec, i) => {
        summary += `${i + 1}. ${rec}\n`;
    });

    // Critical Path (P0 in progress)
    if (p0InProgress.length > 0) {
        summary += `
🔥 CRITICAL PATH (P0 In-Progress)
──────────────────────────────────
`;
        p0InProgress.forEach(t => {
            const deadline = t.endDate ? new Date(t.endDate).toLocaleDateString() : 'No deadline';
            summary += `• ${t.name} (${t.workstream}) → ${deadline}\n`;
        });
    }

    // Overdue Items
    if (overdueTasks.length > 0) {
        summary += `
🚨 OVERDUE ITEMS (${overdueTasks.length})
──────────────────────
`;
        overdueTasks.sort((a, b) => b.daysOverdue - a.daysOverdue);
        overdueTasks.forEach(t => {
            const priorityIcon = t.priority === 'P0' ? '🔴' : t.priority === 'P1' ? '🟠' : '🟢';
            summary += `• ${priorityIcon} ${t.name} - ${t.daysOverdue} days overdue\n`;
        });
    }

    // Blocked Items
    if (blockedTasks.length > 0) {
        summary += `
🚫 BLOCKED ITEMS (${blockedTasks.length})
─────────────────────
`;
        blockedTasks.forEach(t => {
            const priorityIcon = t.priority === 'P0' ? '🔴' : t.priority === 'P1' ? '🟠' : '🟢';
            summary += `• ${priorityIcon} ${t.name} (${t.workstream})${t.risk ? '\n  └─ ' + t.risk : ''}\n`;
        });
    }

    // Upcoming Deadlines
    if (upcomingDeadlines.length > 0) {
        summary += `
📅 UPCOMING DEADLINES (Next 7 Days)
────────────────────────────────────
`;
        upcomingDeadlines.sort((a, b) => new Date(a.date) - new Date(b.date));
        upcomingDeadlines.forEach(t => {
            const priorityIcon = t.priority === 'P0' ? '🔴' : t.priority === 'P1' ? '🟠' : '🟢';
            const statusIcon = t.status === 'in-progress' ? '🔄' : '⏳';
            summary += `• ${t.date}: ${priorityIcon} ${t.name} ${statusIcon}\n`;
        });
    }

    // Workstream Health
    summary += `
📋 WORKSTREAM HEALTH
─────────────────────
`;
    if (workstreamHealth.length > 0) {
        workstreamHealth.forEach((ws, idx) => {
            const pct = ws.total > 0 ? Math.round((ws.completed / ws.total) * 100) : 0;
            const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
            let healthIndicator = '🟢';
            if (ws.blocked > 0 || ws.highRisk > 1) healthIndicator = '🔴';
            else if (ws.atRisk > 0 || ws.highRisk > 0) healthIndicator = '🟡';
            
            summary += `${healthIndicator} ${ws.name}\n`;
            summary += `   [${bar}] ${pct}% (${ws.completed}/${ws.total})`;
            if (ws.blocked > 0) summary += ` | 🚫${ws.blocked} blocked`;
            if (ws.highRisk > 0) summary += ` | 🔺${ws.highRisk} high-risk`;
            summary += '\n';
        });
    } else {
        summary += 'No workstreams defined yet.\n';
    }

    // Closing narrative
    let closingNarrative = '';
    if (healthScore >= 80) {
        closingNarrative = `Overall, the program is healthy. Continue the current execution rhythm and maintain focus on completing in-progress items. No immediate escalation required.`;
    } else if (healthScore >= 60) {
        closingNarrative = `The program needs focused attention on the blocked and at-risk items listed above. Recommend addressing blockers in the next sprint planning and monitoring at-risk items daily.`;
    } else if (healthScore >= 40) {
        closingNarrative = `Immediate action is required. Schedule a program review meeting to address blockers, reassess timelines for overdue items, and establish a recovery plan. Consider adding resources if necessary.`;
    } else {
        closingNarrative = `This program requires executive intervention. Recommend an emergency review to assess root causes, reallocate resources, and potentially re-baseline the schedule. Stakeholder communication about delays should be prepared.`;
    }
    
    // Next steps based on analysis
    let nextSteps = [];
    if (blockedTasks.filter(t => t.priority === 'P0').length > 0) {
        nextSteps.push('Escalate P0 blockers to leadership immediately');
    }
    if (overdueTasks.length > 0) {
        nextSteps.push('Review and update timelines for overdue items');
    }
    if (riskCounts.high > 2) {
        nextSteps.push('Schedule risk mitigation workshop');
    }
    if (upcomingDeadlines.filter(d => d.priority === 'P0').length >= 2) {
        nextSteps.push('Ensure P0 deadlines have adequate resource coverage');
    }
    if (statusCounts['in-progress'] > totalTasks * 0.5) {
        nextSteps.push('Focus on completing in-progress items before starting new work');
    }
    if (nextSteps.length === 0) {
        nextSteps.push('Continue current execution plan');
        nextSteps.push('Monitor progress in daily standups');
    }

    summary += `
📝 CONCLUSION
─────────────
${closingNarrative}

📌 RECOMMENDED NEXT STEPS
─────────────────────────
`;
    nextSteps.forEach((step, i) => {
        summary += `${i + 1}. ${step}\n`;
    });

    summary += `
══════════════════════════════════════════════════════════════
Generated by Project Timeline AI Analysis Engine
${today.toLocaleString()}
══════════════════════════════════════════════════════════════
`;

    return summary;
}

function copyExecSummary() {
    const textEl = document.getElementById('execSummaryText');
    textEl.select();
    document.execCommand('copy');
    showToast('📋 Summary copied to clipboard!');
}

function editExecSummary() {
    const textEl = document.getElementById('execSummaryText');
    textEl.readOnly = !textEl.readOnly;
    if (!textEl.readOnly) {
        textEl.focus();
        showToast('✏️ You can now edit the summary');
    } else {
        showToast('🔒 Summary is now read-only');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initCalendarInputs();
    renderTimeline();
    updateHealthScoreDisplay();
    
    // Add event listener for exec summary button
    const execBtn = document.getElementById('execSummaryBtn');
    if (execBtn) {
        execBtn.addEventListener('click', function() {
            console.log('Exec Summary button clicked!');
            openExecSummary();
        });
        console.log('Exec Summary button listener attached');
    } else {
        console.error('Exec Summary button not found!');
    }
    
    // Make health score panel clickable to open exec summary
    const healthPanel = document.getElementById('healthScorePanel');
    if (healthPanel) {
        healthPanel.style.cursor = 'pointer';
        healthPanel.addEventListener('click', openExecSummary);
    }
});
