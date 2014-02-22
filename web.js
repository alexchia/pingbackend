// web.js
var express = require("express");
var logfmt = require("logfmt");
var http = require("http");
var request = require("request");
var app = express();

app.use(logfmt.requestLogger());

app.get('/', function(req, res) {
  //res.redirect("https://www.linkedin.com/uas/oauth2/authorization?response_type=code&client_id=75wd2l0scscwof&scope=r_basicprofile&state=asdf55&redirect_uri=http://pingbackend.herokuapp.com/linkedin_auth");
  res.send('Hello2');
});

var LINKEDIN_API_KEY = "75wd2l0scscwof";
var LINKEDIN_SECRET_KEY = "x4Wwgd6gyPy7Kj2i";

app.get('/linkedin_auth', function(req, res) {
  if (req.query.error) {
    res.send("Error: " + req.query.error_description);
  } else {
    var code = req.query.code;
    var oauth_url = "https://www.linkedin.com/uas/oauth2/accessToken";
    request.post(oauth_url,
      { form: {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'http://pingbackend.herokuapp.com/linkedin_auth',
        client_id: LINKEDIN_API_KEY,
        client_secret: LINKEDIN_SECRET_KEY
       } },
      function (error, response, body) {
          if (!error && response.statusCode == 200) {
              console.log(body);
              var pingJson = JSON.parse(body);
              console.log("auth token: " + pingJson.access_token);
              res.redirect("www.google.com?" + pingJson.access_token);
              //res.redirect("pingme://linkedin_auth?" + pingJson.access_token);
          } else {
            console.log(error);
            console.log(response);
            res.send("Error: " + error);
          }

      }
    );
  }
});

//res.redirect('http://mydomain.com'+req.url)

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});