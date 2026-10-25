// warmth:
// 1 = very light
// 2 = light
// 3 = medium
// 4 = warm
// 5 = very warm
//
// formality:
// 1 = casual
// 2 = smart casual
// 3 = formal
//
// season:
// spring, summer, autumn, winter


const wardrobe = [

    {
        id: 1,
        name: "White Basic T-Shirt",
        category: "shirt",
        color: "white",
        style: ["casual", "minimal"],
        warmth: 1,
        formality: 1,
        season: ["spring", "summer"]
    },

    {
        id: 2,
        name: "Black T-Shirt",
        category: "shirt",
        color: "black",
        style: ["casual", "streetwear"],
        warmth: 1,
        formality: 1,
        season: ["spring", "summer", "autumn"]
    },

    {
        id: 3,
        name: "Grey T-Shirt",
        category: "shirt",
        color: "grey",
        style: ["casual", "minimal"],
        warmth: 1,
        formality: 1,
        season: ["spring", "summer"]
    },

    {
        id: 4,
        name: "Navy Blue T-Shirt",
        category: "shirt",
        color: "navy",
        style: ["casual", "minimal"],
        warmth: 1,
        formality: 1,
        season: ["spring", "summer"]
    },

    {
        id: 5,
        name: "Olive Green T-Shirt",
        category: "shirt",
        color: "olive",
        style: ["casual", "streetwear"],
        warmth: 1,
        formality: 1,
        season: ["spring", "summer", "autumn"]
    },

    {
        id: 6,
        name: "White Oxford Shirt",
        category: "shirt",
        color: "white",
        style: ["formal", "smart casual", "minimal"],
        warmth: 2,
        formality: 3,
        season: ["spring", "summer", "autumn"]
    },

    {
        id: 7,
        name: "Blue Formal Shirt",
        category: "shirt",
        color: "blue",
        style: ["formal", "smart casual"],
        warmth: 2,
        formality: 3,
        season: ["spring", "summer", "autumn"]
    },

    {
        id: 8,
        name: "Black Formal Shirt",
        category: "shirt",
        color: "black",
        style: ["formal", "minimal"],
        warmth: 2,
        formality: 3,
        season: ["autumn", "winter"]
    },

    {
        id: 9,
        name: "Beige Linen Shirt",
        category: "shirt",
        color: "beige",
        style: ["casual", "minimal"],
        warmth: 1,
        formality: 2,
        season: ["spring", "summer"]
    },

    {
        id: 10,
        name: "Green Casual Shirt",
        category: "shirt",
        color: "green",
        style: ["casual", "smart casual"],
        warmth: 2,
        formality: 2,
        season: ["spring", "autumn"]
    },


    {
        id: 11,
        name: "Blue Jeans",
        category: "pants",
        color: "blue",
        style: ["casual", "streetwear"],
        warmth: 2,
        formality: 1,
        season: ["spring", "summer", "autumn", "winter"]
    },

    {
        id: 12,
        name: "Black Jeans",
        category: "pants",
        color: "black",
        style: ["casual", "minimal", "streetwear"],
        warmth: 2,
        formality: 1,
        season: ["autumn", "winter", "spring"]
    },

    {
        id: 13,
        name: "Light Blue Jeans",
        category: "pants",
        color: "light blue",
        style: ["casual"],
        warmth: 2,
        formality: 1,
        season: ["spring", "summer"]
    },

    {
        id: 14,
        name: "Black Trousers",
        category: "pants",
        color: "black",
        style: ["formal", "minimal"],
        warmth: 2,
        formality: 3,
        season: ["autumn", "winter", "spring"]
    },

    {
        id: 15,
        name: "Grey Trousers",
        category: "pants",
        color: "grey",
        style: ["formal", "smart casual"],
        warmth: 2,
        formality: 3,
        season: ["autumn", "winter", "spring"]
    },

    {
        id: 16,
        name: "Beige Chinos",
        category: "pants",
        color: "beige",
        style: ["smart casual", "minimal"],
        warmth: 2,
        formality: 2,
        season: ["spring", "summer", "autumn"]
    },

    {
        id: 17,
        name: "Olive Cargo Pants",
        category: "pants",
        color: "olive",
        style: ["casual", "streetwear"],
        warmth: 2,
        formality: 1,
        season: ["spring", "autumn", "winter"]
    },

    {
        id: 18,
        name: "Cream Wide-Leg Trousers",
        category: "pants",
        color: "cream",
        style: ["minimal", "smart casual"],
        warmth: 2,
        formality: 2,
        season: ["spring", "summer"]
    },

    {
        id: 19,
        name: "Black Casual Shorts",
        category: "shorts",
        color: "black",
        style: ["casual", "minimal"],
        warmth: 1,
        formality: 1,
        season: ["summer"]
    },

    {
        id: 20,
        name: "Beige Chino Shorts",
        category: "shorts",
        color: "beige",
        style: ["casual", "smart casual"],
        warmth: 1,
        formality: 2,
        season: ["summer"]
    },

    {
        id: 21,
        name: "Blue Denim Shorts",
        category: "shorts",
        color: "blue",
        style: ["casual"],
        warmth: 1,
        formality: 1,
        season: ["summer"]
    },

    {
        id: 22,
        name: "Olive Cargo Shorts",
        category: "shorts",
        color: "olive",
        style: ["casual", "streetwear"],
        warmth: 1,
        formality: 1,
        season: ["summer"]
    },

    {
        id: 23,
        name: "Grey Crewneck Sweater",
        category: "sweater",
        color: "grey",
        style: ["casual", "minimal"],
        warmth: 4,
        formality: 1,
        season: ["autumn", "winter"]
    },

    {
        id: 24,
        name: "Black Hoodie",
        category: "sweater",
        color: "black",
        style: ["casual", "streetwear"],
        warmth: 4,
        formality: 1,
        season: ["autumn", "winter"]
    },

    {
        id: 25,
        name: "Cream Knit Sweater",
        category: "sweater",
        color: "cream",
        style: ["minimal", "smart casual"],
        warmth: 4,
        formality: 2,
        season: ["autumn", "winter"]
    },

    {
        id: 26,
        name: "Navy Blue Sweater",
        category: "sweater",
        color: "navy",
        style: ["minimal", "smart casual"],
        warmth: 4,
        formality: 2,
        season: ["autumn", "winter"]
    },

    {
        id: 27,
        name: "Brown Oversized Hoodie",
        category: "sweater",
        color: "brown",
        style: ["casual", "streetwear"],
        warmth: 4,
        formality: 1,
        season: ["autumn", "winter"]
    },


    {
        id: 28,
        name: "Blue Denim Jacket",
        category: "jacket",
        color: "blue",
        style: ["casual", "streetwear"],
        warmth: 3,
        formality: 1,
        season: ["spring", "autumn"]
    },

    {
        id: 29,
        name: "Black Bomber Jacket",
        category: "jacket",
        color: "black",
        style: ["casual", "streetwear"],
        warmth: 4,
        formality: 1,
        season: ["autumn", "winter"]
    },

    {
        id: 30,
        name: "Black Minimal Jacket",
        category: "jacket",
        color: "black",
        style: ["casual", "minimal"],
        warmth: 4,
        formality: 2,
        season: ["autumn", "winter"]
    },

    {
        id: 31,
        name: "Beige Trench Coat",
        category: "jacket",
        color: "beige",
        style: ["formal", "minimal", "smart casual"],
        warmth: 4,
        formality: 3,
        season: ["autumn", "winter", "spring"]
    },

    {
        id: 32,
        name: "Green Utility Jacket",
        category: "jacket",
        color: "green",
        style: ["casual", "streetwear"],
        warmth: 3,
        formality: 1,
        season: ["spring", "autumn"]
    },



    {
        id: 33,
        name: "Black Casual Dress",
        category: "dress",
        color: "black",
        style: ["casual", "minimal"],
        warmth: 1,
        formality: 1,
        season: ["spring", "summer"]
    },

    {
        id: 34,
        name: "Blue Summer Dress",
        category: "dress",
        color: "blue",
        style: ["casual"],
        warmth: 1,
        formality: 1,
        season: ["summer"]
    },

    {
        id: 35,
        name: "White Linen Dress",
        category: "dress",
        color: "white",
        style: ["casual", "minimal"],
        warmth: 1,
        formality: 2,
        season: ["summer"]
    },

    {
        id: 36,
        name: "Floral Summer Dress",
        category: "dress",
        color: "floral",
        style: ["casual"],
        warmth: 1,
        formality: 1,
        season: ["spring", "summer"]
    },

    {
        id: 37,
        name: "Black Evening Dress",
        category: "dress",
        color: "black",
        style: ["formal", "minimal"],
        warmth: 2,
        formality: 3,
        season: ["autumn", "winter", "spring"]
    },

    {
        id: 38,
        name: "Black Midi Skirt",
        category: "skirt",
        color: "black",
        style: ["minimal", "smart casual"],
        warmth: 2,
        formality: 2,
        season: ["spring", "summer", "autumn"]
    },

    {
        id: 39,
        name: "Denim Mini Skirt",
        category: "skirt",
        color: "blue",
        style: ["casual", "streetwear"],
        warmth: 1,
        formality: 1,
        season: ["spring", "summer"]
    },

    {
        id: 40,
        name: "Beige Pleated Skirt",
        category: "skirt",
        color: "beige",
        style: ["minimal", "smart casual"],
        warmth: 1,
        formality: 2,
        season: ["spring", "summer"]
    },

    {
        id: 41,
        name: "White Sneakers",
        category: "shoes",
        color: "white",
        style: ["casual", "minimal"],
        warmth: 1,
        formality: 1,
        season: ["spring", "summer", "autumn"]
    },

    {
        id: 42,
        name: "Black Sneakers",
        category: "shoes",
        color: "black",
        style: ["casual", "streetwear", "minimal"],
        warmth: 1,
        formality: 1,
        season: ["spring", "summer", "autumn", "winter"]
    },

    {
        id: 43,
        name: "Grey Running Shoes",
        category: "shoes",
        color: "grey",
        style: ["casual", "sporty"],
        warmth: 1,
        formality: 1,
        season: ["spring", "summer", "autumn"]
    },


    {
        id: 44,
        name: "Black Formal Shoes",
        category: "shoes",
        color: "black",
        style: ["formal", "minimal"],
        warmth: 1,
        formality: 3,
        season: ["autumn", "winter", "spring"]
    },

    {
        id: 45,
        name: "Brown Leather Shoes",
        category: "shoes",
        color: "brown",
        style: ["formal", "smart casual"],
        warmth: 1,
        formality: 3,
        season: ["autumn", "winter", "spring"]
    },

    {
        id: 46,
        name: "Black Chelsea Boots",
        category: "shoes",
        color: "black",
        style: ["formal", "minimal", "smart casual"],
        warmth: 3,
        formality: 2,
        season: ["autumn", "winter"]
    },

    {
        id: 47,
        name: "Brown Ankle Boots",
        category: "shoes",
        color: "brown",
        style: ["casual", "smart casual"],
        warmth: 3,
        formality: 2,
        season: ["autumn", "winter"]
    },


    {
        id: 48,
        name: "Brown Leather Sandals",
        category: "shoes",
        color: "brown",
        style: ["casual", "minimal"],
        warmth: 1,
        formality: 1,
        season: ["summer"]
    },

    {
        id: 49,
        name: "Black Slides",
        category: "shoes",
        color: "black",
        style: ["casual", "streetwear"],
        warmth: 1,
        formality: 1,
        season: ["summer"]
    },

    {
        id: 50,
        name: "Red Oversized Shirt",
        category: "shirt",
        color: "red",
        style: ["casual", "streetwear"],
        warmth: 1,
        formality: 1,
        season: ["spring", "summer", "autumn"]
    }

];

if (typeof module !== "undefined") {
    module.exports = wardrobe;
}