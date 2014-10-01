'use strict';
var NB = NB || {};

NB.Auth = (function() {
  var Auth = {}
    , rawUser = {}
    , userModel = {
        _id: '',
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
  Auth.setUser = function(user) {
    rawUser = user;
    if (user) {
      userModel._id = user._id;
      userModel.name.first(user.name.first);
      userModel.name.last(user.name.last);
      userModel.name.display(user.name.display);
      userModel.signedIn(true);
    } else {
      userModel._id = null;
      userModel.name.first(null);
      userModel.name.last(null);
      userModel.name.display(null);
      userModel.signedIn(false);
    }
  };

  Auth.getUser = function() {
    if (userModel.signedIn()) {
      return userModel;
    } else {
      return null;
    }
    
  };
  Auth.getRawUser = function() {
    return rawUser;
  }

  Auth.signOut = function() {
    console.log('OK, will sign out (ha ha, but I am not really!');
  };

  return Auth;
})();