import express from 'express';
import google from 'googleapis';
import googleAuth from 'google-auth-library';
import bodyParser from 'body-parser';
import session from 'cookie-session';
import compression from 'compression';
import enforce from 'express-sslify';
import _ from 'lodash';

const app = express();
const env = process.env.NODE_ENV || 'development';
const auth = new googleAuth();
const calendar = google.calendar('v3');

// Environment variables in development
if (env !== 'production') {
  require('dotenv').config();
}

// Middleware
app.set('port', (process.env.PORT || 3001));
app.use(bodyParser.json());
app.use(compression());

app.use(session({
  secret: process.env.COOKIE_SECRET,
  secure: env === 'production',
  httpOnly: true
}));

if (env === 'production') { // Express only serves static assets in production
  app.use(express.static('client/build'));
  app.disable('x-powered-by');
  app.enable('trust proxy');
  app.set('trust proxy', 1);
  app.use(enforce.HTTPS({
    trustProtoHeader: true
  }));
}

// Routes
app.post('/auth', (req, res) => {
  const oauth2Client = new auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_CLIENT_REDIRECT_URI);

  return oauth2Client.getToken(req.body.code, (err, token) => {
    if (err) {
      console.log('Error while trying to retrieve access token', err);
      return;
    } else {
      console.log('Token: ', token);
    }
    
    oauth2Client.credentials = token;
    req.session.auth = token;

    return calendar.events.list({
      auth: oauth2Client,
      calendarId: 'primary',
      timeMin: (new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
      kind: 'calendar#event',
      fields: 'items(etag, id, status, htmlLink, created, updated, creator, organizer, recurringEventId, recurrence, attendees, summary, start, end, extendedProperties), summary'
    }, (err, response) => {
      console.log('response: ', response);
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }

      const events = response.items;

      return res.json({
        auth: token,
        events
      });
    });
  });
});

app.put('/event', (req, res) => {
  if (!req.session.auth) {
    return res.status(401).end();
  } else {
    const oauth2Client = new auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_CLIENT_REDIRECT_URI);
    const extendedProperties = req.body.extendedProperties;
    const eventId = req.body.id;
    const start = req.body.start;
    const end = req.body.end;
    oauth2Client.credentials = req.session.auth;

    return calendar.events.patch({
      auth: oauth2Client,
      calendarId: 'primary',
      eventId,
      resource: {
        end,
        start,
        extendedProperties
      }
    }, (err, response) => {
      if (err) {
        console.log('err: ', err);
        return res.status(500).end();
      } else {
        return res.status(200).end();
      }
    });
  }
});

app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
