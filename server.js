const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Статическая папка
app.use(express.static(path.join(__dirname, 'frontend')));

// Отдать index.html по корню
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'main.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});