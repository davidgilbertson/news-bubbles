'use strict';
var NB = NB || {};

NB.Auth = (function() {
  var Auth = {}
    , rawUser = {}
    , authModal = d3.select('#auth-modal')
  ;

  // Remove the ugly Facebook appended hash
  // <https://github.com/jaredhanson/passport-facebook/issues/12>
  // source for this code: https://github.com/jaredhanson/passport-facebook/issues/12#issuecomment-5913711
  function removeFacebookAppendedHash() {
    if (!window.location.hash || window.location.hash !== '#_=_') {
      return;
    } else if (window.history && window.history.replaceState) {
      return window.history.replaceState('', document.title, window.location.pathname);
    } else {
      window.location.hash = '';
    }


  }

  function close() {
    authModal
      .transition().duration(500)
      .style('opacity', 0)
      .transition()
      .style('display', 'none');
  }

  function save() {
    close();
  }

  function open() {
    authModal
      .style('display', 'block')
      .transition().duration(500)
      .style('opacity', 1);
  }

  var userModel = {
    _id: '',
    name: {
      first: ko.observable(''),
      last: ko.observable(''),
      display: ko.observable('')
    },
    signedIn: ko.observable(false),
    headerText: ko.observable('Sign in'),
//     signOut: function() {
//       $.get('/auth/sign-out');
//       Auth.setUser(null);
//     },
    open: open,
    close: close,
    save: save
  };


  function init() {
    ko.applyBindings(userModel, document.getElementById('user-items'));
    ko.applyBindings(userModel, document.getElementById('auth-modal'));
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
      userModel.headerText('Account');
      removeFacebookAppendedHash(); //TODO test for FB?
    } else {
      userModel._id = null;
      userModel.name.first(null);
      userModel.name.last(null);
      userModel.name.display(null);
      userModel.signedIn(false);
      userModel.headerText('Sign in');
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
  };

  Auth.signOut = function() {
    console.log('OK, will sign out (ha ha, but I am not really!');
  };

  return Auth;
})();