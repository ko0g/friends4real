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
    const { from, to, vehicle = 'foot' } = req.body || {};
    if (!from || !to || from.lat == null || from.lon == null || to.lat == null || to.lon == null) {
      return res.status(400).json({ error: 'from {lat,lon} и to {lat,lon} обязательны' });
    }

    const url = `http://localhost:8000/route/v1/${vehicle}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;

    const { data } = await axios.get(url);

    if (!data?.routes?.length) {
      return res.status(404).json({ error: 'Маршрут не найден' });
    }

    const route = data.routes[0];
    const coords = route.geometry.coordinates;

    return res.json({
      coords,
      distance: route.distance,
      time: route.duration,
      weight_name: route.weight_name,
      weight: route.weight
    });
  } catch (err) {
    console.error('Route error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

async function dist(from, to, vehicle = 'foot') {
  try {
    const url = `http://localhost:8000/route/v1/${vehicle}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
    const { data } = await axios.get(url);
    if (!data?.routes?.length) return 0;
    return data.routes[0].distance;
  } catch (err) {
    console.error('getDistance error:', err.response?.data || err.message);
    return null;
  }
}

async function fillDistances(arr) {
  let n = arr.length;
  const gg = Array.from({ length: n }, () => Array(n).fill(inf));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        gg[i][j] = 0;
      } else if (i < j) {
        gg[i][j] = await dist({ lat: arr[i][1], lon: arr[i][0] }, { lat: arr[j][1], lon: arr[j][0] });
        gg[j][i] = gg[i][j];
      }
    }
  }
  return gg;
}

app.post('/api/order', async (req, res) => {
  try {
    const { start, points } = req.body || {};
    if (!start || start[0] == null || start[1] == null || !Array.isArray(points) || points.length === 0) {
      return res.status(400).json({ error: 'start {lat,lon} и points [{lat,lon}, ...] обязательны' });
    }
    const arr = [start, ...points];
    let n = arr.length;

    const dp = Array.from({ length: n }, () => Array((1<<n)).fill(inf));
    const pr = Array.from({ length: n }, () => Array((1<<n)).fill(-1));
    
    
    const gg = await fillDistances(arr);
    
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
    while (last !== -1) {
      if (last !== 0){
        order.push(last - 1);
      }
      const p = pr[last][mask];
      mask ^= (1<<last);
      last = p;
    }
    console.log(order, dp[0][(1<<n)-1]);
    return res.json({ order });
  } catch (err) {
    console.error('Order error:', err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/point', async (req, res) => {
  try {
    const { points } = req.body || {};

    if (!Array.isArray(points) || points.length === 0) {
      return res.status(400).json({ error: 'points [{lat,lon}, ...] обязательны' });
    }

    let center = [0, 0];
    points.forEach(point => {
      center[0] += Number(point[0]);
      center[1] += Number(point[1]);
    });
    center[0] /= points.length;
    center[1] /= points.length;
    console.log('Optimal point:', center);
    return res.json({ point: center });
  } catch (err) {
    console.error('Point error:', err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'main.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});