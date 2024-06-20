if(process.env.NODE_ENV !== "production") {
    require('dotenv').config()
}

// console.log(process.env.CLOUDINARY_CLOUD_NAME)
// console.log(process.env.CLOUDINARY_SECRET)  

const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const Campground = require('./models/campground')
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
const session = require('express-session')
const flash = require('connect-flash')
const { campgroundSchema, reviewSchema } = require('./schemas.js')
const catchAsync = require('./utils/catchAsync')
const ExpressError = require('./utils/ExpresError')
const Review = require('./models/review.js')
const User = require('./models/user.js')
//ROUTES
const campgroundRoutes = require('./routes/campgrounds.js')
const reviewRoutes = require('./routes/reviews.js')
const userRoutes = require('./routes/users.js')
//authentication
const passport = require('passport')
const LocalStrategy = require('passport-local')


mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp')
    .then( () => {
        console.log("MONGO CONNECTION OPEN")
    })
    .catch( (err) => {
        console.log("Oh no, mongoose connection failed")
        console.log(err)
    })

const app = express()

app.engine('ejs', ejsMate)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')


const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000*60*60*24*7,
        maxAge: 1000*60*60*24*7
    }
}
app.use(session(sessionConfig))
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())


app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')))

app.use((req,res,next) => {
    console.log(req.session)
    res.locals.currentUser = req.user
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    next()
})

app.get('/fakeUser', async (req,res) => {
    const user = new User({ email: 'shivang@gmail.com', username: 'King'})
    const newUser = await User.register(user, 'king')
    res.send(newUser)
})

app.get('/', (req,res) => {
    res.render('home')
})

app.use('/', userRoutes)
app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/reviews', reviewRoutes)


app.all('*', (req,res,next) => {
    next(new ExpressError('Page not found!!',404))
})

app.use((err,req,res,next) => {
    const { statusCode = 500 } = err
    if(! err.message) err.message = 'Oh no, something went wrong!!'
    res.status(statusCode).render('error', { err })
})

app.listen(8000, () => {
    console.log('Serving on port 8000!')
})