
import db from "../../src/data/database.js";

export function resetTestDatabase() {
    // Never allow tests to erase a persistent database.
    if (process.env.DB_PATH !== ":memory:") {
        throw new Error(
            "Test database reset requires DB_PATH=:memory:"
        );
    }

    // Remove test accounts and their profiles.
    // ON DELETE CASCADE handles related profile records.
    db.prepare("DELETE FROM Users").run();
}
