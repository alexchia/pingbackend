// requirements

var express = require("express");
var logfmt = require("logfmt");
var http = require("http");
var request = require("request");
var mongoose = require('mongoose');
var app = express();

// mongo & schemas

//mongoose.connect(process.env.MONGOHQ_URL);
mongoose.connect("mongodb://heroku:884b614228b90fe6148ab378b08c5c1a@troup.mongohq.com:10063/app22432022");

var Schema = mongoose.Schema;
var userSchema = new Schema({
  accessToken: String,
  id: String,
  firstName: String,
  lastName: String,
  companyName: String,
  industry: String,
  position: String,
  homeLocation: String,
  profilePicture: String // URL to picture
});

var UserData = mongoose.model('UserData', userSchema);


// routes

app.use(logfmt.requestLogger());

app.get('/test', function(req, res) {
  res.redirect("https://www.linkedin.com/uas/oauth2/authorization?response_type=code&client_id=75wd2l0scscwof&scope=r_basicprofile&state=asdf55&redirect_uri=http://pingbackend.herokuapp.com/linkedin_auth");
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
        redirect_uri: 'http://10.60.4.239:5000/linkedin_auth',
        client_id: LINKEDIN_API_KEY,
        client_secret: LINKEDIN_SECRET_KEY
       } },
      function (error, response, body) {
          if (!error && response.statusCode == 200) {
              console.log(body);
              var pingJson = JSON.parse(body);
              console.log(pingJson);
              console.log("auth token: " + pingJson.access_token);
              getData(req, res, pingJson.access_token);
              //res.redirect("pingme://linkedin_auth?" + pingJson.access_token);
          } else {
            console.log("Error: " + error);
            console.log("Resp: " + response);
            res.send("Error: " + error);
          }

      }
    );
  }
});

var getData = function(req, res, access_token) {
  if (req.query.error) {
    res.send("Error: " + req.query.error_description);
  } else {
    var data_requests = "/v1/people/~:(id,firstName,lastName,email-address,picture-url,skills,positions,industry,num-connections)";
    var format = "json";
    console.log("retrieving data from linkedin");
    var linkedin_url = "https://api.linkedin.com" + data_requests + "?"
        + "oauth2_access_token=" + access_token + "&format=" + format;

    console.log("linkedin_url = " + linkedin_url);
    request.get(linkedin_url,
      function(error, response, body) {
        if (!error && response.statusCode == 200) {
          // res.send(body);
          body = JSON.parse(body);
          first = body.positions.values[0];

          console.log("finding userdata");
          UserData.findOne({id: body.id}, function(err, u) {
            console.log(u);

            if (!u) {
              user = new UserData({
                accessToken: access_token,
                id: body.id,
                firstName: body.firstName,
                lastName: body.lastName,
                companyName: first.company.name,
                industry: body.industry,
                position: first.title,
                // homeLocation: body.homeLocation,
                profilePicture: body.pictureUrl,
              });
            }
            else {
              user = u;
            }

            console.log(user);
            /*
            if (u) {
              // overwrite if exists
              user._id = u._id;
            }
            */

            user.save(function(err) {
              var msg;
              if (!err) {
                msg = 'Writing: ' + body.firstName + ' ' + body.lastName;
                res.redirect("pingme://" + body.id);
              } else {
                msg = 'ERROR: ' + err;
                console.log(err);
                res.send(msg);
              }
              console.log(msg);
              // res.send(String(body) + '\n' + msg);
            });

          });
        }
        else {
          console.log(error);
        }
      }
    );
  }
};

app.get('/user/:user', function(req, res) {
  if (req.query.error) {
    res.send("Error: " + req.query.error_description);
  } else {
    UserData.findOne({id: req.params.user}, function(err, u) {
      if (!err) {
        if (u) {
          res.send(String(u));
        }
      }
      else {
        console.log(err);
      }
      console.log(u);
    });
  }
});

//res.redirect('http://mydomain.com'+req.url)

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});