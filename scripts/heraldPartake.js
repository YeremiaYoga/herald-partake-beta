const heraldPartake_journalName = "Herald Partake";

let heraldPartake_urgencySelected = "neutral";
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
    listHistoryDiv.style.top = "-130px";
    // listHistoryContainer.style.width = 0;
    // listHistoryContainer.style.height = 0;
    collapseButton.style.top = `0`;
    heraldPartake_collapseDisplay = true;
  }
}

async function heraldPartake_activeBell() {
  const user = game.user;
  const hexColor = `${user.color.toString(16).padStart(6, "0")}`;
  let selectedActor = user.character;
  console.log(selectedActor);
  if (user.role === CONST.USER_ROLES.PLAYER) {
    await heraldPartake_dialogJoinGame(
      user.name,
      hexColor,
      user.id,
      selectedActor.name
    );
  } else {
    await heraldPartake_createJournal();
  }
}

async function heraldPartake_dialogJoinGame(playerName, color, id, actorName) {
  let content = `
      <div>
          <div class="heraldPartake-dialogPartakeTop">
            <div>
              <p>Please choose your option:</p>
            </div>
           <div id="heraldPartake-urgencySelectorContainer" class="heraldPartake-urgencySelectorContainer">
              <div class="heraldPartake-urgencySystemItem" data-name="neutral">
                ⚙️
                <span class="heraldPartake-urgencySelectTooltip">Neutral</span>
              </div>
              <div class="heraldPartake-urgencySystemItem" data-name="await">
                🕙
                <span class="heraldPartake-urgencySelectTooltip">Await</span>
              </div>
              <div class="heraldPartake-urgencySystemItem" data-name="urgent">
                ‼️
                <span class="heraldPartake-urgencySelectTooltip">Urgent</span>
              </div>
            </div>
          </div>
          <div class="heraldPartake-dialogPartakeMiddle">
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
      </div>
  `;

  let dialog = new Dialog({
    title: "Herald Partake Dialog",
    content: content,
    buttons: {
      join: {
        label: "Wish To Partake",
        class: "heraldPartake-joinButton",
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
              id,
              actorName,
              heraldPartake_urgencySelected
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

    document
      .querySelectorAll(".heraldPartake-urgencySystemItem")
      .forEach((item) => {
        const name = item.getAttribute("data-name");
        if (name === heraldPartake_urgencySelected) {
          item.classList.add("active");
        }
        item.addEventListener("click", () => {
          const selected = item.getAttribute("data-name");
          heraldPartake_urgencySelected = selected;
          heraldPartake_updateUrgencySystem(selected);
          console.log(heraldPartake_urgencySelected);
        });
      });
  });
}

function heraldPartake_updateUrgencySystem(selectedName) {
  document
    .querySelectorAll(".heraldPartake-urgencySystemItem")
    .forEach((item) => {
      const name = item.getAttribute("data-name");
      if (name === selectedName) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
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

async function heraldPartake_joinGame(
  playerName,
  color,
  option,
  input,
  id,
  actorName,
  urgency
) {
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
    name: `${playerName}|${color}|${id}|${actorName}|${urgency}`,
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
            <div id="heraldPartake-actorName-${item.id}" class="heraldPartake-actorName"></div>
            <div id="heraldPartake-buttonHistoryContainer-${item.id}" class="heraldPartake-buttonHistoryContainer">
            </div>
          </div>
          <div class="heraldPartake-historyItemMiddle">
            <div id="heraldPartake-playerName-${item.id}" class="heraldPartake-playerName"></div>
          </div>
          <div class="heraldPartake-historyItemBottom">
          <div class="heraldPartake-optionContainer">
            <div id="heraldPartake-urgencyIconContainer-${item.id}" class="heraldPartake-urgencyIconContainer"></div>
            <div id="heraldPartake-optionName-${item.id}" class="heraldPartake-optionName"></div>
            <div id="heraldPartake-urgencyName-${item.id}" class="heraldPartake-urgencyName"></div>
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

    let actorName = document.getElementById(
      `heraldPartake-actorName-${item.id}`
    );

    if (actorName) {
      actorName.innerText = arrName[3];
      actorName.style.color = `${arrName[1]}`;
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
      `heraldPartake-optionName-${item.id}`
    );

    if (playerOption) {
      let urgencyIcon = ``;
      let urgencyNameCapitalized = ``;
      let tooltipUrgencyIcon = ``;

      if (arrName[4]) {
        urgencyNameCapitalized =
          arrName[4].charAt(0).toUpperCase() + arrName[4].slice(1);
        if (arrName[4] == "urgent") {
          urgencyIcon = `
            ‼️`;
          tooltipUrgencyIcon = `
            Urgent </br>
            Wishimg to join </br>
            the current Roleplay </br>
            as soon as possible`;
        } else if (arrName[4] == "await") {
          urgencyIcon = `🕙`;
          tooltipUrgencyIcon = `
            Await </br>
            After the Current </br>
            Roleplay is done`;
        } else {
          urgencyIcon = `⚙️`;
          tooltipUrgencyIcon = `
            Nuetral </br>
            Wishing to join upon</br>
            the current Roleplay,</br>
            but not right away`;
        }
      }

      let urgencyIconDiv = document.getElementById(
        `heraldPartake-urgencyIconContainer-${item.id}`
      );

      if (urgencyIconDiv) {
        urgencyIconDiv.innerHTML = `
        <div class="heraldPartake-urgencyIconWrapper">
          <div class="heraldPartake-urgencyIcon">${urgencyIcon}</div>
          <div class="heraldPartake-urgencyTooltip">${tooltipUrgencyIcon}</div>
        </div>`;
        const icon = urgencyIconDiv.querySelector(".heraldPartake-urgencyIcon");
        const tooltip = urgencyIconDiv.querySelector(
          ".heraldPartake-urgencyTooltip"
        );

        if (icon && tooltip) {
          icon.addEventListener("mouseenter", () => {
            tooltip.classList.add("active");
          });
          icon.addEventListener("mouseleave", () => {
            tooltip.classList.remove("active");
          });
        }
      }

      // let urgencyNameDiv = document.getElementById(
      //   `heraldPartake-urgencyName-${item.id}`
      // );
      // if (urgencyNameDiv) {
      //   const urgency = arrName[4];
      //   urgencyNameDiv.innerText = `(${urgencyNameCapitalized})`;
      //   let color = "#e2e2e2";
      //   if (urgency === "await") color = "#9ffffd";
      //   else if (urgency === "urgent") color = "#ff7e7e";

      //   urgencyNameDiv.style.color = color;
      // }

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
    // await heraldPartake_renderHistoryUser();
  }, 5000);
}

export {
  heraldPartake_renderButton,
  heraldPartake_renderListHistory,
  heraldPartake_universalInterfalUpdate,
};
