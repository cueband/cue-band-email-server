var express = require('express');
var router = express.Router();
const client = require('@sendgrid/client');

client.setApiKey(process.env.SENDGRID_API_KEY);

router.post('/', async function(req, res, next) {

    console.log("Req Body");
    console.log(req.body);

    if(req.body["email"] == undefined || 
        req.body["smartphone_type"] == undefined ||
        req.body["formal_trial"] == undefined ||
        req.body["study"] == undefined) {
            console.log("Missing Params!");
            res.status(400).send('Missing Params!');
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