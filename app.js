
class Location {
  constructor(name, lat, lon) {
    this.id = Date.now();
    this.name = name;
    this.lat = Number(lat);
    this.lon = Number(lon);
    this.createdAt = new Date();
  }
}

class Job {
  constructor(locationId, type, description) {
    this.id = Date.now();
    this.locationId = locationId;
    this.type = type;
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
    return JSON.parse(localStorage.getItem(key)) || [];
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
const jobDesc = document.getElementById("jobDesc");
const jobList = document.getElementById("jobs");

const filterType = document.getElementById("filterType");

/* ===== MAPA ===== */
const map = L.map("map").setView([49.8175, 15.4730], 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

let markers = [];
let clickMarker = null; 

// Vyber lokace
map.on('click', function(e) {
  const lat = e.latlng.lat;
  const lon = e.latlng.lng;
  
  
  if (clickMarker) {
    map.removeLayer(clickMarker);
  }
  

  
  
  locName.placeholder = `Klikli jste na: ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  
  
  locName.dataset.lat = lat;
  locName.dataset.lon = lon;
});

/* ===== RENDER ===== */
function renderLocations() {
  locList.innerHTML = "";
  jobLocation.innerHTML = '<option value="">-- Vyberte lokalitu --</option>';

  locations.forEach(l => {
    const li = document.createElement("li");
    li.innerHTML = `
      <b>${l.name}</b><br>
      Souřadnice: ${l.lat.toFixed(5)}, ${l.lon.toFixed(5)}
      <button onclick="editLocation(${l.id})">Upravit</button>
      <button onclick="deleteLocation(${l.id})">Smazat</button>
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
        <b>${j.type}</b> – ${j.description}<br>
        Lokalita: ${loc?.name || "?"}<br>
        Stav: ${j.status}<br>
        <button onclick="changeStatus(${j.id})">Změnit stav</button>
        <button onclick="editJob(${j.id})">Upravit</button>
        <button onclick="deleteJob(${j.id})">Smazat</button>
      `;
      jobList.appendChild(li);
    });

  Storage.save("jobs", jobs);
}

function renderMap() {
  
  markers.forEach(m => {
    if (m !== clickMarker) {
      map.removeLayer(m);
    }
  });
  markers = clickMarker ? [clickMarker] : [];

  
  locations.forEach(l => {
    if (!l.lat || !l.lon) return;

    const marker = L.marker([l.lat, l.lon])
      .addTo(map)
      .bindPopup(`<b>${l.name}</b><br>${l.lat.toFixed(5)}, ${l.lon.toFixed(5)}`);
    
  
    marker.on('click', () => {
      map.setView([l.lat, l.lon], 13);
    });

    markers.push(marker);
  });
}

/* ===== ACTIONS ===== */
document.getElementById("addLocation").onclick = () => {
  const name = locName.value.trim();
  const lat = locName.dataset.lat;
  const lon = locName.dataset.lon;
  
  if (!name) {
    alert("Zadejte název lokality");
    locName.focus();
    return;
  }
  
  if (!lat || !lon) {
    alert("Klikněte nejdříve na mapu pro výběr umístění");
    return;
  }
  
  
  const existing = locations.find(loc => 
    loc.lat.toFixed(5) === Number(lat).toFixed(5) && 
    loc.lon.toFixed(5) === Number(lon).toFixed(5)
  );
  
  if (existing) {
    alert(`Tyto souřadnice už patří lokální "${existing.name}". Vyberte jiné místo na mapě.`);
    return;
  }

  locations.push(new Location(name, lat, lon));
  
  // Clear inputs
  locName.value = "";
  locName.dataset.lat = "";
  locName.dataset.lon = "";
  locName.placeholder = "Název lokality";
  
  // Clear click marker
  if (clickMarker) {
    map.removeLayer(clickMarker);
    clickMarker = null;
  }
  
  renderLocations();
  alert("Lokalita úspěšně přidána!");
};

document.getElementById("addJob").onclick = () => {
  if (!jobLocation.value) {
    alert("Vyberte lokalitu");
    jobLocation.focus();
    return;
  }
  
  if (!jobDesc.value.trim()) {
    alert("Zadejte popis práce");
    jobDesc.focus();
    return;
  }

  jobs.push(new Job(Number(jobLocation.value), jobType.value, jobDesc.value));
  jobDesc.value = "";
  renderJobs();
  alert("Zakázka úspěšně přidána!");
};

filterType.onchange = renderJobs;

/* ===== GLOBAL ACTIONS ===== */
window.editLocation = id => {
  const loc = locations.find(l => l.id === id);
  if (!loc) return;
  
  // Vycentrovat mapu
  map.setView([loc.lat, loc.lon], 13);
  
  const name = prompt("Název lokality:", loc.name);
  if (name === null || !name.trim()) return;
  
  loc.name = name.trim();
  renderLocations();
  alert("Lokalita upravena!");
};

window.deleteLocation = id => {
  if (!confirm("Smazat lokalitu včetně zakázek?")) return;

  locations = locations.filter(l => l.id !== id);
  jobs = jobs.filter(j => j.locationId !== id);
  
  renderLocations();
  renderJobs();
  alert("Lokalita smazána!");
};

window.changeStatus = id => {
  const job = jobs.find(j => j.id === id);
  if (!job) return;
  
  const states = ["plánováno", "rozpracováno", "dokončeno"];
  job.status = states[(states.indexOf(job.status) + 1) % states.length];
  renderJobs();
};

window.editJob = id => {
  const job = jobs.find(j => j.id === id);
  if (!job) return;
  
  const desc = prompt("Popis:", job.description);
  if (desc === null || !desc.trim()) return;
  
  const type = prompt("Typ (topení/voda/plyn):", job.type);
  if (type === null || !["topení", "voda", "plyn"].includes(type)) return;
  
  job.description = desc.trim();
  job.type = type;
  renderJobs();
  alert("Zakázka upravena!");
};

window.deleteJob = id => {
  if (!confirm("Smazat zakázku?")) return;
  
  jobs = jobs.filter(j => j.id !== id);
  renderJobs();
  alert("Zakázka smazána!");
};

/* ===== INIT ===== */
renderLocations();
renderJobs();
renderMap();