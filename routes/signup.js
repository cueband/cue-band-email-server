var express = require('express');
var router = express.Router();
const client = require('@sendgrid/client');
const { check, validationResult } = require('express-validator');

client.setApiKey(process.env.SENDGRID_API_KEY);

const signupValidate = [
    // Check Email
    check('email', 'Invalid Email').isEmail()
    .isLength({ max: 50 }).trim().escape().normalizeEmail(),
    // Check SmartphoneType
    check('smartphone_type', 'Invalid SmartphoneType')
        .isLength({ max: 7 }).trim().escape()
        .custom((value) => {
            if (value != "android" && value != "ios" && value != "no") {
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

router.post('/', signupValidate, async function(req, res, next) {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    //Get Sendgrid Contact Lists
    const requestList = {
        method: 'GET',
        url: '/v3/marketing/lists'
    };
    let [response, body] = await client.request(requestList)

    if(response.statusCode != 200) {
        console.log('Error getting lists!');
    }

    const consentList = body.result.find(element => element.name === 'Cue Band Contact Consent'); 

    const list_ids = [];
    if(consentList != undefined)
        list_ids.push(consentList.id);
    else
        console.log('List not found!');
    
    //Send new contact to Sendgrid
    const data = {
        list_ids,
        contacts: [
            {
                email: req.body["email"],
                custom_fields:
                {
                    consent_get_involved_formal_trial: req.body["formal_trial"].toString(),
                    consent_get_involved_smartphone_type: req.body["smartphone_type"].toString(),
                    consent_get_involved_study: req.body["study"].toString(),
                }
            }
        ],
    }
    const request = {
        method: 'PUT',
        url: '/v3/marketing/contacts',
        body: data,
    };
    let [responseContact, bodyContact] = await client.request(request)

    if(responseContact.statusCode == 202 || responseContact.statusCode == 200) {
        console.log('Saved contact');
        res.status(200).send('Saved contact');
    } else {
        console.log('Error on contact saving');
        res.status(500).send('Error on contact saving');
    }
});

module.exports = router;