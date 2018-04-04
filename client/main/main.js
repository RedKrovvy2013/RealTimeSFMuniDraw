var d3 = require('d3');

var {appName} = require('./../constants');

angular.module(appName).directive('main', function($http) {
    return {
        restrict: 'E',
        template: '<svg></svg>',
        link: function($scope, elem, attrs, ctrl) {

            var width = 850;
            var height = 1000;

            var graph = d3.select('svg')
                .attr('width', width)
                .attr('height', height);

            var projection = d3.geoMercator()
                .scale(300000)
                // center map on SF
                .center([-122.435, 37.775])
                .translate([width / 2, height / 2]);

            var path = d3.geoPath()
                .projection(projection);

            var mapG = graph.append('g');

            d3.json("sfmaps/streets.json")
            .then(function(data) {
                var features = data.features;
                mapG.selectAll('path')
                    .data(features)
                    .enter().append('path')
                    .attr('d', path)
                    .attr('class', 'street');
            });
            // TODO: handle file read error

            function doBuses() {
                graph.selectAll('.bus-group')
                    .remove();
                $http.get('http://webservices.nextbus.com/service/publicJSONFeed?command=routeList&a=sf-muni')
                .then(function(res) {
                    var routes = res.data.route;
                    routes.forEach(function(route) {
                        $http.get(`http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=sf-muni&r=${route.tag}&t=0`)
                        .then(function(res) {
                            graph.append('g')
                                .attr('class', 'bus-group')
                                .selectAll('path')
                                .data(convertToGeoPoints(res.data.vehicle))
                                .enter().append('path')
                                .attr('d', path)
                                .attr('class', 'bus');
                        })
                        .catch(function(e) {
                            console.log(`Route ${route.tag} data could not be fetched`);
                            console.log(e);
                        })
                    });
                });
            }
            doBuses();
            setInterval(function() {
                doBuses();
            }, 15000);

            function convertToGeoPoints(vehicles) {
                if(typeof vehicles === "undefined")
                   return []; // handle routes that aren't active
                var geoPoints = [];
                vehicles = vehicles instanceof Array ? vehicles : [vehicles];
                // vehicles may be just one obj instead of arr, so handling above
                vehicles.forEach(function(vehicle) {
                    geoPoints.push({
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [vehicle.lon, vehicle.lat]
                        }
                    });
                });
                return geoPoints;
            }

        }
    };
});
