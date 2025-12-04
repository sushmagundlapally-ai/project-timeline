/**
 * Program Routes - API Endpoints
 * Created by: Sushma Gundlapally
 */

const express = require('express');
const router = express.Router();
const Program = require('../models/Program');

// GET all programs (list view)
router.get('/', async (req, res) => {
    try {
        const programs = await Program.find({ isActive: true })
            .select('name description owner createdAt updatedAt')
            .sort({ updatedAt: -1 });
        
        res.json(programs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single program with full data
router.get('/:id', async (req, res) => {
    try {
        const program = await Program.findById(req.params.id);
        
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }
        
        res.json(program);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new program
router.post('/', async (req, res) => {
    try {
        const { name, description, owner, startMonth, endMonth } = req.body;
        
        const program = new Program({
            name,
            description: description || '',
            owner: owner || '',
            startMonth: startMonth || new Date(),
            endMonth: endMonth || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            workstreams: []
        });
        
        await program.save();
        res.status(201).json(program);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT update program
router.put('/:id', async (req, res) => {
    try {
        const program = await Program.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }
        
        res.json(program);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE program (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const program = await Program.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }
        
        res.json({ message: 'Program deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET program health score
router.get('/:id/health', async (req, res) => {
    try {
        const program = await Program.findById(req.params.id);
        
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }
        
        const healthScore = program.healthScore;
        let status = 'Healthy';
        if (healthScore < 40) status = 'Critical';
        else if (healthScore < 60) status = 'At Risk';
        else if (healthScore < 80) status = 'Needs Attention';
        
        res.json({
            score: healthScore,
            status,
            programId: program._id,
            programName: program.name
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST bulk import program data
router.post('/:id/import', async (req, res) => {
    try {
        const { workstreams } = req.body;
        
        const program = await Program.findById(req.params.id);
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }
        
        // Append new workstreams
        program.workstreams.push(...workstreams);
        await program.save();
        
        res.json(program);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET export program data
router.get('/:id/export', async (req, res) => {
    try {
        const program = await Program.findById(req.params.id);
        
        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }
        
        // Format for export
        const exportData = {
            name: program.name,
            exportedAt: new Date().toISOString(),
            startMonth: program.startMonth,
            endMonth: program.endMonth,
            workstreams: program.workstreams
        };
        
        res.json(exportData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

