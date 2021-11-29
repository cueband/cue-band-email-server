var express = require('express');
var router = express.Router();

const participantsController = require('../controllers/participants');

const { check, query } = require('express-validator');

const signupValidate = [
  // Check Email
  check('email', 'Invalid Email').isEmail()
  .isLength({ max: 50 }).trim().escape().normalizeEmail(),
  // Check SmartphoneType
  check('smartphone_type', 'Invalid SmartphoneType')
      .isLength({ max: 10 }).trim().escape()
      .custom((value) => {
          if (value != "android" && value != "ios" && value != "no" && value != "unknown") {
          throw new Error('Invalid SmartphoneType');
          }
          return true;
      }),
  // Check FormalTrial
  check('formal_trial', 'Invalid FormalTrial')
      .custom((value) => {
          if (typeof(value) != 'boolean')
              throw new Error('Invalid FormalTrial');
          return true;
      }),
  // Check Study
  check('study', 'Invalid Study')
      .custom((value) => {
          if (typeof(value) != 'boolean')
              throw new Error('Invalid Study');
          return true;
      }),
];

// /signup => POST
router.post('/signup', signupValidate, participantsController.postSignUp);


const verifyEmailValidate = [
  // Check token
  query('token', 'Invalid token').isHexadecimal()
  .isLength({ min: 256,max: 256 })
];

// /confirm-email => GET
router.get('/confirm-email', verifyEmailValidate, participantsController.getConfirmEmail)

module.exports = router;
