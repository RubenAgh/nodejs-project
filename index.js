const express = require('express');
const path = require('path');
const csrf = require('csurf');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const Handlebars = require('handlebars');
const exphbs = require('express-handlebars');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const MongoStore = require('connect-mongodb-session')(session);

const authRoutes = require('./routes/auth');
const homeRoutes = require('./routes/home');
const addRoutes = require('./routes/add');
const coursesRoutes = require('./routes/courses');
const cardRoutes = require('./routes/card');
const ordersRouter = require('./routes/orders');
const profileRouter = require('./routes/profile');

const varMiddleware = require('./middlewares/variables');
const authMiddleware = require('./middlewares/auth');
const userMiddleware = require('./middlewares/user');
const errorHandler = require('./middlewares/error');
const fileMiddleware = require('./middlewares/file');
const keys = require('./keys');

const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');

const app = express();

const hbs = exphbs.create({
    defaultLayout: 'main',
    extname: 'hbs',
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    helpers: require('./utils/hbs-helpers')
});

const store = new MongoStore({
    collection: 'sessions',
    uri: keys.MONGODB_URI
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', 'views');  

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: keys.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store
}));
app.use(fileMiddleware.single('avatar'));
app.use(csrf());
app.use(flash());
// app.use(helmet());
app.use(compression());
app.use(varMiddleware);
app.use(userMiddleware);

app.use('/', homeRoutes);
app.use('/add', authMiddleware, addRoutes);
app.use('/courses', coursesRoutes);
app.use('/card', authMiddleware, cardRoutes);
app.use('/orders', authMiddleware, ordersRouter);
app.use('/auth', authRoutes);
app.use('/profile', authMiddleware, profileRouter);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;


async function start () {
    try {    
        await mongoose.connect(keys.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        });
    
        app.listen(PORT, () => {
            console.log(`Server is running on PORT ${PORT}`);
        });
    } catch (e) {
        console.log(e);
    }
}

start();

// allowInsecurePrototypeAccess

// https://www.npmjs.com/package/@handlebars/allow-prototype-access#usage--express-handlebars-and-mongoose-