(function () {
  "use strict";

  function setTheme(dark) {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("vom-theme", dark ? "dark" : "light");
    document.querySelectorAll("#themeToggleBtn, #themeToggleBtnMobile").forEach(btn => {
      btn.innerHTML = dark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
      btn.title = dark ? "Switch to light mode" : "Switch to dark mode";
    });
    window.dispatchEvent(new Event("vom-theme-changed"));
  }

  window.toggleTheme = function () {
    setTheme(!document.documentElement.classList.contains("dark"));
  };

  window.toggleMobileMenu = function () {
    const menu = document.getElementById("mobileMenu");
    if (menu) menu.classList.toggle("hidden");
  };

  window.closeVideoModal = function () {
    const el = document.getElementById("videoModal");
    if (el) el.classList.add("hidden");
  };
  window.openVideoModal = function () {
    const el = document.getElementById("videoModal");
    if (el) el.classList.remove("hidden");
  };
  window.playNativeVideo = function () {};

  window.openResourceModal = function () {
    const el = document.getElementById("resourceModal");
    if (el) el.classList.remove("hidden");
  };
  window.closeResourceModal = function () {
    const el = document.getElementById("resourceModal");
    if (el) el.classList.add("hidden");
  };

  window.handleFormSubmit = function (event) {
    if (event) event.preventDefault();
    const form = event && event.target;
    const data = form ? new FormData(form) : null;
    const name = data?.get("name") || "";
    const message = data?.get("message") || "Hello, I would like to contact Voice-O-Magic.";
    const phone = "919999999999"; // Replace with the official WhatsApp number.
    const url = "https://wa.me/" + phone + "?text=" + encodeURIComponent("Hello Voice-O-Magic,\n\n" + (name ? "Name: " + name + "\n" : "") + message);
    window.open(url, "_blank", "noopener");
    return false;
  };

  window.handleResourceSubmit = function (event) {
    if (event) event.preventDefault();
    const form = event && event.target;
    const data = form ? new FormData(form) : null;
    const email = data?.get("email") || "";
    alert(email ? "Thank you. Your resource request has been recorded." : "Please enter your email.");
    if (form) form.reset();
    return false;
  };

  window.downloadSpeakerKit = function () {
    alert("Speaker Kit download can be connected to your final PDF/resource URL.");
  };

  function updateRequestedAcademyCopy() {
    const replacements = [
      ["Youth Academy & Phonetics", "Youth Academy & Confidence Skills"],
      ["Phonetics & Foundations", "Foundations of Creating Content & Writing"]
    ];

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) textNodes.push(node);

    textNodes.forEach(textNode => {
      let value = textNode.nodeValue;
      replacements.forEach(([from, to]) => {
        value = value.split(from).join(to);
      });
      if (value !== textNode.nodeValue) textNode.nodeValue = value;
    });
  }

  function addTestimonialsNavigation() {
    const desktopNav = document.querySelector('nav[aria-label="Main Navigation"]');
    if (desktopNav && !desktopNav.querySelector('a[href="testimonials.html"]')) {
      const link = document.createElement("a");
      link.href = "testimonials.html";
      link.className = "nav-btn px-4 py-2 rounded-full text-sm font-medium transition";
      link.textContent = "Testimonials";
      desktopNav.appendChild(link);
    }

    const mobileMenu = document.getElementById("mobileMenu");
    if (mobileMenu && !mobileMenu.querySelector('a[href="testimonials.html"]')) {
      const link = document.createElement("a");
      link.href = "testimonials.html";
      link.className = "block w-full text-left px-4 py-3 rounded-lg text-sec hover:bg-gold-light hover:text-gold-hover font-medium transition";
      link.textContent = "Testimonials";
      mobileMenu.insertBefore(link, mobileMenu.querySelector('a[href="contact.html"]'));
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const saved = localStorage.getItem("vom-theme");
    const dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(dark);
    updateRequestedAcademyCopy();
    addTestimonialsNavigation();
  });
})();
