var express = require('express');
var router = express.Router();
const sgClient = require('@sendgrid/client');
const sgMail = require('@sendgrid/mail');
const { query, validationResult } = require('express-validator');

sgClient.setApiKey(process.env.SENDGRID_API_KEY);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const verifyEmailValidate = [
    // Check token
    query('token', 'Invalid token').isHexadecimal()
    .isLength({ min: 256,max: 256 })
];

router.get('/', verifyEmailValidate, async (req, res, next) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Token validation failed!');
        return res.redirect('https://cue.band/activationerror/');
    }

    //Get contact list
    const requestList = {
        method: 'GET',
        url: '/v3/marketing/lists'
    };
    let [response, body] = await sgClient.request(requestList)

    if(response.statusCode != 200) {
        console.log('Error getting lists!');
        return res.redirect('https://cue.band/activationerror/');
    }

    const consentList = body.result.find(element => element.name === 'Cue Band Contact Consent'); 

    if(consentList ==  null || consentList == undefined)
        return res.redirect('https://cue.band/activationerror/');

    //Search for token
    const searchData = {
        query: `consent_get_involved_activation_token LIKE '${req.query.token}' AND CONTAINS(list_ids, '${consentList.id}')`
    }

    const searchRequest = {
        method: 'POST',
        url: '/v3/marketing/contacts/search',
        body: searchData
    };
    let [searchResponse, searchBody] = await sgClient.request(searchRequest)
    
    if(searchResponse.statusCode != 200 || searchBody.contact_count == 0) {
        console.log('Error searching for token!');
        return res.redirect('https://cue.band/activationerror/');
    }

    //Update contact to activated
    const activateData = {
        list_ids: [consentList.id],
        contacts: [
            {
                email: searchBody.result[0].email,
                custom_fields:
                {
                    consent_get_involved_activated: "true"
                }
            }
        ],
    }   
    const request = {
        method: 'PUT',
        url: '/v3/marketing/contacts',
        body: activateData,
    };
    let [activateResponse, activateBody] = await sgClient.request(request)

    if(activateResponse.statusCode == 202 || activateResponse.statusCode == 200) {
        console.log(`Contact activated (${searchBody.result[0].email}).`);
    } else {
        console.log('Error on contact updating');
        return res.redirect('https://cue.band/activationerror/');
    }

    return res.redirect('https://cue.band/activated/');
});

module.exports = router;