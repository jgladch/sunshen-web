import express from 'express';
import google from 'googleapis';
import googleAuth from 'google-auth-library';
import bodyParser from 'body-parser';

const app = express();
const calendar = google.calendar('v3');

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

// Routes
app.get('/data', (req, res) => {
  return res.send(['1', '2', '3']);
});

app.post('/auth', (req, res) => {
  const auth = new googleAuth();
  const oauth2Client = new auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_CLIENT_REDIRECT_URI);

  return oauth2Client.getToken(req.body.code, (err, token) => {
    if (err) {
      console.log('Error while trying to retrieve access token', err);
      return;
    } else {
      console.log('Token: ', token);
    }
    
    oauth2Client.credentials = token;

    calendar.events.list({
      auth: oauth2Client,
      calendarId: 'primary',
      timeMin: (new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    }, (err, response) => {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }

      const events = response.items;

      console.log('events');

      if (events.length == 0) {
        console.log('No upcoming events found.');
      } else {
        console.log('Upcoming 10 events:');
        for (var i = 0; i < events.length; i++) {
          var event = events[i];
          var start = event.start.dateTime || event.start.date;
          console.log('%s - %s', start, event.summary);
        }
      }

      return res.json(events);
    });
  });
});

app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
