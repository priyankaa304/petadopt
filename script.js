// Short single-page app script implementing requested behavior
// --------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const show = id => {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    const el = document.getElementById(id); if (el) el.style.display = "";
    document.querySelectorAll(".main-nav .nav-link").forEach(a => a.classList.toggle("active", a.dataset.target === id));
    if (id === "login") clearLoginInputs();
    if (id === "pets") updatePetCount();
    history.replaceState(null, "", "#" + id);
  };
     
    // Function to calculate and display the current number of pets
    const updatePetCount = () => {
        const totalPets = document.querySelectorAll("#pets-container .pet-card").length;
        document.getElementById("pet-count").textContent = `(${totalPets} animals available)`;
    };


  // init
  show(location.hash.replace("#", "") || "index");

  // nav links
  document.querySelectorAll(".main-nav .nav-link").forEach(a => a.addEventListener("click", e => { e.preventDefault(); show(a.dataset.target); }));

  // Explore -> login
  document.getElementById("explore-btn").addEventListener("click", () => show("login"));

  // back / home
  document.querySelectorAll("[data-back]").forEach(b => b.addEventListener("click", () => show(b.getAttribute("data-back"))));
  document.querySelectorAll("[data-home]").forEach(b => b.addEventListener("click", () => show("index")));

  // clear login inputs
  function clearLoginInputs() {
    const e = document.getElementById("login-email"), p = document.getElementById("login-password");
    if (e) e.value = ""; if (p) p.value = "";
  }

  // login: save user & go to pets
  document.getElementById("login-form").addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    if (!email) return alert("Email required");
    localStorage.setItem("pf_user_email", email);
    localStorage.setItem("pf_user_name", email.split("@")[0]);
    document.getElementById("profile-name").textContent = localStorage.getItem("pf_user_name");
    document.getElementById("profile-email").textContent = localStorage.getItem("pf_user_email");
    show("pets");
  });

  // logout: clear ALL user data
  document.getElementById("logout").addEventListener("click", () => {
    localStorage.clear();
    clearLoginInputs();
    document.getElementById("profile-name").textContent = "User";
    document.getElementById("profile-email").textContent = "user@example.com";
    show("index");
  });

    // pet grid actions delegation
    document.getElementById("pets-container").addEventListener("click", e => {
        const card = e.target.closest(".pet-card"); if (!card) return;
        const pet = card.dataset.id;
        if (e.target.matches(".view")) {
            show('pet-details-' + pet.toLowerCase());
        }
    if (e.target.matches(".adopt")) {
      document.getElementById("adopt-pet-hidden").value = pet;
      document.getElementById("adopt-display").textContent = pet;
      show("adopt");
    }
    if (e.target.matches(".like")) {
      const likes = JSON.parse(localStorage.getItem("pf_likes") || "[]");
      const idx = likes.indexOf(pet);
      if (idx === -1) { likes.push(pet); e.target.textContent = "♥"; } else { likes.splice(idx, 1); e.target.textContent = "♡"; }
      localStorage.setItem("pf_likes", JSON.stringify(likes));
    }
  });

  // adopt from details page
  document.querySelectorAll('.pet-box .adopt').forEach(button => {
    button.addEventListener('click', () => {
        const pet = button.dataset.pet;
        document.getElementById("adopt-pet-hidden").value = pet;
        document.getElementById("adopt-display").textContent = pet;
        show("adopt");
    });
  });


  // adopt form submit -> save & go to submit
  document.getElementById("adopt-form").addEventListener("submit", e => {
    e.preventDefault();
    const pet = document.getElementById("adopt-pet-hidden").value || "Unknown";
    const name = document.getElementById("adopt-name").value.trim();
    const email = document.getElementById("adopt-email").value.trim();
    const phone = document.getElementById("adopt-phone").value.trim();
    const reason = document.getElementById("adopt-reason").value.trim();
    if (!name || !email || !phone || !reason) return alert("Complete all fields");
    const arr = JSON.parse(localStorage.getItem("pf_submissions") || "[]");
    arr.push({ pet, name, email, phone, reason, status: "Pending", date: new Date().toISOString() });
    localStorage.setItem("pf_submissions", JSON.stringify(arr));
    document.getElementById("adopt-form").reset();
    document.getElementById("adopt-pet-hidden").value = "";
    document.getElementById("adopt-display").textContent = "—";
    show("submit");
  });

  // profile subpages open & render
  document.querySelectorAll(".profile-link").forEach(b => {
    b.addEventListener("click", () => {
      const tgt = b.dataset.target;
      if (!tgt) return;
      show(tgt);
      if (tgt === "adopted") renderAdopted();
      if (tgt === "prev-adopted") renderPrev();
      if (tgt === "liked") renderLikes();
    });
  });

  // render functions
  function renderAdopted() {
    const list = JSON.parse(localStorage.getItem("pf_submissions") || "[]");
    const out = list.length ? list.map((s, i) => `<div class="list-item">${s.pet} — ${s.name} <span class="muted">(${new Date(s.date).toLocaleDateString()})</span>
      <div>Status: <strong>${s.status}</strong> ${s.status !== "Received" ? ` <button data-i="${i}" class="mark">Mark Received</button>` : ""}</div></div>`).join("") : "<div class='muted'>No adoption requests</div>";
    document.getElementById("adopted-list").innerHTML = out;
    document.querySelectorAll(".mark").forEach(btn => btn.addEventListener("click", () => {
      const i = +btn.dataset.i; const arr = JSON.parse(localStorage.getItem("pf_submissions") || "[]");
      if (arr[i]) { arr[i].status = "Received"; localStorage.setItem("pf_submissions", JSON.stringify(arr)); renderAdopted(); }
    }));
  }

  function renderPrev() {
    const list = JSON.parse(localStorage.getItem("pf_submissions") || "[]");
    document.getElementById("prev-list").innerHTML = list.length ? list.map(s => `<div class="list-item">${s.pet} — ${s.name} <span class="muted">(${new Date(s.date).toLocaleDateString()})</span></div>`).join("") : "<div class='muted'>No previous adoptions</div>";
  }

  function renderLikes() {
    const likes = JSON.parse(localStorage.getItem("pf_likes") || "[]");
    document.getElementById("likes-list").innerHTML = likes.length ? likes.map(p => `<div class="list-item">${p}</div>`).join("") : "<div class='muted'>No liked pets</div>";
  }
     
  // category filter
  document.querySelectorAll(".cat-btn").forEach(b => b.addEventListener("click", () => {
    const c = b.dataset.cat; 
    let visibleCount = 0;
     
    document.querySelectorAll(".pet-card").forEach(pc => {
        if (c === "all" || pc.dataset.type === c) {
            pc.style.display = "";
            visibleCount++;
        } else {
            pc.style.display = "none";
        }
    });

    document.getElementById("pet-count").textContent = `(${visibleCount} animals available)`;
  }));

  // update profile header if user present
  if (localStorage.getItem("pf_user_name")) {
    document.getElementById("profile-name").textContent = localStorage.getItem("pf_user_name");
    document.getElementById("profile-email").textContent = localStorage.getItem("pf_user_email");
  }

  // data-target buttons (Adopt Now etc.)
  document.querySelectorAll("[data-target]").forEach(el => el.addEventListener("click", e => { e.preventDefault(); show(el.dataset.target); }));
     
    // Initial pet count update
    updatePetCount(); 
});