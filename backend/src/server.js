import app from "./app.js";

const PORT = 3000;

// express 5 passes listen errors (like a port already in use) to this callback
app.listen(PORT, (error) => {
  if (error) {
    if (error.code === "EADDRINUSE") {
      console.error(
        `port ${PORT} is already in use. stop the other backend first.`
      );
    } else {
      console.error("backend failed to start:", error);
    }
    process.exit(1);
  }

  console.log(`queuesmart backend running on http://localhost:${PORT}`);
});
