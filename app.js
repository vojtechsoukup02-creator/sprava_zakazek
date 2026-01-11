/* ===== MODELS ===== */
class Location {
  constructor(name, lat, lon) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.lat = Number(lat);
    this.lon = Number(lon);
    this.createdAt = new Date();
  }
}

class Job {
  constructor(locationId, type, title, description) {
    this.id = crypto.randomUUID();
    this.locationId = locationId;
    this.type = type;
    this.title = title;
    this.description = description;
    this.status = "plánováno";
    this.createdAt = new Date();
  }
}

class Storage {
  static save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }
  static load(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  }
}

/* ===== DATA ===== */
let locations = Storage.load("locations");
let jobs = Storage.load("jobs");

/* ===== UI ===== */
const locName = document.getElementById("locName");
const locList = document.getElementById("locations");

const jobLocation = document.getElementById("jobLocation");
const jobType = document.getElementById("jobType");
const jobTitle = document.getElementById("jobTitle");
const jobDesc = document.getElementById("jobDesc");
const jobList = document.getElementById("jobs");

const filterType = document.getElementById("filterType");

/* ===== MAP ===== */
const map = L.map("map").setView([49.8175, 15.4730], 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

let markers = [];
let clickMarker = null;

map.on("click", e => {
  const { lat, lng } = e.latlng;

  if (clickMarker) map.removeLayer(clickMarker);
  clickMarker = L.marker([lat, lng]).addTo(map);

  locName.placeholder = `Klikli jste na: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  locName.dataset.lat = lat;
  locName.dataset.lon = lng;
});

/* ===== RENDER ===== */
function renderLocations() {
  locList.innerHTML = "";
  jobLocation.innerHTML = '<option value="">-- Vyberte lokalitu --</option>';

  locations.forEach(l => {
    const li = document.createElement("li");
    li.classList.add("accordion");

    li.innerHTML = `
      <div class="accordion-header">
        <span class="loc-title">${l.name}</span>
        <span class="accordion-toggle">▼</span>
      </div>

      <div class="accordion-content">
        Souřadnice: ${l.lat.toFixed(5)}, ${l.lon.toFixed(5)}<br><br>

        <input class="edit-loc-name" value="${l.name}" style="display:none">

        <button onclick="toggleEditLocation('${l.id}', this)">Upravit</button>
        <button onclick="deleteLocation('${l.id}')">Smazat</button>
      </div>
    `;

    locList.appendChild(li);

    const opt = document.createElement("option");
    opt.value = l.id;
    opt.textContent = l.name;
    jobLocation.appendChild(opt);
  });

  Storage.save("locations", locations);
  renderMap();
  bindAccordions();
}

function renderJobs() {
  jobList.innerHTML = "";
  const filter = filterType.value;

  jobs
    .filter(j => !filter || j.type === filter)
    .forEach(j => {
      const loc = locations.find(l => l.id === j.locationId);

      const li = document.createElement("li");
      li.classList.add("accordion");

      li.innerHTML = `
        <div class="accordion-header">
          <span class="job-title">${j.title}</span> (${j.type}) – ${loc?.name || "?"}
          <span class="accordion-toggle">▼</span>
        </div>

        <div class="accordion-content">
          <input class="edit-job-title" value="${j.title}" style="display:none">
          <textarea class="edit-job-desc" style="display:none">${j.description}</textarea>

          <p class="job-desc">${j.description}</p>
          Lokalita: ${loc?.name || "?"}<br>
          Stav: ${j.status}<br><br>

          <button onclick="changeStatus('${j.id}')">Změnit stav</button>
          <button onclick="toggleEditJob('${j.id}', this)">Upravit</button>
          <button onclick="deleteJob('${j.id}')">Smazat</button>
        </div>
      `;

      jobList.appendChild(li);
    });

  Storage.save("jobs", jobs);
  bindAccordions();
}

/* ===== ACCORDION ===== */
function bindAccordions() {
  document.querySelectorAll(".accordion-header").forEach(h => {
    h.onclick = () => h.parentElement.classList.toggle("open");
  });
}

/* ===== MAP ===== */
function buildLocationPopup(location) {
  const locationJobs = jobs.filter(j => j.locationId === location.id);

  if (!locationJobs.length) {
    return `<b>${location.name}</b><br>Žádné zakázky`;
  }

  return `
    <b>${location.name}</b><hr>
    ${locationJobs.map(j =>
      `• <b>${j.title}</b> (${j.type}) – <i>${j.status}</i>`
    ).join("<br>")}
  `;
}

function renderMap() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  locations.forEach(l => {
    if (l.lat == null || l.lon == null) return;

    const marker = L.marker([l.lat, l.lon])
      .addTo(map)
      .bindPopup(buildLocationPopup(l));

    marker.on("click", () => map.setView([l.lat, l.lon], 13));
    markers.push(marker);
  });
}

/* ===== ACTIONS ===== */
document.getElementById("addLocation").onclick = () => {
  const name = locName.value.trim();
  const lat = locName.dataset.lat;
  const lon = locName.dataset.lon;

  if (!name || !lat || !lon) {
    alert("Vyplňte název a klikněte na mapu");
    return;
  }

  locations.push(new Location(name, lat, lon));

  locName.value = "";
  locName.placeholder = "Název lokality";
  delete locName.dataset.lat;
  delete locName.dataset.lon;

  if (clickMarker) map.removeLayer(clickMarker);
  clickMarker = null;

  renderLocations();
};

document.getElementById("addJob").onclick = () => {
  if (!jobLocation.value || !jobTitle.value.trim()) {
    alert("Vyberte lokalitu a zadejte krátký popis");
    return;
  }

  jobs.push(
    new Job(
      jobLocation.value,
      jobType.value,
      jobTitle.value.trim(),
      jobDesc.value.trim()
    )
  );

  jobTitle.value = "";
  jobDesc.value = "";
  jobLocation.value = "";
  jobType.value = "";

  renderJobs();
  renderMap();
};

filterType.onchange = renderJobs;

/* ===== INLINE EDIT ===== */
window.toggleEditLocation = (id, btn) => {
  const loc = locations.find(l => l.id === id);
  const box = btn.parentElement;
  const input = box.querySelector(".edit-loc-name");
  const title = box.parentElement.querySelector(".loc-title");

  const editing = input.style.display === "block";

  if (editing) {
    loc.name = input.value.trim() || loc.name;
    renderLocations();
  } else {
    input.style.display = "block";
    title.style.display = "none";
    btn.textContent = "Uložit";
  }
};

window.toggleEditJob = (id, btn) => {
  const job = jobs.find(j => j.id === id);
  const li = btn.closest(".accordion");
  const box = btn.parentElement;

  const titleInput = box.querySelector(".edit-job-title");
  const descInput = box.querySelector(".edit-job-desc");
  const titleSpan = li.querySelector(".job-title");
  const descP = box.querySelector(".job-desc");

  const editing = titleInput.style.display === "block";

  if (editing) {
    job.title = titleInput.value.trim();
    job.description = descInput.value.trim();

    li.classList.remove("editing");
    renderJobs();
    renderMap();
  } else {
    titleInput.style.display = "block";
    descInput.style.display = "block";
    titleSpan.style.display = "none";
    descP.style.display = "none";

    li.classList.add("editing");
    btn.textContent = "Uložit";
    descInput.focus();
  }
};

window.deleteLocation = id => {
  if (!confirm("Smazat lokalitu včetně zakázek?")) return;
  locations = locations.filter(l => l.id !== id);
  jobs = jobs.filter(j => j.locationId !== id);
  renderLocations();
  renderJobs();
};

window.changeStatus = id => {
  const job = jobs.find(j => j.id === id);
  const states = ["plánováno", "rozpracováno", "dokončeno"];
  job.status = states[(states.indexOf(job.status) + 1) % states.length];
  renderJobs();
  renderMap();
};

window.deleteJob = id => {
  if (!confirm("Smazat zakázku?")) return;
  jobs = jobs.filter(j => j.id !== id);
  renderJobs();
  renderMap();
};

/* ===== INIT ===== */
renderLocations();
renderJobs();
renderMap();
