const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const Store = require("electron-store");

// Persisted store for saved printer
const store = new Store({
  defaults: {
    selectedPrinterName: null,
    silentPrinting: false, // Set to true for production, false for debugging
    extraSpaceTop: 2, // number of extra newlines at top
    extraSpaceBottom: 3, // number of extra newlines at bottom
  },
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 800,
    resizable: false,
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC handlers
ipcMain.handle("printers:list", async () => {
  const wc = mainWindow.webContents;
  if (wc.getPrintersAsync) {
    return await wc.getPrintersAsync();
  }
  return wc.getPrinters();
});

ipcMain.handle("printer:getSaved", () => {
  return store.get("selectedPrinterName", null);
});

ipcMain.handle("printer:save", (event, name) => {
  store.set("selectedPrinterName", name);
  return true;
});

ipcMain.handle("printer:toggle-silent", (event) => {
  const current = store.get("silentPrinting", false);
  store.set("silentPrinting", !current);
  return !current;
});

ipcMain.handle("printer:get-silent", (event) => {
  return store.get("silentPrinting", false);
});

ipcMain.handle("settings:get-extra-space-top", (event) => {
  return store.get("extraSpaceTop", 2);
});

ipcMain.handle("settings:save-extra-space-top", (event, length) => {
  store.set("extraSpaceTop", length);
  return true;
});

ipcMain.handle("settings:get-extra-space-bottom", (event) => {
  return store.get("extraSpaceBottom", 3);
});

ipcMain.handle("settings:save-extra-space-bottom", (event, length) => {
  store.set("extraSpaceBottom", length);
  return true;
});

ipcMain.handle("window:close", () => {
  mainWindow.close();
  return true;
});

ipcMain.handle("printer:simple-print", async (event, { text }) => {
  // Alternative printing method - opens a simple window that can be printed manually
  if (!text || !text.trim()) {
    return { success: false, error: "Empty note" };
  }

  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "/");

  const html = `<!doctype html>
<meta charset="utf-8">
<title>Note Print Preview</title>
<style>
@media print {
  @page { size: 80mm auto; margin: 6mm 4mm; }
  body { margin: 0; }
}
@media screen {
  body { max-width: 80mm; margin: 20px auto; padding: 20px; border: 1px solid #ccc; }
}
.wrap { 
  font-family: system-ui, 'Segoe UI', Arial, sans-serif; 
  font-size: 24pt; 
  line-height: 1.25; 
  word-wrap: break-word; 
}
.meta { 
  font-size: 10pt; 
  margin-top: 8px; 
  opacity: 0.6; 
}
.print-instructions {
  font-size: 12pt;
  color: #666;
  margin-bottom: 20px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}
@media print {
  .print-instructions { display: none; }
}
</style>
<body>
<div class="print-instructions">
  Press Ctrl+P to print this note. Close this window when done.
</div>
<div class="wrap">
  ${escaped}
  <div class="meta">${timestamp}</div>
</div>
<script>
// Auto-focus and enable Ctrl+P
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'p') {
    e.preventDefault();
    window.print();
  }
});
</script>
</body>`;

  const printWin = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "Print Preview",
  });

  await printWin.loadURL(
    "data:text/html;charset=utf-8," + encodeURIComponent(html)
  );

  return { success: true, message: "Print preview window opened" };
});

// Shared print function
async function doPrint(text, dueDate = null, printerName = null) {
  if (!text || !text.trim()) {
    return { success: false, error: "Empty note" };
  }

  const selectedPrinter = printerName || store.get("selectedPrinterName");
  const extraSpaceTop = store.get("extraSpaceTop", 2);
  const extraSpaceBottom = store.get("extraSpaceBottom", 3);

  if (!selectedPrinter) {
    return { success: false, error: "No printer selected" };
  }

  // Get list of available printers to validate the selected printer
  const wc = mainWindow.webContents;
  let printers;
  try {
    if (wc.getPrintersAsync) {
      printers = await wc.getPrintersAsync();
    } else {
      printers = wc.getPrinters();
    }

    const printerExists = printers.some((p) => p.name === selectedPrinter);

    if (!printerExists) {
      return {
        success: false,
        error: `Printer "${selectedPrinter}" not found. Please check settings.`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to get printers: ${error.message}`,
    };
  }

  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  // Include both date and time
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "/");
  const time = now.toTimeString().slice(0, 5); // HH:MM format
  const timestamp = `${date} ${time}`;

  // Format due date if provided
  let dueDateHtml = "";
  if (dueDate) {
    const formattedDueDate = new Date(dueDate)
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "/");
    dueDateHtml = `<div class="due-date">DUE: ${formattedDueDate}</div>`;
  }

  // Create extra newlines for spacing - both top and bottom
  const topNewlines = extraSpaceTop > 0 ? "\n".repeat(extraSpaceTop) : ""; // Extra space at top
  const bottomNewlines =
    extraSpaceBottom > 0 ? "<br>".repeat(extraSpaceBottom) + "." : ""; // Extra space at bottom + dot to prevent cutoff

  const html = `<!doctype html><meta charset="utf-8"><style>@page { size: 80mm auto; margin: 0 } body { margin:0; } .wrap { width:80mm; padding:6mm 4mm; font-family: 'Courier New', monospace; font-size:24pt; line-height:1.2; white-space: pre-line; word-break: break-all; } .meta { font-size:10pt; margin-top:8px; opacity:.6; font-weight: bold; } .due-date { background: black; color: white; font-weight: bold; padding: 4mm; margin-bottom: 4mm; text-align: center; font-size: 16pt; display: block; width: 100%; box-sizing: border-box; }</style><div class="wrap">${topNewlines}${dueDateHtml}${escaped}<div class="meta">${timestamp}${bottomNewlines}</div></div>`;

  const printWin = new BrowserWindow({
    show: false,
    width: 400,
    height: 600,
    webPreferences: { offscreen: true },
  });

  return new Promise((resolve) => {
    let resolved = false;

    const cleanup = (result) => {
      if (resolved) return;
      resolved = true;

      if (!printWin.isDestroyed()) {
        printWin.close();
      }
      resolve(result);
    };

    // Set up event listeners
    printWin.webContents.on("dom-ready", () => {
      // Try printing immediately when DOM is ready
      setTimeout(() => {
        const silentMode = store.get("silentPrinting", false);

        const printOptions = {
          silent: silentMode,
          deviceName: selectedPrinter,
          printBackground: true,
          margins: { marginType: "minimum" },
        };

        try {
          printWin.webContents.print(printOptions, (success, failureReason) => {
            if (!success) {
              cleanup({
                success: false,
                error: failureReason || "Print failed for unknown reason",
              });
            } else {
              cleanup({ success: true });
            }
          });
        } catch (error) {
          cleanup({
            success: false,
            error: `Print operation failed: ${error.message}`,
          });
        }
      }, 500);
    });

    printWin.webContents.on("did-finish-load", () => {
      // Use stored setting for silent printing
      const silentMode = store.get("silentPrinting", false);

      const printOptions = {
        silent: silentMode,
        deviceName: selectedPrinter,
        printBackground: true,
        margins: { marginType: "minimum" },
      };

      try {
        printWin.webContents.print(printOptions, (success, failureReason) => {
          if (!success) {
            cleanup({
              success: false,
              error: failureReason || "Print failed for unknown reason",
            });
          } else {
            cleanup({ success: true });
          }
        });
      } catch (error) {
        cleanup({
          success: false,
          error: `Print operation failed: ${error.message}`,
        });
      }
    });

    printWin.webContents.on(
      "did-fail-load",
      (event, errorCode, errorDescription) => {
        cleanup({
          success: false,
          error: `Failed to load print content: ${errorDescription}`,
        });
      }
    );

    // Timeout for the operation
    setTimeout(() => {
      cleanup({
        success: false,
        error: "Print timeout - operation took too long",
      });
    }, 15000);

    // Load the URL
    printWin
      .loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html))
      .catch((error) => {
        cleanup({
          success: false,
          error: `Failed to load print content: ${error.message}`,
        });
      });
  });
}

ipcMain.handle("printer:test", async (event, printerName) => {
  console.log("Test print requested for printer:", printerName);

  // Use the main print logic with test text
  const testText = "Hey - here is your test print! You're welcome";

  try {
    const result = await doPrint(testText, null, printerName);
    return result;
  } catch (error) {
    return {
      success: false,
      error: `Test print failed: ${error.message}`,
    };
  }
});

ipcMain.handle("note:print", async (event, { text, dueDate }) => {
  return await doPrint(text, dueDate);
});
