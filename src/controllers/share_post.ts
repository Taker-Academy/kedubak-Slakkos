import express from 'express';
import mongoose from 'mongoose';
import { PostModel } from '../db/poster';
import { UserModel, getUserByEmail } from '../db/users';
import { deleteUserById, getUsers } from '../db/users';
import { getUserById,  deleteUserByEmail } from '../db/users';
import { authentication } from '../helpers';
import jwt from 'jsonwebtoken';

export const getListPost = async (req: express.Request, res: express.Response) => {
    try {
        const token = req.headers.authorization;
        if (!token || !token.startsWith('Bearer ')) {
            return res.status(401).json({ ok: false, message: "Mauvais token JWT" });
        }
        const accessToken = token.split(' ')[1];
        const decodedToken = jwt.verify(accessToken, '1234') as { userId: string };
        const posts = await PostModel.find().exec();
        const formattedPosts = posts.map(post => ({
            _id: post._id,
            createdAt: post.createdAt,
            userId: post.userId,
            firstName: post.firstName,
            title: post.title,
            content: post.content,
            comments: post.comments,
            upVotes: post.upVotes
        }));

        const response = {
            ok: true,
            data: formattedPosts
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error("Erreur lors de la récupération des publications:", error);
        return res.status(500).json({ ok: false, message: "Erreur interne du serveur" });
    }
};

export const getMyPosts = async (req: express.Request, res: express.Response) => {
    try {
        const token = req.headers.authorization;
        if (!token || !token.startsWith('Bearer ')) {
            return res.status(401).json({ ok: false, message: "Mauvais token JWT" });
        }

        const accessToken = token.split(' ')[1];
        const decodedToken = jwt.verify(accessToken, '1234') as { userId: string };
        const user = await getUserById(decodedToken.userId);
        if (!user) {
            return res.status(404).json({ ok: false, message: "Utilisateur non trouvé" });
        }
        const userPosts = await PostModel.find({ userId: decodedToken.userId }).exec();
        const formattedUserPosts = userPosts.map(post => ({
            _id: post._id,
            createdAt: post.createdAt,
            userId: post.userId,
            firstName: post.firstName,
            title: post.title,
            content: post.content,
            comments: post.comments,
            upVotes: post.upVotes
        }));
        const response = {
            ok: true,
            data: formattedUserPosts
        };
        return res.status(200).json(response);
    } catch (error) {
        console.error("Erreur lors de la récupération des posts de l'utilisateur:", error);
        return res.status(500).json({ ok: false, message: "Erreur interne du serveur" });
    }
};

export const getPostById = async (req: express.Request, res: express.Response) => {
    try {
        const token = req.headers.authorization;
        if (!token || !token.startsWith('Bearer ')) {
            return res.status(401).json({ ok: false, message: "Mauvais token JWT" });
        }
        const accessToken = token.split(' ')[1];
        const decodedToken = jwt.verify(accessToken, '1234') as { userId: string };
        const user = await getUserById(decodedToken.userId);
        if (!user) {
            return res.status(404).json({ ok: false, message: "Utilisateur non trouvé" });
        }
        const postId = req.params.id;
        if (!postId) {
            return res.status(400).json({ ok: false, message: "ID du post manquant" });
        }
        const post = await PostModel.findById(postId).exec();
        if (!post) {
            return res.status(404).json({ ok: false, message: "Post non trouvé" });
        }
        const response = {
            ok: true,
            data: {
                _id: post._id,
                createdAt: post.createdAt,
                userId: post.userId,
                firstName: post.firstName,
                title: post.title,
                content: post.content,
                comments: post.comments,
                upVotes: post.upVotes
            }
        };
        return res.status(200).json(response);
    } catch (error) {
        console.error("Erreur lors de la récupération du post:", error);
        return res.status(500).json({ ok: false, message: "Erreur interne du serveur" });
    }
};


export const createPost = async (req: express.Request, res: express.Response) => {
    try {
        const token = req.headers.authorization;
        if (!token || !token.startsWith('Bearer ')) {
            return res.status(401).json({ ok: false, message: "Mauvais token JWT" });
        }

        const accessToken = token.split(' ')[1];
        const decodedToken = jwt.verify(accessToken, '1234') as { userId: string, firstName: string };
        console.log("token",decodedToken);

        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ ok: false, message: "Mauvaise requête, paramètres manquants ou invalides" });
        }

        const newPost = await new PostModel({
            createdAt: new Date(),
            userId: decodedToken.userId,
            firstName: decodedToken.firstName,
            title,
            content,
            comments: [],
            upVotes: []
        }).save();

        const newToken = jwt.sign({ postId: newPost._id.toString() }, '1234');

        const response = {
            ok: true,
            data: newPost,
            token: newToken
        };

        return res.status(201).json(response);
    } catch (error) {
        console.error("Erreur lors de la création du post:", error);
        return res.status(500).json({ ok: false, message: "Erreur interne du serveur" });
    }
};

export const deletePostById = async (req: express.Request, res: express.Response) => {
    try {
        const token = req.headers.authorization;
        if (!token || !token.startsWith('Bearer ')) {
            return res.status(401).json({ ok: false, message: "Mauvais token JWT" });
        }
        const accessToken = token.split(' ')[1];
        const decodedToken = jwt.verify(accessToken, '1234') as { userId: string };
        const user = await getUserById(decodedToken.userId);
        if (!user) {
            return res.status(404).json({ ok: false, message: "Utilisateur non trouvé" });
        }
        const postId = req.params.id;
        if (!postId) {
            return res.status(400).json({ ok: false, message: "ID du post manquant" });
        }
        const post = await PostModel.findById(postId).exec();
        if (!post) {
            return res.status(404).json({ ok: false, message: "Post non trouvé" });
        }
        if (post.userId !== decodedToken.userId) {
            return res.status(403).json({ ok: false, message: "L'utilisateur n'est pas le propriétaire du post" });
        }
        await PostModel.findByIdAndDelete(postId).exec();
        const response = {
            ok: true,
            data: {
                _id: post._id,
                createdAt: post.createdAt,
                userId: post.userId,
                firstName: post.firstName,
                title: post.title,
                content: post.content,
                comments: post.comments,
                upVotes: post.upVotes,
                removed: true
            }
        };
        return res.status(200).json(response);
    } catch (error) {
        console.error("Erreur lors de la suppression du post:", error);
        return res.status(500).json({ ok: false, message: "Erreur interne du serveur" });
    }
};

export const votePostById = async (req: express.Request, res: express.Response) => {
    try {
        const token = req.headers.authorization;
        if (!token || !token.startsWith('Bearer ')) {
            return res.status(401).json({ ok: false, message: "Mauvais token JWT" });
        }
        const accessToken = token.split(' ')[1];
        const decodedToken = jwt.verify(accessToken, '1234') as { userId: string };
        const user = await getUserById(decodedToken.userId);
        if (!user) {
            return res.status(404).json({ ok: false, message: "Utilisateur non trouvé" });
        }
        const postId = req.params.id;
        if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(422).json({ ok: false, message: "ID de post invalide" });
        }
        const post = await PostModel.findById(postId);
        if (!post) {
            return res.status(404).json({ ok: false, message: "Post non trouvé" });
        }
        const voteIndex = post.upVotes.indexOf(decodedToken.userId);
        if (voteIndex !== -1) {
            return res.status(409).json({ ok: false, message: "Vous avez déjà voté pour ce post" });
        } else {
            post.upVotes.push(decodedToken.userId);
            await post.save();
            return res.status(200).json({ ok: true, message: "Vote enregistré avec succès" });
        }
    } catch (error) {
        console.error("Erreur lors du vote pour le post:", error);
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ ok: false, message: "Mauvais token JWT" });
        } else if (error instanceof mongoose.Error.ValidationError) {
            return res.status(422).json({ ok: false, message: "ID invalide" });
        } else {
            return res.status(500).json({ ok: false, message: "Erreur interne du serveur" });
        }
    }
};

export const createComment = async (req: express.Request, res: express.Response) => {
    try {
        const token = req.headers.authorization;
        if (!token || !token.startsWith('Bearer ')) {
            return res.status(401).json({ ok: false, message: "Mauvais token JWT" });
        }
        const accessToken = token.split(' ')[1];
        const decodedToken = jwt.verify(accessToken, '1234') as { userId: string, firstName: string };
        const postId = req.params.id;
        if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ ok: false, message: "ID de post invalide" });
        }
        const post = await PostModel.findById(postId);
        if (!post) {
            return res.status(404).json({ ok: false, message: "Post non trouvé" });
        }
        const { content } = req.body;
        if (!content || typeof content !== 'string') {
            return res.status(400).json({ ok: false, message: "Contenu du commentaire manquant ou invalide" });
        }
        const comment = {
            id: new mongoose.Types.ObjectId(),
            firstName: decodedToken.firstName,
            content,
            createdAt: new Date()
        };
        post.comments.push(comment);
        await post.save();

        return res.status(201).json({ ok: true, data: comment });
    } catch (error) {
        console.error("Erreur lors de la création du commentaire:", error);
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ ok: false, message: "Mauvais token JWT" });
        } else if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ ok: false, message: "Mauvaise requête, paramètres manquants ou invalides" });
        } else {
            return res.status(500).json({ ok: false, message: "Erreur interne du serveur" });
        }
    }
};
