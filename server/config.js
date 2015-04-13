'use strict';

var prodUrl = 'http://www.bubblereader.com';
var devUrl = 'http://local.bubblereader.com';

var prodConfig = {
  // baseUrl: 'http://www.bubblereader.com',
  db: {
    port: process.env.PORT,
    conn: process.env.MONGOLAB_URL
  },
  auth: {
    facebook: {
      clientId: '833772886647232',
      secret: '862d4c22a83572793c7214d798afe5f3',
      callbackUrl: prodUrl + '/auth/facebook/callback'
    },
    reddit: {
      clientId: '1_v-tNQj16e7Sg',
      secret: '_yzoDtfgvzMlrFK56mLFlPt6oY4',
      callbackUrl: prodUrl + '/auth/reddit/callback'
    }
  },
  nodetime: {
    accountKey: process.env.NODETIME_ACCOUNT_KEY,
    appName: 'News Bubbles' // optional
  }
};


var devConfig = {
  // baseUrl: 'http://local.bubblereader.com',
  db: {
    port: 9000,
    conn: 'mongodb://localhost/news_bubbles'
  },
  auth: {
    facebook: {
      clientId: prodConfig.auth.facebook.clientId,
      secret: prodConfig.auth.facebook.secret,
      callbackUrl: devUrl + '/auth/facebook/callback'
    },
    reddit: {
      clientId: '4tPkcfJiC76--w',
      secret: 'hWWKy8NNYeiP8ZFXadhS204t4a4',
      callbackUrl: devUrl + '/auth/reddit/callback'
    }
  },
  nodetime: {
    accountKey: '05d915a7339098057141246ef49ab77a3c5bd013',
    appName: 'News Bubbles Dev'
  }
};


module.exports = {
  prod: prodConfig,
  dev: devConfig
};
