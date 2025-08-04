const API_KEY = '11f01e0a-ec02-4d5e-aeb2-76e2f4e6efca';

window.onload = () => {
    const map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: 'https://{a-c}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png/{z}/{x}/{y}.png',
                    attributions: '© OpenStreetMap contributors, © CartoDB'
                })
            })
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([37.60, 55.65]),
            zoom: 15
        })
    });

    const vectorSource1 = new ol.source.Vector();
    const vectorLayer1 = new ol.layer.Vector({
        source: vectorSource1
    });
    map.addLayer(vectorLayer1);

    /*const routeSource = new ol.source.Vector();
    const routeLayer = new ol.layer.Vector({
        source: routeSource,
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'blue',
                width: 2,
                lineDash: [10, 10]
            })
        })
    });
    map.addLayer(routeLayer);

    const point_precision = 100000;


    ready = false;

    const info_txt = document.getElementById('info');

    start = [];
    points = [];

    map.on('click', function (event) {
        const coordinate = event.coordinate;
        const lonLat = ol.proj.toLonLat(coordinate);
        const pointFeature = new ol.Feature({
            geometry: new ol.geom.Point(event.coordinate)
        });
        let color;
        if (!ready){
            color = 'green';
            start = [+lonLat[0].toFixed(6), +lonLat[1].toFixed(6)];
            ready = true;
            info_txt.innerHTML = `Стартовая точка: ${start[1]} ${start[0]}`;
        }
        else{
            color = 'red';
            points.push([+lonLat[0].toFixed(6), +lonLat[1].toFixed(6)]);
        }
        pointFeature.setStyle(new ol.style.Style({
            image: new ol.style.Circle({
                radius: 3,
                fill: new ol.style.Fill({ color }),
                stroke: new ol.style.Stroke({ color: '#000', width: 2 })
            })
        }));
        vectorSource1.addFeature(pointFeature);
    });

    const calcbtn = document.getElementById('calcbutton');

    function decodePolyline(encoded) {
        const points = [];
        let index = 0, lat = 0, lng = 0;

        while (index < encoded.length) {
            let b, shift = 0, result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
            lat += dlat;

            shift = 0;
            result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
            lng += dlng;

            points.push([lng / point_precision, lat / point_precision]);
        }

        return points;
    }

    function calc(toPoint, curColor) {
        const url = `https://graphhopper.com/api/1/route?point=${start[1]},${start[0]}&point=${toPoint[1]},${toPoint[0]}&vehicle=foot&locale=ru&key=${API_KEY}`;
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.paths && data.paths.length > 0) {
                    const coords = decodePolyline(data.paths[0].points);
                    const route = new ol.geom.LineString(coords).transform('EPSG:4326', 'EPSG:3857');
                    const feature = new ol.Feature({ geometry: route });

                    feature.setStyle(new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: curColor,
                            width: 2,
                            lineDash: [10, 10]
                        })
                    }));

                    routeSource.addFeature(feature);
                } else {
                    console.error('Маршрут не найден.');
                }
            })
            .catch(err => {
                console.error('Ошибка при получении маршрута:', err);
            });
    }

    const colors = ['red', 'green', 'blue', 'cyan', 'purple'];

    calcbtn.onclick = () => {
        routeSource.clear(); // очищаем старые маршруты
        for (let i = 0; i < points.length; i++) {
            calc(points[i], colors[i % colors.length]);
        }
    };*/
};
