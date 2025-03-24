import express from "express";

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("", (req, res) => {
  res.send("Hello small World!");
});

app.get("/callback", (req, res) => {
  res.send("Hello Callback!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
