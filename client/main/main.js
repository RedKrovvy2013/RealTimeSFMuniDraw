var d3 = require('d3');

var {appName} = require('./../constants');

angular.module(appName).directive('main', function() {
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

            d3.json("sfmaps/streets.json")
            .then(function(data) {
                var features = data.features;
                graph.selectAll('path')
                    .data(features)
                    .enter().append('path')
                    .attr('d', path);
            });
            // TODO: handle file read error

        }
    };
});
