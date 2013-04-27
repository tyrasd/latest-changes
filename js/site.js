var map = L.map('map', { }).setView([37.7, -97.3], 16);
var layer = null;

L.hash(map);

map.getZoom() > 15 ?
    d3.select('#map').classed('zoom-in', false) :
    d3.select('#map').classed('zoom-in', true);

L.tileLayer('http://a.tiles.mapbox.com/v3/tmcw.map-l1m85h7s/{z}/{x}/{y}.png')
    .addTo(map);

function run() {
    var bounds = map.getBounds();
    d3.xml('http://www.openstreetmap.org/api/0.6/map?bbox=' +
        bounds.getSouthWest().lng + ',' +
        bounds.getSouthWest().lat + ',' +
        bounds.getNorthEast().lng + ',' +
        bounds.getNorthEast().lat // + ',' +
        ).on('load', function(xml) {
            layer && map.removeLayer(layer);

            layer = new L.OSM.DataLayer(xml).addTo(map);

            var bytime = [];

            layer.eachLayer(function(l) {
                bytime.push({
                    time: new Date(l.feature.timestamp),
                    feature: l
                });
            });

            layer.on('click', function(e) {
                click({ feature: e.layer });
            });

            bytime.sort(function(a, b) {
                return (+b.time) - (+a.time);
            });

            var datescale = d3.time.scale()
                .domain(d3.extent(bytime.map(function(b) { return b.time; })))
                .range([0, 1]);

            var colint = d3.interpolateRgb('#000', '#f00');

            var rl = d3.select('#results')
                .selectAll('div.result')
                .data(bytime)
                .enter()
                .append('div')
                .attr('class', 'result')
                .style('color', function(l) {
                    return colint(datescale(l.time));
                });

            function click(d) {
                rl.classed('active', function(_) {
                    return d == _;
                });
                resetStyle();
                d.feature.setStyle({ color: '#0f0' });
                if (d3.event) d3.event.preventDefault();
            }

           rl.append('a').classed('load', true).html('&larr; ').attr('href', '#')
           .on('click', click);
           rl.append('span').classed('deemphasize', true).text('edited ');

           rl.append('span').text(function(d) {
               return moment(d.time).format('MMM Do YYYY, h:mm:ss a ');
           });

           rl.append('span').classed('deemphasize', true).text('by ');

           rl.append('a').text(function(d) {
               return d.feature.feature.user + ' ';
           })
           .attr('target', '_blank')
           .attr('href', function(d) {
               return 'http://openstreetmap.org/user/' + d.feature.feature.user;
           });

           rl.append('a').attr('class', 'l changeset-link').text(function(d) {
               return 'changeset';
           })
           .attr('target', '_blank')
           .attr('href', function(d) {
               return 'http://openstreetmap.org/browse/changeset/' + d.feature.feature.changeset;
           });

           rl.append('a').attr('class', 'l item-link').text(function(d) {
               return d.feature.feature.type;
           })
           .attr('target', '_blank')
           .attr('href', function(d) {
               return 'http://openstreetmap.org/browse/' + d.feature.feature.type + '/' + d.feature.feature.id + '/history';
           });

           function resetStyle() {
               layer.eachLayer(function(l) {
                   l.setStyle({
                       color: colint(datescale(new Date(l.feature.timestamp))),
                       opacity: 0.8
                   });
               });
           }

           resetStyle();

    }).get();
}
map.on('moveend', function() {
    if (map.getZoom() > 13) {
        d3.select('#map').classed('zoom-in', false);
        run();
    } else {
        d3.select('#map').classed('zoom-in', true);
        layer && map.removeLayer(layer);
        layer = null;
    }
});
