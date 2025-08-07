const API_KEY_MAP = '1bc282243dca48c0acd5582d97d4e00a';
const API_KEY_ROUTE = '11f01e0a-ec02-4d5e-aeb2-76e2f4e6efca';

function get_start_point_icon(color){
    return `
        <svg width="31" height="45" viewBox="0 0 31 45" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.1767 0.000305176C23.7288 0.361278 30.5118 7.26639 30.1578 15.9542C30.0356 18.9539 28.6344 21.91 27.0039 24.4072C26.398 25.44 25.8375 26.5003 25.2476 27.5424L22.3245 32.705C21.9193 33.4368 21.264 34.2909 21.0211 35.077C20.4553 35.6326 18.7421 38.6716 18.3242 39.4428C17.5467 40.8855 15.7605 43.3873 15.2669 44.7889L15.1767 44.7189C15.2449 44.1851 15.1797 43.5783 15.1787 43.0349L15.1752 23.5193C15.173 23.0735 15.1124 22.5742 15.1767 22.1372C19.0375 22.0344 22.1771 19.0368 22.2234 15.1181C22.2687 11.2739 18.9718 8.11345 15.1767 8.0872V0.000305176Z" fill="${color}"/>
        <path d="M3.1235 24.4072C1.60028 20.7888 -0.0123236 19.3512 7.09993e-05 14.798C0.0220896 6.69111 7.12475 -0.0506043 15.1767 0.000286242V8.08718C18.9718 8.11343 22.2687 11.2739 22.2234 15.1181C22.1771 19.0368 19.0375 22.0344 15.1767 22.1372C15.1124 22.5742 15.173 23.0735 15.1752 23.5193L15.1787 43.0349C15.1798 43.5783 15.2449 44.1851 15.1767 44.7189C14.5053 43.6151 13.72 42.4739 13.0243 41.3552C12.6339 40.7274 12.3099 40.0492 11.8883 39.4428C11.2828 38.2355 9.98979 36.1851 9.21491 35.077C7.39583 31.7829 5.3586 28.621 3.59872 25.2885C3.45086 24.9872 3.29396 24.6962 3.1235 24.4072ZM15.1767 8.08718C11.2893 8.07858 8.01118 11.2014 7.99952 15.1181C7.98742 19.1265 11.2839 22.0469 15.1767 22.1372C19.0375 22.0344 22.1771 19.0368 22.2234 15.1181C22.2687 11.2739 18.9718 8.11343 15.1767 8.08718Z" fill="${color}"/>
        </svg>
    `;
}

function get_friend_point_icon(color){
    return `
        <svg width="40" height="67" viewBox="0 0 40 67" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.7425 65.9071C20.9776 67.2648 19.0224 67.2648 18.2575 65.9071L0.553063 34.4817C0.209723 33.8723 0.209724 33.1277 0.553063 32.5183L18.2575 1.09292C19.0224 -0.264825 20.9776 -0.264821 21.7425 1.09293L39.4469 32.5183C39.7903 33.1277 39.7903 33.8723 39.4469 34.4817L21.7425 65.9071Z" fill="${color}"/>
        </svg>
    `;
}

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
        source: routeSource
    });

    map.addLayer(routeLayer);
    map.addLayer(mainLayer);

    let ready = false;

    let clicked = false;

    const startbtn = document.getElementById('startpoint');
    const calcbtn = document.getElementById('btn');

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

    map.getViewport().addEventListener('mouseleave', () => {
        if (clicked && !ready) {
            hoverIcon.style.display = 'none';
            following = false;
        }
    });

    map.getViewport().addEventListener('pointermove', (e) => {
        if (following) {
            hoverIcon.style.left = `${e.clientX - 2}px`;
            hoverIcon.style.top = `${e.clientY}px`;

            const mapCoordinate = map.getEventCoordinate(e); // из пикселей в координаты карты
            const lonLat = ol.proj.toLonLat(mapCoordinate);  // в долготу/широту

            startbtn.innerHTML = `${lonLat[0].toFixed(3)}, ${lonLat[1].toFixed(3)}`;
        }
    });

    let mode1 = true;
    let mode2 = false;

    let tgl1 = document.getElementById('mode1');
    let tgl2 = document.getElementById('mode2');

    tgl1.onclick = () => {
        if (tgl1.classList[1] == "active") return;
        mode1 = true;
        mode2 = false;
        tgl2.classList.replace("active", "nonactive");
        tgl1.classList.replace("nonactive", "active");
        calcbtn.innerHTML = "Построить маршрут";
    };

    tgl2.onclick = () => {
        if (tgl2.classList[1] == "active") return;
        mode2 = true;
        mode1 = false;
        tgl1.classList.replace("active", "nonactive");
        tgl2.classList.replace("nonactive", "active");
        calcbtn.innerHTML = "Рассчитать точку";
    };



    function append_icon(_scale, color, type, event){
        const coordinate = event.coordinate;
        const lonLat = ol.proj.toLonLat(coordinate);
        let svg = null;
        if (type == 0){
            svg = get_start_point_icon(color);
        }
        else{
            svg = get_friend_point_icon(color);
        }
        const encoded_svg = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
        const pointFeature = new ol.Feature({
            geometry: new ol.geom.Point(coordinate)
        });
        pointFeature.setStyle(new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 1],
                src: encoded_svg,
                scale: _scale
            })
        }));
        mainSource.addFeature(pointFeature);
    }

    let start = [];
    let points = [];

    const colors = ['red', 'orange', 'blue', 'cyan', 'purple'];

    let was_changed = false;

    map.on('click', function (event) {
        if (!clicked) return;
        was_changed = true;
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
            append_icon(0.9, color, 0, event);
        } else {
            color = colors[points.length % colors.length];
            points.push([lonLat[0].toFixed(6), lonLat[1].toFixed(6)]);
            append_icon(0.75, color, 1, event);
        }
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

    function calc(toPoint, curColor, i) {
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
                            lineDash: [10, 10],
                            lineDashOffset: i
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
        if (!was_changed) return;
        was_changed = false;
        routeSource.clear();
        for (let i = 0; i < points.length; i++) {
            calc(points[i], colors[i % colors.length], i*2);
        }
    };
};
