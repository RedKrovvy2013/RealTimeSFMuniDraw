var angular = require('angular')

var app = angular.module('app', [
    require('angular-ui-router')
])

app.config(
    function($urlRouterProvider, $stateProvider, $locationProvider){

        $urlRouterProvider.otherwise('/')
        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        })

        $stateProvider
        .state('app', {
            url: '/',
            views: {
                header: {
                    template: require('./header/header.html')
                }
            }
        })

    }
)
