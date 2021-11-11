# Cue Band Email Server
This server allows people to register their interest in being contacted to participate in the study. This serves as a middleware between the website's [Get Involved form](https://cue.band/getinvolved) and Sendgrid Marketing feature. All data collected through this server is stored on Sendgrid.

## Envrionment variables
The API requires the following envrionment variables, store these in a `.env` file at the route of the directory,
or pass them in through Docker. Boolean env variables are either `true` or `false`. Uppercase will not be detected.

| **Name**                     | **Type**| **Description**                                                                              |
|------------------------------|---------|----------------------------------------------------------------------------------------------|
| SENDGRID_API_KEY             | String  | Key required to use Sendgrid services.                                                       |
| DOMAIN_URL                   | String  | URL of the domain where this is currently deployed (include protocol).                       |
| EMAIL_SENDER                 | String  | Email address that will send the emails. Must be registered on Sendgrid.                     |
| CONFIRM_EMAIL_TEMPLATE_ID    | String  | Id of the email template send to confirm the users email.                                    |
| TOKEN_ERROR_REDIRECT_URL     | String  | URL to the page where the user will be redirected if confirmation of the email fails.        |
| TOKEN_ACTIVATED_REDIRECT_URL | String  | URL to the page where the user will be redirected if confirmation of the email is successful.|
| CONTACT_LIST_NAME            | String  | Name of the list where the contacts are being stored in Sendgrid.                            |

## Endpoints

| Route          | Method | Description                    | Parameters                                                                                                                            |
|----------------|--------|--------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| /signup        | POST   | Stores user data into Sendgrid | - `email` : string <br> - `smartphone_type` : string ("android", "ios", "no") <br> - `formal_trial` : boolean <br> - `study` : boolean|
| /confirm-email | GET    | Confirms the user email        | - `token` : string (hex 128 bytes)

## Sendgrid Setup

### Required Custom Fields
To create custom fields go to `Marketing` => `Custom Fields` => `New Custom Field`.

| Field Name   | Field Type |
|---------|--------|
| consent_get_involved_formal_trial | Text
| consent_get_involved_smartphone_type | Text
| consent_get_involved_study | Text
| consent_get_involved_activation_token | Text
| consent_get_involved_activated | Text

### Required Contact List
1. To create a contact list go to `Marketing` => `Contacts` => `Create` => `New List`.<br>
2. Add the name of the newly created list to the `.env` in the `CONTACT_LIST_NAME ` parameter.

## Deploying with Docker
```
docker-compose up
```

## Running locally
```
npm run start
```