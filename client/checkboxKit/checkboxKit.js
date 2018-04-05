var {appName} = require('./../constants');

angular.module(appName).directive('checkboxKit', function() {
    return {
        restrict: 'E',
        // use isolated scope to make directive more component-like
        scope: {
            title: '@',
            id: '<?',
            onCheck: '&?',
            onUncheck: '&?',
            isChecked: '<?'
        },
        template: require('./checkboxKit.html'),
        link: function($scope, elem, attrs, ctrl) {

            if(typeof $scope.isChecked === 'undefined')
                $scope.isChecked = true;

            $scope.toggleCheckbox = function() {
                $scope.isChecked = !$scope.isChecked;
                if($scope.isChecked) {
                    $scope.onCheck({id: $scope.id});
                } else {
                    $scope.onUncheck({id: $scope.id});
                }
            }

        }
    };
});
