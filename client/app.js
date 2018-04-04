var angular = require('angular');
// only requiring angular here, as it is a core package,
// so no need to track its usage throughout modules

var {appName} = require('./constants');

angular.module(appName, []);

require('./main/main');
