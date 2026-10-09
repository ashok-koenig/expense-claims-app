const path = require('node:path');
const express = require('express');
const cors = require('cors');
const claimsRoutes = require('./routes/claims.routes');
const ratesRoutes = require('./routes/rates.routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/claims', claimsRoutes);
app.use('/api/rates', ratesRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
