const sgClient = require('@sendgrid/client');
const sgMail = require('@sendgrid/mail');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

sgClient.setApiKey(process.env.SENDGRID_API_KEY);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


getSendgridContactList = async() => {

    const requestList = {
        method: 'GET',
        url: '/v3/marketing/lists'
    };
    let [response, body] = await sgClient.request(requestList)

    if(response.statusCode != 200) {
        console.log('Error getting lists!');
        return null;
    }

    const consentList = body.result.find(element => element.name ===  process.env.CONTACT_LIST_NAME); 
    if(consentList == undefined || consentList == null) {
        console.log('List not found!');
        return null;
    }

    return consentList;
}

checkIfContactExists = async(email, listId) => {

    const searchData = {
        query: `email LIKE '${email}' AND CONTAINS(list_ids, '${listId}')`
    }

    const searchRequest = {
        method: 'POST',
        url: '/v3/marketing/contacts/search',
        body: searchData
    };
    let [searchResponse, searchBody] = await sgClient.request(searchRequest)

    if(searchResponse.statusCode != 200) {
        console.log('Error searching for token!');
        return null;
    }

    return searchBody.contact_count == 0 ? null : searchBody.result[0];
}

sendNewContactToSendgrid = async(contact, activationToken, listId, email, formalTrial, smartphoneType, study) => {

    const custom_fields = {
        consent_get_involved_formal_trial: formalTrial,
        consent_get_involved_smartphone_type: smartphoneType,
        consent_get_involved_study: study,
    }

    if(contact == null || 
        (contact != null && (contact.custom_fields.consent_get_involved_activated == 'false' || contact.custom_fields.consent_get_involved_activated == '' || contact.custom_fields.consent_get_involved_activated == null || contact.custom_fields.consent_get_involved_activated == undefined))) {
        custom_fields['consent_get_involved_activation_token'] = activationToken;
        custom_fields['consent_get_involved_activated'] = 'false';
    }

    //Send new contact to Sendgrid
    const data = {
        list_ids: [listId],
        contacts: [
            {
                email,
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
        return true;
    } else {
        console.log('Error on contact saving');
        return false;
    }

}

sendConfirmationEmail = async(email, activationToken) => {
    const emailDelayMinutes = 3;
    const currentTime =  new Date();
    currentTime.setMinutes(currentTime.getMinutes() + emailDelayMinutes);
    const unixTimeInSeconds = Math.round(currentTime.getTime() / 1000);

    const confirmEmailEndpoint = '/confirm-email'; 

    const emailBody = {
        to: email,
        from: process.env.EMAIL_SENDER,
        templateId: process.env.CONFIRM_EMAIL_TEMPLATE_ID,
        dynamicTemplateData: {
            tokenLink: `${process.env.DOMAIN_URL}${confirmEmailEndpoint}?token=${activationToken}`,
            email,
        },
        sendAt: unixTimeInSeconds
    }

    try {
        await sgMail.send(emailBody);
        return true;
    } catch (error) {
        console.error(error);
        if (error.response) {
            console.error(error.response.body)
        }
        return false;
    }
}

searchToken = async(token, listId) => {
    const searchData = {
        query: `consent_get_involved_activation_token LIKE '${token}' AND CONTAINS(list_ids, '${listId}')`
    }

    const searchRequest = {
        method: 'POST',
        url: '/v3/marketing/contacts/search',
        body: searchData
    };
    let [searchResponse, searchBody] = await sgClient.request(searchRequest)

    if(searchResponse.statusCode != 200 || searchBody.contact_count == 0) {
        console.log('Error searching for token!');
        return null;
    }

    return searchBody.result[0];
}

activateContact = async(contact, listId) => {

    const activateData = {
        list_ids: [listId],
        contacts: [
            {
                email: contact.email,
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
        console.log(`Contact activated (${contact.email}).`);
        return true;
    } else {
        console.log('Error on contact updating');
        return false;
    }

}


exports.postSignUp = async (req, res, next) => {

    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        //Get Sendgrid Contact Lists
        const consentList = await getSendgridContactList();
        if(consentList == null)
            return res.status(500).send('Error Signing Up');


        //Check if contact already exists and it's activated.
        const contact = await checkIfContactExists(req.body["email"], consentList.id);

        //Generate activation token
        const activationToken = crypto.randomBytes(128).toString('hex');

        //Send new contact to Sendgrid
        const sendSuccessful = await sendNewContactToSendgrid(contact, activationToken, consentList.id, req.body["email"], req.body["formal_trial"].toString(), req.body["smartphone_type"].toString(), req.body["study"].toString());
        if(!sendSuccessful)
            return res.status(500).send('Error Signing Up');

        //if already activated, no need to send email
        if(contact != null && contact.custom_fields.consent_get_involved_activated == 'true') {
            console.log('Contact already exists, dont send email', req.body["email"], contact, contact.custom_fields.consent_get_involved_activated);
            return res.status(200).send('Saved contact');
        }
        
        //Send Confirmation email
        console.log("Sending email");
        const sendEmailSuccessful = await sendConfirmationEmail(req.body["email"], activationToken);
        if(sendEmailSuccessful)
            return res.status(200).send('Saved contact');
        else
            return res.status(500).send('Error Signing Up');

    } catch(e) {
        console.error(e);
        return res.status(500).send('Error Signing Up');
    }
}

exports.getConfirmEmail = async (req, res, next) => {
 
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        //Get Sendgrid Contact Lists
        const consentList = await getSendgridContactList();
        if(consentList == null) {
            console.log('Error getting lists!');
            return res.redirect(process.env.TOKEN_ERROR_REDIRECT_URL);
        }

        //Search for token
        const contact = await searchToken(req.query.token, consentList.id);
        if(contact == null)
            return res.redirect(process.env.TOKEN_ERROR_REDIRECT_URL);

        //Update contact to activated
        const activated = activateContact(contact, consentList.id);
        if(!activated)
            return res.redirect(process.env.TOKEN_ERROR_REDIRECT_URL);
        
        return res.redirect(process.env.TOKEN_ACTIVATED_REDIRECT_URL);

    } catch(e) {
        console.error(e);
        return res.redirect(process.env.TOKEN_ERROR_REDIRECT_URL);
    }

}