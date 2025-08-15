const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("noteAPI", {
  listPrinters: () => ipcRenderer.invoke("printers:list"),
  getSavedPrinter: () => ipcRenderer.invoke("printer:getSaved"),
  savePrinter: (name) => ipcRenderer.invoke("printer:save", name),
  testPrinter: (name) => ipcRenderer.invoke("printer:test", name),
  printNote: (data) => ipcRenderer.invoke("note:print", data),
  simplePrint: (data) => ipcRenderer.invoke("printer:simple-print", data),
  toggleSilentMode: () => ipcRenderer.invoke("printer:toggle-silent"),
  getSilentMode: () => ipcRenderer.invoke("printer:get-silent"),
  getExtraSpaceTop: () => ipcRenderer.invoke("settings:get-extra-space-top"),
  saveExtraSpaceTop: (length) =>
    ipcRenderer.invoke("settings:save-extra-space-top", length),
  getExtraSpaceBottom: () =>
    ipcRenderer.invoke("settings:get-extra-space-bottom"),
  saveExtraSpaceBottom: (length) =>
    ipcRenderer.invoke("settings:save-extra-space-bottom", length),
  closeWindow: () => ipcRenderer.invoke("window:close"),
});
