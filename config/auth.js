// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'      : '1549152758680448', // your App ID
        'clientSecret'  : '1426d3e81a01c6f7d887753e6aeed68c', // your App Secret
        'callbackURL'   : 'http://opensource.petra.ac.id:11010/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey'       : 'C1atDPj2iojZAI6VLUfOzkwxj',
        'consumerSecret'    : 'yrJg9t0E24btg9ezWGn6FR9tZwhaC6PJ6tUgFO6h3kYBPpCth9',
        'callbackURL'       : 'http://opensource.petra.ac.id:11010/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'      : '62980141677-hgu0nvss6aiafmgaqbesj3ge89it5fek.apps.googleusercontent.com',
        'clientSecret'  : 'CZtegUKbOCUMu77Wi4hJhqBp',
        'callbackURL'   : 'http://opensource.petra.ac.id:11010/auth/google/callback'
    }

};