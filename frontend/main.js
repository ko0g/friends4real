const API_KEY_MAP = '1bc282243dca48c0acd5582d97d4e00a';
const API_KEY_ROUTE = '11f01e0a-ec02-4d5e-aeb2-76e2f4e6efca';

window.onload = () => {
    const map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: `https://maps.geoapify.com/v1/tile/klokantech-basic/{z}/{x}/{y}.png?&apiKey=${API_KEY_MAP}`,
                    attributions: 'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a> contributors',
                    maxZoom: 20,
                    minZoom: 8
                })
            })
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([37.60, 55.65]),
            zoom: 15
        })
    });
    const mainSource = new ol.source.Vector();
    const routeSource = new ol.source.Vector();

    const mainLayer = new ol.layer.Vector({
        source: mainSource
    });
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
    map.addLayer(mainLayer);

    let ready = false;

    let clicked = false;

    const startbtn = document.getElementById('startpoint');

    startbtn.onclick = () => {
        clicked=true;
    };

    const hoverIcon = document.getElementById('hover-icon');
    let following = false;

    map.getViewport().addEventListener('mouseenter', () => {
        if (clicked && !ready) {
            hoverIcon.style.display = 'block';
            following = true;
        }
    });

    // Hide when mouse leaves
    map.getViewport().addEventListener('mouseleave', () => {
        if (clicked && !ready) {
            hoverIcon.style.display = 'none';
            following = false;
        }
    });

    // Move with cursor
    map.getViewport().addEventListener('pointermove', (e) => {
    if (following) {
        hoverIcon.style.left = `${e.clientX - 2}px`;
        hoverIcon.style.top = `${e.clientY}px`;
    }
    });

    let start = [];
    let points = [];

    const colors = ['red', 'orange', 'blue', 'cyan', 'purple'];

    map.on('click', function (event) {
        if (!clicked) return;
        if (following){
            hoverIcon.style.transform = 'translate(-47%, -77.5%) scale(0.55)';
            setTimeout(() => {
            hoverIcon.style.display = 'none';
            }, 290);
            following = false;
        }
        
        const coordinate = event.coordinate;
        const lonLat = ol.proj.toLonLat(coordinate);

        if (!ready) {
            start = [lonLat[0].toFixed(6), lonLat[1].toFixed(6)];
            ready = true;
            color = 'green';
        } else {
            color = colors[points.length % colors.length];
            points.push([lonLat[0].toFixed(6), lonLat[1].toFixed(6)]);
        }

        const svg = `
            <svg width="31" height="45" viewBox="0 0 31 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.1767 0.000305176C23.7288 0.361278 30.5118 7.26639 30.1578 15.9542C30.0356 18.9539 28.6344 21.91 27.0039 24.4072C26.398 25.44 25.8375 26.5003 25.2476 27.5424L22.3245 32.705C21.9193 33.4368 21.264 34.2909 21.0211 35.077C20.4553 35.6326 18.7421 38.6716 18.3242 39.4428C17.5467 40.8855 15.7605 43.3873 15.2669 44.7889L15.1767 44.7189C15.2449 44.1851 15.1797 43.5783 15.1787 43.0349L15.1752 23.5193C15.173 23.0735 15.1124 22.5742 15.1767 22.1372C19.0375 22.0344 22.1771 19.0368 22.2234 15.1181C22.2687 11.2739 18.9718 8.11345 15.1767 8.0872V0.000305176Z" fill="${color}"/>
            <path d="M3.1235 24.4072C1.60028 20.7888 -0.0123236 19.3512 7.09993e-05 14.798C0.0220896 6.69111 7.12475 -0.0506043 15.1767 0.000286242V8.08718C18.9718 8.11343 22.2687 11.2739 22.2234 15.1181C22.1771 19.0368 19.0375 22.0344 15.1767 22.1372C15.1124 22.5742 15.173 23.0735 15.1752 23.5193L15.1787 43.0349C15.1798 43.5783 15.2449 44.1851 15.1767 44.7189C14.5053 43.6151 13.72 42.4739 13.0243 41.3552C12.6339 40.7274 12.3099 40.0492 11.8883 39.4428C11.2828 38.2355 9.98979 36.1851 9.21491 35.077C7.39583 31.7829 5.3586 28.621 3.59872 25.2885C3.45086 24.9872 3.29396 24.6962 3.1235 24.4072ZM15.1767 8.08718C11.2893 8.07858 8.01118 11.2014 7.99952 15.1181C7.98742 19.1265 11.2839 22.0469 15.1767 22.1372C19.0375 22.0344 22.1771 19.0368 22.2234 15.1181C22.2687 11.2739 18.9718 8.11343 15.1767 8.08718Z" fill="${color}"/>
            </svg>
        `;
        const encoded_svg = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);

        const pointFeature = new ol.Feature({
            geometry: new ol.geom.Point(coordinate)
        });
        pointFeature.setStyle(new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 1],
                src: encoded_svg,
                scale: 0.9
            })
        }));
        mainSource.addFeature(pointFeature);
    });

    const point_precision = 100000;
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

    const calcbtn = document.getElementById('btn');

    function calc(toPoint, curColor) {
        const url = `https://graphhopper.com/api/1/route?point=${start[1]},${start[0]}&point=${toPoint[1]},${toPoint[0]}&vehicle=foot&locale=ru&key=${API_KEY_ROUTE}`;
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
                            width: 4,
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

    calcbtn.onclick = () => {
        routeSource.clear();
        for (let i = 0; i < points.length; i++) {
            calc(points[i], colors[i % colors.length]);
        }
    };
};
