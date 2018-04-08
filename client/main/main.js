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

            function Route(data, vehicleLocationsUrl) {
                this.tag = data.tag;
                this.title = data.title;
                this.vehicleLocationsUrl = vehicleLocationsUrl;
            }
            Route.prototype.activeRoutes = [];
            $scope.activeRoutes = Route.prototype.activeRoutes;

            var urlPrefix = "http://webservices.nextbus.com/service/publicJSONFeed";

            Route.prototype.alreadyInited = false;
            Route.prototype.init = function() {
                if(this.alreadyInited)
                    return; //guard against this being called more than once
                this.alreadyInited = true;
                $http.get(`${urlPrefix}?command=routeList&a=sf-muni`)
                .then(function(res) {
                    var routes = res.data.route;
                    routes.forEach(function(route) {
                        var vehicleLocationsUrl =
                            `${urlPrefix}?command=vehicleLocations&a=sf-muni&r=${route.tag}`;
                        $http.get(vehicleLocationsUrl)
                        .then(function(res) {
                            if(typeof res.data.vehicle !== "undefined") {
                                Route.prototype.activeRoutes.push(
                                    new Route(route, vehicleLocationsUrl)
                                );
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
                        });
                    })
                    var processed = 0;
                    function maybeFinish() {
                        if(++processed === routes.length) {
                            Route.prototype.initRoutes();
                        }
                    }
                })
            }
            Route.prototype.init();

            Route.prototype.initRoutes = function() {
                Route.prototype.doColorScale = d3.scaleOrdinal()
                    .domain(
                        Route.prototype.activeRoutes.map((route)=>route.tag)
                    )
                    .range(['#2BD8FF', '#CEF6FF', '#DD2BFF']);
                // above: can only assign/evenly distribute colors once
                //        we know how many active routes we are dealing with
                Route.prototype.doRoutes(true);
            };

            //static Route function .. ooohh!
            Route.prototype.doRoutes = function(isInit) {
                Route.prototype.activeRoutes.forEach(function(route) {
                    $http.get(route.vehicleLocationsUrl)
                    .then(function(res) {
                        if(isInit === true) {
                            route.svgGroup = graph.append('g')
                                .attr('class', `bus-route bus-route-${route.tag}`);
                        }
                        var vehicles = res.data.vehicle;
                        route.vehicles =
                            Route.prototype.convertToGeoPoints(vehicles, route.tag);
                        route.update();
                    })
                    .catch(function(e) {
                        //TODO: remove these vehicles from map, if exists
                        console.log(`Route ${route.tag} data could not be fetched`);
                        console.log(e);
                    });
                });
            };

            //instance Route function ... yaaay!
            Route.prototype.update = function() {
                var join = this.svgGroup
                    .selectAll('path')
                    .data(this.vehicles, (d)=>d.id);
                // important: must give key above to enable animating of buses;
                //            definitley not guaranteed that vehicles match up by index
                //            between fetches to vehicle data

                join.transition()
                    .attr('d', path);
                // takes care of updates to existing buses

                join.enter()
                    .append('path')
                    .style('fill', function(d) {
                        return Route.prototype.doColorScale(d.routeTag);
                    })
                    .attr('class', 'bus')
                    .attr('d', path);

                join.exit().remove();
            };

            Route.prototype.convertToGeoPoints = function(vehicles, routeTag) {
                var geoPoints = [];
                if(typeof vehicles === "undefined") {
                    return geoPoints; // handle routes that aren't active
                    // still is useful as current code doesn't synch active routes after init,
                    // so this handles routes that become inactive after app init
                }
                vehicles = vehicles instanceof Array ? vehicles : [vehicles];
                // vehicles may be just one obj instead of arr, so handling via above
                vehicles.forEach(function(vehicle) {
                    geoPoints.push({
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [vehicle.lon, vehicle.lat]
                        },
                        routeTag,
                        id: vehicle.id
                    });
                });
                return geoPoints;
            };
            // TODO: genericize above, make it a part of utility module..

            setInterval(function() {
                Route.prototype.doRoutes();
            }, 15000);
            // TODO: handle for when init calls don't finish after 15 seconds

            $scope.showRoute = function(routeTag) {
                d3.select(`g.bus-route-${routeTag}`)
                    .classed('hide', false);
            };
            $scope.hideRoute = function(routeTag) {
                d3.select(`g.bus-route-${routeTag}`)
                    .classed('hide', true);
            };

        }
    };
});
