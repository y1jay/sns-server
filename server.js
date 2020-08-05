const express = require("express");
const dotenv = require("dotenv");

dotenv.config({ path: "./config/config.env" });

const fileupload = require("express-fileupload");
const path = require("path");

const app = express();
app.use(express.json());
app.use(fileupload());
app.use(express.static(path.join(__dirname, "posting")));
const sns_users = require("./routes/sns_users");
const sns_friends = require("./routes/sns_friends");
app.use("/api/v1/sns_users", sns_users);
app.use("/api/v1/sns_friends", sns_friends);
const PORT = process.env.PORT || 5900;

app.listen(PORT, () => {
  console.log("App listening on port 5900!");
});
