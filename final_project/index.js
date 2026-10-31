const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const JWT_SECRET = require('./router/auth_users.js').JWT_SECRET;
const genl_routes = require('./router/general.js').general;

const app = express();

app.set('json spaces', 4);
app.use(express.json());

app.use("/customer",session({secret:"fingerprint_customer",resave: true, saveUninitialized: true}))

app.use("/customer/auth/*", function auth(req,res,next){
  const authorization = req.session.authorization;
  if (!authorization) {
    return res.status(403).json({message: "User not logged in"});
  }
  jwt.verify(authorization.accessToken, JWT_SECRET, (err) => {
    if (err) {
      return res.status(403).json({message: "User not authenticated"});
    }
    next();
  });
});
 
const PORT =5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT,()=>console.log("Server is running"));
