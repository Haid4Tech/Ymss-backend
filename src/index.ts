import app from "./app";

const PORT = process.env.PORT || 4000;

app.get("/", (_, res) => {
  res.send("Backend is running ✅");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
