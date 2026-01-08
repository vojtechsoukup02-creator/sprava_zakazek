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
    li.textContent = `${l.name} – ${l.address}`;
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
        Stav: ${j.status}
        <button onclick="changeStatus(${j.id})">Změnit stav</button>
      `;
      jobList.appendChild(li);
    });

  Storage.save("jobs", jobs);
}


document.getElementById("addLocation").onclick = () => {
  const name = locName.value;
  const address = locAddress.value;
  if (!name || !address) return;

  locations.push(new Location(name, address));
  renderLocations();
};

document.getElementById("addJob").onclick = () => {
  if (!jobLocation.value) return;

  jobs.push(
    new Job(
      Number(jobLocation.value),
      jobType.value,
      jobDesc.value
    )
  );
  renderJobs();
};

filterType.onchange = renderJobs;

window.changeStatus = id => {
  const job = jobs.find(j => j.id === id);
  const states = ["plánováno", "rozpracováno", "dokončeno"];
  job.status = states[(states.indexOf(job.status) + 1) % states.length];
  renderJobs();
};


renderLocations();
renderJobs();
