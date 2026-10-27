const bcrypt = require('bcryptjs');
const db = require('./database/database');
const {
  app,
  BrowserWindow,
  ipcMain,
  session
} = require("electron");


const path = require("path");
const fs = require("fs");

let mainWindow;
let cameraWindow;


// Handle user registration
ipcMain.handle('signup-user', async (event, userData) => {
    try {
        const username = userData.username?.trim();
        const email = userData.email?.trim().toLowerCase();
        const password = userData.password;

        if (!username || !email || !password) {
            return {
                success: false,
                message: 'Please fill in all required fields.'
            };
        }

        if (password.length < 8) {
            return {
                success: false,
                message: 'Password must contain at least 8 characters.'
            };
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert the user into SQLite
        const insertUser = db.prepare(`
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        `);

        insertUser.run(username, email, hashedPassword);

        return {
            success: true,
            message: 'Account created successfully!'
        };

    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return {
                success: false,
                message: 'This email is already registered. Please log in.'
            };
        }

        console.error('Signup error:', error);

        return {
            success: false,
            message: 'Registration failed. Please try again.'
        };
    }
});

// Handle user login
ipcMain.handle('login-user', async (event, userData) => {
    try {
        const username = userData.username?.trim();
        const password = userData.password;

        if (!username || !password) {
            return {
                success: false,
                message: 'Please enter your username and password.'
            };
        }

        // Find the user by their registered username
        const user = db.prepare(`
            SELECT id, name, email, password
            FROM users
            WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
        `).get(username);

        if (!user) {
            return {
                success: false,
                message: 'Invalid username or password.'
            };
        }

        // Compare the entered password with its stored hash
        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return {
                success: false,
                message: 'Invalid username or password.'
            };
        }

        return {
            success: true,
            message: 'Login successful!',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        };

    } catch (error) {
        console.error('Login error:', error);

        return {
            success: false,
            message: 'Unable to log in. Please try again.'
        };
    }
});


// =====================================================
// START APPLICATION
// =====================================================

app.whenReady().then(() => {

  // ===================================================
  // ALLOW CAMERA ACCESS
  // ===================================================

  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {

      if (permission === "media") {
        callback(true);
      } else {
        callback(false);
      }

    }
  );
  // Test SQLite database connection
  const result = db.prepare('SELECT sqlite_version() AS version').get();
  console.log('SQLite connected successfully! Version:', result.version);   


  // ===================================================
  // MAIN WINDOW
  // ===================================================

  mainWindow = new BrowserWindow({
    width: 400,
    height: 790,

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile("signup.html");


  // ===================================================
  // OPEN CAMERA WINDOW
  // ===================================================

  ipcMain.on("open-camera", () => {

    // If camera window already exists,
    // bring it to the front.

    if (cameraWindow) {
      cameraWindow.focus();
      return;
    }


    cameraWindow = new BrowserWindow({
      width: 800,
      height: 600,

      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });


    cameraWindow.loadFile("camera.html");


    cameraWindow.on("closed", () => {
      cameraWindow = null;
    });

  });


  // ===================================================
  // SAVE CAPTURED IMAGE
  // ===================================================

  ipcMain.on("save-image", (event, photoDataUrl) => {

    try {

      // Remove Base64 header

      const base64Data =
        photoDataUrl.replace(
          /^data:image\/jpeg;base64,/,
          ""
        );


      // Convert Base64 to image buffer

      const imageBuffer =
        Buffer.from(
          base64Data,
          "base64"
        );


      // Save image to Pictures folder

      const savePath =
        path.join(
          app.getPath("pictures"),
          "captured_photo.jpg"
        );


      fs.writeFile(
        savePath,
        imageBuffer,
        (error) => {

          if (error) {

            console.error(
              "Error saving image:",
              error
            );

          } else {

            console.log(
              "Image saved successfully:",
              savePath
            );

          }

        }
      );

    } catch (error) {

      console.error(
        "Error processing image:",
        error
      );

    }

  });


  // ===================================================
  // AI OUTFIT RECOMMENDATION
  // ===================================================

  ipcMain.handle(
    "get-ai-recommendation",
    async (event, data) => {

      console.log(
        "AI recommendation request received."
      );


      const weather = data.weather;
      const wardrobe = data.wardrobe;


      // -----------------------------------------------
      // Create local recommendation first.
      // -----------------------------------------------

      const localRecommendation =
        createLocalRecommendation(
          weather,
          wardrobe
        );


      // -----------------------------------------------
      // Get OpenAI API key from environment.
      // -----------------------------------------------

      const openAIKey =
        process.env.OPENAI_API_KEY;


      // -----------------------------------------------
      // If there is no OpenAI key,
      // use local recommendation.
      // -----------------------------------------------

      if (!openAIKey) {

        console.log(
          "OPENAI_API_KEY was not found."
        );

        return localRecommendation;
      }


      // -----------------------------------------------
      // Ask OpenAI
      // -----------------------------------------------

      try {

        const aiRecommendation =
          await askOpenAI(
            weather,
            localRecommendation.outfit,
            openAIKey
          );


        return {
          outfit:
            localRecommendation.outfit,

          recommendation:
            aiRecommendation.recommendation,

          reason:
            aiRecommendation.reason
        };

      } catch (error) {

        console.error(
          "OpenAI request failed:",
          error
        );


        // If OpenAI fails,
        // return the local recommendation.

        return localRecommendation;
      }

    }
  );

});


// =====================================================
// LOCAL RECOMMENDATION SYSTEM
// =====================================================

function createLocalRecommendation(
  weather,
  wardrobe
) {

  const temperature =
    weather.temperature;


  // Decide how much warmth is needed.

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


  // Find clothing categories.

  const shirts =
    wardrobe.filter(
      item => item.category === "shirt"
    );

  const pants =
    wardrobe.filter(
      item => item.category === "pants"
    );

  const jackets =
    wardrobe.filter(
      item => item.category === "jacket"
    );

  const shoes =
    wardrobe.filter(
      item => item.category === "shoes"
    );

  const dresses =
    wardrobe.filter(
      item => item.category === "dress"
    );


  // Choose items.

  const selectedShirt =
    findBestItem(
      shirts,
      requiredWarmth
    );

  const selectedPants =
    findBestItem(
      pants,
      requiredWarmth
    );

  const selectedShoes =
    findBestItem(
      shoes,
      1
    );


  // Build outfit.

  let outfit = [];


  if (selectedShirt) {
    outfit.push(selectedShirt);
  }


  if (selectedPants) {
    outfit.push(selectedPants);
  }


  if (selectedShoes) {
    outfit.push(selectedShoes);
  }


  // Add jacket when cold.

  if (temperature < 20) {

    const selectedJacket =
      findBestItem(
        jackets,
        requiredWarmth
      );

    if (selectedJacket) {
      outfit.push(selectedJacket);
    }

  }


  // Use a dress when it is very hot.

  if (
    temperature >= 30 &&
    dresses.length > 0
  ) {

    const selectedDress =
      dresses.find(
        item => item.warmth <= 2
      );


    if (selectedDress) {

      outfit = [
        selectedDress
      ];


      if (selectedShoes) {
        outfit.push(selectedShoes);
      }

    }

  }


  // Weather recommendation.

  let recommendation;


  if (temperature >= 30) {

    recommendation =
      "Go for a light and breathable outfit.";

  } else if (temperature >= 24) {

    recommendation =
      "A comfortable lightweight outfit should work well.";

  } else if (temperature >= 18) {

    recommendation =
      "A balanced outfit with moderate coverage is a good choice.";

  } else {

    recommendation =
      "The weather is cool, so add a warmer layer.";
  }


  // Explanation.

  const reason =
    `The outfit was selected based on the current ` +
    `${temperature.toFixed(1)}°C temperature and ` +
    `${weather.description}. ` +
    `The clothing was chosen from your wardrobe ` +
    `based on warmth and style.`;


  return {
    outfit: outfit,
    recommendation: recommendation,
    reason: reason
  };
}


// =====================================================
// FIND BEST CLOTHING ITEM
// =====================================================

function findBestItem(
  items,
  requiredWarmth
) {

  if (
    !items ||
    items.length === 0
  ) {

    return null;
  }


  const scoredItems =
    items.map(item => {

      let score = 0;


      // How close is the warmth?

      const warmthDifference =
        Math.abs(
          item.warmth -
          requiredWarmth
        );


      score +=
        10 -
        warmthDifference * 3;


      // Prefer casual clothes.

      if (
        item.style.includes("casual")
      ) {

        score += 2;
      }


      // Prefer minimal clothes.

      if (
        item.style.includes("minimal")
      ) {

        score += 2;
      }


      return {
        item: item,
        score: score
      };

    });


  // Highest score first.

  scoredItems.sort(
    (a, b) =>
      b.score - a.score
  );


  return scoredItems[0].item;
}


// =====================================================
// OPENAI REQUEST
// =====================================================

async function askOpenAI(
  weather,
  outfit,
  apiKey
) {

  const wardrobeText =
    outfit.map(item => {

      return (
        `${item.name} | ` +
        `category: ${item.category} | ` +
        `color: ${item.color} | ` +
        `style: ${item.style.join(", ")}`
      );

    }).join("\n");


  const prompt = `
You are a personal fashion assistant.

Create a short outfit recommendation using ONLY
the clothing items provided below.

WEATHER:
Temperature: ${weather.temperature}°C
Feels like: ${weather.feelsLike}°C
Condition: ${weather.description}
Humidity: ${weather.humidity}%
Wind: ${weather.windSpeed} m/s

AVAILABLE OUTFIT ITEMS:
${wardrobeText}

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


  const response =
    await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model: "gpt-6-luna",
          input: prompt
        })
      }
    );


  if (!response.ok) {

    const errorText =
      await response.text();

    throw new Error(
      `OpenAI API error: ${response.status} ${errorText}`
    );
  }


  const data =
    await response.json();


  let output =
    data.output_text;


  if (!output && data.output) {

    for (
      const outputItem of data.output
    ) {

      if (
        outputItem.content
      ) {

        for (
          const contentItem
          of outputItem.content
        ) {

          if (
            contentItem.type ===
            "output_text"
          ) {

            output =
              contentItem.text;
          }

        }

      }

    }

  }


  if (!output) {

    throw new Error(
      "OpenAI returned no text."
    );
  }


  // Remove Markdown code fences.

  output =
    output
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();


  // Convert JSON to JavaScript object.

  return JSON.parse(output);
}


// =====================================================
// CLOSE APP
// =====================================================

app.on(
  "window-all-closed",
  () => {

    if (
      process.platform !== "darwin"
    ) {

      app.quit();
    }

  }
);