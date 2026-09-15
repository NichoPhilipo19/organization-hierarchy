import type { OrgNode } from '../lib';

/**
 * Dummy data: 2 company (multi-root), ±50 node, 4 level.
 * Mencakup kasus visual: only-child, 2 anak, banyak anak, subtree dalam.
 */

/**
 * Avatar dummy — di-generate lewat DiceBear (SVG, deterministic per id,
 * tanpa perlu nyimpen file gambar di repo). Sengaja CUMA dipasang di
 * sebagian node: biar live demo menunjukkan dua kondisi sekaligus — kartu
 * yang sudah ada foto vs kartu yang masih fallback ke inisial (lihat
 * `NodeCard`, FR-9) — kayak progres pengisian data avatar yang belum
 * selesai di aplikasi beneran. Root company (`tdt`, `tc`) sengaja
 * dibiarkan tanpa avatar juga: initials-nya (`TD`/`TC`) lebih masuk akal
 * dibaca sebagai singkatan nama perusahaan ketimbang logo.
 */
function avatar(id: string): string {
  return `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(id)}`;
}

export const sampleData: OrgNode[] = [
  // ── Company A: Teras Digital Tech ──────────────────────────────
  { id: 'tdt', parentId: null, name: 'Teras Digital Tech', title: 'Holding' },

  { id: 'tdt-ceo', parentId: 'tdt', name: 'Arini Wijaya', title: 'CEO', avatarUrl: avatar('tdt-ceo') },

  { id: 'tdt-cto', parentId: 'tdt-ceo', name: 'Bagus Pratama', title: 'CTO', avatarUrl: avatar('tdt-cto') },
  { id: 'tdt-cfo', parentId: 'tdt-ceo', name: 'Citra Lestari', title: 'CFO' },
  { id: 'tdt-coo', parentId: 'tdt-ceo', name: 'Dimas Nugroho', title: 'COO', avatarUrl: avatar('tdt-coo') },
  { id: 'tdt-chro', parentId: 'tdt-ceo', name: 'Eka Saputri', title: 'CHRO', avatarUrl: avatar('tdt-chro') },

  // Engineering (di bawah CTO)
  { id: 'eng-vp', parentId: 'tdt-cto', name: 'Fajar Ramadhan', title: 'VP Engineering', avatarUrl: avatar('eng-vp') },
  { id: 'sec-lead', parentId: 'tdt-cto', name: 'Gita Permata', title: 'Head of Security' },

  { id: 'fe-lead', parentId: 'eng-vp', name: 'Hendra Kusuma', title: 'Frontend Lead', avatarUrl: avatar('fe-lead') },
  { id: 'be-lead', parentId: 'eng-vp', name: 'Indah Cahyani', title: 'Backend Lead', avatarUrl: avatar('be-lead') },
  { id: 'qa-lead', parentId: 'eng-vp', name: 'Joko Santoso', title: 'QA Lead' },
  { id: 'devops-lead', parentId: 'eng-vp', name: 'Kirana Dewi', title: 'DevOps Lead', avatarUrl: avatar('devops-lead') },

  { id: 'fe-1', parentId: 'fe-lead', name: 'Lukman Hakim', title: 'Frontend Engineer', avatarUrl: avatar('fe-1') },
  { id: 'fe-2', parentId: 'fe-lead', name: 'Maya Sari', title: 'Frontend Engineer' },
  { id: 'fe-3', parentId: 'fe-lead', name: 'Naufal Rizki', title: 'Frontend Engineer', avatarUrl: avatar('fe-3') },
  { id: 'be-1', parentId: 'be-lead', name: 'Oktavia Putri', title: 'Backend Engineer', avatarUrl: avatar('be-1') },
  { id: 'be-2', parentId: 'be-lead', name: 'Putra Wardana', title: 'Backend Engineer' },
  { id: 'be-3', parentId: 'be-lead', name: 'Qori Amalia', title: 'Backend Engineer', avatarUrl: avatar('be-3') },
  { id: 'be-4', parentId: 'be-lead', name: 'Rendi Prasetyo', title: 'Backend Engineer', avatarUrl: avatar('be-4') },
  { id: 'qa-1', parentId: 'qa-lead', name: 'Sinta Maharani', title: 'QA Engineer' }, // only-child — sengaja tanpa avatar
  { id: 'devops-1', parentId: 'devops-lead', name: 'Taufik Hidayat', title: 'SRE', avatarUrl: avatar('devops-1') },
  { id: 'devops-2', parentId: 'devops-lead', name: 'Umi Kalsum', title: 'Platform Engineer', avatarUrl: avatar('devops-2') },

  // Security (only-child branch)
  { id: 'sec-1', parentId: 'sec-lead', name: 'Vino Aditya', title: 'Security Analyst' },

  // Finance (di bawah CFO)
  { id: 'fin-mgr', parentId: 'tdt-cfo', name: 'Wulan Anggraini', title: 'Finance Manager', avatarUrl: avatar('fin-mgr') },
  { id: 'acc-mgr', parentId: 'tdt-cfo', name: 'Xaverius Bima', title: 'Accounting Manager', avatarUrl: avatar('acc-mgr') },
  { id: 'fin-1', parentId: 'fin-mgr', name: 'Yuni Astuti', title: 'Finance Analyst' },
  { id: 'fin-2', parentId: 'fin-mgr', name: 'Zaki Maulana', title: 'Treasury Analyst', avatarUrl: avatar('fin-2') },
  { id: 'acc-1', parentId: 'acc-mgr', name: 'Ayu Rahmawati', title: 'Accountant', avatarUrl: avatar('acc-1') },
  { id: 'acc-2', parentId: 'acc-mgr', name: 'Bayu Segara', title: 'Tax Specialist' },

  // Operations (di bawah COO)
  { id: 'ops-mgr', parentId: 'tdt-coo', name: 'Chandra Wibowo', title: 'Ops Manager', avatarUrl: avatar('ops-mgr') },
  { id: 'cs-mgr', parentId: 'tdt-coo', name: 'Dewi Fortuna', title: 'CS Manager', avatarUrl: avatar('cs-mgr') },
  { id: 'ops-1', parentId: 'ops-mgr', name: 'Erlangga Putra', title: 'Ops Specialist' },
  { id: 'cs-1', parentId: 'cs-mgr', name: 'Fitri Handayani', title: 'CS Agent', avatarUrl: avatar('cs-1') },
  { id: 'cs-2', parentId: 'cs-mgr', name: 'Galih Pambudi', title: 'CS Agent', avatarUrl: avatar('cs-2') },
  { id: 'cs-3', parentId: 'cs-mgr', name: 'Hana Salsabila', title: 'CS Agent' },

  // HR (di bawah CHRO)
  { id: 'hr-mgr', parentId: 'tdt-chro', name: 'Irfan Maulid', title: 'HR Manager', avatarUrl: avatar('hr-mgr') },
  { id: 'hr-1', parentId: 'hr-mgr', name: 'Jasmine Aulia', title: 'Recruiter', avatarUrl: avatar('hr-1') },
  { id: 'hr-2', parentId: 'hr-mgr', name: 'Krisna Bayu', title: 'HR Generalist' },

  // ── Company B: Teras Commerce (subsidiary) ─────────────────────
  { id: 'tc', parentId: null, name: 'Teras Commerce', title: 'Subsidiary' },

  { id: 'tc-md', parentId: 'tc', name: 'Larasati Widya', title: 'Managing Director', avatarUrl: avatar('tc-md') },

  { id: 'tc-head-prod', parentId: 'tc-md', name: 'Miko Ardhana', title: 'Head of Product', avatarUrl: avatar('tc-head-prod') },
  { id: 'tc-head-mkt', parentId: 'tc-md', name: 'Nadya Paramitha', title: 'Head of Marketing' },
  { id: 'tc-head-log', parentId: 'tc-md', name: 'Oscar Firmansyah', title: 'Head of Logistics', avatarUrl: avatar('tc-head-log') },

  { id: 'tc-pm-1', parentId: 'tc-head-prod', name: 'Prita Anjani', title: 'Product Manager', avatarUrl: avatar('tc-pm-1') },
  { id: 'tc-pm-2', parentId: 'tc-head-prod', name: 'Raka Danuarta', title: 'Product Manager' },
  { id: 'tc-des-1', parentId: 'tc-head-prod', name: 'Salsa Nabila', title: 'Product Designer', avatarUrl: avatar('tc-des-1') },

  { id: 'tc-mkt-1', parentId: 'tc-head-mkt', name: 'Tegar Saputra', title: 'Growth Marketer', avatarUrl: avatar('tc-mkt-1') },
  { id: 'tc-mkt-2', parentId: 'tc-head-mkt', name: 'Uswatun Nisa', title: 'Content Strategist' },

  { id: 'tc-log-1', parentId: 'tc-head-log', name: 'Wahyu Nugraha', title: 'Warehouse Supervisor', avatarUrl: avatar('tc-log-1') }, // only-child
  { id: 'tc-wh-1', parentId: 'tc-log-1', name: 'Yoga Pratama', title: 'Warehouse Staff', avatarUrl: avatar('tc-wh-1') },
  { id: 'tc-wh-2', parentId: 'tc-log-1', name: 'Zahra Kamila', title: 'Warehouse Staff' },
];

/** Data sengaja kotor — untuk mendemokan onDataError (US-5). Tanpa avatar; fokusnya validasi, bukan tampilan. */
export const dirtyData: OrgNode[] = [
  { id: 'root', parentId: null, name: 'Clean Root' },
  { id: 'ok', parentId: 'root', name: 'Valid Child' },
  { id: 'orphan-1', parentId: 'does-not-exist', name: 'Orphan Node' },
  { id: 'dup', parentId: 'root', name: 'Duplicate (first)' },
  { id: 'dup', parentId: 'root', name: 'Duplicate (second)' },
  { id: 'cyc-a', parentId: 'cyc-b', name: 'Cycle A' },
  { id: 'cyc-b', parentId: 'cyc-a', name: 'Cycle B' },
];
