angular.module('ionic.service.modal', ['ionic.service.templateLoad', 'ionic.service.platform', 'ionic.ui.modal'])

/**
 * @ngdoc service
 * @name $ionicModal
 * @module ionic
 * @description
 * The Modal is a content pane that can go over the user's main view
 * temporarily.  Usually used for making a choice or editing an item.
 *
 * @usage
 * ```html
 * <script id="my-modal.html" type="text/ng-template">
 *   <div class="modal">
 *     <ion-header-bar title="My Modal Title"></ion-header-bar>
 *     <ion-content>
 *       Hello!
 *     </ion-content>
 *   </div>
 * </script>
 * ```
 * ```js
 * angular.module('testApp', ['ionic'])
 * .controller('MyController', function($scope, $ionicModal) {
 *   $ionicModal.fromTemplateUrl('modal.html', {
 *     scope: $scope,
 *     animation: 'slide-in-up'
 *   }).then(function(modal) {
 *     $scope.modal = modal;
 *   });
 *   $scope.openModal = function() {
 *     $scope.modal.show();
 *   };
 *   $scope.closeModal = function() {
 *     $scope.modal.hide();
 *   };
 *   //Cleanup the modal when we're done with it!
 *   $scope.$on('$destroy', function() {
 *     $scope.modal.remove();
 *   });
 * });
 * ```
 */
.factory('$ionicModal', ['$rootScope', '$document', '$compile', '$timeout', '$ionicPlatform', '$ionicTemplateLoader',
                function( $rootScope,   $document,   $compile,   $timeout,   $ionicPlatform,   $ionicTemplateLoader) {

  /**
   * @ngdoc controller
   * @name ionicModal
   * @module ionic
   * @description
   * Instantiated by the {@link ionic.service:$ionicModal} service.
   *
   * Hint: Be sure to call [remove()](#remove) when you are done with each modal
   * to clean it up and avoid memory leaks.
   */
  var ModalView = ionic.views.Modal.inherit({
    /**
     * @ngdoc method
     * @name ionicModal#initialize
     * @description Creates a new modal controller instance.
     * @param {object} options An options object with the following properties:
     *  - `{object=}` `scope` The scope to be a child of.
     *    Default: creates a child of $rootScope.
     *  - `{string=}` `animation` The animation to show & hide with.
     *    Default: 'slide-in-up'
     *  - `{boolean=}` `focusFirstInput` Whether to autofocus the first input of
     *    the modal when shown.  Default: false.
     */
    initialize: function(opts) {
      ionic.views.Modal.prototype.initialize.call(this, opts);
      this.animation = opts.animation || 'slide-in-up';
    },

    /**
     * @ngdoc method
     * @name ionicModal#show
     * @description Show this modal instance.
     */
    show: function() {
      var self = this;
      var modalEl = angular.element(self.modalEl);

      self.el.classList.remove('hide');

      $document[0].body.classList.add('modal-open');

      self._isShown = true;

      if(!self.el.parentElement) {
        modalEl.addClass(self.animation);
        $document[0].body.appendChild(self.el);
      }

      modalEl.addClass('ng-enter active')
             .removeClass('ng-leave ng-leave-active');

      $timeout(function(){
        modalEl.addClass('ng-enter-active');
        self.scope.$parent && self.scope.$parent.$broadcast('modal.shown');
        self.el.classList.add('active');
      }, 20);

      self._deregisterBackButton = $ionicPlatform.registerBackButtonAction(function(){
        self.hide();
      }, 200);

      ionic.views.Modal.prototype.show.call(self);

    },

    /**
     * @ngdoc method
     * @name ionicModal#hide
     * @description Hide this modal instance.
     */
    hide: function() {
      var self = this;
      self._isShown = false;
      var modalEl = angular.element(self.modalEl);

      self.el.classList.remove('active');
      modalEl.addClass('ng-leave');

      $timeout(function(){
        modalEl.addClass('ng-leave-active')
               .removeClass('ng-enter ng-enter-active active');
      }, 20);

      $timeout(function(){
        $document[0].body.classList.remove('modal-open');
        self.el.classList.add('hide');
      }, 350);

      ionic.views.Modal.prototype.hide.call(self);

      self.scope.$parent && self.scope.$parent.$broadcast('modal.hidden');

      self._deregisterBackButton && self._deregisterBackButton();
    },

    /**
     * @ngdoc method
     * @name ionicModal#remove
     * @description Remove this modal instance from the DOM and clean up.
     */
    remove: function() {
      var self = this;
      self.hide();
      self.scope.$parent && self.scope.$parent.$broadcast('modal.removed');

      $timeout(function(){
        self.scope.$destroy();
        self.el && self.el.parentElement && self.el.parentElement.removeChild(self.el);
      }, 750);
    },

    /**
     * @ngdoc method
     * @name ionicModal#isShown
     * @returns boolean Whether this modal is currently shown.
     */
    isShown: function() {
      return !!this._isShown;
    }
  });

  var createModal = function(templateString, options) {
    // Create a new scope for the modal
    var scope = options.scope && options.scope.$new() || $rootScope.$new(true);

    // Compile the template
    var element = $compile('<ion-modal>' + templateString + '</ion-modal>')(scope);

    options.el = element[0];
    options.modalEl = options.el.querySelector('.modal');
    var modal = new ModalView(options);

    modal.scope = scope;

    // If this wasn't a defined scope, we can assign 'modal' to the isolated scope
    // we created
    if(!options.scope) {
      scope.modal = modal;
    }

    return modal;
  };

  return {
    /**
     * @ngdoc method
     * @name $ionicModal#fromTemplate
     * @param {string} templateString The template string to use as the modal's
     * content.
     * @param {object} options Options to be passed {@link ionic.controller:ionicModal#initialize ionicModal#initialize} method.
     * @returns {object} An instance of an {@link ionic.controller:ionicModal}
     * controller.
     */
    fromTemplate: function(templateString, options) {
      var modal = createModal(templateString, options || {});
      return modal;
    },
    /**
     * @ngdoc method
     * @name $ionicModal#fromTemplateUrl
     * @param {string} templateUrl The url to load the template from.
     * @param {object} options Options to be passed {@link ionic.controller:ionicModal#initialize ionicModal#initialize} method.
     * options object.
     * @returns {promise} A promise that will be resolved with an instance of
     * an {@link ionic.controller:ionicModal} controller.
     */
    fromTemplateUrl: function(url, options, _) {
      var cb;
      //Deprecated: allow a callback as second parameter. Now we return a promise.
      if (angular.isFunction(options)) {
        cb = options;
        options = _;
      }
      return $ionicTemplateLoader.load(url).then(function(templateString) {
        var modal = createModal(templateString, options || {});
        cb && cb(modal);
        return modal;
      });
    }
  };
}]);
