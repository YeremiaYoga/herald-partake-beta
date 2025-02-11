const heraldPartake_journalName = "Herald Partake";

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

async function heraldPartake_renderListHistory() {
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
      heraldPartake_renderHistoryUser();
    })
    .catch((err) => {
      console.error("Gagal memuat template .html: partake", err);
    });
}

async function heraldPartake_activeBell() {
  const user = game.user;

  if (user.role === CONST.USER_ROLES.PLAYER) {
    await heraldPartake_joinGame(user.name, user.id);
  } else {
    await heraldPartake_createJournal();
  }
}

async function heraldPartake_createJournal() {
  let journalEntry = game.journal.find(
    (j) => j.name === heraldPartake_journalName
  );

  if (!journalEntry) {
    journalEntry = await JournalEntry.create({
      name: heraldPartake_journalName,
      ownership: { default: 3 },
    });

    if (!journalEntry) {
      ui.notifications.error("Failed to create journal.");
      return;
    } else {
      ui.notifications.info("Herald Partake Active");
    }
  } else {
    ui.notifications.info("Herald Partake Already Active");
  }
}

async function heraldPartake_joinGame(playerName, id) {
  let journalEntry = game.journal.find(
    (j) => j.name === heraldPartake_journalName
  );
  if (!journalEntry) {
    ui.notifications.error(
      "Herald Partake is not ready. Please talk to the DM to activate it."
    );
    return;
  }
  const pageData = {
    name: `${playerName}|${id}`,
    type: "text",
    text: {
      content: new Date().toISOString(),
      format: 1,
    },
    ownership: { default: 3 },
  };

  const newPages = await journalEntry.createEmbeddedDocuments(
    "JournalEntryPage",
    [pageData]
  );

  if (newPages.length > 0) {
    ui.notifications.info(
      "Your wish to partake has been accounted for. You have been notice!"
    );

    ChatMessage.create({
      content: `I wish to join upon! (Wait for DM's confirmation, you are notice)`,
    });
    await heraldPartake_renderHistoryUser();
  } else {
    ui.notifications.error("Failed to add new page.");
  }
}

async function heraldPartake_renderHistoryUser() {
  const user = game.user;
  let journal = game.journal.find((j) => j.name === heraldPartake_journalName);
  if (!journal) {
    return;
  }
  let listHistoryUser = journal.pages.contents
    .slice()
    .reverse()
    .map((item, index) => ({
      id: index + 1,
      ...item,
    }));
  console.log(listHistoryUser);
  const historyList = document.getElementById(
    "heraldPartake-historyListContainer"
  );
  let templateListPartake = ``;
  listHistoryUser.forEach((item) => {
    templateListPartake += `
    <li class="heraldPartake-historyItem">
      <div class="heraldPartake-historyItemTop">
        <div class="heraldPartake-playerName">tesPlayer1</div>
        <div class="heraldPartake-buttonHistoryContainer">
          <div class="heraldPartake-buttonHistoryAccept">V</div>
          <div class="heraldPartake-buttonHistoryDelete">X</div>
        </div>
      </div>
      <div class="heraldPartake-historyItemBottom">
        <div class="heraldPartake-questionContainer">
          <div class="heraldPartake-statusValue">Roleplaying</div>
        </div>
        
        <div class="heraldPartake-historyTime">2 minutes ago</div>
      </div>
    </li>
    `;
  });
  historyList.innerHTML = `
  <div>
    <ul>
      ${templateListPartake}
    </ul>
  </div>
  `;
}

// async function heraldPartake_renderHistoryUser() {
//   const user = game.user;

//   let journal = game.journal.find((j) => j.name === heraldPartake_journalName);
//   if (!journal) {
//     return;
//   }

//   let listHistoryUser = journal.pages.contents;

//   const historyList = document.getElementById(
//     "heraldPartake-historyListContainer"
//   );
//   if (!historyList) return;

//   historyList.innerHTML = "";

//   const ul = document.createElement("ul");

//   function timeAgo(dateString) {
//     const now = new Date();
//     const date = new Date(dateString);
//     const diff = now - date;

//     const minutes = Math.floor(diff / (1000 * 60));
//     const hours = Math.floor(diff / (1000 * 60 * 60));
//     const days = Math.floor(diff / (1000 * 60 * 60 * 24));

//     if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
//     if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
//     if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
//     return "Just now";
//   }

//   listHistoryUser.reverse().forEach((item) => {
//     const li = document.createElement("li");
//     li.classList.add("heraldPartake-historyItem");
//     const nameParts = item.name.split(" ");
//     const playerName = nameParts[0];
//     const playerId = nameParts[1];
//     const playerTime = item.text.content;
//     const relativeTime = timeAgo(playerTime);

//     const playerNameDiv = document.createElement("div");
//     playerNameDiv.classList.add("heraldPartake-playerName");
//     playerNameDiv.textContent = `${playerName}`;

//     const playerTimeDiv = document.createElement("div");
//     playerTimeDiv.classList.add("heraldPartake-playerTime");
//     playerTimeDiv.textContent = `${relativeTime}`;

//     const deleteButtonDiv = document.createElement("div");
//     deleteButtonDiv.classList.add("heraldPartake-deleteButton");

//     if (user.role === CONST.USER_ROLES.GAMEMASTER || user.id == playerId) {
//       const deleteButton = document.createElement("div");
//       deleteButton.innerHTML = `<i class="fa-solid fa-x"></i>`;
//       deleteButton.classList.add("heraldPartake-deleteButtonText");

//       deleteButton.addEventListener("click", async () => {
//         await heraldPartake_deleteHistoryUser(item._id);
//       });

//       deleteButtonDiv.appendChild(deleteButton);
//     }

//     li.appendChild(playerNameDiv);
//     li.appendChild(playerTimeDiv);
//     li.appendChild(deleteButtonDiv);

//     ul.appendChild(li);
//   });

//   historyList.appendChild(ul);
// }

async function heraldPartake_deleteHistoryUser(pageId) {
  let journal = game.journal.find((j) => j.name === heraldPartake_journalName);
  if (!journal) return;

  let page = journal.pages.get(pageId);
  if (page) {
    await page.delete();
    ui.notifications.info("Player history removed.");
    heraldPartake_renderHistoryUser();
  }
}

function heraldPartake_universalInterfalUpdate() {
  setInterval(() => {
    heraldPartake_renderHistoryUser();
  }, 5000);
}

export {
  heraldPartake_renderButton,
  heraldPartake_renderListHistory,
  heraldPartake_universalInterfalUpdate,
};
