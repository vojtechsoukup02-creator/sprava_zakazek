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
    li.innerHTML = `
      <b>${l.name}</b><br>
      Souřadnice: ${Number(l.lat).toFixed(5)}, ${Number(l.lon).toFixed(5)}<br>
      <button onclick="editLocation('${l.id}')">Upravit</button>
      <button onclick="deleteLocation('${l.id}')">Smazat</button>
    `;
    locList.appendChild(li);

    const opt = document.createElement("option");
    opt.value = l.id;
    opt.textContent = l.name;
    jobLocation.appendChild(opt);
  });

  Storage.save("locations", locations);
  renderMap();
}

function renderJobs() {
  jobList.innerHTML = "";
  const filter = filterType.value;

  jobs
    .filter(j => !filter || j.type === filter)
    .forEach(j => {
      const loc = locations.find(l => l.id === j.locationId);

      const li = document.createElement("li");
      li.innerHTML = `
        <b>${j.title}</b> <small>(${j.type})</small><br>
        ${j.description}<br>
        Lokalita: ${loc?.name || "?"}<br>
        Stav: ${j.status}<br>
        <button onclick="changeStatus('${j.id}')">Změnit stav</button>
        <button onclick="editJob('${j.id}')">Upravit</button>
        <button onclick="deleteJob('${j.id}')">Smazat</button>
      `;
      jobList.appendChild(li);
    });

  Storage.save("jobs", jobs);
}

/* ===== MAP POPUP WITH JOBS ===== */
function buildLocationPopup(location) {
  const locationJobs = jobs.filter(j => j.locationId === location.id);

  if (locationJobs.length === 0) {
    return `<b>${location.name}</b><br>Žádné zakázky`;
  }

  const jobListHtml = locationJobs
    .map(
      j =>
        `• <b>${j.title}</b> (${j.type}) – <i>${j.status}</i>`
    )
    .join("<br>");

  return `
    <b>${location.name}</b><br>
    <hr>
    ${jobListHtml}
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

/* ===== GLOBAL ===== */
window.editLocation = id => {
  const loc = locations.find(l => l.id === id);
  if (!loc) return;

  const name = prompt("Název lokality:", loc.name);
  if (!name) return;

  loc.name = name.trim();
  renderLocations();
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
  if (!job) return;

  const states = ["plánováno", "rozpracováno", "dokončeno"];
  job.status = states[(states.indexOf(job.status) + 1) % states.length];
  renderJobs();
  renderMap();
};

window.editJob = id => {
  const job = jobs.find(j => j.id === id);
  if (!job) return;

  const title = prompt("Krátký popis:", job.title);
  if (!title) return;

  const desc = prompt("Detailní popis:", job.description);
  if (!desc) return;

  job.title = title.trim();
  job.description = desc.trim();
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
