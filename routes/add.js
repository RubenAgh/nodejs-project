const { Router } = require('express');
const Course = require('../models/Course');
const { validationResult } = require('express-validator/check');
const { courseValidators } = require('../utils/validators');
const router = Router();

router.get('/', (req, res) => {
    res.render('add', {
        title: 'Add new course',
        isAdd: true
    });
});

router.post('/', courseValidators, async (req, res) => {
    const errors = validationResult(req);
    const { courseName, coursePrice, imageURL } = req.body;

    if (!errors.isEmpty()) {
        return res.status(422).render('add', {
            title: 'Add new course',
            isAdd: true,
            error: errors.array()[0].msg,
            data: {
                title: courseName,
                price: coursePrice,
                image: imageURL, 
            } 
        });
    }

    
    // const course = new Course(courseName, coursePrice, imageURL);
    const course = new Course({
        title: courseName,
        price: coursePrice,
        image: imageURL,
        userId: req.user
    });

    try {
        await course.save();
        res.redirect('/courses');
    } catch (error) {
        console.log(error);
    }

});

module.exports = router;