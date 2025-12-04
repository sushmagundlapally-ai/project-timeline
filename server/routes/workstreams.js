/**
 * Workstream Routes - API Endpoints
 * Created by: Sushma Gundlapally
 */

const express = require('express');
const router = express.Router();
const Program = require('../models/Program');

// POST add workstream to program
router.post('/:programId', async (req, res) => {
    try {
        const { name, owner } = req.body;
        
        const program = await Program.findById(req.params.programId);
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }
        
        const workstream = {
            name,
            owner: owner || '',
            order: program.workstreams.length,
            tasks: []
        };
        
        program.workstreams.push(workstream);
        await program.save();
        
        const newWorkstream = program.workstreams[program.workstreams.length - 1];
        res.status(201).json(newWorkstream);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT update workstream
router.put('/:programId/:workstreamId', async (req, res) => {
    try {
        const program = await Program.findById(req.params.programId);
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }
        
        const workstream = program.workstreams.id(req.params.workstreamId);
        if (!workstream) {
            return res.status(404).json({ error: 'Workstream not found' });
        }
        
        // Update allowed fields
        if (req.body.name) workstream.name = req.body.name;
        if (req.body.owner !== undefined) workstream.owner = req.body.owner;
        if (req.body.order !== undefined) workstream.order = req.body.order;
        
        await program.save();
        res.json(workstream);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE workstream
router.delete('/:programId/:workstreamId', async (req, res) => {
    try {
        const program = await Program.findById(req.params.programId);
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }
        
        program.workstreams.pull(req.params.workstreamId);
        await program.save();
        
        res.json({ message: 'Workstream deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT reorder workstreams
router.put('/:programId/reorder', async (req, res) => {
    try {
        const { workstreamOrder } = req.body; // Array of workstream IDs in new order
        
        const program = await Program.findById(req.params.programId);
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }
        
        // Reorder workstreams
        const reordered = workstreamOrder.map((id, index) => {
            const ws = program.workstreams.id(id);
            if (ws) ws.order = index;
            return ws;
        }).filter(Boolean);
        
        await program.save();
        res.json(program.workstreams);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// POST bulk add tasks to workstream
router.post('/:programId/:workstreamId/bulk-tasks', async (req, res) => {
    try {
        const { tasks } = req.body; // Array of task objects
        
        const program = await Program.findById(req.params.programId);
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }
        
        const workstream = program.workstreams.id(req.params.workstreamId);
        if (!workstream) {
            return res.status(404).json({ error: 'Workstream not found' });
        }
        
        workstream.tasks.push(...tasks);
        await program.save();
        
        res.status(201).json({
            message: `Added ${tasks.length} tasks`,
            workstream
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;

