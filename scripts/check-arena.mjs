const api = 'https://api.are.na/v3';
const json = async url => {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.json();
};

const response = await json(`${api}/users/harshita-shyale/contents?per=50&type=Channel`);
const channels = (response.data || []).filter(channel => !channel.visibility || channel.visibility === 'public');
const results = await Promise.all(channels.map(async channel => {
  let page = 1, total = 0, more = true;
  while (more) {
    const payload = await json(`${api}/channels/${encodeURIComponent(channel.slug)}/contents?per=100&page=${page}`);
    total += (payload.data || []).filter(block => {
      const type = String(block.type || '').toLowerCase();
      return type === 'image' || ((type === 'link' || type === 'attachment') && block.image && block.image.src);
    }).length;
    more = !!(payload.meta && payload.meta.has_more_pages);
    page++;
  }
  return { title: channel.title, count: total };
}));
console.log(`public channels: ${channels.length}`);
console.log(`image blocks: ${results.reduce((sum, channel) => sum + channel.count, 0)}`);
for (const channel of results) console.log(`${channel.title}: ${channel.count}`);
