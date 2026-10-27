const fs = require("fs");
const path = require("path");
const db = require("./database/database");

const imageFolder = path.join(__dirname, "clothing_images");

// Both users will own the same clothing images
const userIds = [1, 2];

const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif"
};

try {
    if (!fs.existsSync(imageFolder)) {
        throw new Error("The clothing_images folder was not found.");
    }

    const files = fs.readdirSync(imageFolder)
        .filter(file => /^clothing_\d+\./i.test(file))
        .sort();

    if (files.length === 0) {
        throw new Error("No downloaded clothing images were found.");
    }

    // Check that both users exist
    const findUser = db.prepare(
        "SELECT id FROM users WHERE id = ?"
    );

    for (const userId of userIds) {
        if (!findUser.get(userId)) {
            throw new Error(`User ID ${userId} was not found.`);
        }
    }

    // Check whether this image is already stored for a user
    const findExisting = db.prepare(`
        SELECT id
        FROM clothing_items
        WHERE user_id = ? AND image_path = ?
    `);

    // Insert the image's actual binary data into SQLite
    const insertImage = db.prepare(`
        INSERT INTO clothing_items
        (user_id, name, category, color, image_path, image_data, image_format)
        VALUES (?, ?, 'unclassified', NULL, ?, ?, ?)
    `);

    let imported = 0;
    let skipped = 0;

    const importImages = db.transaction(() => {
        for (const userId of userIds) {
            for (const file of files) {
                const fullPath = path.join(imageFolder, file);
                const relativePath = path.join("clothing_images", file)
                    .replace(/\\/g, "/");

                // Avoid importing the same image twice for the same user
                if (findExisting.get(userId, relativePath)) {
                    skipped++;
                    continue;
                }

                const imageData = fs.readFileSync(fullPath);
                const extension = path.extname(file).toLowerCase();
                const imageFormat = mimeTypes[extension];

                if (!imageFormat) {
                    throw new Error(
                        `Unsupported image format for ${file}: ${extension}`
                    );
                }

                const name = path.parse(file).name;

                insertImage.run(
                    userId,
                    name,
                    relativePath,
                    imageData,
                    imageFormat
                );

                imported++;
            }
        }
    });

    importImages();

    console.log("\nImage import completed!");
    console.log("Images found:", files.length);
    console.log("New records imported:", imported);
    console.log("Existing records skipped:", skipped);

    console.log("\nRecords stored for each user:");

    const results = db.prepare(`
        SELECT
            user_id,
            COUNT(*) AS total_images,
            SUM(
                CASE WHEN image_data IS NOT NULL THEN 1 ELSE 0 END
            ) AS images_with_blob
        FROM clothing_items
        GROUP BY user_id
        ORDER BY user_id
    `).all();

    console.table(results);

} catch (error) {
    console.error("Import failed:", error.message);
    process.exitCode = 1;
} finally {
    db.close();
}