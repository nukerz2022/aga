import axios from 'axios';

const client = axios.create({ timeout: 8000 });

function isSteamId64(input) {
  return /^\d{17}$/.test(input.trim());
}

function extractXmlField(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}>([^<]*)</${tag}>`));
  return match ? (match[1] ?? match[2] ?? '').trim() : null;
}

export async function getSteamProfile(input) {
  const clean = input.trim().replace(/https?:\/\/steamcommunity\.com\/(id|profiles)\//i, '').replace(/\/$/, '');
  const isId64 = isSteamId64(clean);
  const url = isId64
    ? `https://steamcommunity.com/profiles/${clean}/?xml=1`
    : `https://steamcommunity.com/id/${clean}/?xml=1`;

  const res = await client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const xml = res.data;

  if (xml.includes('<error>')) {
    const err = extractXmlField(xml, 'error');
    throw new Error(err || 'Profil tidak ditemukan');
  }

  const steamId64 = extractXmlField(xml, 'steamID64');
  const steamId = extractXmlField(xml, 'steamID');
  const onlineState = extractXmlField(xml, 'onlineState');
  const stateMessage = extractXmlField(xml, 'stateMessage');
  const privacyState = extractXmlField(xml, 'privacyState');
  const avatarFull = extractXmlField(xml, 'avatarFull');
  const memberSince = extractXmlField(xml, 'memberSince');
  const location = extractXmlField(xml, 'location');
  const realname = extractXmlField(xml, 'realname');
  const vacBanned = extractXmlField(xml, 'vacBanned');
  const tradeBanState = extractXmlField(xml, 'tradeBanState');
  const isLimited = extractXmlField(xml, 'isLimitedAccount');
  const customURL = extractXmlField(xml, 'customURL');
  const headline = extractXmlField(xml, 'headline');

  return {
    steamId64,
    steamId,
    onlineState,
    stateMessage,
    privacyState,
    avatarFull,
    memberSince,
    location,
    realname,
    vacBanned: vacBanned === '1',
    tradeBanState,
    isLimited: isLimited === '1',
    customURL,
    headline,
    profileUrl: steamId64
      ? `https://steamcommunity.com/profiles/${steamId64}`
      : `https://steamcommunity.com/id/${clean}`,
  };
}
