// import depedencies
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session')
const flash = require('connect-flash');
const fileUpload = require('express-fileupload');

// setup app
const app = express();

// config database
const {
  Pool
} = require('pg');
const pool = new Pool({
  user: 'dxlblartphicig',
  host: 'ec2-184-72-235-159.compute-1.amazonaws.com',
  database: 'd1ug1odop9lvlb',
  password: 'eb440f324f150a51c51d4eef1fecacc3aae40d74e03ced20636ac76ea0805011',
  port: 5432
  // user: 'pisckipy',
  // host: 'localhost',
  // database: 'pms',
  // password: 'Bismillah',
  // port: 5432
})
console.log("successfull connect to the database")

// setup routes
const indexRouter = require('./routes/index')(pool);
const usersRouter = require('./routes/users')(pool);
const projectRouter = require('./routes/project')(pool);
const profileRouter = require('./routes/profile')(pool);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'aplikasiaingkumahaaing',
  resave: true,
  saveUninitialized: true
}))

app.use(flash());
app.use(fileUpload());
app.use(function (req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/project', projectRouter);
app.use('/profile', profileRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;