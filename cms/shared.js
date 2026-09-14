export function isConfigured(config) {
  return /^[a-z0-9-]+$/.test(config.projectId || '') && /^[a-z0-9_-]+$/.test(config.dataset || '');
}
export function queryURL(config, query, params = {}, cdn = true) {
  const url = new URL('https://' + config.projectId + (cdn ? '.apicdn.sanity.io' : '.api.sanity.io') + '/v' + config.apiVersion + '/data/query/' + config.dataset);
  url.searchParams.set('query', query);
  url.searchParams.set('perspective', 'published');
  for (const [key, value] of Object.entries(params)) url.searchParams.set('$' + key, JSON.stringify(value));
  return url;
}
export async function fetchContent(config, query, params = {}, {cdn = true, fetcher = fetch} = {}) {
  if (!isConfigured(config)) return null;
  const response = await fetcher(queryURL(config, query, params, cdn), {signal: AbortSignal.timeout(8000)});
  if (!response.ok) throw new Error('Sanity returned HTTP ' + response.status);
  const data = await response.json();
  if (!Object.hasOwn(data, 'result')) throw new Error('Invalid Sanity response');
  return data.result;
}
export function imageURL(image, config) {
  const ref = image?.asset?._ref;
  const match = /^image-([a-zA-Z0-9]+)-(\d+x\d+)-(jpg|jpeg|png|webp|gif|avif)$/.exec(ref || '');
  if (!match || !isConfigured(config)) return null;
  return 'https://cdn.sanity.io/images/' + config.projectId + '/' + config.dataset + '/' + match[1] + '-' + match[2] + '.' + match[3] + '?auto=format&w=2000&fit=max';
}
export const pageQuery = '*[_type == "sitePage" && _id == $id][0]';
export const eventsQuery = '*[_type == "event"] | order(startsAt asc){"id":_id,title,category,summary,location,audience,startsAt,endsAt,"image":image.asset->url,"imageAlt":image.alt,url,featured}';
