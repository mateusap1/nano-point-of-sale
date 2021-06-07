const electron = require('electron');

const { ipcRenderer } = electron;

export default function message2Background(
  command: string,
  payload: unknown
): void {
  ipcRenderer.invoke('message-from-main', {
    command,
    payload,
  });
}
