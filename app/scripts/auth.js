'use strict';
var NB = NB || {};

NB.Auth = (function() {
  var Auth = {}
    , user = null
    , userModel = {
        name: {
          first: ko.observable(''),
          last: ko.observable(''),
          display: ko.observable('')
        },
        signOut: function() {
          $.get('/auth/sign-out');
          Auth.setUser(null);
        },
        signedIn: ko.observable(false) //TODO: Hmmm, implied?
      }
  ;



  function init() {
    ko.applyBindings(userModel, document.getElementById('user-items'));
  }

  
  init();

  /*  --  EXPORTS  --  */
  Auth.user = userModel; //TODO change to 'get userModel' and update the ko binding
  Auth.setUser = function(user) {
    
    if (user && user.name) {
      userModel.name.first(user.name.first);
      userModel.name.last(user.name.last);
      userModel.name.display(user.name.display);
      userModel.signedIn(true);
    } else {
      userModel.name.first(null);
      userModel.name.last(null);
      userModel.name.display(null);
      userModel.signedIn(false);
    }
  };
  Auth.signOut = function() {
    console.log('OK, will sign out');
  };

  return Auth;
})();