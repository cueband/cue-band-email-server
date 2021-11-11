var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var dotenv = require('dotenv');

const result = dotenv.config()
if (result.error) {
  throw result.error
}

const requiredEnvVariables = [process.env.SENDGRID_API_KEY, process.env.DOMAIN_URL, process.env.EMAIL_SENDER, 
  process.env.CONFIRM_EMAIL_TEMPLATE_ID,  process.env.TOKEN_ERROR_REDIRECT_URL, 
  process.env.TOKEN_ACTIVATED_REDIRECT_URL, process.env.CONTACT_LIST_NAME];

for(const variable of requiredEnvVariables) {
  if(variable == undefined)
    throw Error('Required env variable missing!');
}

var indexRouter = require('./routes/index');

var app = express();

app.use(cors())

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).send();
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
