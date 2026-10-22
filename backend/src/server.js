
require("dotenv").config();

const app = require("./app");
const seedStaff = require("./data/seedStaff");

const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        // Create development staff accounts before accepting requests
        await seedStaff();

        app.listen(PORT, () => {
            console.log(
                `NEBB Queue backend running on http://localhost:${PORT}`
            );
        });

    } catch (error) {
        console.error("Failed to start backend:", error);
        process.exit(1);
    }
}

startServer();
