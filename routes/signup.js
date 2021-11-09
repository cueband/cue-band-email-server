var express = require('express');
var router = express.Router();
const sgClient = require('@sendgrid/client');
const sgMail = require('@sendgrid/mail');
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');

sgClient.setApiKey(process.env.SENDGRID_API_KEY);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
    let [response, body] = await sgClient.request(requestList)

    if(response.statusCode != 200) {
        console.log('Error getting lists!');
        return res.status(500).send('Error Signing Up');
    }

    const consentList = body.result.find(element => element.name === 'Cue Band Contact Consent'); 
    if(consentList == undefined || consentList == null) {
        console.log('List not found!');
        return res.status(500).send('Error Signing Up');
    }

    //Check if contact already exists and it's activated.
    const searchData = {
        query: `email LIKE '${req.body["email"]}' AND CONTAINS(list_ids, '${consentList.id}')`
    }

    const searchRequest = {
        method: 'POST',
        url: '/v3/marketing/contacts/search',
        body: searchData
    };
    let [searchResponse, searchBody] = await sgClient.request(searchRequest)
    
    if(searchResponse.statusCode != 200) {
        console.log('Error searching for token!');
        return res.status(500).send('Error Signing Up');
    }

    const custom_fields = {
        consent_get_involved_formal_trial: req.body["formal_trial"].toString(),
        consent_get_involved_smartphone_type: req.body["smartphone_type"].toString(),
        consent_get_involved_study: req.body["study"].toString(),
    }
    
    //Generate activation token
    const activationToken = crypto.randomBytes(128).toString('hex');

    if(searchBody.contact_count == 0 || (searchBody.contact_count > 0 && searchBody.result[0].custom_fields.consent_get_involved_activated == 'false')) {
        custom_fields['consent_get_involved_activation_token'] = activationToken;
        custom_fields['consent_get_involved_activated'] = 'false';
    }
    
    //Send new contact to Sendgrid
    const data = {
        list_ids: [consentList.id],
        contacts: [
            {
                email: req.body["email"],
                custom_fields
            }
        ],
    }
    const request = {
        method: 'PUT',
        url: '/v3/marketing/contacts',
        body: data,
    };
    let [responseContact, bodyContact] = await sgClient.request(request)

    if(responseContact.statusCode == 202 || responseContact.statusCode == 200) {
        console.log('Saved contact');
    } else {
        console.log('Error on contact saving');
        return res.status(500).send('Error Signing Up');
    }

    //if already activated, no need to send email
    if(searchBody.contact_count > 0 && searchBody.result[0].custom_fields.consent_get_involved_activated == 'true')
        return res.status(200).send('Saved contact');

    //Send verification email
    const emailBody = {
        to: req.body["email"],
        from: 'kyle.montague@northumbria.ac.uk',
        subject: 'CueBand - Email verification',
        text:`
        Hello, thanks for registering your interetest in CueBand.
        Please copy and paste the address below to verify your account.
        http://localhost:3000/verify-email?token=${activationToken}`,
        html: `
        <h1>Hello, </h1>
        <p>Thanks for registering your interetest in CueBand.</p>
        <p>Please click the link below to verify your account.</p>
        <a href="http://localhost:3000/verify-email?token=${activationToken}"> Verify your account </a>`
    } 

    try {
        await sgMail.send(emailBody);
        return res.status(200).send('Saved contact');
    } catch (error) {
        console.error(error);
        if (error.response) {
            console.error(error.response.body)
        }
        return res.status(500).send('Error Signing Up');
    }

});





module.exports = router;