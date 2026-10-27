const fs = require("fs");
const path = require("path");

const projectFolder = __dirname;
const imageFolder = path.join(projectFolder, "clothing_images");

const htmlFiles = [
    "index.html",
    "shirts.html",
    "pants.html",
    "jackets.html",
    "all.html",
    "create-outfit.html",
    "outfit.html"
];

async function downloadImages() {
    const imageUrls = new Set();

    // Find image URLs in the HTML files
    for (const file of htmlFiles) {
        const filePath = path.join(projectFolder, file);

        if (!fs.existsSync(filePath)) {
            console.log(`File not found: ${file}`);
            continue;
        }

        const html = fs.readFileSync(filePath, "utf8");

        const matches = html.matchAll(
            /https?:\/\/[^"'\\s<>]+/g
        );

        for (const match of matches) {
            const url = match[0].replace(/[),;]+$/, "");

            if (
                /^https?:\/\//i.test(url) &&
                /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(url)
            ) {
                imageUrls.add(url);
            }
        }
    }

    console.log(`Found ${imageUrls.size} unique image URLs.`);

    let success = 0;
    let failed = 0;
    let number = 1;

    // Download each unique image
    for (const url of imageUrls) {
        try {
            console.log(`Downloading image ${number}...`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const contentType = response.headers.get("content-type") || "";

            if (!contentType.startsWith("image/")) {
                throw new Error("The URL did not return an image.");
            }

            const extension = {
                "image/jpeg": ".jpg",
                "image/png": ".png",
                "image/webp": ".webp",
                "image/gif": ".gif"
            }[contentType.split(";")[0].toLowerCase()] || ".img";

            const filename = `clothing_${String(number).padStart(3, "0")}${extension}`;
            const savePath = path.join(imageFolder, filename);

            const imageBuffer = Buffer.from(
                await response.arrayBuffer()
            );

            fs.writeFileSync(savePath, imageBuffer);

            console.log(`Saved: ${filename}`);
            success++;
        } catch (error) {
            console.log(`Failed to download image ${number}: ${error.message}`);
            failed++;
        }

        number++;
    }

    console.log("\n--- Download Summary ---");
    console.log(`Downloaded: ${success}`);
    console.log(`Failed: ${failed}`);
    console.log(`Folder: ${imageFolder}`);
}

downloadImages();