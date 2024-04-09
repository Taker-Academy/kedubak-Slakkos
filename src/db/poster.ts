import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
    createdAt: { type: Date, required: true },
    userId: { type: String, required: true },
    firstName: { type: String, required: true },
    title: { type: String, required: true },
    comments: [{
        createdAt: { type: Date, default: Date.now },
        id: { type: String, required: true },
        firstName: { type: String, required: true },
        content: { type: String, required: true }
    }],
    content: { type: String, required: true },
    upVotes: [{ type: String }],
});

export const PostModel = mongoose.model('Post', PostSchema);