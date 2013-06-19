angular.module('kendo.directives').factory('directiveFactory', ['widgetFactory', '$timeout',
  function(widgetFactory, $timeout) {
    var create = function(kendoWidget) {

      return {
        // Parse the directive for attributes and classes
        restrict: 'ACE',
        transclude: true,
        require: '?ngModel',
        controller: [ '$scope', '$attrs', '$element', '$transclude', function($scope, $attrs, $element, $transclude) {

          // Make the element's contents available to the kendo widget to allow creating some widgets from existing elements.
          $transclude(function(clone){
            $element.append(clone);
          });

          // TODO: add functions to allow other directives to register option decorators
        }],

        link: function(scope, element, attrs, ngModel) {

          var widget;

          // Bind kendo widget to element only once interpolation on attributes is done.
          // Using a $timeout with no delay simply makes sure the function will be executed next in the event queue
          // after the current $digest cycle is finished. Other directives on the same element (select for example)
          // will have been processed, and interpolation will have happened on the attributes.
          $timeout( function() {

            // create the kendo widget and bind it to the element.
            widget = widgetFactory.create(scope, element, attrs, kendoWidget);


            // if kendo-refresh attribute is provided, rebind the kendo widget when
            // the watched value changes
            if( attrs.kendoRefresh ) {
              // watch for changes on the expression passed in the kendo-refresh attribute
              scope.$watch(attrs.kendoRefresh, function(newValue, oldValue) {
                if(newValue !== oldValue) {
                  // create the kendo widget and bind it to the element.
                  widget = widgetFactory.create(scope, element, attrs, kendoWidget);
                }
              }, true); // watch for object equality. Use native or simple values.
            }

            // Cleanup after ourselves
            scope.$on( '$destroy', function() {
              widget.destroy();
            });

            // if ngModel is on the element, we setup bi-directional data binding
            if (ngModel) {
              if( !widget.value ) {
                throw new Error('ng-model used but ' + kendoWidget + ' does not define a value accessor');
              }

              // Angular will invoke $render when the view needs to be updated with the view value.
              ngModel.$render = function() {
                // Update the widget with the view value.
                widget.value(ngModel.$viewValue);
              };

              // In order to be able to update the angular scope objects, we need to know when the change event is fired for a Kendo UI Widget.
              widget.bind("change", function(e) {
                scope.$apply(function() {
                  // Set the value on the scope to the widget value.
                  ngModel.$setViewValue(widget.value());
                });
              });
            }
          });
        }
      };
    };

    return {
      create: create
    };
}]);