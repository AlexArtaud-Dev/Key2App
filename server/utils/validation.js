const Joi = require('joi');

const registerValidation = (data) => {
    const schema = Joi.object({
        username: Joi.string()
            .min(6)
            .required(),
        email: Joi.string().min(6)
            .required()
            .email(),
        password: Joi.string()
            .min(8)
            .required(),
        passwordConfirmation: Joi.string()
            .min(8)
            .required()
    });
    return schema.validate(data);
};
const loginValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().min(6)
            .required()
            .email(),
        password: Joi.string()
            .min(8)
            .required()
    });
    return schema.validate(data);
};
const loginValidationUsername = (data) => {
    const schema = Joi.object({
        username: Joi.string().min(6)
            .required(),
        password: Joi.string()
            .min(8)
            .required()
    });
    return schema.validate(data);
};

const userUpdateValidation = (data) => {
    const schema = Joi.object({
        username: Joi.string()
            .min(6)
            .max(255),
        email: Joi.string()
            .min(6)
            .max(500),
        password: Joi.string()
            .min(8)
            .max(1024)
    });
    return schema.validate(data);
};




module.exports = {
    registerValidation,
    loginValidation,
    loginValidationUsername,
    userUpdateValidation,
}