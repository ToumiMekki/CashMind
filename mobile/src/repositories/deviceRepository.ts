import { getDatabase } from '../database';

function generateDeviceId(): string {
  return `dev_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;
}

export async function getDevice(): Promise<{
  deviceId: string;
  senderName: string;
}> {
  const db = await getDatabase();
  const [r] = await db.executeSql(
    'SELECT deviceId, senderName FROM device WHERE id = 1'
  );
  if (r.rows.length > 0) {
    const row = r.rows.item(0) as { deviceId: string; senderName: string };
    const name = (row.senderName || '').trim();
    return { deviceId: row.deviceId, senderName: name === 'User' ? '' : name };
  }
  const deviceId = generateDeviceId();
  await db.executeSql(
    'INSERT INTO device (id, deviceId, senderName) VALUES (1, ?, ?)',
    [deviceId, '']
  );
  return { deviceId, senderName: '' };
}

export async function setSenderName(senderName: string): Promise<void> {
  const db = await getDatabase();
  const v = senderName.trim();
  await db.executeSql('UPDATE device SET senderName = ? WHERE id = 1', [v]);
}

export async function setDeviceId(deviceId: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('UPDATE device SET deviceId = ? WHERE id = 1', [
    deviceId.trim(),
  ]);
}
