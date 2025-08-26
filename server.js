'use strict';

const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.json());

const inf = Number(1e12);

app.post('/api/route', async (req, res) => {
  try {
    const { from, to, vehicle = 'foot' } = req.body || {};
    if (!from || !to || from.lat == null || from.lon == null || to.lat == null || to.lon == null) {
      return res.status(400).json({ error: 'from {lat,lon} и to {lat,lon} обязательны' });
    }
    const url = `http://5.129.241.119:5000/route/v1/${vehicle}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;

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
    const url = `http://5.129.241.119:5000/route/v1/${vehicle}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
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

const K = 8;

const distCache = new Map();

function cacheKey(x1,y1,x2,y2){
  return `${x1.toFixed(6)},${y1.toFixed(6)}|${x2.toFixed(6)},${y2.toFixed(6)}`;
}

let global = 0;

async function safeDist(a,b){
  const key = cacheKey(a.lon,a.lat,b.lon,b.lat);
  if (distCache.has(key)) return distCache.get(key);
  const d = await dist(a,b);
  global++;
  if (d == null) throw new Error('dist failed for '+key);
  distCache.set(key,d);
  return d;
}

async function f(x, y, points) {
  const center = { lat: y, lon: x };
  const promises = points.map(p => safeDist(center, { lat: Number(p[1]), lon: Number(p[0]) }));
  const dists = await Promise.all(promises);
  return Math.max(...dists);
}

async function find2(x, points) {
    let l = Math.min(...points.map(p => p[1]));
    let r = Math.max(...points.map(p => p[1]));
    let g = (Math.sqrt(5) - 1)/2;
    let prev = -1;
    let t = null;

    for(let iter = 0; iter < K; iter++){
      let len = r - l;
      let m1 = l + len/(g+2);
      let m2 = r - len/(g+2);
      let f1 = null;
      let f2 = null;
      if (prev === -1){
        f1 = await f(x,m1,points);
        f2 = await f(x,m2,points);
      }
      else if (prev === 0){
        f1 = t;
        f2 = await f(x,m2,points);
      }
      else{
        f1 = await f(x,m1,points);
        f2 = t;
      }
      if (f1 < f2){
        r = m2;
        prev = 1;
        t = f1;
      }
      else{
        l = m1;
        prev = 0;
        t = f2;
      }
    }
    return (l+r)/2;
}

async function find(points) {
    let l = Math.min(...points.map(p => p[0]));
    let r = Math.max(...points.map(p => p[0]));
    let g = (Math.sqrt(5) - 1)/2;
    let prev = -1;
    let t = null;

    for(let iter = 0; iter < K; iter++){
      let len = r - l;
      let m1 = l + len/(g+2);
      let m2 = r - len/(g+2);
      let f1 = null;
      let f2 = null;
      if (prev === -1){
        f1 = await find2(m1,points);
        f2 = await find2(m2,points);
      }
      else if (prev === 0){
        f1 = t;
        f2 = await find2(m2,points);
      }
      else{
        f1 = await find2(m1,points);
        f2 = t;
      }
      let func1 = await f(m1, f1,points);
      let func2 = await f(m2, f2,points);
      if (func1 < func2){
        r = m2;
        prev = 1;
        t = f1;
      }
      else{
        l = m1;
        prev = 0;
        t = f2;
      }
    }
    let opt = await find2((l+r)/2,points);
    return [(l+r)/2, opt];
}

app.post('/api/point', async (req, res) => {
  try {
    const { points } = req.body || {};

    if (!Array.isArray(points) || points.length === 0) {
      return res.status(400).json({ error: 'points [{lat,lon}, ...] обязательны' });
    }
    global = 0;
    let center = await find(points);
    let result = await f(center[0], center[1], points);
    console.log('Optimal point:', center, ':',result, global);

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