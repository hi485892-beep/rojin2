// =========================================================
// STARVISION NEWSROOM — shared behaviour
// Expects window.STARVISION_ARTICLE = {id, viewSeed, commentSeed}
// to be set inline on article pages before this file loads.
// =========================================================
(function () {
  "use strict";

  function fmt(n) {
    return Number(n).toLocaleString("ko-KR");
  }

  // ---------- view counter (works on index + article pages) ----------
  document.querySelectorAll("[data-view-seed]").forEach(function (el) {
    var id = el.getAttribute("data-article-id");
    var seed = parseInt(el.getAttribute("data-view-seed"), 10) || 0;
    var key = "sv_view_" + id;
    var sessionKey = "sv_seen_" + id;
    var stored = parseInt(localStorage.getItem(key), 10);
    var views = isNaN(stored) ? seed : stored;

    if (el.hasAttribute("data-count-this-view") && !sessionStorage.getItem(sessionKey)) {
      views += 1;
      try {
        localStorage.setItem(key, views);
      } catch (e) {}
      sessionStorage.setItem(sessionKey, "1");
    }
    el.textContent = fmt(views);
  });

  // ---------- comment count badges on index / related cards ----------
  document.querySelectorAll("[data-comment-seed]").forEach(function (el) {
    var id = el.getAttribute("data-article-id");
    var seed = parseInt(el.getAttribute("data-comment-seed"), 10) || 0;
    var extra = 0;
    try {
      extra = JSON.parse(localStorage.getItem("sv_comments_" + id) || "[]").length;
    } catch (e) {}
    el.textContent = fmt(seed + extra);
  });

  // ---------- full comment section on article pages ----------
  var ART = window.STARVISION_ARTICLE;
  if (ART) {
    var listEl = document.querySelector("[data-comment-list]");
    var countEl = document.querySelector("[data-comment-count]");
    var form = document.querySelector("[data-comment-form]");
    var commentKey = "sv_comments_" + ART.id;

    function loadUserComments() {
      try {
        return JSON.parse(localStorage.getItem(commentKey) || "[]");
      } catch (e) {
        return [];
      }
    }
    function saveUserComments(arr) {
      try {
        localStorage.setItem(commentKey, JSON.stringify(arr));
      } catch (e) {}
    }
    function refreshCount() {
      if (countEl) countEl.textContent = fmt(ART.commentSeed + loadUserComments().length);
    }
    function renderComment(c, isNew) {
      var li = document.createElement("li");
      li.className = "comment-item" + (isNew ? " is-new" : "");
      var avatar = document.createElement("div");
      avatar.className = "comment-avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = (c.name || "익명").trim().charAt(0);

      var body = document.createElement("div");
      body.className = "comment-body";

      var meta = document.createElement("div");
      meta.className = "comment-meta";
      var nameSpan = document.createElement("span");
      nameSpan.className = "comment-name";
      nameSpan.textContent = c.name || "익명";
      var timeSpan = document.createElement("span");
      timeSpan.className = "comment-time";
      timeSpan.textContent = c.time || "방금 전";
      meta.appendChild(nameSpan);
      meta.appendChild(timeSpan);

      var text = document.createElement("p");
      text.className = "comment-text";
      text.textContent = c.text;

      var likeBtn = document.createElement("button");
      likeBtn.type = "button";
      likeBtn.className = "comment-like";
      likeBtn.innerHTML = '\u2764 <span>' + (c.likes || 0) + "</span>";

      body.appendChild(meta);
      body.appendChild(text);
      body.appendChild(likeBtn);
      li.appendChild(avatar);
      li.appendChild(body);
      return li;
    }

    // render any locally-saved comments above the static seed comments
    loadUserComments().forEach(function (c) {
      listEl && listEl.insertBefore(renderComment(c), listEl.firstChild);
    });
    refreshCount();

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var nameInput = form.querySelector('[name="name"]');
        var textInput = form.querySelector('[name="text"]');
        var name = nameInput.value.trim() || "익명";
        var text = textInput.value.trim();
        if (!text) {
          textInput.focus();
          return;
        }
        var c = { name: name, text: text, time: "방금 전", likes: 0 };
        var arr = loadUserComments();
        arr.push(c);
        saveUserComments(arr);
        listEl.insertBefore(renderComment(c, true), listEl.firstChild);
        refreshCount();
        textInput.value = "";
        nameInput.value = "";
        nameInput.focus();
      });
    }

    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".comment-like");
      if (!btn || btn.disabled) return;
      var span = btn.querySelector("span");
      span.textContent = parseInt(span.textContent, 10) + 1;
      btn.disabled = true;
    });
  }
})();
