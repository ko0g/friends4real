'use strict';

require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.json());

app.post('/api/route', async (req, res) => {
  try {
    const { from, to, vehicle = 'foot', locale = 'ru' } = req.body || {};
    if (!from || !to || from.lat == null || from.lon == null || to.lat == null || to.lon == null) {
      return res.status(400).json({ error: 'from {lat,lon} и to {lat,lon} обязательны' });
    }

    const params = new URLSearchParams();
    params.append('point', `${from.lat},${from.lon}`);
    params.append('point', `${to.lat},${to.lon}`);
    params.append('vehicle', vehicle);
    params.append('locale', locale);
    params.append('points_encoded', 'false');
    params.append('key', process.env.API_KEY_ROUTE);

    const { data } = await axios.get('https://graphhopper.com/api/1/route', { params });

    if (!data?.paths?.length) {
      return res.status(404).json({ error: 'Маршрут не найден' });
    }

    const path = data.paths[0];
    const coords = path.points?.coordinates;
    return res.json({
      coords,
      distance: path.distance,
      time: path.time,
      bbox: path.bbox
    });
  } catch (err) {
    console.error('Route error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'main.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});