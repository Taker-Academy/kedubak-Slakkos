import express from 'express';

import { deleteUser, editMyProfile, register } from '../controllers/authentication';
import { login } from '../controllers/authentication';
import { getMyProfile } from '../controllers/authentication';
import { getListPost, createPost, deletePostById, getMyPosts, getPostById, votePostById } from '../controllers/share_post';
import { createComment } from '../controllers/share_post';

export default (router: express.Router) => {
    router.post('/auth/register', register);
    router.post('/auth/login', login);
    router.get('/user/me', getMyProfile);
    router.put('/user/edit', editMyProfile);
    router.delete('/user/remove', deleteUser);
    router.get('/post/', getListPost);
    router.get('/post/me', getMyPosts);
    router.post('/post/', createPost);
    router.delete('/post/:id', deletePostById);
    router.get('/post/:id', getPostById);
    router.post('/post/vote/:id', votePostById)
    router.post('/comment/:id', createComment);
};
