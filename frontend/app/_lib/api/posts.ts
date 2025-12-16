export async function fetchPostsByBbox(bbox: {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}) {
  const bboxStr = `${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng}`;
  const res = await fetch(`/posts?bbox=${bboxStr}`);
  return res.json();
}