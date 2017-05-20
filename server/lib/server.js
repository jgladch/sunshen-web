import express from 'express';
import passport from 'passport';
import { Strategy } from 'passport-google-authcode';
import bodyParser from 'body-parser';

const app = express();

// Environment variables in development
if (process.env.NODE_ENV !== 'production') { // If we're not in production, pull in environment variables
  require('dotenv').config();
}

// Middleware
app.set('port', (process.env.PORT || 3001));
app.use(bodyParser.json());

if (process.env.NODE_ENV === 'production') { // Express only serves static assets in production
  app.use(express.static('client/build'));
}

// Auth
app.use(passport.initialize());

passport.use(new Strategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET
}, (accessToken, refreshToken, profile, done) => {
  console.log('accessToken: ', accessToken);
  console.log('refreshToken: ', refreshToken);
  console.log('profile: ', profile);
  return done();
}));

// Routes
app.get('/data', (req, res) => {
  return res.send(['1', '2', '3']);
});

app.post('/auth', passport.authenticate('google-authcode'), (req, res) => {
  console.log('auth post request: ', req.body);
  return res.end();
});

app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
