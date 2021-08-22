const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const PORT = process.env.PORT || 8080;
// initialize express
const app = express();
const Account = require('./models');

const {getShortLivedAccessToken,getLongLivedAccessToken} = require('./resolvers/ig');
const { findOneAndRemove } = require("./models");

const mongoUri = `mongodb://${process.env.DB_SERVICE_NAME}:${process.env.DB_PORT}/${process.env.DB_NAME}`
console.log(`Begin connecting to ${mongoUri}`);
mongoose.Promise = global.Promise;


// express configs
app.use(cors()); // cors set up
app.use(express.json()); // json format
app.use(express.urlencoded({ extended: false })); // data parsing

const head = (title)=>`
<head>
<title>${title}</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-KyZXEAg3QhqLMpG8r+8fhAXLRk2vvoC2f3B09zVXn8CA5QIVfZOJ3BCsw2P0p/We" crossorigin="anonymous">
<script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.3/dist/umd/popper.min.js" integrity="sha384-eMNCOe7tC1doHpGoWe/6oMVemdAVTMs2xqW4mwXrXsW0L84Iytr2wi5v2QjrP/xp" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/js/bootstrap.min.js" integrity="sha384-cn7l7gDp0eyniUwwAZgrzD06kc/tftFf19TOAs2zVinnD/C7E91j9yyk5//jjpt/" crossorigin="anonymous"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css">
</head>
<style>
.main {
  padding: 2em;
  max-width: 1200px;
  margin: auto;
  font-size: 18px;
}
code {
  max-width: 200px;
  overflow: scroll;
}
</style>
<header>
<nav class="navbar navbar-expand-lg navbar-light bg-light">
  <div class="container-fluid">
    <a class="navbar-brand" href="#">Token Manager App</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarSupportedContent">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0">
        <li class="nav-item">
          <a class="nav-link" aria-current="page" href="/tokens">Tokens</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/get-auth-code">Get Auth Token</a>
        </li>
      </ul>
    </div>
  </div>
</nav>
</header>
`

// getting-authorization-code
app.get("/get-auth-code", async (req, res, next) => {
  return res.send(
    `${head('Register IG Token')}
    <section class="main">
      <h1>Register a token with us</h1>
      <hr>
      <a class="btn btn-primary" target="_blank" href='https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${process.env.BASEURL}/auth/oauth&scope=user_media,user_profile&response_type=code'>
      Connect to Instagram <i class="bi bi-instagram"></i>
      </a>
    </section>
    `
  );
});

app.get("/get-auth-code-link", async (req, res, next) => {
  return res.send(
    `https://api.instagram.com/oauth/authorize
    ?client_id=${process.env.INSTAGRAM_APP_ID}
    &redirect_uri=${process.env.BASEURL}/auth/oauth
    &scope=user_media,user_profile
    &response_type=code`
  );
});

// getting-authorization-code
app.get("/tokens", async (req, res, next) => {
  const allAccounts = await Account.find({})
  // return res.send(allAccounts)
  // res.send(allAccounts)
  // const accountsMarkup = allAccounts;
  const accountsMarkup = allAccounts.map( (item)=>(
    `<tr>
      <td scope="col">${item.user_id}</td>
      <td>${item.created_at}</td>
      <td>${item.expires_in}</td>
      <td><code>${item.long_term_token}</code></td>
      <td>
        <div class="btn-group" role="group">
          <a href="/refresh?access_token=${item.long_term_token}" type="button" class="btn btn-primary">Refresh</a>
          <a href="/delete?user_id=${item.user_id}" type="button" class="btn btn-danger">Delete</a>
        </div>
      </td>
    </tr>`
  ))
  return res.send(
    `${head('Instagram Token Manager')}
    <section class="main">
      <h1>Tokens:</h1>
      <table class="table table-striped table-hover" >
        <thead>
          <tr>
          <th scope="col">User ID</th>
          <th scope="col">Token Created At</th>
          <th scope="col">Token Expires In</th>
          <th scope="col">Long Term Token</th>
          <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${accountsMarkup}
        </tbody>
      </table>
      <a class="btn btn-primary" target="_blank" href='https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=localhost:8080/auth/oauth&scope=user_media,user_profile&response_type=code'>
      Connect to Instagram <i class="bi bi-instagram"></i>
      </a>
    </section>
    `
  );
});

// app.get("/create-test-account",(req,res,next) => {
//   const account = Account.create([  {
//     "user_id": "test 3",
//     "created_at": "",
//     "auth_token": "test auth token",
//     "short_term_token": "test short token",
//     "long_term_token": "test long token",
//   }], function(err) {
//     console.log('err',err)
//   });
//   return res.send(`<h1>create</h1>`)
// })

app.get("/auth/oauth", async (req, res, next) => {
  try {
    // Get Short Lived Access Token
    const authCode = req.query.code;
    const shortLivedToken = await getShortLivedAccessToken(authCode);
    
    // Get Long Lived Access Token
    const longLivedResponse = await getLongLivedAccessToken(shortLivedToken);
    // Save to DB
    const newAccount = {
      created_at: Date.now(),
      ...longLivedResponse
    }
    const createAccount = await Account.findOneAndUpdate({user_id: newAccount.user_id}, newAccount, {upsert: true});

    // Send a response
    return res.send(
      `
      <h1>Long Term Token Authorized</h1>
      <code>${{
        created_at: Date.now(),
        ...longLivedResponse
      }}</code>
      <code>${JSON.stringify(createAccount)}</code>
      `
    );
  } catch(error) {
    console.log(error);
  }
      
});

app.get("/deauthorize", (req, res, next) => {
  return res.send(
    `Authorization Successful ${JSON.stringify(req.body)}`
  );
});

app.get("/delete", async (req, res, next) => {
  const deleteCall = await Account.findOneAndRemove({user_id: res.query.user_id})
  return res.send(
    `Deletion Successful ${JSON.stringify(deleteCall)}`
  );
});
app.get("/refresh?access_token=", async (req, res, next) => {
  const longLivedResponse = await getLongLivedAccessToken(shortLivedToken);
  const newAccount = {
    created_at: Date.now(),
    ...longLivedResponse
  }
  const updateAccount = await Account.findOneAndUpdate({user_id: newAccount.user_id}, newAccount, {upsert: true});

  return res.send(
    `Token Refreshed! ${JSON.stringify(updateAccount)}`
  );
});
app.get("/privacy-policy", (req, res, next) => {
  return res.send(
    `Authorization Successful ${JSON.stringify(req.body)}`
  );
});

app.get("/terms-of-service", (req, res, next) => {
  return res.send(
    `Authorization Successful ${JSON.stringify(req.body)}`
  );
});
// start server on the PORT.

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  user: process.env.DB_USER,
  pass: process.env.DB_PASSWORD
}).then(() => {
  console.log('successfully connected to the database');
  app.listen(PORT, () => console.log(`Server started on port: ${PORT}`));
}).catch(err => {
  console.log('error connecting to the database');
  process.exit();
});