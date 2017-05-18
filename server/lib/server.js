import express from 'express';
const app = express();

app.set('port', (process.env.PORT || 3001));

if (process.env.NODE_ENV === 'production') { // Express only serves static assets in production
  app.use(express.static('client/build'));
} else { // If we're not in production, pull in environment variables
  require('dotenv').config();
}

app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`); // eslint-disable-line no-console
});
