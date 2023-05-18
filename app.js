const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const app = express();
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
app.use(express.json());
const dbPath = path.join(__dirname, "twitterClone.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath,
         driver: sqlite3.Database 
        });
    app.listen(3000, () => {
        const newLocal = "Server is running on http://localhost:3000";
        console.log(newLocal);
    });
  } catch (error) {
    console.log(`Database Error is ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const authenticateToken = (request, response, next) => {
  const {tweet}=request.body;
  const {tweetId}=request.params;  
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
          request.payload=payload;
          request.tweetId=tweetId;
          request.tweet=tweet;
          next();
      }
    });
  }
};



app.post("/register/",async(request,response)=>{



const { username, password, name, gender } = request.body; 
const selectUserQuery =
`SELECT * FROM user WHERE username = '${username}';`;
console.log(username, password, name, gender);
const dbUser = await db.get(selectUserQuery); 
if (dbUser === undefined) {
   if (password.Length <6) { 
       response.status(400);
       response.send("Password is too short");
     } else {
         const hashed Password = await bcrypt.hash(password, 10);
         const createUserQuery =
        `INSERT INTO 

         user (name, username, password, gender)
         VALUES (


         '${name}'
         '${username}',
         '${hashedPassword}',
         '${gender}');`;
await db.run(createUserQuery);
response.status (200);
response.send("User created successfully");
  }
 }else {
response.status(400);
response.send("User already exists");
}
});
//User Login API-2
app.post("/login/", async (request, response) = {
const { username, password } = request.body;
const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`; 
console.log(username, password);
const dbUser = await db.get(selectUserQuery);
console.log(dbUser);
if (dbUser=== undefined) {
  response.status(400);
  response.send("Invalid user");
} else {
const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
 if (isPasswordMatched === true) {


   const jwtToken = jwt.sign (dbUser, "MY_SECRET_TOKEN");
   response.send({ jwtToken });
} else {

  response.status(400);
  response.send("Invalid password");
}
}
});
//User Tweets Feed API-3
app.get("/user/tweets/feed/", authenticateToken, async (request, response) => {
const { payload } = request;

const { user_id, name, username, gender }=payload;



console.log(name);
const getTweetsFeedQuery=`
SELECT

   Username, 
   tweet,
   date_time AS dateTime 
FROM
   follower INNER JOIN tweet ON follower.following_user_id = tweet.user_iD INNER JOIN user ON user.user_id=follower.following_user_id
WHERE
   follower.follower_user_id=${user_id}
ORDER BY
  date_time DESC
LIMIT 4
;`;
const tweetFeedArray = await db.all(getTweetsFeedQuery);
 response.send(tweetFeedArray);
});
// Get User Following User NamesAPI-4
app.get("/user/following/", authenticateToken, async (request, response) => {
const { payload} = request;
const { user_id, name, username, gender } = payload;
console.log(name);
const userFollowsQuery=`

SELECT

name FROM 
user INNER JOIN follower ON user.user_id = follower. following_user_id
WHERE
follower.follower_user_id = ${user_id};`;
const userFollowsArray = await db.all(userFollowsQuery); 
response.send(userFollowsArray);
});
..
//Get User Names Followers API-5
app.get("/user/followers/", authenticateToken, async (request, response) => { 
    const { payload }= request;
    const { user_id, name, username, gender } = payload;
    console.log(name);
    const userFollowersQuery =
        `SELECT name
         FROM

          user INNER JOIN follower ON user.user_id = follower. follower_user_id
         WHERE

         follower.following_user_id = ${user_id};`;
    const userFollowersArray = await db.all(userFollowersQuery);
    response.send(userFollowersArray);
});
// Get Tweet ADT 6

app.get("/tweets/:tweetId/", authenticateToken, async (request, response)=> {

    const { tweetId} = request;
    const { payload} = request;
    const {user_id, name, username, gender}= payload;
    console.log(name, tweetId);
    const tweetsQuery = `SELECT * FROM tweet WHERE tweet_id=${tweetId};`;
    const tweetsResult = await db.get(tweetsQuery);
// response.send(tweetsResult);
    const userFollowersQuery =
        `SELECT *
         FROM follower INNER JOIN user ON user.user_id = follower.following_user_id
         WHERE
         follower.follower_user_id = ${user_id};`;
const userFollowers = await db.all(userFollowersQuery);
// response.send(userFollowers);
if (
UserFollowers.some((item) => item. following_user_id === tweetsResult.user_id
)
){
console.log(tweetsResult);
console.log("----------");

console.log(UserFollowers);
const getTweetDetailsQuery =
`SELECT
   tweet,
   COUNT (DISTINCT (like.like_id)) AS likes,
    COUNT (DISTINCT (reply.reply_id)) AS replies, tweet.date_time AS dateTime
FROM
    tweet INNER JOIN Like ON tweet.tweet_id = like.tweet_id INNER JOIN reply ON reply.tweet_id =tweet.tweet_id
WHERE
tweet.tweet_id = ${tweetId} AND tweet.user_id=${userFollowers[0].user_id};`;
const tweetDetails = await db.get(getTweetDetailsQuery);
response.send(tweetDetails);
} else {

response.status(401);
response.send("Invalid Request");
}
});
// Get Tweet Liked Users API-7|
app.get(
"/tweets/:tweetId/likes/", authenticateToken,async (request, response) => { 

 
const { tweetId} = request; 
const {payload}= request;
const { user_id, name, username, gender } = payload;
console.log(name, tweetId);
const getLikedUsersQuery=`
SELECT
*
FROM
follower INNER JOIN tweet ON tweet.user_id = follower.following_user_id INNER JOIN like ON like.tweet_id=tweet.tweet_id
 INNER JOIN user ON user.user_id = like.user_id
WHERE
tweet.tweet_id= ${tweetId} AND follower.follower_user_id= ${user_id};`;
const LikedUsers= await db.all(getLikedUsersQuery);
console.log(likedUsers);
if (LikedUsers.Length!== 0) {
Let Likes = [];
const getNamesArray=
(LikedUsers) => {
for (let item of LikedUsers) {
Likes.push(item.username);
}
};

getNamesArray(LikedUsers);
response.send({ Likes });

} else {

response.status(401);
response.send("Invalid Request");
}
}
);
//Get Tweet Replied Users API-8
app.get(
"/tweets/:tweetId/replies/",authenticateToken,async (request, response)=>{
    const { tweetId} = request;
 
     const {payload}= request;
    const { user_id, name, username, gender } = payload;
    console.log(name, tweetId);
    const getRepliesQuery=`SELECT * FROM follower INNER JOIN tweet ON tweet.user_id=follower.following_user_id INNER JOIN  reply ON reply.tweet_id=tweet.tweet_id 
    INNER JOIN user ON user.user_id=reply.user_id
    WHERE tweet.tweet_id=${tweetId} AND follower.follower_user_id=${user_id};`;
    const repliesUser=await db.all(getRepliesQuery);
    console.log(repliesUser);
    if(repliesUser.length!==0){
        let replies=[];
        const getNameArray=(repliesUser)=>{
            for(let item of repliesUser){
                let object={
                    name:item.name,
                    reply:item.reply,
                };
                replies.push(object);
                }
            };
           getNameArray(repliesUser);
           response.send({replies});
            }else{
                response.status(401);
                response.send("Invalid Request");
            }
        }
    };

app.get("/user/tweets/", authenticateToken, async (request, response) = {
     const {payload } = request;
     const { user_id, name, username, gender } = payload;
     console.log(name, user_id);
const getTweetsDetailsQuery =
`SELECT
tweet. tweet AS tweet,COUNT (DISTINCT (Like.Like id)) AS Likes,
COUNT (DISTINCT (reply.reply_id)) AS replies, tweet.date_time AS dateTime
FROM

   user INNER JOIN tweet ON user.user_id= tweet.user_id INNER JOIN like ON like.tweet_id=tweet.tweet_id INNER JOIN reply ON reply.tweet_id=tweet.tweet_id

WHERE
   user.user_id= ${user_id}
GROUP BY
   tweet.tweet_id;`;
const tweetsDetails await db.all(getTweetsDetailsQuery);
 response.send(tweetsDetails);


});

//ap10//
app.post(
"/user/tweets/",authenticateToken,async (request, response)=>{
    const { tweet} = request;
 
    const { tweetId} = request;
    const {payload} = request;
    const { user_id, name, username, gender } = payload;
    console.log(name, tweetId);
    const postTweetQuery=
    `INSERT INTO 
    tweet(tweet,user_id)
    VALUES('${tweet}',${user_id}
    );`;
    await db.run(postTweetQuery);
    response.send("Created a Tweet");
});


//api11//
app.delete(
"/tweets/:tweetId/",authenticateToken,async (request, response)=>{
   
 
    const { tweetId} = request;
    const {payload} = request;
    const { user_id, name, username, gender } = payload;
    
    const SelectQuery=`SELECT * FROM tweet WHERE tweet.user_id=${user_id} AND tweet.tweet_id=${tweetId};`;
    const tweetUser=await db.all(selectQuery);
    if(tweetUser.length!==0){
        const deleteQuery=`DELETE FROM tweet WHERE tweet.user_id=${user_id} AND tweet.tweet_id=${tweetId};`;
        await db.run(deleteQuery);
        response.send("Tweet Removed");
    }else{
        response.status(401);
        response.send("Invalid Request");
    }
});
module.exports=app;


