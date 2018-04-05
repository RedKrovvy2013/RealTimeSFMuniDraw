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

            function Route(data) {
                this.tag = data.tag;
                this.title = data.title;
            }

            Route.prototype.activeRoutes = [];
            $scope.activeRoutes = Route.prototype.activeRoutes;

            function Bus() {

            }

            // Bus.prototype.urlPrefix = `http://webservices.nextbus.com/service/publicJSONFeed`;
            // var urlPrefix = Bus.prototype.urlPrefix;
            // TODO: use urlPrefix instead of longer strings in call instances; wasn't working at first try

            Bus.prototype.activeRoutes = Route.prototype.activeRoutes;
            Bus.prototype.alreadyInited = false;
            Bus.prototype.init = function() {
                if(this.alreadyInited)
                    return; //guard against this being called more than once
                this.alreadyInited = true;
                $http.get('http://webservices.nextbus.com/service/publicJSONFeed?command=routeList&a=sf-muni')
                .then(function(res) {
                    var routes = res.data.route;
                    routes.forEach(function(route) {
                        $http.get(`http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=sf-muni&r=${route.tag}`)
                        .then(function(res) {
                            if(typeof res.data.vehicle !== "undefined") {
                                Route.prototype.activeRoutes.push(new Route(route));
                                // above filters out routes that aren't active,
                                // so they don't errantly show as toggle-able in route selector
                                // TODO: dynamically update activeRoutes as routes
                                //       become active and inactive
                            }
                            maybeFinish();
                        })
                        .catch(function(e) {
                            // TODO: error handling
                            maybeFinish();
                        })
                    })
                    var processed = 0;
                    function maybeFinish() {
                        if(++processed === routes.length) {
                            Bus.prototype.doBuses();
                        }
                    }
                })
            }
            Bus.prototype.init();

            Bus.prototype.doBuses = function() {
                graph.selectAll('.bus-route')
                    .remove();
                Route.prototype.activeRoutes.forEach(function(route) {
                    $http.get(`http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=sf-muni&r=${route.tag}`)
                    .then(function(res) {
                        var vehicles = res.data.vehicle;
                        graph.append('g')
                            .attr('class', `bus-route bus-route-${route.tag}`)
                            .selectAll('path')
                            .data(Bus.prototype.convertToGeoPoints(vehicles))
                            .enter().append('path')
                            .attr('d', path)
                            .attr('class', 'bus');
                    })
                    .catch(function(e) {
                        console.log(`Route ${route.tag} data could not be fetched`);
                        console.log(e);
                    })
                });
            }
            Bus.prototype.doBuses();
            setInterval(function() {
                Bus.prototype.doBuses();
            }, 10000);

            Bus.prototype.convertToGeoPoints = function(vehicles) {
                if(typeof vehicles === "undefined") {
                    return []; // handle routes that aren't active
                    // still is useful as current code doesn't synch active routes after init,
                    // so this handles routes that become inactive after app init
                }
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
                d3.select(`g.bus-route-${routeTag}`)
                    .classed('hide', false);
            }
            $scope.hideRoute = function(routeTag) {
                d3.select(`g.bus-route-${routeTag}`)
                    .classed('hide', true);
            }

            // $http.get('http://webservices.nextbus.com/service/publicJSONFeed?command=routeList&a=sf-muni')
            // .then(function(res) {
            //     $scope.routes = res.data.route;
            // });

        }
    };
});
