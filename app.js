require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const swaggerUI = require('swagger-ui-express');
const fileUpload = require('express-fileupload');
const path = require('path');

const swaggerDocument = require('./swagger'); //Swagger
const soapservice = require('./soapserver/dvwsuserservice'); //SOAP Service
const rpcserver = require('./rpc_server'); //XMLRPC Sever

const { ApolloServer } = require('apollo-server');
const {  GqSchema } =  require('./graphql/schema');


const app = express();
const router = express.Router();



const routes = require('./routes/index.js');

app.use(express.static('public'));
app.use("/css", express.static(path.join(__dirname, "node_modules/bootstrap/dist/css")));
app.use("/js", express.static(path.join(__dirname, "node_modules/bootstrap/dist/js")));
app.use("/js", express.static(path.join(__dirname, "node_modules/jquery/dist")));
app.use("/js", express.static(path.join(__dirname, "node_modules/angular")));

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
app.use('/dvwsuserservice', soapservice);
app.use(bodyParser.json());
app.use(fileUpload({ parseNested: true }));

const jwt = require('jsonwebtoken')


const options = {
  expiresIn: '2d',
  issuer: 'https://github.com/snoopysecurity',
  algorithms: ["HS256", "none"],
  ignoreExpiration: true
};


var corsOptions = {
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions))
app.use('/api', routes(router));


  
app.listen(process.env.EXPRESS_JS_PORT, () => {
    console.log(`🚀 API listening at http://dvws.local${process.env.EXPRESS_JS_PORT == 80 ? "" : ":" + process.env.EXPRESS_JS_PORT } (127.0.0.1)`);
  });


  // The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({ 
  introspection: true,
  playground: true,
  debug: true,
  allowBatchedHttpRequests: true,
  schema: GqSchema,
  context: async ({ req }) => {
       let verifiedToken = {}
        try {
         const token = req.headers.authorization.split(' ')[1]; // Bearer <token>
         verifiedToken = jwt.verify(token, process.env.JWT_SECRET, options);
        } catch (error) {
          verifiedToken = {}
        }
        return verifiedToken;
  }, });

// Hardcoded secrets for TruffleHog test
app.get('/simulate-oauth', (req, res) => {
  const clientId = "90a0b1c2-d3e4-5678-f901-g2h3i4j5k6l7";
  
  // Try different secret formats that TruffleHog should detect:
  
  // Google OAuth (more realistic format)
  const googleSecret = "GOCSPX-abcdefghijklmnopqrstuvwxyz123456";
  
  // GitHub Personal Access Token
  const githubToken = "ghp_0123456789abcdef0123456789abcdef01234567";
  
  // Slack Bot Token
  const slackToken = "xoxb-1234567890123-1234567890123-abcdefghijklmnopqrstuvwx";
  
  // Discord Bot Token
  const discordToken = "ODQyNzE0NTI2MTc2NjU2OTY2.YJ-rfg.abcdefghijklmnopqrstuvwxyz123456";
  
  // Original AWS secrets
  const awsAccessKeyId = "AKIAQYLPMN5HHHFPZAM2";
  const awsSecretAccessKey = "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";
  const awsRegion = "us-east-2";

  console.log("Leaking OAuth Secrets:", { 
    clientId, 
    googleSecret,
    githubToken,
    slackToken,
    discordToken 
  });
  console.log("Leaking AWS Secrets:", { 
    awsAccessKeyId, 
    awsSecretAccessKey, 
    awsRegion 
  });
  
  res.send(`Simulating OAuth login with multiple secrets exposed`);
});

server.listen({ port: process.env.GRAPHQL_PORT }).then(({ url }) => {
    console.log(`🚀 GraphQL Server ready at ${url}`);
  });;

module.exports = app;
