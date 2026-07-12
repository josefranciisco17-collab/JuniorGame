"use strict";

const recordsButton = document.getElementById("recordsButton");
const settingsButton = document.getElementById("settingsButton");

const comingSoonModal = document.getElementById("comingSoonModal");
const closeModalButton = document.getElementById("closeModalButton");
const acceptModalButton = document.getElementById("acceptModalButton");

function openComingSoonModal() {
  comingSoonModal.classList.remove("hidden");
}

function closeComingSoonModal() {
  comingSoonModal.classList.add("hidden");
}

recordsButton.addEventListener("click", openComingSoonModal);
settingsButton.addEventListener("click", openComingSoonModal);

closeModalButton.addEventListener("click", closeComingSoonModal);
acceptModalButton.addEventListener("click", closeComingSoonModal);

comingSoonModal.addEventListener("click", (event) => {
  if (event.target === comingSoonModal) {
    closeComingSoonModal();
  }
});
