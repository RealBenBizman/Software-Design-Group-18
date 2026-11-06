
import "dotenv/config";
import app from "./app.js";
import seedStaff from "./data/seedStaff.js";
import ( initializeDatabase } from "./db.js";

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    const db= await initializeDatabase();
    app.locals.db=db;
    // Create development staff accounts before accepting requests
    await seedStaff();

    app.listen(PORT, (error) => {
      if (error) {
        if (error.code === "EADDRINUSE") {
          console.error(
            `Port ${PORT} is already in use. Stop the other backend first.`
          );
        } else {
          console.error("Backend failed to start:", error);
        }

        process.exit(1);
      }

      console.log(
        `QueueSmart backend running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
}

startServer();
