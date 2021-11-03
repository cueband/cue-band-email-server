# Cue Band Email Server
Server allowing people to register their interest in being contacted to participate in the study. This serves as a middleware between the website's [Get Involved form](https://cue.band/getinvolved) and Sendgrid Marketing featuring. All data collected in thourhg this server is stored on Sendgrid.

## Envrionment variables
The API requires the following envrionment variables, store these in a `.env` file at the route of the directory,
or pass them in through Docker. Boolean env variables are either `true` or `false`. Uppercase will not be detected.

| **Name**              | **Type**| **Description**                                                                             |
|-----------------------|---------|---------------------------------------------------------------------------------------------|
| SENDGRID_API_KEY      | String  | Key required to use Sendgrid services                                                       |


## Endpoints

| Route   | Method | Description | Parameters |
|---------|--------|-------------|------------|
| /signup | POST   | Stores user data into Sendgrid | - `email` : string <br> - `smartphone_type` : string ("android", "ios", "no") <br> - `formal_trial` : boolean <br> - `study` : boolean

## Sendgrid Setup

### Required Custom Fields
To create custom fields go to `Marketing` => `Custom Fields` => `New Custom Field`

| Field Name   | Field Type |
|---------|--------|
| consent_get_involved_formal_trial | Text
| consent_get_involved_smartphone_type | Text
| consent_get_involved_study | Text

### Required Contact List
To create a contact list go to `Marketing` => `Contacts` => `Create` => `New List`

* `Cue Band Contact Consent`

## Deploying with Docker
```
docker-compose up
```

## Running locally
```
npm run start
```