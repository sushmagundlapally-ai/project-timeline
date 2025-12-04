/**
 * API Client - Frontend JavaScript for MongoDB Backend
 * Created by: Sushma Gundlapally
 * 
 * Replace the localStorage calls in script.js with these API calls
 * to switch from browser storage to MongoDB
 */

const API_BASE = '/api';

class ProjectTimelineAPI {
    
    // ==================== PROGRAMS ====================
    
    static async getPrograms() {
        const response = await fetch(`${API_BASE}/programs`);
        if (!response.ok) throw new Error('Failed to fetch programs');
        return response.json();
    }
    
    static async getProgram(programId) {
        const response = await fetch(`${API_BASE}/programs/${programId}`);
        if (!response.ok) throw new Error('Failed to fetch program');
        return response.json();
    }
    
    static async createProgram(programData) {
        const response = await fetch(`${API_BASE}/programs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(programData)
        });
        if (!response.ok) throw new Error('Failed to create program');
        return response.json();
    }
    
    static async updateProgram(programId, programData) {
        const response = await fetch(`${API_BASE}/programs/${programId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(programData)
        });
        if (!response.ok) throw new Error('Failed to update program');
        return response.json();
    }
    
    static async deleteProgram(programId) {
        const response = await fetch(`${API_BASE}/programs/${programId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete program');
        return response.json();
    }
    
    static async getProgramHealth(programId) {
        const response = await fetch(`${API_BASE}/programs/${programId}/health`);
        if (!response.ok) throw new Error('Failed to fetch health');
        return response.json();
    }
    
    static async exportProgram(programId) {
        const response = await fetch(`${API_BASE}/programs/${programId}/export`);
        if (!response.ok) throw new Error('Failed to export');
        return response.json();
    }
    
    // ==================== WORKSTREAMS ====================
    
    static async addWorkstream(programId, workstreamData) {
        const response = await fetch(`${API_BASE}/workstreams/${programId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workstreamData)
        });
        if (!response.ok) throw new Error('Failed to add workstream');
        return response.json();
    }
    
    static async updateWorkstream(programId, workstreamId, workstreamData) {
        const response = await fetch(`${API_BASE}/workstreams/${programId}/${workstreamId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workstreamData)
        });
        if (!response.ok) throw new Error('Failed to update workstream');
        return response.json();
    }
    
    static async deleteWorkstream(programId, workstreamId) {
        const response = await fetch(`${API_BASE}/workstreams/${programId}/${workstreamId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete workstream');
        return response.json();
    }
    
    static async bulkAddTasks(programId, workstreamId, tasks) {
        const response = await fetch(`${API_BASE}/workstreams/${programId}/${workstreamId}/bulk-tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks })
        });
        if (!response.ok) throw new Error('Failed to bulk add tasks');
        return response.json();
    }
    
    // ==================== TASKS ====================
    
    static async addTask(programId, workstreamId, taskData) {
        const response = await fetch(`${API_BASE}/tasks/${programId}/${workstreamId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        if (!response.ok) throw new Error('Failed to add task');
        return response.json();
    }
    
    static async updateTask(programId, workstreamId, taskId, taskData) {
        const response = await fetch(`${API_BASE}/tasks/${programId}/${workstreamId}/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        if (!response.ok) throw new Error('Failed to update task');
        return response.json();
    }
    
    static async deleteTask(programId, workstreamId, taskId) {
        const response = await fetch(`${API_BASE}/tasks/${programId}/${workstreamId}/${taskId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete task');
        return response.json();
    }
    
    static async addComment(programId, workstreamId, taskId, commentData) {
        const response = await fetch(`${API_BASE}/tasks/${programId}/${workstreamId}/${taskId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(commentData)
        });
        if (!response.ok) throw new Error('Failed to add comment');
        return response.json();
    }
    
    static async deleteComment(programId, workstreamId, taskId, commentId) {
        const response = await fetch(`${API_BASE}/tasks/${programId}/${workstreamId}/${taskId}/comments/${commentId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete comment');
        return response.json();
    }
    
    static async moveTask(programId, taskId, moveData) {
        const response = await fetch(`${API_BASE}/tasks/${programId}/move/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(moveData)
        });
        if (!response.ok) throw new Error('Failed to move task');
        return response.json();
    }
}

// Export for use in script.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectTimelineAPI;
}

