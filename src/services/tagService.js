import prisma from "../utils/prisma.js";
import AppError from "../utils/AppError.js";
import { logger } from "../utils/loggerHelper.js";

const tableConfig = {
  images: { table: 'images', transform: (r) => ({ name: r.tag, count: Number(r.count) }) },
  albums: { table: 'albums', transform: (r) => ({ name: r.tag, count: Number(r.count) }) },
  'link-posts': { table: 'link_posts', transform: (r) => ({ name: r.tag, count: Number(r.count) }) },
};

export async function getTags({ type, sort = 'count' }) {
  const order = sort === 'name' ? 'tag' : 'count';

  if (type) {
    const cfg = tableConfig[type];
    if (!cfg) throw new AppError('无效的内容类型', 400);
    const rows = await prisma.$queryRawUnsafe(`
      SELECT jt.tag, COUNT(*) AS \`count\`
      FROM \`${cfg.table}\`
      CROSS JOIN JSON_TABLE(tags, '$[*]' COLUMNS (tag VARCHAR(100) PATH '$')) AS jt
      WHERE tags IS NOT NULL AND tags != CAST('[]' AS JSON)
      GROUP BY jt.tag
      ORDER BY \`${order}\` DESC
    `);
    return rows.map(cfg.transform);
  }

  // 全部类型聚合
  let allTags = [];
  for (const cfg of Object.values(tableConfig)) {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT jt.tag, COUNT(*) AS \`count\`
      FROM \`${cfg.table}\`
      CROSS JOIN JSON_TABLE(tags, '$[*]' COLUMNS (tag VARCHAR(100) PATH '$')) AS jt
      WHERE tags IS NOT NULL AND tags != CAST('[]' AS JSON)
      GROUP BY jt.tag
    `);
    allTags.push(...rows.map(cfg.transform));
  }

  // 合并相同标签
  const merged = new Map();
  for (const t of allTags) {
    merged.set(t.name, (merged.get(t.name) || 0) + t.count);
  }

  const result = [...merged.entries()].map(([name, count]) => ({ name, count }));
  return sort === 'name'
    ? result.sort((a, b) => a.name.localeCompare(b.name))
    : result.sort((a, b) => b.count - a.count);
}
