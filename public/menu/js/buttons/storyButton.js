// public/menu/js/buttons/storyButton.js
window.StoryButton = {
  handleClick(username) {
    console.log("[HISTORIA] Click por:", username);
    // Lector de historia
    window.location.href = "/story/index.html";
  },
};
