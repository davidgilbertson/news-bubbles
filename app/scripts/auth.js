'use strict';
var NB = NB || {};

NB.Auth = (function() {
  var Auth = {}
    , user = null
    , userModel = {
        displayName: ko.observable(''),
        signOut: function() {
          userModel.displayName(null);
        },
        signedIn: ko.observable(false) //TODO: Hmmm, implied?
      }
  ;



  function init() {
    ko.applyBindings(userModel, document.getElementById('user-actions'));
  }

  
  init();

  /*  --  EXPORTS  --  */
  Auth.user = userModel; //TODO change to 'get userModel' and update the ko binding
  Auth.setUser = function(user) {
    
    if (user) {
      userModel.displayName(user.name.display);
//       userModel.signedIn(true)
    } else {
      userModel.displayName(null);
//       userModel.signedIn(false);
    }
  };
  Auth.signOut = function() {
    console.log('OK, will sign out');
  };

  return Auth;
})();