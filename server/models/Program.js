/**
 * Program Model - MongoDB Schema
 * Created by: Sushma Gundlapally
 */

const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    text: { type: String, required: true },
    author: { type: String, default: 'Anonymous' },
    date: { type: Date, default: Date.now }
});

const TaskSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    owner: { type: String, default: '' },
    priority: { type: String, enum: ['P0', 'P1', 'P2'], default: 'P1' },
    size: { type: String, enum: ['S', 'M', 'L'], default: 'M' },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    status: { 
        type: String, 
        enum: ['not-started', 'in-progress', 'blocked', 'at-risk', 'completed', 'canceled'],
        default: 'not-started'
    },
    risk: { type: String, enum: ['none', 'low', 'medium', 'high'], default: 'none' },
    riskText: { type: String, default: '' },
    riskPosition: { type: Number, default: 50 },
    depType: { type: String, enum: ['', 'parallel', 'dependency'], default: '' },
    depRow: { type: Number },
    rowNum: { type: Number },
    comments: [CommentSchema]
}, { timestamps: true });

const WorkstreamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    owner: { type: String, default: '' },
    order: { type: Number, default: 0 },
    tasks: [TaskSchema]
}, { timestamps: true });

const ProgramSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    owner: { type: String, default: '' },
    startMonth: { type: Date, required: true },
    endMonth: { type: Date, required: true },
    workstreams: [WorkstreamSchema],
    createdBy: { type: String, default: 'system' },
    isActive: { type: Boolean, default: true }
}, { 
    timestamps: true,
    collection: 'programs'
});

// Indexes for faster queries
ProgramSchema.index({ name: 1 });
ProgramSchema.index({ createdBy: 1 });
ProgramSchema.index({ isActive: 1 });

// Virtual for health score
ProgramSchema.virtual('healthScore').get(function() {
    let totalTasks = 0;
    let blockedTasks = 0;
    let atRiskTasks = 0;
    let completedTasks = 0;
    let highRiskTasks = 0;
    let overdueTasks = 0;
    const today = new Date();

    this.workstreams.forEach(ws => {
        ws.tasks.forEach(task => {
            totalTasks++;
            if (task.status === 'blocked') blockedTasks++;
            if (task.status === 'at-risk') atRiskTasks++;
            if (task.status === 'completed') completedTasks++;
            if (task.risk === 'high') highRiskTasks++;
            if (task.end < today && task.status !== 'completed' && task.status !== 'canceled') {
                overdueTasks++;
            }
        });
    });

    if (totalTasks === 0) return 100;

    let score = 100;
    score -= (blockedTasks / totalTasks) * 100 * 2;
    score -= (atRiskTasks / totalTasks) * 100 * 1.5;
    score -= (highRiskTasks / totalTasks) * 100 * 1;
    score -= overdueTasks * 3;
    score += (completedTasks / totalTasks) * 100 * 0.3;

    return Math.max(0, Math.min(100, Math.round(score)));
});

// Ensure virtuals are included in JSON output
ProgramSchema.set('toJSON', { virtuals: true });
ProgramSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Program', ProgramSchema);

