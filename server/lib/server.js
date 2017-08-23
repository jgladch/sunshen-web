import express from 'express';
import google from 'googleapis';
import googleAuth from 'google-auth-library';
import bodyParser from 'body-parser';
import session from 'cookie-session';
import compression from 'compression';
import enforce from 'express-sslify';
import _ from 'lodash';
import moment from 'moment';

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
app.get('/init', (req, res) => {
  if (req.session.auth) {
    const oauth2Client = new auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_CLIENT_REDIRECT_URI);
    oauth2Client.credentials = req.session.auth;

    return calendar.calendarList.list({
      auth: oauth2Client
    }, (err, response) => {
      const calendars = !!response && !!response.items ? response.items : [];

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
        if (err) {
          console.log('The API returned an error: ' + err);
          return res.json({
            authorized: false
          });
        }

        const events = response.items;
        const sortedEvents = sortEvents(events);

        return res.json({
          authorized: true,
          events,
          sortedEvents,
          calendars
        });
      });
    });

  } else {
    return res.json({
      authorized: false,
      events: [],
      sortedEvents: []
    });
  }
});

app.post('/auth', (req, res) => {
  const oauth2Client = new auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_CLIENT_REDIRECT_URI);
  const timeMin = moment().toISOString();
  const timeMax = moment().add(1, 'weeks').toISOString();

  return oauth2Client.getToken(req.body.code, (err, token) => {
    if (err) {
      console.log('Error while trying to retrieve access token', err);
      return;
    } else {
      console.log('Token: ', token);
    }
    
    oauth2Client.credentials = token;
    req.session.auth = token;

    return calendar.calendarList.list({
      auth: oauth2Client
    }, (err, response) => {
      const calendars = !!response && !!response.items ? response.items : [];

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
        if (err) {
          console.log('The API returned an error: ' + err);
          return res.json({
            authorized: false
          });
        }

        const events = response.items;
        const sortedEvents = sortEvents(events);

        return res.json({
          authorized: true,
          events,
          sortedEvents,
          calendars
        });
      });
    });
  });
});

app.get('/events', (req, res) => {
  if (!req.session.auth) {
    return res.status(401).end();
  } else {
    const timeMin = req.query.timeMin;
    const timeMax = req.query.timeMax;
    const oauth2Client = new auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_CLIENT_REDIRECT_URI);
    oauth2Client.credentials = req.session.auth;

    return calendar.events.list({
      auth: oauth2Client,
      calendarId: 'primary',
      timeMin,
      timeMax,
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
      const sortedEvents = sortEvents(events);

      return res.json({
        events,
        sortedEvents
      });
    });
  }
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
        end, // I believe this can be removed after moving to `patch` method
        start, // This one too
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

function sortEvents (events) { // Group events by day, map into array, sort array by date (for displaying events in day lists)
  const groupedEvents = _.groupBy(events, event => moment(event.start.dateTime || event.start.date).format('MMMM Do, YYYY'));
  const mappedEvents = _.map(groupedEvents, (events, date) => {
    return {
      date,
      events
    };
  });
  const sortedEvents = _.sortBy(mappedEvents, group => group.date);

  return sortedEvents;
}