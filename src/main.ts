import express from 'express';
import compression from 'compression';
import fs from 'fs';
import expressJwt from 'express-jwt';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fileupload from 'express-fileupload';
// for url info request
import request from 'request';
import HTMLParser from 'node-html-parser';

// projectData
import Endpoint from '@lsys/projectData/esm/Endpoint';
import { MongoDatabase, MongoDBQuery } from '@lsys/projectData/esm/Misc/MongoDB';
import { default as mongodb } from 'mongodb';

// own imports
import * as config from '../config.js';
import { storeImage, deleteImage, handleUpdateImages } from './imageStorage.js';

// db setup

const dbEntriesCollection : string = 'entries';
const MongoClient = mongodb.MongoClient;
const client = new MongoClient(config.dbUrl, {
  auth: { user: config.dbUser, password: config.dbPassword },
  useUnifiedTopology: true
});

// example db query, from docs: get documents from db
// const findDocuments = function(db, callback) {
//   // Get the documents collection
//   const collection = db.collection(dbEntriesCollection);
//   // Find some documents
//   collection.find({}).toArray(function(err, docs) {
//     if (err) {
//       console.log(err);
//       return;
//     }
//     console.log("Found the following records");
//     console.log(docs)
//     callback(docs);
//   });
// }

// use projectData MongoDatabase connector -> needs import fix
// async function dbinit() {
//   const db = await MongoDatabase(dbUrl, dbName,
//     { auth: { user: dbUser, password: dbPassword }});
//   findDocuments(db, ()=>{});
// }
// dbinit();

// setup app

const app = express();
app.use(express.json({limit: '10mb'}));
app.use(compression());
app.use(expressJwt({
  secret: config.secret,
  algorithms: ['HS256'],
  credentialsRequired: false
}));
app.use(fileupload({
  createParentPath: true
}));

// static files (incl. client)
app.use('/', express.static(config.staticDir,));

// login / jwt stuff

function createToken() : string {
  // sign with default (HMAC SHA256)
  //let expirationDate =  Math.floor(Date.now() / 1000) + 30 //30 seconds from now
  var token = jwt.sign({ user: config.user.name }, config.secret);
  return token;
}

// routes w/o db access

const htmlParser : any = HTMLParser;

app.get('/api/urlinfo', (req : any, res : any) => {
  if (!req.user) {
    console.log('unallowed urlinfo request rejected');
    res.sendStatus(401);
    return;
  }
  const url = req.query.url;
  console.log("url request: ", url);
  request(url, (error, response, body) => {
    if (error) {
      res.send({
        success: false,
        errorMessage: error.code
      });
      return;
    }
    const contentType = response.headers['content-type'];
    const root = htmlParser.parse(response.body);
    if (!root.valid) {
      res.send({
        success: false,
        errorMessage: "error parsing body..."
      });
      return;
    }
    const title = root.querySelector('title').text;
    res.send({
      success: true,
      contentType: contentType,
      statusCode: response.statusCode,
      title: title
    });
  });
});

app.post('/api/uploadMultiImages', async (req : any, res : any) => {
  if (!req.user) {
    console.log('unallowed image upload rejected');
    res.sendStatus(401);
    return;
  }
  //console.log(req.user)
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
  let files = [];
  const filedata = req.files.filedata;
  if (Array.isArray(filedata)) {
    files = await Promise.all(filedata.map(async (f) => await storeImage(f)));
  } else {
    files.push(await storeImage(filedata));
  }
  //console.log(files)
  res.send({
    success: true,
    files: files
  });
});

// routes that need db access

// db connector

client.connect((err) => {
  if (err) {
    console.log("Error connecting to db: ");
    throw err;
  }
  console.log("Connected successfully to server");
  const db = client.db(config.dbName);
  const entriesCollection = db.collection(dbEntriesCollection);
  // test
  //findDocuments(db, ()=>{});

  // login

  app.post('/api/login', (req : any, res : any) => {
    if (req.body.username !== config.user.name) {
      res.sendStatus(401);
      return;
    }
    bcrypt.compare(req.body.password, config.user.pwhash).then((check) => {
      if (check) {
        console.log("login ok");
        res.send({
          success: true,
          token: createToken()
        });
      } else {
        console.log("login failed");
        res.sendStatus(401);
      }
    });
  });

  // projectData endpoints

  app.use('/api/entries', new Endpoint({
    query: new MongoDBQuery(db, { collection: dbEntriesCollection, query: {} }),
    id: (e : any) => e.id,
    filter: (e : any, req : any) => {
      if (e.private) {
        if (req.user) return e;
        else return;
      }
      return e;
    },
    add: async (obj : any, req : any) => {
      console.log("add entry user: ", req.user);
      if (!req.user) return;
      entriesCollection.insertOne(obj).catch(err => {
        console.log("Error writing entry to db: ", err);
      });
    },
    delete: async (obj : any, req : any) => {
      if (!req.user) return;
      console.log("DELETE");
      // backwards compat.
      if (obj.images) {
        for (const image of obj.images) {
          deleteImage(image);
        }
      }
      entriesCollection.deleteOne({ id: obj.id }).catch(err => {
        console.log("Error deleting entry from db: ", err);
      });
    },
    update: async (newObj : any, oldObj : any, req : any) => {
      if (!req.user) return;
      console.log("UPDATE");
      // handle images
      if (!newObj.images) newObj.images = [];
      if (!oldObj.images) oldObj.images = [];
      handleUpdateImages(newObj.images, oldObj.images);
      // remove fields that are not to update, _id cannot update
      delete newObj._id;
      delete newObj.id;
      delete newObj.date;
      entriesCollection.updateOne({ id: oldObj.id }, { $set: newObj })
        .catch(err => {
          console.log("Error updating entry in db: ", err);
      });
    }
  }).router);
  //client.close();
});

app.listen(config.port);
console.log('listening on ' + config.port);
