const GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Harem",
  "Historical",
  "Horror",
  "Isekai",
  "Magic",
  "Martial Arts",
  "Mystery",
  "Romance",
  "School Life",
  "Sci-Fi",
  "Slice of Life",
  "Supernatural",
  "Thriller"
];

const defaultCover =
  "https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&w=900&q=80";

let users = JSON.parse(localStorage.getItem("sf_users")) || [];
let stories = JSON.parse(localStorage.getItem("sf_stories")) || [];
let currentUser = JSON.parse(localStorage.getItem("sf_current_user")) || null;

function saveData() {
  localStorage.setItem("sf_users", JSON.stringify(users));
  localStorage.setItem("sf_stories", JSON.stringify(stories));
  localStorage.setItem("sf_current_user", JSON.stringify(currentUser));
}

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(date));
}

function escapeHTML(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showHome() {
  const latest = [...stories]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  document.getElementById("app").innerHTML = `
    <section class="hero">
      <h1>Temukan dunia baru dalam setiap halaman.</h1>
      <p>
        Spaceless Find adalah tempat untuk membaca dan membagikan
        berbagai karya light novel dari banyak genre.
      </p>
      <button class="primary" onclick="showLibrary()">Jelajahi Novel</button>
    </section>

    <section class="container">
      <h2 class="section-title">Novel Terbaru</h2>
      ${
        latest.length
          ? `<div class="cards">${latest.map(storyCard).join("")}</div>`
          : `<div class="empty">Belum ada novel. Jadilah penulis pertama!</div>`
      }
    </section>
  `;

  updateUserUI();
}

function showLibrary() {
  document.getElementById("app").innerHTML = `
    <section class="container">
      <h1>Library Novel</h1>

      <div class="search-area">
        <div class="search-row">
          <input
            id="searchInput"
            type="search"
            placeholder="Cari berdasarkan judul novel..."
            oninput="filterStories()"
          >
          <button class="secondary" onclick="clearSearch()">Reset</button>
        </div>

        <br>

        <strong>Filter genre:</strong>
        <div class="genre-list">
          ${GENRES.map(
            genre => `
              <button class="genre-button" onclick="filterByGenre('${genre}')">
                ${genre}
              </button>
            `
          ).join("")}
        </div>
      </div>

      <div id="libraryResults" class="cards"></div>
    </section>
  `;

  renderStories(stories);
  updateUserUI();
}

function storyCard(story) {
  const isOwner = currentUser && story.authorId === currentUser.id;

  return `
    <article class="story-card">
      <img src="${story.cover || defaultCover}" alt="Cover ${escapeHTML(story.title)}">

      <div class="story-card-body">
        <h3>${escapeHTML(story.title)}</h3>

        <div class="story-genres">
          ${story.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join("")}
        </div>

        <p>${escapeHTML(story.synopsis).slice(0, 150)}...</p>
        <small>Dibuat: ${formatDate(story.createdAt)}</small>
      </div>

      <div class="story-card-actions">
        <button class="primary" onclick="openStory('${story.id}')">
          Baca
        </button>

        ${
          isOwner
            ? `<button class="secondary" onclick="editStory('${story.id}')">
                Edit
              </button>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderStories(list) {
  const results = document.getElementById("libraryResults");

  if (!results) return;

  results.innerHTML = list.length
    ? list.map(storyCard).join("")
    : `<div class="empty">Novel tidak ditemukan.</div>`;
}

function filterStories() {
  const keyword = document
    .getElementById("searchInput")
    .value
    .toLowerCase()
    .trim();

  const filtered = stories.filter(story =>
    story.title.toLowerCase().includes(keyword)
  );

  renderStories(filtered);
}

function filterByGenre(genre) {
  const input = document.getElementById("searchInput");

  if (input) input.value = genre;

  const filtered = stories.filter(story =>
    story.genres.includes(genre)
  );

  renderStories(filtered);
}

function clearSearch() {
  const input = document.getElementById("searchInput");

  if (input) input.value = "";

  renderStories(stories);
}

function openStory(storyId) {
  const story = stories.find(item => item.id === storyId);

  if (!story) return;

  document.getElementById("app").innerHTML = `
    <section class="container">
      <button class="secondary" onclick="showLibrary()">← Kembali</button>

      <article class="story-detail">
        <div class="story-header">
          <img src="${story.cover || defaultCover}" alt="${escapeHTML(story.title)}">

          <div class="story-header-info">
            <h1>${escapeHTML(story.title)}</h1>

            <div class="story-genres">
              ${story.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join("")}
            </div>

            <p>${escapeHTML(story.synopsis)}</p>
            <small>Dibuat pada ${formatDate(story.createdAt)}</small>
          </div>
        </div>

        <h2>Daftar Chapter</h2>
        <div class="chapter-list">
          ${
            story.chapters.length
              ? story.chapters
                  .sort((a, b) => a.number - b.number)
                  .map(chapter => chapterItem(story, chapter))
                  .join("")
              : `<div class="empty">Belum ada chapter.</div>`
          }
        </div>
      </article>
    </section>
  `;

  updateUserUI();
}

function chapterItem(story, chapter) {
  const isOwner = currentUser && story.authorId === currentUser.id;

  return `
    <div class="chapter-item">
      <div>
        <strong>Chapter ${chapter.number}: ${escapeHTML(chapter.title)}</strong>
        <small>Dibuat: ${formatDate(chapter.createdAt)}</small>
      </div>

      <div>
        <button class="primary" onclick="readChapter('${story.id}', '${chapter.id}')">
          Baca
        </button>

        ${
          isOwner
            ? `<button class="secondary"
                onclick="editChapter('${story.id}', '${chapter.id}')">
                Edit
              </button>`
            : ""
        }
      </div>
    </div>
  `;
}

function readChapter(storyId, chapterId) {
  const story = stories.find(item => item.id === storyId);
  const chapter = story.chapters.find(item => item.id === chapterId);

  document.getElementById("app").innerHTML = `
    <section class="container">
      <button class="secondary" onclick="openStory('${story.id}')">← Kembali</button>

      <article class="chapter-reader">
        <small>${escapeHTML(story.title)}</small>
        <h1>Chapter ${chapter.number}: ${escapeHTML(chapter.title)}</h1>
        <small>Dibuat: ${formatDate(chapter.createdAt)}</small>

        <div class="chapter-reader-content">
          ${chapter.content || "<p>Chapter ini masih kosong.</p>"}
        </div>
      </article>
    </section>
  `;

  updateUserUI();
}

function showEditor() {
  if (!currentUser) {
    alert("Silakan login terlebih dahulu untuk membuka editor.");
    openModal("loginModal");
    return;
  }

  const myStories = stories.filter(
    story => story.authorId === currentUser.id
  );

  document.getElementById("app").innerHTML = `
    <section class="container">
      <div class="search-row">
        <div>
          <h1>Editor Cerita</h1>
          <p>Kelola novel dan chapter buatanmu.</p>
        </div>
        <button class="primary" onclick="openStoryForm()">+ Tambah Novel</button>
      </div>

      <br>

      ${
        myStories.length
          ? `<div class="cards">${myStories.map(editorCard).join("")}</div>`
          : `<div class="empty">
              Kamu belum memiliki novel.
              <br><br>
              <button class="primary" onclick="openStoryForm()">Buat Novel Pertama</button>
            </div>`
      }
    </section>
  `;

  updateUserUI();
}

function editorCard(story) {
  return `
    <article class="story-card">
      <img src="${story.cover || defaultCover}" alt="${escapeHTML(story.title)}">

      <div class="story-card-body">
        <h3>${escapeHTML(story.title)}</h3>
        <p>${story.chapters.length} chapter</p>
        <small>Diperbarui: ${formatDate(story.updatedAt)}</small>
      </div>

      <div class="story-card-actions">
        <button class="secondary" onclick="editStory('${story.id}')">Edit Novel</button>
        <button class="primary" onclick="openChapterForm('${story.id}')">+ Chapter</button>
      </div>
    </article>
  `;
}

function openStoryForm(story = null) {
  const options = document.getElementById("genreOptions");

  document.getElementById("storyModalTitle").textContent =
    story ? "Edit Novel" : "Tambah Novel";

  document.getElementById("storyId").value = story ? story.id : "";
  document.getElementById("storyTitle").value = story ? story.title : "";
  document.getElementById("storySynopsis").value = story ? story.synopsis : "";
  document.getElementById("storyCover").value = story ? story.cover : "";

  options.innerHTML = GENRES.map(genre => `
    <label class="genre-option">
      <input
        type="checkbox"
        name="storyGenre"
        value="${genre}"
        ${story && story.genres.includes(genre) ? "checked" : ""}
      >
      ${genre}
    </label>
  `).join("");

  openModal("storyModal");
}

function editStory(storyId) {
  const story = stories.find(item => item.id === storyId);

  if (!story || story.authorId !== currentUser.id) return;

  openStoryForm(story);
}

function saveStory(event) {
  event.preventDefault();

  const selectedGenres = [...document.querySelectorAll(
    'input[name="storyGenre"]:checked'
  )].map(input => input.value);

  if (selectedGenres.length === 0) {
    alert("Pilih setidaknya satu genre.");
    return;
  }

  const id = document.getElementById("storyId").value;
  const now = new Date().toISOString();

  if (id) {
    const story = stories.find(item => item.id === id);

    story.title = document.getElementById("storyTitle").value.trim();
    story.synopsis = document.getElementById("storySynopsis").value.trim();
    story.cover = document.getElementById("storyCover").value.trim();
    story.genres = selectedGenres;
    story.updatedAt = now;
  } else {
    stories.push({
      id: createId(),
      authorId: currentUser.id,
      title: document.getElementById("storyTitle").value.trim(),
      synopsis: document.getElementById("storySynopsis").value.trim(),
      cover: document.getElementById("storyCover").value.trim(),
      genres: selectedGenres,
      chapters: [],
      createdAt: now,
      updatedAt: now
    });
  }

  saveData();
  closeModal("storyModal");
  showEditor();
}

function openChapterForm(storyId, chapter = null) {
  const story = stories.find(item => item.id === storyId);

  if (!story || story.authorId !== currentUser.id) return;

  document.getElementById("chapterModalTitle").textContent =
    chapter ? "Edit Chapter" : "Tambah Chapter";

  document.getElementById("chapterId").value = chapter ? chapter.id : "";
  document.getElementById("chapterStoryId").value = storyId;
  document.getElementById("chapterTitle").value = chapter ? chapter.title : "";
  document.getElementById("chapterContent").innerHTML =
    chapter ? chapter.content : "";

  document.getElementById("autoSaveStatus").textContent =
    "Perubahan otomatis tersimpan di browser.";

  openModal("chapterModal");
}

function editChapter(storyId, chapterId) {
  const story = stories.find(item => item.id === storyId);
  const chapter = story.chapters.find(item => item.id === chapterId);

  openChapterForm(storyId, chapter);
}

function saveChapter(event) {
  event.preventDefault();

  const storyId = document.getElementById("chapterStoryId").value;
  const chapterId = document.getElementById("chapterId").value;
  const story = stories.find(item => item.id === storyId);
  const now = new Date().toISOString();

  const title = document.getElementById("chapterTitle").value.trim();
  const content = document.getElementById("chapterContent").innerHTML;

  if (chapterId) {
    const chapter = story.chapters.find(item => item.id === chapterId);

    chapter.title = title;
    chapter.content = content;
    chapter.updatedAt = now;
  } else {
    story.chapters.push({
      id: createId(),
      number: story.chapters.length + 1,
      title,
      content,
      createdAt: now,
      updatedAt: now
    });
  }

  story.updatedAt = now;

  saveData();
  closeModal("chapterModal");
  showEditor();
}

let autoSaveTimer;

function autoSaveChapter() {
  clearTimeout(autoSaveTimer);

  document.getElementById("autoSaveStatus").textContent =
    "Menyimpan perubahan...";

  autoSaveTimer = setTimeout(() => {
    const storyId = document.getElementById("chapterStoryId").value;
    const chapterId = document.getElementById("chapterId").value;

    if (!storyId || !chapterId) {
      document.getElementById("autoSaveStatus").textContent =
        "Draft tersimpan sementara.";
      return;
    }

    const story = stories.find(item => item.id === storyId);
    const chapter = story.chapters.find(item => item.id === chapterId);

    chapter.title = document.getElementById("chapterTitle").value.trim();
    chapter.content = document.getElementById("chapterContent").innerHTML;
    chapter.updatedAt = new Date().toISOString();

    story.updatedAt = chapter.updatedAt;

    saveData();

    document.getElementById("autoSaveStatus").textContent =
      "Perubahan tersimpan otomatis.";
  }, 600);
}

function formatText(command, value = null) {
  document.execCommand(command, false, value);
  document.getElementById("chapterContent").focus();
  autoSaveChapter();
}

function register(event) {
  event.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;

  if (users.some(user => user.email === email)) {
    alert("Email sudah terdaftar.");
    return;
  }

  const user = {
    id: createId(),
    name,
    email,
    password
  };

  users.push(user);
  currentUser = user;

  saveData();
  closeModal("registerModal");
  updateUserUI();
  showEditor();

  alert("Registrasi berhasil.");
}

function login(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const user = users.find(
    item => item.email === email && item.password === password
  );

  if (!user) {
    alert("Email atau password salah.");
    return;
  }

  currentUser = user;
  saveData();

  closeModal("loginModal");
  updateUserUI();
  showHome();
}

function logout() {
  currentUser = null;
  saveData();
  updateUserUI();
  showHome();
}

function updateUserUI() {
  const userLabel = document.getElementById("userLabel");
  const loginButton = document.getElementById("loginButton");
  const logoutButton = document.getElementById("logoutButton");

  if (currentUser) {
    userLabel.textContent = `Halo, ${currentUser.name}`;
    loginButton.classList.add("hidden");
    logoutButton.classList.remove("hidden");
  } else {
    userLabel.textContent = "";
    loginButton.classList.remove("hidden");
    logoutButton.classList.add("hidden");
  }
}

function openModal(id) {
  document.getElementById(id).classList.add("show");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("show");
}

function switchModal(from, to) {
  closeModal(from);
  openModal(to);
}

window.addEventListener("click", event => {
  if (event.target.classList.contains("modal")) {
    event.target.classList.remove("show");
  }
});

showHome();
