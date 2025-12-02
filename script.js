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

// Initialize with empty data
projectData = emptyData;

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
    switch(risk) {
        case 'high': return '🔺';
        case 'medium': return '🔶';
        case 'low': return '⚠️';
        default: return '';
    }
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
        saveData();
        renderTimeline();
        showToast('✅ Updated!');
    }
}

// Delete task
function deleteTask(taskId) {
    if (!confirm('Delete this task?')) return;
    
    for (const ws of projectData.workstreams) {
        if (ws.tasks) {
            const idx = ws.tasks.findIndex(t => t.id === taskId);
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
                const idx = sg.tasks.findIndex(t => t.id === taskId);
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
                <input type="text" class="inline-edit task-name-edit" value="${escapeHtml(task.name)}" 
                       onchange="updateTask(${task.id}, 'name', this.value)" title="Click to edit name">
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
                    <select class="inline-select risk-select" 
                            onchange="updateTask(${task.id}, 'risk', this.value)">
                        <option value="none" ${!task.risk || task.risk === 'none' ? 'selected' : ''}>-</option>
                        <option value="low" ${task.risk === 'low' ? 'selected' : ''}>⚠️</option>
                        <option value="medium" ${task.risk === 'medium' ? 'selected' : ''}>🔶</option>
                        <option value="high" ${task.risk === 'high' ? 'selected' : ''}>🔺</option>
                    </select>
                    <button class="btn-delete-task" onclick="deleteTask(${task.id})" title="Delete task">🗑️</button>
                </div>
            </div>
            <div class="task-timeline">
                ${months.map(() => '<div class="timeline-cell"></div>').join('')}
                ${pos ? `
                    <div class="gantt-bar ${task.priority.toLowerCase()}" 
                         style="left: ${pos.left}px; width: ${pos.width}px;"
                         title="${task.name}\n${task.start} to ${task.end}\n${task.priority}, Size: ${task.size}${task.owner ? '\nOwner: ' + task.owner : ''}">
                        ${task.risk && task.risk !== 'none' ? `<span class="risk-indicator">${getRiskIndicator(task.risk)}</span>` : ''}
                        <div class="bar-pattern">
                            ${Array(Math.floor(pos.width / 10)).fill('<div class="bar-segment"></div>').join('')}
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
        risk: document.getElementById('taskRisk').value,
        owner: document.getElementById('taskOwner').value
    };
    
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

// Save to localStorage
function saveData() {
    localStorage.setItem('projectTimeline', JSON.stringify(projectData));
}

// Load from localStorage
function loadData() {
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
