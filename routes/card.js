const { Router } = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const router = Router();

function mapCartItems(cart) {
    return cart.items.map(c => ({
        ...c.courseId._doc,
        id: c.courseId.id, 
        count: c.count 
    }));
}

function computePrice(courses) {
    return courses.reduce((acc, course) => {
        return acc + course.count * course.price;
    }, 0);
}

router.post('/add', async (req, res) => {
    const course = await Course.findById(req.body.id);
    await req.user.addToCart(course);

    res.redirect('/card');
});

router.get('/', async (req, res) => {
    const user = await req.user
        .populate('cart.items.courseId')
        .execPopulate();

    const courses = mapCartItems(user.cart);
    
    res.render('card', {
        title: 'Card',
        isCard: true,
        courses,
        price: computePrice(courses)
    });
});

router.delete('/remove/:id', async (req, res) => {
    await req.user.removeFromCart(req.params.id);
    const user = await req.user.populate('cart.items.courseId').execPopulate();
    
    const courses = mapCartItems(user.cart);
    const cart = {
        courses, price: computePrice(courses)
    };

    res.json(cart);
});

module.exports = router;