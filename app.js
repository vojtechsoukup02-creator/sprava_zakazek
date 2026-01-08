
class Location {
  constructor(name, address) {
    this.id = Date.now();
    this.name = name;
    this.address = address;
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


const locations = Storage.load("locations");
const jobs = Storage.load("jobs");


const locList = document.getElementById("locations");
const jobList = document.getElementById("jobs");
const jobLocation = document.getElementById("jobLocation");
const filterType = document.getElementById("filterType");


function renderLocations() {
  locList.innerHTML = "";
  jobLocation.innerHTML = "";

  locations.forEach(l => {
    const li = document.createElement("li");
    li.innerHTML = `
      <b>${l.name}</b> – ${l.address}
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
}

function renderJobs() {
  jobList.innerHTML = "";
  const filter = filterType.value;

  jobs
    .filter(j => !filter || j.type === filter)
    .forEach(j => {
      const loc = locations.find(l => l.id == j.locationId);
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


document.getElementById("addLocation").onclick = () => {
  if (!locName.value || !locAddress.value) return;
  locations.push(new Location(locName.value, locAddress.value));
  locName.value = "";
  locAddress.value = "";
  renderLocations();
};

document.getElementById("addJob").onclick = () => {
  if (!jobLocation.value || !jobDesc.value) return;
  jobs.push(new Job(
    Number(jobLocation.value),
    jobType.value,
    jobDesc.value
  ));
  jobDesc.value = "";
  renderJobs();
};

filterType.onchange = renderJobs;


window.editLocation = id => {
  const loc = locations.find(l => l.id === id);
  const name = prompt("Nový název:", loc.name);
  const address = prompt("Nová adresa:", loc.address);

  if (name && address) {
    loc.name = name;
    loc.address = address;
    renderLocations();
    renderJobs();
  }
};

window.deleteLocation = id => {
  if (!confirm("Smazat lokalitu včetně zakázek?")) return;

  locations.splice(locations.findIndex(l => l.id === id), 1);
  for (let i = jobs.length - 1; i >= 0; i--) {
    if (jobs[i].locationId === id) jobs.splice(i, 1);
  }

  renderLocations();
  renderJobs();
};

window.changeStatus = id => {
  const job = jobs.find(j => j.id === id);
  const states = ["plánováno", "rozpracováno", "dokončeno"];
  job.status = states[(states.indexOf(job.status) + 1) % states.length];
  renderJobs();
};

window.editJob = id => {
  const job = jobs.find(j => j.id === id);
  const desc = prompt("Popis:", job.description);
  const type = prompt("Typ (topení/voda/plyn):", job.type);

  if (desc && type) {
    job.description = desc;
    job.type = type;
    renderJobs();
  }
};

window.deleteJob = id => {
  if (!confirm("Smazat zakázku?")) return;
  jobs.splice(jobs.findIndex(j => j.id === id), 1);
  renderJobs();
};


renderLocations();
renderJobs();
