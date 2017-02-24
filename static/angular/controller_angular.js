//Note AngularJS code is included within the layout
var demoAngular = angular.module('laopao', []);

demoAngular.config(function($interpolateProvider) {
    //allow Web2py views and Angular to co-exist
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
});
