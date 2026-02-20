import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

const MAIN_DOMAINS = ['shopu.ge', 'momigvare.ge', 'localhost', '127.0.0.1'];

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

router.get('/sitemap.xml', async (req, res) => {
  try {
    let host = (req.get('x-original-host') || req.get('host') || '').split(':')[0].toLowerCase().replace(/^www\./, '');

    // Resolve tenant — same logic as tenantResolver but lightweight
    let tenant = null;

    // Check custom domain first
    tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { customDomain: host },
          { customDomain: `www.${host}` },
        ],
        customDomain: { not: null },
        isActive: true,
      },
      select: { id: true, subdomain: true, customDomain: true },
    });

    // Fall back to subdomain
    if (!tenant) {
      const parts = host.split('.');
      let subdomain = null;
      if (host.includes('localhost') && parts.length > 1 && parts[0] !== 'localhost') {
        subdomain = parts[0];
      } else if (parts.length > 2) {
        subdomain = parts[0];
      }

      if (subdomain) {
        tenant = await prisma.tenant.findUnique({
          where: { subdomain },
          select: { id: true, subdomain: true, customDomain: true },
        });
      }
    }

    if (!tenant) {
      return res.status(404).send('Store not found');
    }

    const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
    const origin = `${protocol}://${req.get('host')}`;

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { tenantId: tenant.id, isActive: true, isDeleted: false },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.category.findMany({
        where: { tenantId: tenant.id, isDeleted: false },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const urls = [
      { loc: `${origin}/`, changefreq: 'daily', priority: '1.0' },
    ];

    for (const cat of categories) {
      urls.push({
        loc: `${origin}/category/${escapeXml(encodeURIComponent(cat.slug))}`,
        lastmod: cat.updatedAt.toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.8',
      });
    }

    for (const product of products) {
      urls.push({
        loc: `${origin}/product/${escapeXml(encodeURIComponent(product.slug))}`,
        lastmod: product.updatedAt.toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.7',
      });
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    res.status(500).send('Internal server error');
  }
});

export default router;
