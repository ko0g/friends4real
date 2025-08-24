'use strict';

require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.json());

const inf = Number(1e12);

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

async function dist(from, to, vehicle = 'foot') {
  const params = new URLSearchParams();
  params.append('point', `${from.lat},${from.lon}`);
  params.append('point', `${to.lat},${to.lon}`);
  params.append('vehicle', vehicle);
  params.append('points_encoded', 'false');
  params.append('key', process.env.API_KEY_ROUTE);
  try {
    const { data } = await axios.get('https://graphhopper.com/api/1/route', { params });
    if (!data?.paths?.length) return null;
    return data.paths[0].distance;
  } catch (err) {
    console.error('getDistance error:', err.response?.data || err.message);
    return null;
  }
}

function fillDistances(arr, gg, dist) {
  return new Promise((resolve) => {
    let n = arr.length;
    let idx = 0;
    const intervalId = setInterval(async () => {
      let i = Math.floor(idx / n);
      let j = idx % n;
      if (gg[j][i] != inf) {
        gg[i][j] = gg[j][i];
      }
      else{
        gg[i][j] = await dist({ lat: arr[i][0], lon: arr[i][1] }, { lat: arr[j][0], lon: arr[j][1] });
      }
      idx++;
      if (idx === n * n) {
        clearInterval(intervalId);
        resolve();
      }
    }, 1000);
  });
}

app.post('/api/order', async (req, res) => {
  try {
    const { start, points } = req.body || {};
    let n = points.length;
    if (!start || start[0] == null || start[1] == null || !Array.isArray(points) || n === 0) {
      return res.status(400).json({ error: 'start {lat,lon} и points [{lat,lon}, ...] обязательны' });
    }
    

    const dp = Array.from({ length: n }, () => Array((1<<n)).fill(inf));
    const pr = Array.from({ length: n }, () => Array((1<<n)).fill(-1));
    const gg = Array.from({ length: n }, () => Array(n).fill(inf));
    
    await fillDistances(points, gg, dist);
    
    dp[0][0] = 0;
    for(let i = 0; i < n; i++) {
      dp[i][1<<i] = 0;
    }
    for(let mask = 1; mask < (1<<n); mask++){
      for(let u = 0; u < n; u++){
          if (!((mask>>u)&1) || dp[u][mask] == inf) continue;
          for(let v = 0; v < n; v++){
            if ((mask>>v)&1) continue;
            let d = gg[u][v];
            if (dp[u][mask] + d < dp[v][mask | (1<<v)]) {
              dp[v][mask | (1<<v)] = dp[u][mask] + d;
              pr[v][mask | (1<<v)] = u;
            }
          }
      }
    }
    const order = [];
    let last = 0;
    let mask = (1<<n)-1;
    for(let i = 1; i < n; i++){
      if (dp[i][mask] < dp[last][mask]) last = i;
    }
    while (last !== -1) {
      order.push(last);
      const p = pr[last][mask];
      mask ^= (1<<last);
      last = p;
    }

    order.reverse();
    return res.json({ order });
  } catch (err) {
    console.error('Order error:', err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'main.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});