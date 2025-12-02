// Project Timeline Data
let projectData = {
    startMonth: new Date(2024, 11, 1), // December 2024
    endMonth: new Date(2025, 11, 1),   // December 2025
    workstreams: []
};

// Sample Data matching your format
const sampleData = {
    startMonth: new Date(2024, 11, 1),
    endMonth: new Date(2025, 11, 1),
    workstreams: [
        {
            id: 1,
            name: "LE 1.0 BASIC IMPROVEMENTS (EMAIL ONLY)",
            tasks: [
                { id: 101, name: "Email engine improvements", priority: "P0", size: "L", start: "2024-12-01", end: "2025-01-15", risk: "high" },
                { id: 102, name: "Athena Auth spike", priority: "P0", size: "S", start: "2024-12-01", end: "2024-12-14", risk: "high" }
            ]
        },
        {
            id: 2,
            name: "FALCONIZATION OF LE",
            tasks: [
                { id: 201, name: "Falcon Dev Ready", priority: "P0", size: "L", start: "2024-12-01", end: "2025-01-31", risk: "high" },
                { id: 202, name: "Fox Onboarding", priority: "P0", size: "M", start: "2025-01-01", end: "2025-02-15", risk: "high" },
                { id: 203, name: "Prod-ready + release pathing", priority: "P0", size: "M", start: "2025-02-01", end: "2025-03-15", risk: "high" }
            ]
        },
        {
            id: 3,
            name: "LE HIPAA COMPLIANCY",
            tasks: [
                { id: 301, name: "HIPAA enablement", priority: "P0", size: "L", start: "2025-01-15", end: "2025-03-31", risk: "high" }
            ]
        },
        {
            id: 4,
            name: "LE INTEGRATION WITH AGENTFORCE",
            tasks: [
                { id: 401, name: "Push/pull config spike", priority: "P1", size: "M", start: "2024-12-01", end: "2025-01-15", risk: "medium" },
                { id: 402, name: "Dev/Sandbox implementation", priority: "P1", size: "L", start: "2025-01-15", end: "2025-03-31", risk: "medium" },
                { id: 403, name: "LE Agentforce UX", priority: "P2", size: "M", start: "2025-02-15", end: "2025-04-15", risk: "low" }
            ]
        },
        {
            id: 5,
            name: "LE EVOLUTION 2.0 (PHASED)",
            subgroups: [
                {
                    name: "5.a Improve Human-in-the-loop (HITL)",
                    tasks: [
                        { id: 501, name: "HITL UX", priority: "P2", size: "M", start: "2024-12-01", end: "2025-01-15", risk: "low" },
                        { id: 502, name: "Strength escalation logic", priority: "P1", size: "M", start: "2024-12-01", end: "2025-01-15", risk: "medium" },
                        { id: 503, name: "Automated testing (backend/frontend)", priority: "P1", size: "L", start: "2025-01-01", end: "2025-03-15", risk: "medium" },
                        { id: 504, name: "Structured feedback loop", priority: "P2", size: "M", start: "2025-02-15", end: "2025-04-01", risk: "low" },
                        { id: 505, name: "Holistic agent updates", priority: "P0", size: "L", start: "2025-04-01", end: "2025-06-30", risk: "high" }
                    ]
                },
                {
                    name: "5.b Pre-deployment Learning (Q2 scope)",
                    tasks: [
                        { id: 511, name: "Pre-deploy UX", priority: "P2", size: "M", start: "2025-05-01", end: "2025-06-15", risk: "low" },
                        { id: 512, name: "Pre-deployment LE", priority: "P1", size: "L", start: "2025-05-01", end: "2025-07-31", risk: "medium" },
                        { id: 513, name: "Automated testing (phase 2)", priority: "P1", size: "M", start: "2025-05-01", end: "2025-06-15", risk: "medium" },
                        { id: 514, name: "Test on historical data", priority: "P1", size: "M", start: "2025-05-01", end: "2025-06-15", risk: "medium" },
                        { id: 515, name: "Test on simulated data", priority: "P2", size: "M", start: "2025-06-15", end: "2025-08-01", risk: "low" }
                    ]
                },
                {
                    name: "5.c Agent-agnostic (Q3 scope)",
                    tasks: [
                        { id: 521, name: "Voice/text/email multi-modality", priority: "P2", size: "L", start: "2025-08-01", end: "2025-10-31", risk: "low" },
                        { id: 522, name: "Works with non-AF agents", priority: "P2", size: "L", start: "2025-08-01", end: "2025-10-31", risk: "low" }
                    ]
                }
            ]
        },
        {
            id: 6,
            name: "BILLING USE CASE EXPANSION",
            subgroups: [
                {
                    name: "6.a Phase 1",
                    tasks: [
                        { id: 601, name: "Workflow mapping", priority: "P1", size: "M", start: "2024-12-01", end: "2025-01-15", risk: "medium" },
                        { id: 602, name: "Annotation eval", priority: "P2", size: "M", start: "2025-01-01", end: "2025-02-15", risk: "low" },
                        { id: 603, name: "Automated eval", priority: "P2", size: "M", start: "2025-01-01", end: "2025-02-15", risk: "low" },
                        { id: 604, name: "Customer eval", priority: "P1", size: "L", start: "2025-02-15", end: "2025-04-30", risk: "medium" }
                    ]
                },
                {
                    name: "6.b Phase 2",
                    tasks: [
                        { id: 611, name: "Workflow mapping", priority: "P1", size: "M", start: "2025-04-01", end: "2025-05-15", risk: "medium" },
                        { id: 612, name: "Annotation eval", priority: "P2", size: "M", start: "2025-05-15", end: "2025-06-30", risk: "low" },
                        { id: 613, name: "Automated eval", priority: "P2", size: "M", start: "2025-05-15", end: "2025-06-30", risk: "low" },
                        { id: 614, name: "Customer eval", priority: "P1", size: "L", start: "2025-07-01", end: "2025-09-15", risk: "medium" }
                    ]
                },
                {
                    name: "6.c Phase 3",
                    tasks: [
                        { id: 621, name: "Workflow mapping", priority: "P1", size: "M", start: "2025-08-01", end: "2025-09-15", risk: "medium" },
                        { id: 622, name: "Annotation eval", priority: "P2", size: "M", start: "2025-09-15", end: "2025-10-31", risk: "low" },
                        { id: 623, name: "Automated eval", priority: "P2", size: "M", start: "2025-09-15", end: "2025-10-31", risk: "low" },
                        { id: 624, name: "Customer eval", priority: "P1", size: "L", start: "2025-11-01", end: "2025-12-31", risk: "medium" }
                    ]
                }
            ]
        },
        {
            id: 7,
            name: "BILLING EMAIL AGENT ON AGENTFORCE",
            tasks: [
                { id: 701, name: "Gap assessment + architecture", priority: "P0", size: "L", start: "2025-01-01", end: "2025-03-15", risk: "high" },
                { id: 702, name: "MVP Sandbox", priority: "P0", size: "L", start: "2025-02-15", end: "2025-05-15", risk: "high" },
                { id: 703, name: "MVP Production", priority: "P0", size: "L", start: "2025-05-01", end: "2025-07-31", risk: "high" }
            ]
        },
        {
            id: 8,
            name: "Data ETL: UCSF",
            tasks: [
                { id: 801, name: "Data ETL: UCSF", priority: "P1", size: "L", start: "2025-05-01", end: "2025-07-31", risk: "medium" }
            ]
        },
        {
            id: 9,
            name: "UCSF APIs",
            tasks: [
                { id: 901, name: "UCSF APIs", priority: "P1", size: "L", start: "2025-05-01", end: "2025-07-31", risk: "medium" }
            ]
        },
        {
            id: 10,
            name: "Billing Text Agent on Agentforce",
            tasks: [
                { id: 1001, name: "Billing Text Agent on Agentforce", priority: "P2", size: "L", start: "2025-06-15", end: "2025-09-30", risk: "low" }
            ]
        },
        {
            id: 11,
            name: "Billing Voice Agent on Agentforce",
            tasks: [
                { id: 1101, name: "Billing Voice Agent on Agentforce", priority: "P2", size: "L", start: "2025-08-01", end: "2025-10-31", risk: "low" }
            ]
        },
        {
            id: 12,
            name: "Parking Agent on Agentforce Voice",
            tasks: [
                { id: 1201, name: "Parking Agent on Agentforce Voice", priority: "P1", size: "L", start: "2025-05-01", end: "2025-07-31", risk: "medium" }
            ]
        },
        {
            id: 13,
            name: "Automated evaluation by eval engine",
            tasks: [
                { id: 1301, name: "Automated evaluation by eval engine", priority: "P1", size: "M", start: "2025-01-15", end: "2025-03-31", risk: "medium" }
            ]
        }
    ]
};

// Initialize with sample data
projectData = sampleData;

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

// Render a task row
function renderTaskRow(task, isSubTask = false, isSubSubTask = false) {
    const pos = calculateBarPosition(task.start, task.end);
    const labelClass = isSubSubTask ? 'sub-sub-task' : (isSubTask ? 'sub-task' : '');
    const months = getMonths();
    
    return `
        <div class="task-row" data-task-id="${task.id}">
            <div class="task-label ${labelClass}">
                <span class="task-name">${escapeHtml(task.name)}</span>
                <div class="task-meta">
                    <span class="priority-badge ${task.priority.toLowerCase()}">${task.priority}</span>
                    <span class="size-badge">${task.size}</span>
                </div>
            </div>
            <div class="task-timeline">
                ${months.map(() => '<div class="timeline-cell"></div>').join('')}
                ${pos ? `
                    <div class="gantt-bar ${task.priority.toLowerCase()}" 
                         style="left: ${pos.left}px; width: ${pos.width}px;"
                         title="${task.name} (${task.start} to ${task.end})">
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

// Render workstream
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
                    <span>${escapeHtml(workstream.name)}</span>
                    <div class="workstream-actions">
                        <button onclick="addTaskToWorkstream(${workstream.id})" title="Add Task">➕</button>
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
        risk: document.getElementById('taskRisk').value
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
        tasks: []
    };
    
    projectData.workstreams.push(workstream);
    
    saveData();
    renderTimeline();
    closeWorkstreamModal();
    showToast('✅ Workstream added!');
});

// Event listeners
document.getElementById('addWorkstreamBtn').addEventListener('click', openWorkstreamModal);

document.getElementById('exportBtn').addEventListener('click', function() {
    const dataStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-timeline.json';
    a.click();
    showToast('📥 Data exported!');
});

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
            console.log('Using sample data');
            projectData = sampleData;
        }
    } else {
        projectData = sampleData;
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
    renderTimeline();
});

