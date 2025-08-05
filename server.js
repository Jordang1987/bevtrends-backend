const express = require('express');
const cors = require('cors');

const trendsRoutes = require('./routes/trends');
const sponsoredRoutes = require('./routes/sponsored');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/trending', trendsRoutes);
app.use('/sponsored', sponsoredRoutes);

app.get('/', (req, res) => {
  res.send('BevTrends API Running 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
