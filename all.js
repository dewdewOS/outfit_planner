
const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
    const savedClothesGrid = document.getElementById("savedClothesGrid");

    async function loadClothingItems() {
        savedClothesGrid.replaceChildren();

        try {
            const result = await ipcRenderer.invoke("get-clothing-items");

            if (!result.success) {
                savedClothesGrid.textContent =
                    result.message || "Could not load your wardrobe.";
                return;
            }

            if (!result.items || result.items.length === 0) {
                savedClothesGrid.textContent =
                    "Your wardrobe is empty. Capture or add some clothes!";
                return;
            }

            result.items.forEach(item => {
                const card = document.createElement("div");
                card.className = "item";

                if (item.imageDataUrl) {
                    const image = document.createElement("img");
                    image.src = item.imageDataUrl;
                    image.alt = item.name || "Clothing item";
                    card.appendChild(image);
                }

                const name = document.createElement("p");
                name.className = "item-name";
                name.textContent = item.name;
                card.appendChild(name);

                const category = document.createElement("p");
                category.className = "sample-label";
                category.textContent = item.category;
                card.appendChild(category);

                if (item.color) {
                    const color = document.createElement("p");
                    color.className = "sample-label";
                    color.textContent = `Color: ${item.color}`;
                    card.appendChild(color);
                }

                savedClothesGrid.appendChild(card);
            });
        } catch (error) {
            console.error("Error loading wardrobe:", error);
            savedClothesGrid.textContent =
                "Could not load your wardrobe. Check the Terminal.";
        }
    }

    loadClothingItems();
});
