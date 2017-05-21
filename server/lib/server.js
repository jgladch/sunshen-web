import express from 'express';
import google from 'googleapis';
import googleAuth from 'google-auth-library';
import bodyParser from 'body-parser';

const app = express();

// Environment variables in development
if (process.env.NODE_ENV !== 'production') { // If we're not in production, pull in environment variables
  require('dotenv').config();
}

const auth = new googleAuth();
const oauth2Client = new auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_CLIENT_REDIRECT_URI);

// Middleware
app.set('port', (process.env.PORT || 3001));
app.use(bodyParser.json());

if (process.env.NODE_ENV === 'production') { // Express only serves static assets in production
  app.use(express.static('client/build'));
}

// Routes
app.get('/data', (req, res) => {
  return res.send(['1', '2', '3']);
});

app.post('/auth', (req, res) => {
  return oauth2Client.getToken(req.body.code, (err, token) => {
    if (err) {
      console.log('Error while trying to retrieve access token', err);
      return;
    } else {
      console.log('Token: ', token);
    }
    oauth2Client.credentials = token;
    return res.end();
  });
});

app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
