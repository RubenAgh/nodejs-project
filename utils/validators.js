const { body } = require('express-validator/check');
const User = require('../models/User');

exports.registerValidators = [
    body('email').isEmail().withMessage('Write correct mail').custom(async (value, { req }) => {
        try {
            const user = await User.findOne({ email: value });
            
            if (user) {
                return Promise.reject('User exists');
            }
        } catch (e) {
            console.log(e);
        }
    }),
    body('password', 'Password invalid').isLength({ min: 4, max: 10}).isAlphanumeric(),
    body('confirm').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords is not same');
        }

        return true;
    }),
    body('name').isLength({ min: 3 }).withMessage('Name min 3.')    
];


exports.courseValidators = [
    body('title').isLength({ min: 3 }).withMessage('Title min length 3').trim(),
    body('price').isNumeric().withMessage('Write correct price'),
    body('img', 'Write correct URL').isURL()
];

