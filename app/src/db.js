var mysql = require('mysql');

var DB_USER = process.env.DB_USER || 'ubuntu';
var DB_PASS = process.env.DB_PASS || 'jukebox';
var DB_HOST = process.env.DB_HOST || '127.0.0.1';
var DB_NAME = process.env.DB_NAME || 'jb_dev';
var DB_POOL = process.env.DB_POOL || 8;

// Create a global reference for the connection pool to the proxy server
var pool = mysql.createConnection({
  connection_limit: DB_POOL,      // 32 in prod
  host: DB_HOST,                  // cloudsql-proxy in prod
  user: DB_USER,                  // From Kubernetes secrets in prod
  password: DB_PASS,              // Null in prod
  database: DB_NAME               // jb_prod in prod
});

/****************** Exported routines *****************/

/*
 * Returns a promise which resolves to fulfilled if
 * the connection to database is successful.
 */
function connect() {
  return new Promise(function (fulfill, reject) {
    // TODO: require all clients to explicitly connect
    fulfill();
  });
}

/*
 * Returns a promise which resolves to fulfilled if
 * the disconnect from database is successful.
 */
function disconnect() {
  return new Promise(function (fulfill, reject) {

    // Ensure connection pool exists
    if (!pool) reject("Not connected to DB.");
    
    // Make disconnect call
    pool.end(function(err) {
      if (err) {
        console.log("Could not end database connection pool: " + err);
        reject(err);
      }
      else {
        console.log("Successfully ended database connection");
        fulfill();
      }
    });
  });
}

/*
 * Returns a promise which resolves to fulfilled if
 * the insertion is successful.
 */
function addUser(userId, accessToken) {
  return new Promise(function (fulfill, reject) {
    
    // Ensure connection exists
    if (!pool) reject("Not connected to DB.");

    // Execute the query and transition promise state
    pool.query('INSERT INTO `user` (`id`, `access_token`) VALUES (?, ?)',
        [userId, accessToken], function(error, results, fields) {
          if (error) {
            console.log("unable to add user %s with access token %s", userId, accessToken);
            reject(error);
          }
          fulfill("User added");
        });
  });
}

/*
 * Returns a promise which resolves to fulfilled and returns the
 * user id if access token corresponds to a valid user.
 */
function getUser(accessToken) {
  return new Promise(function (fulfill, reject) {
    
    // Ensure connection exists
    if (!pool) reject("Not connected to DB.");

    // Execute the query and transition promise state
    pool.query('SELECT `id` FROM `user` WHERE `access_token` = ?', 
        [accessToken], function(error, results, fields) {
          if (error) {
            console.log("unable to find user with access token %s", accessToken);
            reject(error);
          }
          fulfill(results[0]['id']);
        });
  });
}

/******************** Helpers *********************/

module.exports = {
  connect: connect,
  disconnect: disconnect,
  addUser: addUser,
  getUser: getUser
};

/* 
 * Example usage of the exported routines
 */
function main() {
  // Define template callback
  callback = function(message) {
    if (message) console.log(message);
  }

  // Establish connection
  connect().
    then(callback, callback);

  // Example usage of addUser()
  addUser("user1", "token1").
    then(callback, callback);

  // Example usage of getUser()
  getUser("token1")
    .then(callback, callback);

  // Terminate connection
  disconnect().
    then(callback, callback);
}

/*
 * If run as a script, start the server
 */
if (require.main === module) {
  main();
} 
