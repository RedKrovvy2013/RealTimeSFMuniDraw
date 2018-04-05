var d3 = require('d3');

var {appName} = require('./../constants');
require('./../checkboxKit/checkboxKit');

angular.module(appName).directive('main', function($http) {
    return {
        restrict: 'E',
        template: require('./main.html'),
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
                            var vehicles = res.data.vehicle;
                            graph.append('g')
                                .attr('class', 'bus-group')
                                .selectAll('path')
                                .data(convertToGeoPoints(vehicles))
                                .enter().append('path')
                                .attr('d', path)
                                .attr('class', `bus route-tag-${getRouteTag(vehicles)}`);
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
            }, 10000);

            function getRouteTag(vehicles) {
                if(typeof vehicles === "undefined")
                    return "undefined";
                vehicles = vehicles instanceof Array ? vehicles : [vehicles];
                return vehicles[0].routeTag;
            }

            function convertToGeoPoints(vehicles) {
                if(typeof vehicles === "undefined")
                   return []; // handle routes that aren't active
                var geoPoints = [];
                vehicles = vehicles instanceof Array ? vehicles : [vehicles];
                // vehicles may be just one obj instead of arr, so handling via above
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

            $scope.showRoute = function(routeTag) {
                d3.selectAll(`.route-tag-${routeTag}`)
                    .classed('hide', false);
            }
            $scope.hideRoute = function(routeTag) {
                d3.selectAll(`.route-tag-${routeTag}`)
                    .classed('hide', true);
            }

            $http.get('http://webservices.nextbus.com/service/publicJSONFeed?command=routeList&a=sf-muni')
            .then(function(res) {
                $scope.routes = res.data.route;
            });

        }
    };
});
