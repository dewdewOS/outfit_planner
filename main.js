const bcrypt = require("bcryptjs");
const db = require("./database/database");

const {
  app,
  BrowserWindow,
  ipcMain,
  session,
  dialog
} = require("electron");

const path = require("path");
const fs = require("fs");

let mainWindow;
let cameraWindow;
let currentUserId = null;

const { randomUUID } = require("crypto");

// Keep selected images in the main process.
const pendingClothingImages = new Map();

// Load the pretrained model only once.
let clothingClassifierPromise = null;


/* =========================================
   SELECT A CLOTHING IMAGE
========================================= */

ipcMain.handle("select-clothing-image", async (event) => {
  try {
    if (!currentUserId) {
      return {
        success: false,
        message: "Please log in first."
      };
    }

    const result = await dialog.showOpenDialog({
      title: "Choose a clothing photo",
      properties: ["openFile"],
      filters: [
        {
          name: "Clothing images",
          extensions: ["jpg", "jpeg", "png", "webp"]
        }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return {
        success: false,
        canceled: true,
        message: "No image selected."
      };
    }

    const filePath = result.filePaths[0];
    const buffer = await fs.promises.readFile(filePath);

    // Limit uploads to 10 MB.
    if (buffer.length > 10 * 1024 * 1024) {
      return {
        success: false,
        message: "Please choose an image smaller than 10 MB."
      };
    }

    const extension = path.extname(filePath).toLowerCase();

    const mimeTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp"
    };

    const mimeType = mimeTypes[extension];

    if (!mimeType) {
      return {
        success: false,
        message: "Unsupported image format."
      };
    }

    const token = randomUUID();

    pendingClothingImages.set(token, {
      buffer,
      mimeType,
      fileName: path.basename(filePath),
      userId: currentUserId,
      webContentsId: event.sender.id
    });

    return {
      success: true,
      token,
      fileName: path.basename(filePath),
      imageDataUrl:
        `data:${mimeType};base64,${buffer.toString("base64")}`
    };
  } catch (error) {
    console.error("Image selection error:", error);

    return {
      success: false,
      message: "Could not open the selected image."
    };
  }
});


ipcMain.handle("prepare-captured-clothing-image", async (event, photoDataUrl) => {
  try {
    if (!currentUserId) {
      return {
        success: false,
        message: "Please log in first."
      };
    }

    if (typeof photoDataUrl !== "string") {
      return {
        success: false,
        message: "Invalid captured photo."
      };
    }

    const match = photoDataUrl.match(
      /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/
    );

    if (!match) {
      return {
        success: false,
        message: "The captured photo is not a valid JPEG."
      };
    }

    const buffer = Buffer.from(match[1], "base64");

    if (buffer.length === 0 || buffer.length > 10 * 1024 * 1024) {
      return {
        success: false,
        message: "The photo must be smaller than 10 MB."
      };
    }

    const token = randomUUID();

    pendingClothingImages.set(token, {
      buffer,
      mimeType: "image/jpeg",
      fileName: `captured-${Date.now()}.jpg`,
      userId: currentUserId,
      webContentsId: event.sender.id
    });

    return {
      success: true,
      token,
      fileName: `captured-${Date.now()}.jpg`,
      imageDataUrl: photoDataUrl
    };
  } catch (error) {
    console.error("Captured photo preparation error:", error);

    return {
      success: false,
      message: "Could not prepare the captured photo."
    };
  }
});


/* =========================================
   CLASSIFY CLOTHING WITH TRANSFORMERS.JS
========================================= */

ipcMain.handle("classify-clothing-image", async (event, token) => {
  try {
    if (!currentUserId) {
      return {
        success: false,
        message: "Please log in first."
      };
    }

    const image = pendingClothingImages.get(token);

    if (
      !image ||
      image.userId !== currentUserId ||
      image.webContentsId !== event.sender.id
    ) {
      return {
        success: false,
        message: "Please select the image again."
      };
    }

    if (!clothingClassifierPromise) {
      clothingClassifierPromise = (async () => {
        const { pipeline, RawImage } =
          await import("@huggingface/transformers");

        const classifier = await pipeline(
          "zero-shot-image-classification",
          "Xenova/clip-vit-base-patch32"
        );

        return { classifier, RawImage };
      })().catch(error => {
        clothingClassifierPromise = null;
        throw error;
      });
    }

    const { classifier, RawImage } =
      await clothingClassifierPromise;

    const imageData = await RawImage.fromBlob(
      new Blob([image.buffer], { type: image.mimeType })
    );

    const labels = [
      "a T-shirt",
      "a formal shirt",
      "a pair of jeans",
      "a pair of trousers",
      "a pair of shorts",
      "a sweater or hoodie",
      "a jacket or coat",
      "a dress",
      "a skirt",
      "a pair of shoes",
      "a pair of sandals"
    ];


    const predictions = await classifier(imageData, labels);
    const best = predictions[0];

    const categoryMap = {
      "a T-shirt": "shirt",
      "a formal shirt": "shirt",
      "a pair of jeans": "pants",
      "a pair of trousers": "pants",
      "a pair of shorts": "shorts",
      "a sweater or hoodie": "sweater",
      "a jacket or coat": "jacket",
      "a dress": "dress",
      "a skirt": "skirt",
      "a pair of shoes": "shoes",
      "a pair of sandals": "shoes"
    };

    // Use the same image model to estimate each attribute.
    async function predictAttribute(options) {
      const results = await classifier(imageData, options);
      return results[0]?.label || "";
    }

    // Predict the main colour.
    const color = await predictAttribute([
      "black clothing",
      "white clothing",
      "blue clothing",
      "navy blue clothing",
      "red clothing",
      "green clothing",
      "yellow clothing",
      "pink clothing",
      "purple clothing",
      "brown clothing",
      "grey clothing",
      "beige clothing",
      "orange clothing",
      "multicoloured clothing"
    ]);

    // Predict the pattern.
    const pattern = await predictAttribute([
      "plain solid-colour clothing",
      "striped clothing",
      "checked or plaid clothing",
      "floral clothing",
      "polka dot clothing",
      "graphic printed clothing",
      "abstract patterned clothing",
      "camouflage patterned clothing",
      "denim clothing"
    ]);

    // Predict the style.
    const style = await predictAttribute([
      "casual clothing",
      "formal business clothing",
      "smart casual clothing",
      "sportswear and activewear",
      "streetwear",
      "partywear",
      "traditional clothing"
    ]);

    // Predict the most suitable season.
    const season = await predictAttribute([
      "light summer clothing",
      "rainy monsoon weather clothing",
      "spring clothing",
      "autumn clothing",
      "warm winter clothing",
      "clothing suitable for all seasons"
    ]);

    // Convert the model's labels to simple values.
    const category = categoryMap[best.label] || "shirt";

    const name = best.label
      .replace(/^a pair of /, "")
      .replace(/^(a|an) /, "");

    const colorValue = color
      .replace(/\s+clothing$/, "");

    const patternValue = pattern
      .replace(/\s+clothing$/, "");

    const styleMap = {
      "casual clothing": "casual",
      "formal business clothing": "formal",
      "smart casual clothing": "smart casual",
      "sportswear and activewear": "sportswear",
      "streetwear": "streetwear",
      "partywear": "partywear",
      "traditional clothing": "traditional"
    };

    const seasonMap = {
      "light summer clothing": "summer",
      "rainy monsoon weather clothing": "monsoon",
      "spring clothing": "spring",
      "autumn clothing": "autumn",
      "warm winter clothing": "winter",
      "clothing suitable for all seasons": "all seasons"
    };

    const styleValue = styleMap[style] || "casual";
    const seasonValue = seasonMap[season] || "all seasons";

    // Estimate warmth from clothing type.
    // 1 = very light, 5 = very warm.
    const warmthMap = {
      shirt: 1,
      pants: 2,
      shorts: 1,
      sweater: 4,
      jacket: 5,
      dress: 2,
      skirt: 2,
      shoes: 1
    };

    // Estimate formality from predicted style.
    // 1 = casual, 2 = smart casual, 3 = formal.
    let formalityValue = 1;


    if (styleValue === "smart casual") {
      formalityValue = 2;
    } else if (styleValue === "formal") {
      formalityValue = 3;
    }

    // Log the clothing attributes
    console.log("Returning clothing attributes:", {
      success: true,
      name,
      category,
      subcategory: best.label,
      confidence: best.score,
      color: colorValue,
      style: styleValue,
      pattern: patternValue,
      warmth: warmthMap[category] || 2,
      formality: formalityValue,
      season: seasonValue
    });

    // Return the classification results to camera.html
    return {
      success: true,
      name,
      category,
      subcategory: best.label,
      confidence: best.score,
      color: colorValue,
      style: styleValue,
      pattern: patternValue,
      warmth: warmthMap[category] || 2,
      formality: formalityValue,
      season: seasonValue
    };

  } catch (error) {
    console.error("Clothing classification error:", error);

    return {
      success: false,
      message:
        "Classification failed. Check your internet connection and try again."
    };
  }
});


/* =========================================
   SAVE CLOTHING TO SQLITE
========================================= */

ipcMain.handle("save-clothing-item", async (event, item) => {
  try {
    if (!currentUserId) {
      return {
        success: false,
        message: "Please log in first."
      };
    }

    const image = pendingClothingImages.get(item?.token);

    if (
      !image ||
      image.userId !== currentUserId ||
      image.webContentsId !== event.sender.id
    ) {
      return {
        success: false,
        message: "Please select the image again."
      };
    }

    const allowedCategories = [
      "shirt", "pants", "shorts", "sweater",
      "jacket", "dress", "skirt", "shoes"
    ];

    const name = String(item?.name || "").trim();
    const category = String(item?.category || "").trim();

    if (!name || name.length > 100) {
      return {
        success: false,
        message: "Enter a name of up to 100 characters."
      };
    }

    if (!allowedCategories.includes(category)) {
      return {
        success: false,
        message: "Please choose a valid clothing category."
      };
    }

    const confidence = Number(item?.confidence);
    const safeConfidence =
      Number.isFinite(confidence) &&
        confidence >= 0 &&
        confidence <= 1
        ? confidence
        : null;

    const warmth = Number(item?.warmth);
    const formality = Number(item?.formality);

    const safeWarmth =
      Number.isInteger(warmth) && warmth >= 1 && warmth <= 5
        ? warmth
        : null;

    const safeFormality =
      Number.isInteger(formality) &&
        formality >= 1 &&
        formality <= 3
        ? formality
        : null;

    const result = db.prepare(`
            INSERT INTO clothing_items (
                user_id, name, category, color,
                image_data, image_format, image_path,
                subcategory, style, pattern, warmth,
                formality, season, classification_confidence
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
      currentUserId,
      name,
      category,
      String(item?.color || "").slice(0, 50) || null,
      image.buffer,
      image.mimeType,
      image.fileName,
      String(item?.subcategory || "").slice(0, 100) || null,
      String(item?.style || "").slice(0, 100) || null,
      String(item?.pattern || "").slice(0, 100) || null,
      safeWarmth,
      safeFormality,
      String(item?.season || "").slice(0, 100) || null,
      safeConfidence
    );

    pendingClothingImages.delete(item.token);

    return {
      success: true,
      id: Number(result.lastInsertRowid),
      message: "Clothing saved successfully."
    };
  } catch (error) {
    console.error("Save clothing error:", error);

    return {
      success: false,
      message: "Could not save this clothing item."
    };
  }
});


/* =========================================
   LOAD THE LOGGED-IN USER'S CLOTHES
========================================= */

ipcMain.handle("get-clothing-items", async () => {
  try {
    if (!currentUserId) {
      return {
        success: false,
        message: "Please log in first.",
        items: []
      };
    }

    const rows = db.prepare(`
            SELECT
                id, name, category, color, image_data,
                image_format, subcategory, style, pattern,
                warmth, formality, season,
                classification_confidence
            FROM clothing_items
            WHERE user_id = ?
            ORDER BY id DESC
        `).all(currentUserId);

    const items = rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      color: row.color,
      subcategory: row.subcategory,
      style: row.style,
      pattern: row.pattern,
      warmth: row.warmth,
      formality: row.formality,
      season: row.season,
      confidence: row.classification_confidence,
      imageDataUrl: row.image_data
        ? `data:${row.image_format || "image/jpeg"};base64,${Buffer.from(row.image_data).toString("base64")}`
        : null
    }));

    return {
      success: true,
      items
    };
  } catch (error) {
    console.error("Load clothing error:", error);

    return {
      success: false,
      message: "Could not load your wardrobe.",
      items: []
    };
  }
});

ipcMain.handle("signup-user", async (event, userData) => {
  try {
    const username = userData.username?.trim();
    const email = userData.email?.trim().toLowerCase();
    const password = userData.password;

    if (!username || !email || !password) {
      return {
        success: false,
        message: "Please fill in all required fields."
      };
    }

    if (password.length < 8) {
      return {
        success: false,
        message: "Password must contain at least 8 characters."
      };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    db.prepare(`
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        `).run(username, email, hashedPassword);

    return {
      success: true,
      message: "Account created successfully!"
    };

  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return {
        success: false,
        message: "This email is already registered. Please log in."
      };
    }

    console.error("Signup error:", error);

    return {
      success: false,
      message: "Registration failed. Please try again."
    };
  }
});

// =====================================================
// USER LOGIN
// =====================================================

ipcMain.handle("login-user", async (event, userData) => {
  try {
    const username = userData.username?.trim();
    const password = userData.password;

    if (!username || !password) {
      return {
        success: false,
        message: "Please enter your username and password."
      };
    }

    const user = db.prepare(`
            SELECT id, name, email, password
            FROM users
            WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
        `).get(username);

    if (!user) {
      return {
        success: false,
        message: "Invalid username or password."
      };
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return {
        success: false,
        message: "Invalid username or password."
      };
    }

    // Remember the logged-in user's ID.
    currentUserId = user.id;

    return {
      success: true,
      message: "Login successful!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };

  } catch (error) {
    console.error("Login error:", error);

    return {
      success: false,
      message: "Unable to log in. Please try again."
    };
  }
});

// =====================================================
// SAVE PROFILE CUSTOMIZATION
// =====================================================

ipcMain.handle(
  "save-profile-customization",
  async (event, selections) => {
    try {
      if (!currentUserId) {
        return {
          success: false,
          message: "Please log in before saving your profile."
        };
      }

      const {
        skinTone,
        hairColor,
        gender
      } = selections || {};

      // Validate the selected colours.
      if (
        typeof skinTone !== "string" ||
        !/^#[0-9a-fA-F]{6}$/.test(skinTone) ||
        typeof hairColor !== "string" ||
        !/^#[0-9a-fA-F]{6}$/.test(hairColor) ||
        !["male", "female"].includes(gender)
      ) {
        return {
          success: false,
          message: "Please select your colours and gender."
        };
      }

      db.prepare(`
                UPDATE users
                SET skin_tone = ?,
                    hair_color = ?,
                    gender = ?
                WHERE id = ?
            `).run(
        skinTone,
        hairColor,
        gender,
        currentUserId
      );

      return {
        success: true,
        message: "Profile customization saved!"
      };

    } catch (error) {
      console.error("Profile save error:", error);

      return {
        success: false,
        message: "Could not save your profile."
      };
    }
  }
);

// =====================================================
// LOAD PROFILE CUSTOMIZATION
// =====================================================

ipcMain.handle(
  "get-profile-customization",
  async () => {
    try {
      if (!currentUserId) {
        return {
          success: false,
          message: "Please log in first."
        };
      }

      const profile = db.prepare(`
                SELECT skin_tone, hair_color, gender
                FROM users
                WHERE id = ?
            `).get(currentUserId);

      if (!profile) {
        return {
          success: false,
          message: "Profile not found."
        };
      }

      return {
        success: true,
        profile: {
          skinTone: profile.skin_tone,
          hairColor: profile.hair_color,
          gender: profile.gender
        }
      };

    } catch (error) {
      console.error("Profile load error:", error);

      return {
        success: false,
        message: "Could not load your profile."
      };
    }
  }
);

// =====================================================
// START APPLICATION
// =====================================================

app.whenReady().then(() => {

  // Allow camera access.
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      callback(permission === "media");
    }
  );

  // Test the SQLite database connection.
  const result = db.prepare(
    "SELECT sqlite_version() AS version"
  ).get();

  console.log(
    "SQLite connected successfully! Version:",
    result.version
  );

  // Main window.
  mainWindow = new BrowserWindow({
    width: 400,
    height: 790,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  console.log(
    "Node integration enabled:",
    mainWindow.webContents.getLastWebPreferences().nodeIntegration
  );

  mainWindow.loadFile("signup.html");

  ipcMain.on("open-camera", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadFile(path.join(__dirname, "camera.html"));
    } else {
      console.error("Main window is not available.");
    }
  });


});

// =================================================
// SAVE CAPTURED IMAGE
// =================================================

ipcMain.on("save-image", (event, photoDataUrl) => {
  try {
    const base64Data = photoDataUrl.replace(
      /^data:image\/jpeg;base64,/,
      ""
    );

    const imageBuffer = Buffer.from(
      base64Data,
      "base64"
    );

    const savePath = path.join(
      app.getPath("pictures"),
      "captured_photo.jpg"
    );

    fs.writeFile(savePath, imageBuffer, (error) => {
      if (error) {
        console.error("Error saving image:", error);
      } else {
        console.log(
          "Image saved successfully:",
          savePath
        );
      }
    });

  } catch (error) {
    console.error("Error processing image:", error);
  }
});

// =================================================
// AI OUTFIT RECOMMENDATION
// =================================================

// =================================================
// AI OUTFIT RECOMMENDATION
// =================================================

ipcMain.handle("get-ai-recommendation", async (event, data) => {
  console.log("AI recommendation request received.");

  const weather = data?.weather;
  const wardrobe = Array.isArray(data?.wardrobe)
    ? data.wardrobe
    : [];

  const localRecommendation =
    createLocalRecommendation(weather, wardrobe);

  const openAIKey = process.env.OPENAI_API_KEY;

  // Use local recommendations if no API key exists.
  if (!openAIKey) {
    console.log(
      "OPENAI_API_KEY was not found. Using local recommendation."
    );

    return localRecommendation;
  }

  try {
    const aiRecommendation = await askOpenAI(
      weather,
      localRecommendation.outfit,
      openAIKey
    );

    return {
      outfit: localRecommendation.outfit,
      recommendation: aiRecommendation.recommendation,
      reason: aiRecommendation.reason
    };

  } catch (error) {
    console.error("OpenAI request failed:", error);

    // Fall back to the local recommendation.
    return localRecommendation;
  }
});


// =====================================================
// LOCAL RECOMMENDATION SYSTEM
// =====================================================

function createLocalRecommendation(weather, wardrobe) {
  const temperature = Number(weather?.temperature ?? 25);
  const description = weather?.description || "current weather";

  let requiredWarmth;

  if (temperature >= 30) {
    requiredWarmth = 1;
  } else if (temperature >= 24) {
    requiredWarmth = 2;
  } else if (temperature >= 18) {
    requiredWarmth = 3;
  } else {
    requiredWarmth = 4;
  }

  const shirts = wardrobe.filter(
    item => item.category === "shirt"
  );

  const pants = wardrobe.filter(
    item => item.category === "pants"
  );

  const jackets = wardrobe.filter(
    item => item.category === "jacket"
  );

  const shoes = wardrobe.filter(
    item => item.category === "shoes"
  );

  const dresses = wardrobe.filter(
    item => item.category === "dress"
  );

  const selectedShirt = findBestItem(
    shirts,
    requiredWarmth
  );

  const selectedPants = findBestItem(
    pants,
    requiredWarmth
  );

  const selectedShoes = findBestItem(shoes, 1);

  let outfit = [];

  if (selectedShirt) outfit.push(selectedShirt);
  if (selectedPants) outfit.push(selectedPants);
  if (selectedShoes) outfit.push(selectedShoes);

  // Add a jacket when the weather is cold.
  if (temperature < 20) {
    const selectedJacket = findBestItem(
      jackets,
      requiredWarmth
    );

    if (selectedJacket) {
      outfit.push(selectedJacket);
    }
  }

  // Prefer a dress in very hot weather when available.
  if (temperature >= 30 && dresses.length > 0) {
    const selectedDress = dresses.find(
      item => Number(item.warmth) <= 2
    );

    if (selectedDress) {
      outfit = [selectedDress];

      if (selectedShoes) {
        outfit.push(selectedShoes);
      }
    }
  }

  let recommendation;

  if (temperature >= 30) {
    recommendation = "Go for a light and breathable outfit.";
  } else if (temperature >= 24) {
    recommendation = "A comfortable lightweight outfit should work well.";
  } else if (temperature >= 18) {
    recommendation = "A balanced outfit with moderate coverage is a good choice.";
  } else {
    recommendation = "The weather is cool, so add a warmer layer.";
  }

  const reason =
    `The outfit was selected based on the current ` +
    `${temperature.toFixed(1)}°C temperature and ${description}. ` +
    `The clothing was chosen from your wardrobe based on warmth and style.`;

  return {
    outfit,
    recommendation,
    reason
  };
}

// =====================================================
// FIND BEST CLOTHING ITEM
// =====================================================

function findBestItem(items, requiredWarmth) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const scoredItems = items.map(item => {
    let score = 0;

    const warmth = Number(item.warmth ?? requiredWarmth);

    const warmthDifference = Math.abs(
      warmth - requiredWarmth
    );

    score += 10 - warmthDifference * 3;

    const styles = Array.isArray(item.style)
      ? item.style
      : String(item.style || "").split(/[,\s]+/);

    if (styles.includes("casual")) {
      score += 2;
    }

    if (styles.includes("minimal")) {
      score += 2;
    }

    return {
      item,
      score
    };
  });

  scoredItems.sort((a, b) => b.score - a.score);

  return scoredItems[0].item;
}

// =====================================================
// OPENAI REQUEST
// =====================================================

async function askOpenAI(weather, outfit, apiKey) {
  const wardrobeText = outfit.map(item => {
    const styles = Array.isArray(item.style)
      ? item.style.join(", ")
      : String(item.style || "unspecified");

    return (
      `${item.name} | ` +
      `category: ${item.category} | ` +
      `color: ${item.color || "unspecified"} | ` +
      `style: ${styles}`
    );
  }).join("\n");

  const prompt = `
You are a personal fashion assistant.

Create a short outfit recommendation using ONLY
the clothing items provided below.

WEATHER:
Temperature: ${weather.temperature}°C
Feels like: ${weather.feelsLike ?? "unknown"}°C
Condition: ${weather.description}
Humidity: ${weather.humidity ?? "unknown"}%
Wind: ${weather.windSpeed ?? "unknown"} m/s

AVAILABLE OUTFIT ITEMS:
${wardrobeText || "No matching wardrobe items were found."}

Give the user:
1. A short recommendation.
2. A short explanation of why the outfit works
   for the weather and style.

Do not invent clothing items.
Do not mention clothes that are not listed.

Return ONLY valid JSON in this format:
{
  "recommendation": "short recommendation",
  "reason": "short explanation"
}
`;

  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        // Keep the model ID from your existing code.
        model: "gpt-6-luna",
        input: prompt
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `OpenAI API error: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();

  let output = data.output_text;

  if (!output && Array.isArray(data.output)) {
    for (const outputItem of data.output) {
      for (const contentItem of (outputItem.content || [])) {
        if (contentItem.type === "output_text") {
          output = contentItem.text;
        }
      }
    }
  }

  if (!output) {
    throw new Error("OpenAI returned no text.");
  }

  // Remove Markdown code fences, if present.
  output = output
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(output);
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});