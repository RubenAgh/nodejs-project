const { Router } = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator/check'); 
const nodemailer = require('nodemailer');
const sendgrid = require('nodemailer-sendgrid-transport');
const keys = require('../keys');
const router = Router();
const regEmail = require('../emails/registration');
const resetEmail = require('../emails/reset');
const { registerValidators } = require('../utils/validators');

const transporter = nodemailer.createTransport(sendgrid({
    auth: { api_key: keys.SENDGRID_API_KEY }
}));

router.get('/login', async (req, res) => {
    res.render('auth/login', {
        title: 'Authorization',
        isLogin: true,
        loginError: req.flash('loginError'),
        registerError: req.flash('registerError')
    });
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const candidate = await User.findOne({ email });

        if (candidate) {
            const isSame = await bcrypt.compare(password, candidate.password);

            if (isSame) {
                req.session.user = candidate;
                req.session.isAuthenticated = true;
                req.session.save((err) => {
                    if (err) {
                        throw err;
                    } else {
                        res.redirect('/');
                    }
                });
            } else {
                req.flash('loginError', 'Incorrect password');
                res.redirect('/auth/login#login');
            }
        } else {
            req.flash('loginError', 'No user');
            res.redirect('/auth/login#login');
        }
    } catch (e) {
        console.log(e);
    }
});

router.get('/logout', async (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login#login');
    });
});

router.post('/register', registerValidators, async (req, res) => {
    try {
        const { email, password, name } = req.body;   

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('registerError', errors.array()[0].msg);

            return res.status(422).redirect('/auth/login#register');
        }
        
        const hashPassword = await bcrypt.hash(password, 10);
        const user = new User({
            email, name, password: hashPassword, cart: { items: [] }
        });
        await user.save();

        await transporter.sendMail(regEmail( email ));
        res.redirect('/auth/login#login');
    } catch (error) {
        console.log(error);
    }
});

router.get('/reset', (req, res) => {
    res.render('auth/reset', {
        title: 'Reset password',
        error: req.flash('error')
    });
});

router.get('/password/:token', async (req, res) => {
    const { token } = req.params;

    if (!token) {
        return res.redirect('/auth/login');
    }

    try {
        const user = await User.findOne({
            resetToken: token,
            resetTokenExp: { $gt: Date.now() } 
        });

        if (!user) {
            return res.redirect('/auth/login');     
        } else {
            res.render('auth/password', {
                title: 'Reset password',
                error: req.flash('error'),
                userId: user._id.toString(),
                token
            }); 
        }
    } catch (e) {
        console.log(e);
    };

});

router.post('/reset', (req, res) => {
    try {
        const { email } = req.body;

        crypto.randomBytes(32, async (err, buffer) => {
            if (err) {
                req.flash('error', 'Please try again!');
                return res.redirect('/auth/reset');
            }

            const token = buffer.toString('hex');

            const candidate = await User.findOne({ email });
            
            if (candidate) {
                candidate.resetToken = token;
                candidate.resetTokenExp = Date.now() + 60 * 60 * 1000;

                await candidate.save();

                transporter.sendMail(resetEmail(email, token));
                res.redirect('/auth/login');
            } else {
                req.flash('error', 'User not found!');
                res.redirect('/auth/reset');
            }
        });
    } catch (e) {
        console.log(e);
    }
});

router.post('/password', async (req, res) => {
    try {
        const { userId, token, password } = req.body;

        const user = await User.findOne({
            _id: userId,
            resetToken: token,
            resetTokenExp: { $gt: Date.now() }
        });

        if (!user) {
            req.flash('loginError', 'Token expired');
            res.redirect('/auth/login');
        } else {
            user.password = await bcrypt.hash(password, 10);
            user.resetTokenExp = undefined;
            user.resetToken = undefined;

            await user.save();
            
            res.redirect('/auth/login');
        }
    } catch (e) {
        console.log(e);
    };
});

module.exports = router;