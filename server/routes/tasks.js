/**
 * Task Routes - API Endpoints
 * Created by: Sushma Gundlapally
 */

const express = require('express');
const router = express.Router();
const Program = require('../models/Program');

// POST add task to workstream
router.post('/:programId/:workstreamId', async (req, res) => {
    try {
        const program = await Program.findById(req.params.programId);
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }
        
        const workstream = program.workstreams.id(req.params.workstreamId);
        if (!workstream) {
            return res.status(404).json({ error: 'Workstream not found' });
        }
        
        const task = {
            name: req.body.name,
            description: req.body.description || '',
            owner: req.body.owner || '',
            priority: req.body.priority || 'P1',
            size: req.body.size || 'M',
            start: req.body.start,
            end: req.body.end,
            status: req.body.status || 'not-started',
            risk: req.body.risk || 'none',
            riskText: req.body.riskText || '',
            comments: []
        };
        
        workstream.tasks.push(task);
        await program.save();
        
        const newTask = workstream.tasks[workstream.tasks.length - 1];
        res.status(201).json(newTask);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT update task
router.put('/:programId/:workstreamId/:taskId', async (req, res) => {
    try {
        const program = await Program.findById(req.params.programId);
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }
        
        const workstream = program.workstreams.id(req.params.workstreamId);
        if (!workstream) {
            return res.status(404).json({ error: 'Workstream not found' });
        }
        
        const task = workstream.tasks.id(req.params.taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        // Update allowed fields
        const allowedFields = ['name', 'description', 'owner', 'priority', 'size', 
                               'start', 'end', 'status', 'risk', 'riskText', 
                               'riskPosition', 'depType', 'depRow'];
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                task[field] = req.body[field];
            }
        });
        
        await program.save();
        res.json(task);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE task
router.delete('/:programId/:workstreamId/:taskId', async (req, res) => {
    try {
        const program = await Program.findById(req.params.programId);
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }
        
        const workstream = program.workstreams.id(req.params.workstreamId);
        if (!workstream) {
            return res.status(404).json({ error: 'Workstream not found' });
        }
        
        workstream.tasks.pull(req.params.taskId);
        await program.save();
        
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST add comment to task
router.post('/:programId/:workstreamId/:taskId/comments', async (req, res) => {
    try {
        const { text, author } = req.body;
        
        const program = await Program.findById(req.params.programId);
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }
        
        const workstream = program.workstreams.id(req.params.workstreamId);
        if (!workstream) {
            return res.status(404).json({ error: 'Workstream not found' });
        }
        
        const task = workstream.tasks.id(req.params.taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        task.comments.push({
            text,
            author: author || 'Anonymous',
            date: new Date()
        });
        
        await program.save();
        res.status(201).json(task.comments[task.comments.length - 1]);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE comment from task
router.delete('/:programId/:workstreamId/:taskId/comments/:commentId', async (req, res) => {
    try {
        const program = await Program.findById(req.params.programId);
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }
        
        const workstream = program.workstreams.id(req.params.workstreamId);
        if (!workstream) {
            return res.status(404).json({ error: 'Workstream not found' });
        }
        
        const task = workstream.tasks.id(req.params.taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        task.comments.pull(req.params.commentId);
        await program.save();
        
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT reorder tasks within workstream
router.put('/:programId/:workstreamId/reorder', async (req, res) => {
    try {
        const { taskOrder } = req.body; // Array of task IDs in new order
        
        const program = await Program.findById(req.params.programId);
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }
        
        const workstream = program.workstreams.id(req.params.workstreamId);
        if (!workstream) {
            return res.status(404).json({ error: 'Workstream not found' });
        }
        
        // Reorder tasks
        const reorderedTasks = taskOrder.map(id => workstream.tasks.id(id)).filter(Boolean);
        workstream.tasks = reorderedTasks;
        
        await program.save();
        res.json(workstream.tasks);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT move task to different workstream
router.put('/:programId/move/:taskId', async (req, res) => {
    try {
        const { sourceWorkstreamId, targetWorkstreamId, targetIndex } = req.body;
        
        const program = await Program.findById(req.params.programId);
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }
        
        const sourceWs = program.workstreams.id(sourceWorkstreamId);
        const targetWs = program.workstreams.id(targetWorkstreamId);
        
        if (!sourceWs || !targetWs) {
            return res.status(404).json({ error: 'Workstream not found' });
        }
        
        const task = sourceWs.tasks.id(req.params.taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        // Remove from source
        sourceWs.tasks.pull(req.params.taskId);
        
        // Add to target at specified index
        targetWs.tasks.splice(targetIndex || targetWs.tasks.length, 0, task);
        
        await program.save();
        res.json({ message: 'Task moved successfully', task });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;

