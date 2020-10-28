const { Router } = require('express');
const Course = require('../models/Course');
const authMiddleware = require('../middlewares/auth');
const { courseValidators } = require('../utils/validators');
const router = Router();

router.get('/', async (req, res) => {
    try {
        const courses = await Course.find()
            .populate('userId', 'email name')
            .select('price title image');
        
        res.render('courses', {
            title: 'Courses page',
            isCourses: true,
            userId: req.user ? req.user._id.toString() : null,
            courses
        });
    } catch (e) {
        console.log(e);
    }
});

router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        res.render('course', {
            layout: 'empty',
            title: `${course.title} Course`,
            course
        });
    } catch (e) {
        console.log(e);
    }
});

router.get('/:id/edit', authMiddleware, async (req, res) => {
    if (!req.query.allow) {
        return res.redirect('/');
    }

    try {
        const course = await Course.findById(req.params.id);

        if (course.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/courses');
        }
    
        res.render('course-edit', {
            title: `Edit ${course.title} course`,
            course
        });
    } catch (e) {
        console.log(e);
    }
});

router.post('/edit', authMiddleware, courseValidators, async (req, res) => {
    try {
        const errors = validationResult(req);
        const { id } = req.body;

        if (!errors.isEmpty()) {
            return res.status(422).redirect(`/courses/${id}/edit`);
        }

        if (id.toString() !== req.user._id.toString()) {
            return res.redirect('/courses');
        }
    
        delete req.body.id;
    
        await Course.findByIdAndUpdate(id, req.body);
    
        res.redirect('/courses');
    } catch (e) {
        console.log(e);
    }
});

router.post('/remove', authMiddleware, async (req, res) => {
    const { id } = req.body;
    try {
        await Course.deleteOne({
            _id: id,
            userId: req.user._id
        });
    
        res.redirect('/courses');
    } catch (error) {
        console.log(error);
    }
});

module.exports = router;