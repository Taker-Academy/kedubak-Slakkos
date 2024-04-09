import crypto from 'crypto';

const SECRET ='MATHIEU-REST-API';

export const random = () => crypto.randomBytes(128).toString('base64');
export const authentication = (password: string) => {
    return crypto.createHmac('sha256', SECRET).update(password).digest('hex');
};



