const noteInput = document.getElementById("noteInput");
const printBtn = document.getElementById("printBtn");
const settingsBtn = document.getElementById("settingsBtn");
const wordWarning = document.getElementById("wordWarning");
const printerCaption = document.getElementById("printerCaption");
const settingsModal = document.getElementById("settingsModal");
const printerSelect = document.getElementById("printerSelect");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const testPrintBtn = document.getElementById("testPrintBtn");
const silentModeToggle = document.getElementById("silentModeToggle");
const extraSpaceTopInput = document.getElementById("extraSpaceTop");
const extraSpaceBottomInput = document.getElementById("extraSpaceBottom");
const closeBtn = document.getElementById("closeBtn");
const dueDateLabel = document.getElementById("dueDateLabel");
const printerPreview = document.getElementById("printerPreview");
const charCounter = document.getElementById("charCounter");

// Due date elements
const dueDatePlus1 = document.getElementById("dueDatePlus1");
const dueDatePlus7 = document.getElementById("dueDatePlus7");
const dueDatePlus14 = document.getElementById("dueDatePlus14");
const dueDateOther = document.getElementById("dueDateOther");
const dueDateClear = document.getElementById("dueDateClear");

// Due date modal elements
const dueDateModal = document.getElementById("dueDateModal");
const daysInput = document.getElementById("daysInput");
const confirmDaysBtn = document.getElementById("confirmDaysBtn");
const cancelDaysBtn = document.getElementById("cancelDaysBtn");

let selectedDueDate = null;
let currentSelectedButton = null;

// Enhanced text wrapping function for 80mm paper with emoji support
function calculateCharWidth(char) {
  // Check if character is an emoji (basic check for common emoji ranges)
  const codePoint = char.codePointAt(0);

  // Common emoji ranges
  if (
    (codePoint >= 0x1f600 && codePoint <= 0x1f64f) || // Emoticons
    (codePoint >= 0x1f300 && codePoint <= 0x1f5ff) || // Misc Symbols and Pictographs
    (codePoint >= 0x1f680 && codePoint <= 0x1f6ff) || // Transport and Map
    (codePoint >= 0x1f1e0 && codePoint <= 0x1f1ff) || // Regional indicators
    (codePoint >= 0x2600 && codePoint <= 0x26ff) || // Misc symbols
    (codePoint >= 0x2700 && codePoint <= 0x27bf) || // Dingbats
    (codePoint >= 0xfe00 && codePoint <= 0xfe0f) || // Variation selectors
    (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) || // Supplemental Symbols and Pictographs
    (codePoint >= 0x1fa70 && codePoint <= 0x1faff) // Extended symbols
  ) {
    return 2.5;
  }

  return 1;
}

function getTextWidth(text) {
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    // Handle surrogate pairs for emojis
    if (
      char.charCodeAt(0) >= 0xd800 &&
      char.charCodeAt(0) <= 0xdbff &&
      i + 1 < text.length
    ) {
      const nextChar = text[i + 1];
      if (
        nextChar.charCodeAt(0) >= 0xdc00 &&
        nextChar.charCodeAt(0) <= 0xdfff
      ) {
        // This is a surrogate pair, treat as single emoji
        width += calculateCharWidth(char + nextChar);
        i++; // Skip the next character as it's part of the surrogate pair
        continue;
      }
    }
    width += calculateCharWidth(char);
  }
  return width;
}

function wrapTextFor80mm(text) {
  const maxCharsPerLine = 13;
  const lines = [];

  // Split by existing line breaks first
  const paragraphs = text.split("\n");

  for (let paragraph of paragraphs) {
    if (paragraph === "") {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/(\s+)/); // Split but keep whitespace
    let currentLine = "";
    let currentWidth = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // Skip empty words
      if (word === "") continue;

      // If it's just whitespace, add it if there's room
      if (/^\s+$/.test(word)) {
        if (currentWidth + 1 <= maxCharsPerLine) {
          currentLine += " ";
          currentWidth += 1;
        }
        continue;
      }

      const wordWidth = getTextWidth(word);

      // If word is longer than max line width, we need to break it
      if (wordWidth > maxCharsPerLine) {
        // If current line has content, finish it first
        if (currentLine.trim() !== "") {
          lines.push(currentLine.trim());
          currentLine = "";
          currentWidth = 0;
        }

        // Break the long word into chunks
        let remainingWord = word;
        while (remainingWord.length > 0) {
          let chunk = "";
          let chunkWidth = 0;
          let charIndex = 0;

          while (
            charIndex < remainingWord.length &&
            chunkWidth < maxCharsPerLine
          ) {
            const char = remainingWord[charIndex];

            // Handle surrogate pairs
            let charToAdd = char;
            let charWidth = calculateCharWidth(char);

            if (
              char.charCodeAt(0) >= 0xd800 &&
              char.charCodeAt(0) <= 0xdbff &&
              charIndex + 1 < remainingWord.length
            ) {
              const nextChar = remainingWord[charIndex + 1];
              if (
                nextChar.charCodeAt(0) >= 0xdc00 &&
                nextChar.charCodeAt(0) <= 0xdfff
              ) {
                charToAdd = char + nextChar;
                charWidth = calculateCharWidth(charToAdd);
                charIndex++; // Skip next char as it's part of surrogate pair
              }
            }

            if (chunkWidth + charWidth <= maxCharsPerLine) {
              chunk += charToAdd;
              chunkWidth += charWidth;
              charIndex++;
            } else {
              break;
            }
          }

          if (chunk === "") {
            // Single character/emoji is too wide, force it anyway
            chunk = remainingWord[0];
            if (
              remainingWord[0].charCodeAt(0) >= 0xd800 &&
              remainingWord[0].charCodeAt(0) <= 0xdbff &&
              remainingWord.length > 1
            ) {
              chunk += remainingWord[1];
              charIndex = 2;
            } else {
              charIndex = 1;
            }
          }

          lines.push(chunk);
          remainingWord = remainingWord.substring(charIndex);
        }

        currentLine = "";
        currentWidth = 0;
      } else {
        // Word fits within line limit
        const spaceWidth = currentLine === "" ? 0 : 1; // Space before word if line isn't empty

        if (currentWidth + spaceWidth + wordWidth <= maxCharsPerLine) {
          // Word fits on current line
          if (currentLine !== "") {
            currentLine += " ";
            currentWidth += 1;
          }
          currentLine += word;
          currentWidth += wordWidth;
        } else {
          // Word doesn't fit, start new line
          if (currentLine.trim() !== "") {
            lines.push(currentLine.trim());
          }
          currentLine = word;
          currentWidth = wordWidth;
        }
      }
    }

    // Add remaining line if it has content
    if (currentLine.trim() !== "") {
      lines.push(currentLine.trim());
    }
  }

  return lines.join("\n");
}

function updatePreview(text) {
  const wrappedText = wrapTextFor80mm(text);
  printerPreview.textContent = wrappedText || "Your note will appear here...";

  // Update character counter
  const lines = wrappedText ? wrappedText.split("\n") : [];
  const totalChars = text.length;
  const totalLines = lines.length;

  charCounter.textContent = `${totalChars} chars, ${totalLines} lines`;

  return wrappedText;
}

function updateCaption(name) {
  printerCaption.textContent = name
    ? `Printer: ${name}`
    : "No printer selected";
}

function updateWarning(text) {
  const wrappedText = wrapTextFor80mm(text);
  const lines = wrappedText.split("\n");

  if (lines.length > 8) {
    wordWarning.textContent = `${lines.length} lines - might be long for ticket.`;
  } else {
    wordWarning.textContent = "";
  }
}

async function populatePrinters(selected) {
  const printers = await window.noteAPI.listPrinters();
  printerSelect.innerHTML = "";
  printers.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.name;
    opt.textContent = p.name;
    if (p.name === selected) opt.selected = true;
    printerSelect.appendChild(opt);
  });
}

noteInput.addEventListener("input", (e) => {
  const text = e.target.value;
  const hasText = !!text.trim();
  printBtn.disabled = !hasText;

  // Update preview and warning
  updatePreview(text);
  updateWarning(text);
  updateClearButton();
});

noteInput.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    if (!printBtn.disabled) doPrint();
  }
});

printBtn.addEventListener("click", () => doPrint());

// Close button functionality
closeBtn.addEventListener("click", async () => {
  await window.noteAPI.closeWindow();
});

// Due date button event listeners
dueDatePlus1.addEventListener("click", () => setDueDate(1, dueDatePlus1));
dueDatePlus7.addEventListener("click", () => setDueDate(7, dueDatePlus7));
dueDatePlus14.addEventListener("click", () => setDueDate(14, dueDatePlus14));
dueDateOther.addEventListener("click", () => {
  // Reset input and show modal
  daysInput.value = "1";
  dueDateModal.showModal();
  daysInput.focus();
});

// Due date modal event listeners
confirmDaysBtn.addEventListener("click", () => {
  const days = parseInt(daysInput.value);
  if (!isNaN(days) && days > 0) {
    setDueDate(days, dueDateOther);
    dueDateModal.close();
  } else {
    // Show error feedback
    daysInput.style.borderColor = "red";
    setTimeout(() => {
      daysInput.style.borderColor = "";
    }, 2000);
  }
});

cancelDaysBtn.addEventListener("click", () => {
  dueDateModal.close();
});

// Allow Enter key to confirm in the modal
daysInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    confirmDaysBtn.click();
  } else if (e.key === "Escape") {
    e.preventDefault();
    dueDateModal.close();
  }
});
dueDateClear.addEventListener("click", () => {
  selectedDueDate = null;
  currentSelectedButton = null;
  updateDueDateButtons();
  updateClearButton();
});

function updateClearButton() {
  if (selectedDueDate) {
    dueDateClear.classList.remove("disabled");
  } else {
    dueDateClear.classList.add("disabled");
  }
}

// Styled notification function
function showNotification(message, type = "info") {
  // Remove any existing notifications
  const existingNotification = document.querySelector(".notification");
  const existingOverlay = document.querySelector(".notification-overlay");
  if (existingNotification) existingNotification.remove();
  if (existingOverlay) existingOverlay.remove();

  // Check if settings dialog is open
  const settingsDialog = document.getElementById("settingsModal");
  const isDialogOpen = settingsDialog && settingsDialog.open;

  // Create overlay
  const overlay = document.createElement("div");
  overlay.className = "notification-overlay";

  // Create notification
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  // If dialog is open, adjust positioning to be relative to the dialog
  if (isDialogOpen) {
    notification.style.position = "absolute";
    notification.style.zIndex = "999999";
    overlay.style.zIndex = "999998";
  }

  notification.innerHTML = `
    <p>${message}</p>
    <button onclick="this.parentElement.remove(); document.querySelector('.notification-overlay').remove();">OK</button>
  `;

  // Append to appropriate parent
  const parentElement = isDialogOpen ? settingsDialog : document.body;
  parentElement.appendChild(overlay);
  parentElement.appendChild(notification);

  // Auto-remove on overlay click
  overlay.addEventListener("click", () => {
    notification.remove();
    overlay.remove();
  });
}

function updateDueDateButtons() {
  // Remove selected class from all buttons
  document.querySelectorAll(".due-date-btn").forEach((btn) => {
    btn.classList.remove("selected");
  });

  // Update label
  if (selectedDueDate) {
    const formattedDate = selectedDueDate
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "/");
    dueDateLabel.textContent = `Due Date: ${formattedDate}`;
    if (currentSelectedButton) {
      currentSelectedButton.classList.add("selected");
    }
  } else {
    dueDateLabel.textContent = "Due Date:";
  }
  updateClearButton();
}

function setDueDate(days, buttonElement) {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + days);
  selectedDueDate = dueDate;
  currentSelectedButton = buttonElement;
  updateDueDateButtons();
}
settingsBtn.addEventListener("click", async () => {
  const saved = await window.noteAPI.getSavedPrinter();
  const silentMode = await window.noteAPI.getSilentMode();
  const extraSpaceTop = await window.noteAPI.getExtraSpaceTop();
  const extraSpaceBottom = await window.noteAPI.getExtraSpaceBottom();
  await populatePrinters(saved);
  silentModeToggle.checked = silentMode;
  extraSpaceTopInput.value = extraSpaceTop;
  extraSpaceBottomInput.value = extraSpaceBottom;
  settingsModal.showModal();
});

saveSettingsBtn.addEventListener("click", async () => {
  const name = printerSelect.value;
  await window.noteAPI.savePrinter(name);

  // Save silent mode setting
  const currentSilent = await window.noteAPI.getSilentMode();
  if (currentSilent !== silentModeToggle.checked) {
    await window.noteAPI.toggleSilentMode();
  }

  // Save new settings
  await window.noteAPI.saveExtraSpaceTop(parseInt(extraSpaceTopInput.value));
  await window.noteAPI.saveExtraSpaceBottom(
    parseInt(extraSpaceBottomInput.value)
  );

  updateCaption(name);
  settingsModal.close();
});

closeSettingsBtn.addEventListener("click", () => settingsModal.close());

testPrintBtn.addEventListener("click", async () => {
  console.log("Test print button clicked");
  const selectedPrinter = printerSelect.value;
  console.log("Selected printer:", selectedPrinter);
  if (!selectedPrinter) {
    showNotification("Please select a printer first", "error");
    return;
  }

  testPrintBtn.disabled = true;
  testPrintBtn.textContent = "Testing...";

  try {
    const result = await window.noteAPI.testPrinter(selectedPrinter);

    if (result.success) {
      showNotification(
        "Test print sent successfully! Check your printer.",
        "success"
      );
    } else {
      showNotification(`Test print failed: ${result.error}`, "error");
    }
  } catch (error) {
    showNotification(`Test print error: ${error.message}`, "error");
  } finally {
    testPrintBtn.disabled = false;
    testPrintBtn.textContent = "Test Print";
  }
});

async function doPrint() {
  const originalText = noteInput.value;
  const wrappedText = wrapTextFor80mm(originalText); // Wrap only at print time

  // Show that we're attempting to print
  printBtn.disabled = true;
  printBtn.textContent = "Printing...";
  wordWarning.textContent = "Sending to printer...";

  try {
    const result = await window.noteAPI.printNote({
      text: wrappedText,
      dueDate: selectedDueDate,
    });
    if (result.success) {
      noteInput.value = "";
      printBtn.disabled = true;
      updateWarning("");
      updatePreview(""); // Clear preview
      wordWarning.textContent = "✓ Printed successfully!";
      printBtn.textContent = "Print";

      // Clear due date after successful print
      selectedDueDate = null;
      currentSelectedButton = null;
      updateDueDateButtons();

      // Clear success message after 3 seconds
      setTimeout(() => {
        wordWarning.textContent = "";
      }, 3000);
    } else {
      wordWarning.textContent = `Print failed: ${result.error}`;
      printBtn.textContent = "Print";
      printBtn.disabled = false;
    }
  } catch (error) {
    wordWarning.textContent = `Error: ${error.message}`;
    printBtn.textContent = "Print";
    printBtn.disabled = false;
  }
}

// Initialise on load
window.addEventListener("DOMContentLoaded", async () => {
  const saved = await window.noteAPI.getSavedPrinter();
  updateCaption(saved);
  await populatePrinters(saved);

  // Initialize button states
  const hasText = !!noteInput.value.trim();
  printBtn.disabled = !hasText;
  updateClearButton();

  // Initialize preview
  updatePreview(noteInput.value);
});
