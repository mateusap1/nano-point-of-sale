import message2Background from './messageToBackground';

export default function updateInfo(sync: boolean): void {
  message2Background('update-info', { sync });
}
