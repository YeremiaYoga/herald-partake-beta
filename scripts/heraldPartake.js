const heraldPartake_journalName = "Herald Partake";
let heraldPartake_listHistoryUser = [];
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
  const existingBar = document.getElementById("heraldPartake-listHistoryDiv");
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
      partake.id = "heraldPartake-listHistoryDiv";

      document.body.appendChild(partake);
      heraldPartake_renderHistoryUser();
      heraldPartake_createCollapseButton();
    })
    .catch((err) => {
      console.error("Gagal memuat template .html: partake", err);
    });
}

async function heraldPartake_createCollapseButton() {
  let collapseButton = document.getElementById(
    "heraldPartake-collapseButtonContainer"
  );
  collapseButton.addEventListener("click", async () => {
    await heraldPartake_toggleCollapsePartake();
  });
}
let heraldPartake_collapseDisplay = false;
async function heraldPartake_toggleCollapsePartake() {
  let listHistoryContainer = document.getElementById(
    "heraldPartake-listHistoryContainer"
  );
  let listHistoryDiv = document.getElementById("heraldPartake-listHistoryDiv");
  let collapseButton = document.getElementById(
    "heraldPartake-collapseButtonContainer"
  );

  if (heraldPartake_collapseDisplay) {
    listHistoryDiv.style.top = "0";
    listHistoryContainer.style.width = `300px`;
    listHistoryContainer.style.height = `130px`;
    collapseButton.style.top = `13vh`;
    const listHistoryValueDiv = document.createElement("div");
    listHistoryValueDiv.id = "heraldPartake-listHistoryValue";
    listHistoryValueDiv.classList.add("heraldPartake-listHistoryValue");

    listHistoryContainer.appendChild(listHistoryValueDiv);
    await heraldPartake_renderHistoryUser();
    heraldPartake_collapseDisplay = false;
  } else {
    listHistoryDiv.style.top = "-13vh";
    // listHistoryContainer.style.width = 0;
    // listHistoryContainer.style.height = 0;
    collapseButton.style.top = `0`;
    heraldPartake_collapseDisplay = true;
  }
}

async function heraldPartake_activeBell() {
  const user = game.user;
  const hexColor = `${user.color.toString(16).padStart(6, "0")}`;
  if (user.role === CONST.USER_ROLES.PLAYER) {
    await heraldPartake_dialogJoinGame(user.name, hexColor, user.id);
  } else {
    await heraldPartake_createJournal();
  }
}

async function heraldPartake_dialogJoinGame(playerName, color, id) {
  let content = `
      <div>
          <p>Please choose your option:</p>
          <label>
              <input type="radio" name="roleOption" value="roleplaying" checked> Roleplaying
          </label>
          <br>
          <label>
              <input type="radio" name="roleOption" value="question"> Question
          </label>
          <br>
          <div id="heraldPartake-questionInputContainer" style="display:none;">
              <label for="heraldPartake-questionInput">Please provide your question:</label>
              <textarea id="heraldPartake-questionInput" placeholder="Your question..." maxlength="300" rows="4" cols="40"></textarea>
              <p id="heraldPartake-questionWarning" style="color: red; display: none;">Question cannot be empty.</p>
          </div>
      </div>
  `;

  let dialog = new Dialog({
    title: "Herald Partake Dialog",
    content: content,
    buttons: {
      join: {
        label: "Join Game",
        class:"heraldPartake-joinButton",
        callback: async () => {
          let selectedOption = document.querySelector(
            'input[name="roleOption"]:checked'
          ).value;
          let questionInput =
            selectedOption === "question"
              ? document.getElementById("heraldPartake-questionInput").value
              : null;

          if (selectedOption === "question" && !questionInput) {
            document.getElementById(
              "heraldPartake-questionWarning"
            ).style.display = "block";
            ui.notifications.error("Question cannot be empty.");
            return;
          } else {
            document.getElementById(
              "heraldPartake-questionWarning"
            ).style.display = "none";

            await heraldPartake_joinGame(
              playerName,
              color,
              selectedOption,
              questionInput,
              id
            );
          }
        },
      },
    },
    render: (html) => {
      html.find('input[value="question"]').on("change", () => {
        document.getElementById(
          "heraldPartake-questionInputContainer"
        ).style.display = "block";
        document.getElementById("heraldPartake-questionWarning").style.display =
          "none";
      });
      html.find('input[value="roleplaying"]').on("change", () => {
        document.getElementById(
          "heraldPartake-questionInputContainer"
        ).style.display = "none";
        document.getElementById("heraldPartake-questionWarning").style.display =
          "none";
      });
    },
  });

  dialog.render(true);

  Hooks.once("renderDialog", (app) => {
    if (app instanceof Dialog && app.title === "Herald Partake Dialog") {
      const width = 500;
      const height = 300;

      app.setPosition({
        left: (window.innerWidth - width) / 2,
        top: (window.innerHeight - height) / 2,
        width: width,
        height: height,
        scale: 1.0,
      });
    }
  });
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

async function heraldPartake_joinGame(playerName, color, option, input, id) {
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
    name: `${playerName}|${color}|${id}`,
    type: "text",
    text: {
      content: `time:${new Date().toISOString()}|${option}|${input}|false`,
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

  heraldPartake_listHistoryUser = journal.pages.contents.slice().reverse();
  const historyList = document.getElementById("heraldPartake-listHistoryValue");
  let templateListPartake = ``;
  heraldPartake_listHistoryUser.forEach((item) => {
    let arrContent = item.text.content.split("|");
    let lastPart = arrContent[arrContent.length - 1].trim();
    let historyStyle = ``;
    let goldLine = ``;
    if (lastPart == "true") {
      historyStyle = `style="box-shadow: 0 0 2px 2px rgba(255, 215, 0, 0.8);"`;
      goldLine = `
        <div class="heraldPartake-historyItem-topleft"></div>
        <div class="heraldPartake-historyItem-topright"></div>
        <div class="heraldPartake-historyItem-bottomleft"></div>
        <div class="heraldPartake-historyItem-bottomright"></div>
        `;
    }
    templateListPartake += `
    <li id="heraldPartake-historyItem-${item.id}" class="heraldPartake-historyItem" ${historyStyle}>
     ${goldLine}
      <div class="heraldPartake-historyItemDetail">
        <div class="heraldPartake-historyItemTop">
            <div id="heraldPartake-playerName-${item.id}" class="heraldPartake-playerName" ></div>
            <div id="heraldPartake-buttonHistoryContainer-${item.id}" class="heraldPartake-buttonHistoryContainer">
            </div>
          </div>
          <div class="heraldPartake-historyItemBottom">
            <div id="heraldPartake-optionContainer-${item.id}" class="heraldPartake-optionContainer">
          
            </div>
            <div id="heraldPartake-historyTime-${item.id}" class="heraldPartake-historyTime"></div>
          </div>
      </div>
      
    </li>
    `;
  });
  if (historyList) {
    historyList.innerHTML = `
    <div>
      <ul>
        ${templateListPartake}
      </ul>
    </div>
    `;
    await heraldPartake_renderDataHistory();
  }
}

async function heraldPartake_renderDataHistory() {
  const user = game.user;

  heraldPartake_listHistoryUser.forEach((item) => {
    let arrName = item.name.split("|");
    let arrContent = item.text.content.split("|");
    let playerName = document.getElementById(
      `heraldPartake-playerName-${item.id}`
    );
    if (playerName) {
      playerName.innerText = arrName[0];
      playerName.style.color = `${arrName[1]}`;
    }

    let playerTime = document.getElementById(
      `heraldPartake-historyTime-${item.id}`
    );
    if (playerTime) {
      let timeData = arrContent[0].replace("time:", "").trim();
      let time = new Date(timeData);
      let now = new Date();
      let diffInSeconds = Math.floor((now - time) / 1000);
      if (diffInSeconds < 60) {
        playerTime.innerText = `${diffInSeconds} seconds ago`;
      } else if (diffInSeconds < 3600) {
        let diffInMinutes = Math.floor(diffInSeconds / 60);
        playerTime.innerText = `${diffInMinutes} minutes ago`;
      } else if (diffInSeconds < 86400) {
        let diffInHours = Math.floor(diffInSeconds / 3600);
        playerTime.innerText = `${diffInHours} hours ago`;
      } else {
        let diffInDays = Math.floor(diffInSeconds / 86400);
        playerTime.innerText = `${diffInDays} days ago`;
      }
    }
    let buttonControl = document.getElementById(
      `heraldPartake-buttonHistoryContainer-${item.id}`
    );

    if (user.role === CONST.USER_ROLES.GAMEMASTER) {
      let confirmButton = document.createElement("div");
      confirmButton.innerHTML = `<i class="fa-solid fa-check"></i>`;
      confirmButton.classList.add("heraldPartake-buttonHistoryConfirm");
      confirmButton.addEventListener("click", async () => {
        await heraldPartake_confirmHistoryUser(item._id);
      });

      let deleteButton = document.createElement("div");
      deleteButton.classList.add("heraldPartake-buttonHistoryDelete");
      deleteButton.innerHTML = `<i class="fa-solid fa-x"></i>`;
      deleteButton.addEventListener("click", async () => {
        await heraldPartake_deleteHistoryUser(item._id);
      });

      buttonControl.appendChild(confirmButton);
      buttonControl.appendChild(deleteButton);
    } else if (item.ownership[user.id] === 3) {
      let deleteButton = document.createElement("div");
      deleteButton.classList.add("heraldPartake-buttonHistoryDelete");
      deleteButton.innerText = "X";
      deleteButton.addEventListener("click", async () => {
        await heraldPartake_deleteHistoryUser(item._id);
      });
      buttonControl.appendChild(deleteButton);
    }

    let playerOption = document.getElementById(
      `heraldPartake-optionContainer-${item.id}`
    );

    if (playerOption) {
      if (arrContent[1] == "question") {
        let optionDiv = document.createElement("div");
        optionDiv.classList.add("heraldPartake-optionSelected");
        optionDiv.innerText = `Question`;

        playerOption.appendChild(optionDiv);

        optionDiv.addEventListener("mouseenter", () => {
          heraldPartake_renderHistoryTooltip(true, arrName[0], arrContent[2]);
        });

        optionDiv.addEventListener("mouseleave", () => {
          heraldPartake_renderHistoryTooltip(false, arrName[0], arrContent[2]);
        });
      } else {
        let optionDiv = document.createElement("div");
        optionDiv.classList.add("heraldPartake-optionSelected");
        optionDiv.innerText = `Roleplaying`;

        playerOption.appendChild(optionDiv);
      }
    }
  });
}

async function heraldPartake_renderHistoryTooltip(hover, name, data) {
  let historyTooltip = document.getElementById("heraldPartake-historyTooltip");
  if (hover == true) {
    let existingTooltip = document.querySelector(
      ".heraldPartake-optionTooltipValue"
    );
    if (existingTooltip) {
      existingTooltip.remove();
    }
    let tooltipValue = document.createElement("div");
    tooltipValue.classList.add("heraldPartake-optionTooltipValue");
    tooltipValue.innerText = data;
    historyTooltip.appendChild(tooltipValue);
    historyTooltip.style.display = "block";
  } else {
    historyTooltip.innerHTML = "";
    historyTooltip.style.display = "none";
  }
}

async function heraldPartake_confirmHistoryUser(pageId) {
  let journal = game.journal.find((j) => j.name === heraldPartake_journalName);
  if (!journal) return;

  let page = journal.pages.get(pageId);
  let content = page.text.content;
  let parts = content.split("|");

  let lastPart = parts[parts.length - 1].trim();
  let newLastPart = lastPart === "true" ? "false" : "true";
  parts[parts.length - 1] = newLastPart;
  let updatedContent = parts.join("|");
  await page.update({ "text.content": updatedContent });
  await heraldPartake_renderHistoryUser();
  heraldPartake_ringBell();
}

function heraldPartake_ringBell() {
  let volume = game.settings.get("core", "globalPlaylistVolume");
  AudioHelper.play({
    src: "/modules/herald-partake-beta/assets/bell_sound.mp3",
    volume: volume,
    autoplay: true,
    loop: false,
  });
}

async function heraldPartake_deleteHistoryUser(pageId) {
  let journal = game.journal.find((j) => j.name === heraldPartake_journalName);
  if (!journal) return;

  let page = journal.pages.get(pageId);
  if (page) {
    await page.delete();
    heraldPartake_renderHistoryUser();
  }
}

function heraldPartake_universalInterfalUpdate() {
  setInterval(async () => {
    await heraldPartake_renderHistoryUser();
  }, 5000);
}

export {
  heraldPartake_renderButton,
  heraldPartake_renderListHistory,
  heraldPartake_universalInterfalUpdate,
};
