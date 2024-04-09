import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastUpVote: { type: Date, default: () => Date.now() - 60000 },
});

export const UserModel = mongoose.model('User', UserSchema);

export const getUsers = () => UserModel.find();
export const getUserByEmail = (email: string) => UserModel.findOne({ email });
export const getUserBySessionToken = (sessionToken: string) => UserModel.findOne({
    'authentification.sessionToken': sessionToken,
})
export const getUserById = (id: string) => UserModel.findById(id);
export const createUser = (values: Record<string, any>) => new UserModel(values)
    .save().then((user) =>! user.toObject());
export const deleteUserById = (id: string) => UserModel. findOneAndDelete({ _id: id });
export const updateUserById = (id: string, values: Record<string, any>) => UserModel.findByIdAndUpdate(id, values);

export const deleteUserByEmail = async (email: string) => {
    try {
        const user = await UserModel.findOneAndDelete({ email });
        if (!user) {
            return null;
        }
        return user;
    } catch (error) {
        console.error("Erreur lors de la suppression de l'utilisateur par e-mail:", error);
        throw error;
    }
};

export const getFirstNameById = async (userId: string) => {
    try {
        const user = await getUserById(userId);
        if (user) {
            return user.firstName;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Erreur lors de la récupération du prénom de l'utilisateur:", error);
        throw error;
    }
};
export const getLastNameById = async (userId: string) => {
    try {
        const user = await getUserById(userId);
        if (user) {
            return user.lastName;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Erreur lors de la récupération du nom de famille de l'utilisateur:", error);
        throw error;
    }
};
