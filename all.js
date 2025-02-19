document.addEventListener("DOMContentLoaded", () => {
    // Select all heart buttons
    const heartButtons = document.querySelectorAll(".heart-button");

    heartButtons.forEach(button => {
        button.addEventListener("click", () => {
            button.classList.toggle("active"); // Toggle red color
            button.innerHTML = button.classList.contains("active") ? "❤️" : "♡"; // Change text
        });
    });
});
