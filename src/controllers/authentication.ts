import express from 'express';
import { UserModel, getUserByEmail } from '../db/users';
import { deleteUserById, getUsers } from '../db/users';
import { getUserById,  deleteUserByEmail } from '../db/users';
import { authentication } from '../helpers';
import jwt from 'jsonwebtoken';

export const login = async (req: express.Request, res: express.Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ ok: false, error: 'Mauvaise requête, paramètres manquants ou invalides.' });
        }
        const user = await getUserByEmail(email);
        if (!user || user.password !== authentication(password)) {
            return res.status(401).json({ ok: false, error: 'Mauvais identifiants.' });
        }
        const token = jwt.sign({ email: user.email, userId: user._id, firstName: user.firstName }, '1234', { expiresIn: '1h' });
        return res.status(200).json({
            ok: true,
            data: {
                token: token,
                user: {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName
                }
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false, error: 'Erreur interne du serveur.' });
    }
}

export const register = async (req: express.Request, res: express.Response) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        if (!email || !password || !firstName || !lastName) {
            return res.sendStatus(400);
        }
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.sendStatus(400);
        }
        const hashedPassword = authentication(password);
        const newUser = new UserModel({
            email: email,
            password: hashedPassword,
            firstName: firstName,
            lastName: lastName,
        });
        const user = await newUser.save();
        const token = jwt.sign({ email: user.email, userId: user._id, firstName: user.firstName }, '1234', { expiresIn: '1h' });

        return res.status(201).json({
            ok: true,
            data: {
                token: token,
                user: {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName
                }
            }
        }).end();
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
}

export const getMyProfile = async (req: express.Request, res: express.Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.sendStatus(401);
        }
        const token = authHeader.split(' ')[1];
        console.log(token);
        const decodedToken = jwt.verify(token, '1234') as { email: string };
        const userEmail = decodedToken.email;
        const user = await getUserByEmail(userEmail);

        if (!user) {
            return res.sendStatus(404);
        }
        const responseData = {
            ok: true,
            data: {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        };
        return res.status(200).json(responseData);
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
};

export const editMyProfile = async (req: express.Request, res: express.Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.sendStatus(401);
        }
        const accessToken = authHeader.split(' ')[1];
        const decodedToken = jwt.verify(accessToken, '1234') as { email: string };
        const userEmail = decodedToken.email;
        const user = await getUserByEmail(userEmail);

        if (!user) {
            return res.sendStatus(404);
        }
        if (req.body.firstName) {
            user.firstName = req.body.firstName;
        }
        if (req.body.lastName) {
            user.lastName = req.body.lastName;
        }
        if (req.body.email) {
            user.email = req.body.email;
        }
        if (req.body.password) {
            user.password = authentication(req.body.password);
        }
        const updatedUser = await user.save();
        const responseData = {
            ok: true,
            data: {
                email: updatedUser.email,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName
            }
        };

        return res.status(200).json(responseData);
    } catch (error) {
        console.log(error);
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ ok: false, message: "Invalid JWT token" });
        }
        return res.sendStatus(500);
    }
};

export const deleteUser = async (req: express.Request, res: express.Response) => {
    try {
        const token = req.headers.authorization;
        if (!token || !token.startsWith('Bearer ')) {
            return res.status(401).json({ ok: false, message: "Token JWT manquant" });
        }
        const accessToken = token.split(' ')[1];
        const decodedToken = jwt.verify(accessToken, '1234') as { email: string };
        const userEmail = decodedToken.email;

        const deletedUser = await deleteUserByEmail(userEmail);

        if (!deletedUser) {
            return res.status(404).json({ ok: false, message: "Utilisateur non trouvé" });
        }

        return res.status(200).json({
            ok: true,
            data: {
                email: deletedUser.email,
                firstName: deletedUser.firstName,
                lastName: deletedUser.lastName,
                removed: true
            }
        });
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ ok: false, message: "Mauvais token JWT" });
        }
        console.log(error);
        return res.status(500).json({ ok: false, message: "Erreur interne du serveur" });
    }
};

