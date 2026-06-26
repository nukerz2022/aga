import dgram from 'dgram';
import dns from 'dns/promises';

export async function querySampServer(host, port = 7777, timeout = 5000) {
  let ip = host;
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    try {
      const resolved = await dns.lookup(host);
      ip = resolved.address;
    } catch {
      throw new Error(`Tidak dapat resolve host: ${host}`);
    }
  }

  return new Promise((resolve, reject) => {
    const client = dgram.createSocket('udp4');
    const timer = setTimeout(() => {
      try { client.close(); } catch {}
      reject(new Error('Query timeout — server mungkin offline atau tidak mendukung SA-MP query'));
    }, timeout);

    const ipParts = ip.split('.').map(Number);
    const packet = Buffer.alloc(11);
    packet.write('SAMP', 0, 'ascii');
    packet[4] = ipParts[0] || 0;
    packet[5] = ipParts[1] || 0;
    packet[6] = ipParts[2] || 0;
    packet[7] = ipParts[3] || 0;
    packet[8] = port & 0xff;
    packet[9] = (port >> 8) & 0xff;
    packet[10] = 0x69; // 'i' = info query

    client.on('message', (msg) => {
      clearTimeout(timer);
      try { client.close(); } catch {}
      try {
        resolve(parseSampInfo(msg));
      } catch (e) {
        reject(new Error('Gagal parse response SA-MP'));
      }
    });

    client.on('error', (err) => {
      clearTimeout(timer);
      try { client.close(); } catch {}
      reject(err);
    });

    client.send(packet, 0, packet.length, port, ip, (err) => {
      if (err) {
        clearTimeout(timer);
        try { client.close(); } catch {}
        reject(err);
      }
    });
  });
}

function parseSampInfo(buf) {
  if (buf.length < 11) throw new Error('Response terlalu pendek');
  let offset = 11;
  if (buf.toString('ascii', offset, offset + 1) !== 'i') offset++;

  const password = buf.readUInt8(offset++);
  const players = buf.readUInt16LE(offset); offset += 2;
  const maxPlayers = buf.readUInt16LE(offset); offset += 2;

  const hostnameLen = buf.readUInt32LE(offset); offset += 4;
  const hostname = buf.toString('ascii', offset, offset + hostnameLen); offset += hostnameLen;

  const gamemodeLen = buf.readUInt32LE(offset); offset += 4;
  const gamemode = buf.toString('ascii', offset, offset + gamemodeLen); offset += gamemodeLen;

  const languageLen = buf.readUInt32LE(offset); offset += 4;
  const language = buf.toString('ascii', offset, offset + languageLen);

  return { hostname, players, maxPlayers, gamemode, language, password: !!password };
}
