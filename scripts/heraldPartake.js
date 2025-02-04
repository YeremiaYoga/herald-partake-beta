function heraldPartake_renderButton() {
  const existingBar = document.getElementById("heraldPartake-buttonContainer");
  if (existingBar) {
    existingBar.remove();
  }

  fetch(
    "/modules/herald-partake-beta/templates/heraldPartake-partakeButton.html"
  )
    .then((response) => response.text())
    .then((html) => {
      const div = document.createElement("div");
      div.innerHTML = html;
      const partake = div.firstChild;
      partake.id = "heraldPartake-buttonContainer";

      const partakeButton = document.createElement("button");
      partakeButton.id = "heraldPartake-partakeButton";
      partakeButton.classList.add("heraldPartake-partakeButton");
      partakeButton.innerHTML =
        '<i class="fa fa-bell" style="margin-left:2px;"></i>';
      partakeButton.addEventListener("click", function () {
        heraldPartake_activeBell();
      });

      partake.appendChild(partakeButton);
      document.body.appendChild(partake);
    })
    .catch((err) => {
      console.error("Gagal memuat template .html: partake", err);
    });
}

function heraldPartake_renderListHistory() {
  const existingBar = document.getElementById(
    "heraldPartake-historyListContainer"
  );
  if (existingBar) {
    existingBar.remove();
  }

  fetch(
    "/modules/herald-partake-beta/templates/heraldPartake-partakeHistoryList.html"
  )
    .then((response) => response.text())
    .then((html) => {
      const div = document.createElement("div");
      div.innerHTML = html;
      const partake = div.firstChild;
      partake.id = "heraldPartake-historyListContainer";

      document.body.appendChild(partake);
    })
    .catch((err) => {
      console.error("Gagal memuat template .html: partake", err);
    });
}

async function heraldPartake_activeBell() {
  const user = game.user;

  if (user.role === CONST.USER_ROLES.PLAYER) {
    ui.notifications.info(
      "Your wish to partake has been accounted for. You have been notice!"
    );

    ChatMessage.create({
      content: `I wish to join upon! (Wait for DM's confirmation, you are notice)`,
    });

    heraldPartake_addDataHistory();
  } else {
  }
}

let listHistoryUser = [];
function heraldPartake_addDataHistory() {
  const user = game.user;
  if (user.role === CONST.USER_ROLES.PLAYER) {
    const now = new Date();
    const timeString = new Intl.RelativeTimeFormat("en", {
      numeric: "auto",
    }).format(-Math.round((now - new Date()) / 60000), "minute");

    let userData = `${user.name} - ${timeString}`;
    listHistoryUser.push(userData);
  }
}

function heraldPartake_renderHistoryUser() {
  const historyList = document.getElementById(
    "heraldPartake-historyListContainer"
  );
  if (!historyList) return;

  historyList.innerHTML = "";

  const ul = document.createElement("ul");

  listHistoryUser.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  });

  historyList.appendChild(ul);
}

export { heraldPartake_renderButton, heraldPartake_renderListHistory };
