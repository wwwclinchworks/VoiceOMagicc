(function () {
  "use strict";
  function setTheme(dark) {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("vom-theme", dark ? "dark" : "light");
    document.querySelectorAll("#themeToggleBtn, #themeToggleBtnMobile").forEach(btn => {
      btn.innerHTML = dark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
      btn.title = dark ? "Switch to light mode" : "Switch to dark mode";
    });
  }
  window.toggleTheme = function () { setTheme(!document.documentElement.classList.contains("dark")); };
  window.toggleMobileMenu = function () { document.getElementById("mobileMenu")?.classList.toggle("hidden"); };
  window.closeVideoModal = function () { document.getElementById("videoModal")?.classList.add("hidden"); };
  window.openVideoModal = function (url) { const m=document.getElementById("videoModal"); const f=document.getElementById("videoIframe"); if(f&&url) f.src=url; if(m)m.classList.remove("hidden"); };
  window.closeResourceModal = function () { document.getElementById("resourceModal")?.classList.add("hidden"); };
  window.openResourceModal = function () { document.getElementById("resourceModal")?.classList.remove("hidden"); };
  window.handleFormSubmit = function (event) { if (event) event.preventDefault(); return false; };
  window.handleResourceSubmit = function (event) { if (event) event.preventDefault(); return false; };
  window.downloadSpeakerKit = function (url) { if (typeof url === "string" && /^https:\/\//.test(url)) location.href=url; };
  document.addEventListener("DOMContentLoaded", function () {
    const saved=localStorage.getItem("vom-theme"); setTheme(saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  });
})();
