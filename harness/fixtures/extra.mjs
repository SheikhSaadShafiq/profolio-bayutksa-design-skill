/**
 * Fixture answers for the rest of the rail's screens — Agent Performance
 * (TruBroker, badges, TruPoints, leaderboard, team performance), Credits &
 * Packages, Licenses — in the real API's shape. See harness/fixtures.mjs
 * (answer) for how these are loaded, and scripts/check-fixtures.mjs.
 *
 * Shapes are data/api-shapes.b.json's — the second, agency-STAFF account,
 * the only one ever seen calling these seven. Values are invented and belong
 * to the shared account: Najd Horizon Real Estate, its owner Faisal Al-Harbi
 * and three agents (profile.mjs owns who they are — this module reads them
 * from its agencies/:id answer, so the two can never disagree).
 *
 *   GET /api/surge/users/user_badge_eligibility          the three badge cards
 *   GET /api/surge/users/tru_points                      "How to earn TruPoints" tasks
 *   GET /api/surge/users/:id/trubroker/tru_point_activities   the TruPoints activity list/drawer
 *   GET /api/surge/users/trubroker/leader_board          the TruBroker leaderboard (card + modal)
 *   GET /api/surge/users/team_performance                "Your Team's Performance" (owner only)
 *   GET /api/surge/packages                              Credits & Packages cards
 *   GET /api/surge/agencies/:id/licenses                 User Settings › Licenses
 *
 * ── WHO SEES WHAT (AgentPerformance.js) ─────────────────────────────────────
 * IS_AGENCY (useLeadsDashboardData.js:13) is true for an agency admin, and it
 * decides the bottom half of the page: an admin gets TeamPerformanceTable, a
 * staff member gets the Leaderboard card and the TruPoints card side by side.
 * Both always call all five endpoints. The recorded staff account was REFUSED
 * team_performance — `{ errors: [one 45-character string], success }` — so
 * that is what mode 'staff' answers; the owner (default mode) gets the table.
 * check-fixtures therefore reports `missing .errors` for team_performance in
 * the default mode on purpose, and nothing with --mode staff.
 *
 * ── THE NUMBERS AGREE WITH EACH OTHER ────────────────────────────────────────
 *   · TruPoints are the last 90 days of activity (ActivityDrawer.js "This data
 *     is based on the last 90 days"): a user's tru_points in the team table is
 *     the sum of that user's activity log, and each activity is one of the
 *     tasks tru_points lists, at that task's points.
 *   · Nobody in the agency is a TruBroker, so nobody is ranked (rank null, as
 *     profile.mjs already says) and nobody is on the leaderboard, which lists
 *     TruBrokers only — other agencies' agents, invented.
 *   · Super Lister's count is the user's live listings: the owner's 20
 *     (profile.mjs agencies/:id), the staff member's 6 (his users/:id in mode
 *     'staff'). Mode 'staff' signs in as Abdullah Al-Otaibi (profile.mjs
 *     STAFF): his log is this quarter's posts and Hot/Signature upgrades —
 *     what his 1,250 used credits went on (credits.mjs STAFF_BREAKDOWN) —
 *     eight entries, as the recorded staff account had; his call and
 *     WhatsApp tracking are off, so those four numbers are null, as recorded.
 *     Noura's history is listings since taken down; Reem has none yet.
 *   · Calls/WhatsApp over 90 days are the dashboard's 30-day 3 calls / 9
 *     WhatsApp, times three. 9 calls is under the 10-call criterion, so the
 *     owner's "Calls Answered" shows the eligibility note (AgentBages.js:52).
 *   · Packages: each mode's own package (users/current credits.bayut.
 *     current_package) is "Current Package", and Titanium / Platinum Plus
 *     Yearly carry the id, credits, price and discount users/:id records.
 *
 * users/current (profile.mjs) carries no `score` and no
 * `active_listings_count`, so on /agent-performance the TruPoints tile reads
 * 0, the leaderboard's own-user card reads "TruPoints™" with no number, and
 * the TruBroker "2+ Active Listings" goal stays unticked — in both modes.
 * Setting users/current.score to the user's tru_points in this module's
 * team_performance answer (owner 46, staff 38) and active_listings_count to
 * his live listings (20 / 6) makes the page agree with itself.
 *
 * @param h  the shared invented account
 * @returns  [[RegExp over the pathname, (search, mode, pathname, method) => body], …]
 */
import profileArea from './profile.mjs';

export default (h) => {
  const { U, AGENCY, page, day, iso } = h;

  /* ── the account, as the profile area answers it ─────────────────────── */
  const PROFILE_ROUTES = profileArea(h);
  const ask = (path, mode = null) => {
    try {
      const r = PROFILE_ROUTES.find(([re]) => re.test(path));
      return r ? r[1]('', mode, path, 'GET') : undefined;
    } catch { return undefined; }
  };
  const AGENCY_FULL = ask(`/api/surge/agencies/${AGENCY.id}`)?.agency || {};
  const USERS = AGENCY_FULL.users?.length ? AGENCY_FULL.users : [{
    id: U.id, name: U.name, name_l1: U.name_l1, email: U.email, mobile: U.mobile,
    role: 'owner', rank: null, active_listings_count: page.listings.active, is_quality_lister: true,
  }];
  const OWNER = USERS.find((u) => u.id === U.id) || USERS[0];
  const AGENTS = USERS.filter((u) => u !== OWNER);
  /* whoever users/current says is signed in, in this mode */
  const me = (mode) => ask('/api/surge/users/current', mode)?.user || U;
  const isStaff = (mode) => mode === 'staff' || me(mode)?.agency_admin === false;

  /* Surge's timestamp: 29 characters, Riyadh time */
  const two = (n) => String(n).padStart(2, '0');
  const stamp = (daysAgo, hh = 10, mm = 0, ss = 0) => `${iso(day(daysAgo))}T${two(hh)}:${two(mm)}:${two(ss)}.000+03:00`;
  const pageOf = (search, perDefault) => {
    const q = new URLSearchParams(search || '');
    return { page: Math.max(1, Number(q.get('page')) || 1), per: Math.max(1, Number(q.get('per_page')) || perDefault), q };
  };
  const pagination = (page, per, total) => {
    const pages = Math.max(1, Math.ceil(total / per));
    return { current_page: page, next_page: page < pages ? page + 1 : null, prev_page: page > 1 ? page - 1 : null,
             total_pages: pages, total_count: total };
  };

  /* ── TruPoints: what can be earned (IconCriteriaMapping's nine slugs, in its order) ── */
  const TASKS = [
    { id: 1, slug: 'active-listings-gt-4',     points: 10, title: 'Keep more than 4 listings active',      title_l1: 'حافظ على أكثر من 4 إعلانات نشطة' },
    { id: 2, slug: 'avg-listing-health-gt-50', points: 10, title: 'Keep average listing health above 50%', title_l1: 'حافظ على جودة الإعلانات فوق 50%' },
    { id: 3, slug: 'upgrade-to-hot',           points: 5,  title: 'Upgrade a listing to Hot',              title_l1: 'رقِّ إعلاناً إلى مميز' },
    { id: 4, slug: 'upgrade-to-signature',     points: 10, title: 'Upgrade a listing to Signature',        title_l1: 'رقِّ إعلاناً إلى سيغنتشر' },
    { id: 5, slug: 'post-a-listing',           points: 2,  title: 'Post a new listing',                    title_l1: 'انشر إعلاناً جديداً' },
    { id: 6, slug: 'trubroker-3-months',       points: 25, title: 'Stay a TruBroker™ for 3 months in a row', title_l1: 'احتفظ بشارة TruBroker™ لـ 3 أشهر' },
    { id: 7, slug: 'trubroker-6-months',       points: 50, title: 'Stay a TruBroker™ for 6 months in a row', title_l1: 'احتفظ بشارة TruBroker™ لـ 6 أشهر' },
    { id: 8, slug: 'activate-trucheck-rented', points: 15, title: 'Activate TruCheck™ on a rented property', title_l1: 'فعّل TruCheck™ لعقار مؤجر' },
    { id: 9, slug: 'activate-trucheck-sale',   points: 15, title: 'Activate TruCheck™ on a property for sale', title_l1: 'فعّل TruCheck™ لعقار للبيع' },
  ];
  const TASK = Object.fromEntries(TASKS.map((t) => [t.slug, t]));
  /* how an earned task reads in the activity log (the real description is 16 characters) */
  const EARNED = {
    'active-listings-gt-4':     ['4+ active listings',        'أكثر من 4 إعلانات نشطة'],
    'avg-listing-health-gt-50': ['Listing health above 50%',  'جودة الإعلانات فوق 50%'],
    'upgrade-to-hot':           ['Upgraded to Hot',           'ترقية إلى مميز'],
    'upgrade-to-signature':     ['Upgraded to Signature',     'ترقية إلى سيغنتشر'],
    'post-a-listing':           ['Posted a listing',          'نشر إعلان'],
  };

  /* ── each user's last 90 days: [task slug, days ago, hh, mm] ─────────────
     The owner: the account's 5 Hot and 12 Signature upgrades and its live
     listings. Abdullah — the staff member mode 'staff' signs in as — posted
     and upgraded this quarter (his 1,250 used credits went on basic, Hot and
     Signature, credits.mjs STAFF_BREAKDOWN); eight entries, as the recorded
     staff account had. Noura: listings posted and since taken down. Reem is
     the newest agent and has nothing yet — the empty state, for real. */
  /* the agent mode 'staff' signs in as (profile.mjs STAFF — Abdullah
     Al-Otaibi today), wherever he sits in the list; the other two keep
     their own histories */
  const STAFFER = AGENTS.find((u) => u.id === me('staff')?.id) || AGENTS[1];
  const [NOURA, REEM] = AGENTS.filter((u) => u !== STAFFER);
  const LOG = {
    [OWNER.id]: [
      ['upgrade-to-signature', 2, 11, 24], ['post-a-listing', 4, 9, 41], ['upgrade-to-hot', 9, 16, 5],
      ['post-a-listing', 15, 13, 12], ['upgrade-to-signature', 23, 10, 37], ['active-listings-gt-4', 30, 8, 0],
      ['post-a-listing', 41, 18, 22], ['upgrade-to-hot', 58, 12, 49],
    ],
    ...(NOURA && { [NOURA.id]: [
      ['post-a-listing', 6, 12, 3], ['post-a-listing', 13, 17, 45], ['avg-listing-health-gt-50', 21, 8, 0],
      ['post-a-listing', 34, 10, 18], ['post-a-listing', 52, 15, 30], ['post-a-listing', 77, 11, 9],
    ] }),
    ...(STAFFER && { [STAFFER.id]: [
      ['upgrade-to-signature', 3, 10, 12], ['post-a-listing', 5, 16, 40], ['upgrade-to-hot', 8, 11, 5],
      ['post-a-listing', 12, 9, 30], ['post-a-listing', 18, 14, 27], ['upgrade-to-hot', 26, 13, 44],
      ['post-a-listing', 46, 9, 55], ['avg-listing-health-gt-50', 61, 8, 0],
    ] }),
    ...(REEM && { [REEM.id]: [] }),
  };
  /* a staff member this module has no history for gets the first agent's */
  const logOf = (id) => LOG[id] || LOG[NOURA?.id] || [];
  const activitiesOf = (id) => logOf(id).map(([slug, ago, hh, mm], i) => ({
    id: 70400 + (Number(id) % 1000) * 20 + i,
    description: EARNED[slug][0],
    description_l1: EARNED[slug][1],
    points: TASK[slug].points,
    created_at: stamp(ago, hh, mm, (i * 17) % 60),
    updated_at: stamp(ago, hh, mm, (i * 17) % 60),
  }));
  const TRUPOINTS = Object.fromEntries(USERS.map((u) => [u.id, activitiesOf(u.id).reduce((n, a) => n + a.points, 0)]));

  /* ── badge eligibility: images/features %, 90-day calls and WhatsApp ─── */
  const CRITERIA = { calls: 10, whatsapp: 10 };
  const PERF = {
    [OWNER.id]: { images: 86.25, features: 57.5, calls: 9, callRate: 77.78, wa: 27, waRate: 88.89 },
    ...(NOURA && { [NOURA.id]: { images: 64.5, features: 38.75, calls: 2, callRate: 50, wa: 4, waRate: 75 } }),
    /* call and WhatsApp tracking are off for him (profile.mjs STAFF_CURRENT): null, as recorded */
    ...(STAFFER && { [STAFFER.id]: { images: 41.67, features: 22.5, calls: null, callRate: null, wa: null, waRate: null } }),
    /* nothing tracked yet: the API sends null, as it did for the recorded staff account */
    ...(REEM && { [REEM.id]: { images: 0, features: 0, calls: null, callRate: null, wa: null, waRate: null } }),
  };
  const perfOf = (id) => PERF[id] || PERF[NOURA?.id] || PERF[OWNER.id];
  const userOf = (id) => USERS.find((u) => u.id === id);
  /* live listings: the staff member's own record (users/:id in mode 'staff')
     for him, the agency's users list for everyone else */
  const STAFF_SELF = ask('/api/surge/users/1', 'staff')?.user;
  const activeOf = (id) => (STAFF_SELF?.id === id && STAFF_SELF.active_listings_count != null
    ? STAFF_SELF.active_listings_count
    : userOf(id)?.active_listings_count ?? (id === U.id ? page.listings.active : 0));

  /* which tasks a user has done in the window: anything in their log, plus
     the standing ones their live listings satisfy */
  const doneBy = (id) => new Set([
    ...logOf(id).map(([slug]) => slug),
    ...(activeOf(id) > 4 ? ['active-listings-gt-4'] : []),
  ]);

  /* ── the TruBroker leaderboard: TruBrokers only, other agencies' agents ─ */
  const FIRST = [
    ['Sara', 'سارة'], ['Khalid', 'خالد'], ['Mohammed', 'محمد'], ['Lama', 'لمى'], ['Turki', 'تركي'],
    ['Hind', 'هند'], ['Omar', 'عمر'], ['Nawaf', 'نواف'], ['Dana', 'دانة'], ['Yousef', 'يوسف'],
    ['Rawan', 'روان'], ['Fahad', 'فهد'], ['Maha', 'مها'], ['Saud', 'سعود'], ['Jawaher', 'جواهر'],
    ['Bandar', 'بندر'], ['Ghada', 'غادة'], ['Majed', 'ماجد'], ['Latifa', 'لطيفة'], ['Ziyad', 'زياد'],
  ];
  const LAST = [
    ['Al-Malki', 'المالكي'], ['Al-Dosari', 'الدوسري'], ['Al-Shammari', 'الشمري'], ['Al-Zahrani', 'الزهراني'],
    ['Al-Ghamdi', 'الغامدي'], ['Al-Mutairi', 'المطيري'], ['Al-Subaie', 'السبيعي'], ['Al-Anazi', 'العنزي'],
    ['Al-Juhani', 'الجهني'], ['Al-Rashidi', 'الرشيدي'], ['Al-Sulami', 'السلمي'], ['Al-Harthi', 'الحارثي'],
    ['Al-Bishi', 'البيشي'],
  ];
  const TRUBROKERS = 148;
  const hex = (n, k) => ((Math.imul(n + 1, 2654435761) ^ Math.imul(k + 7, 40503)) >>> 0).toString(16).padStart(8, '0');
  const uuid = (n) => { const s = hex(n, 1) + hex(n, 2) + hex(n, 3) + hex(n, 4);
    return `${s.slice(0, 8)}-${s.slice(8, 12)}-4${s.slice(13, 16)}-a${s.slice(17, 20)}-${s.slice(20, 32)}`; };
  const photo = (n) => {
    const id = uuid(n);
    const at = (size) => `/harness-img/avatar-leader-${id}-${size}.svg`;   /* served the avatar glyph */
    return { id, status: 'done', filename: id, uuid: id,
             sizes: { full: at('full'), large: at('large'), medium: at('medium'), thumbnail: at('thumbnail'), small: at('small') },
             order: null };
  };
  const BADGE_MIX = [
    { is_quality_lister: true,  is_super_lister: false, is_responsive_broker: false },
    { is_quality_lister: false, is_super_lister: true,  is_responsive_broker: false },
    { is_quality_lister: true,  is_super_lister: false, is_responsive_broker: false },
    { is_quality_lister: false, is_super_lister: false, is_responsive_broker: true },
    { is_quality_lister: false, is_super_lister: false, is_responsive_broker: false },
  ];
  const leader = (rank) => {
    const [f, f1] = FIRST[(rank * 7 + 3) % FIRST.length];
    const [l, l1] = LAST[(rank * 5 + 1) % LAST.length];
    return {
      id: 88020000 + rank * 37,
      name: `${f} ${l}`,
      name_l1: `${f1} ${l1}`,
      /* two in every ten have no photo — the teal initial */
      profile_image: [6, 9].includes(((rank - 1) % 10) + 1) ? null : photo(rank),
      rank,
      score: Math.round(1285 * Math.pow(0.982, rank - 1)),
      is_tru_broker: true,
      /* at most one badge beside the TruBroker pill: the Badges column is
         150px (LeaderBoard.js:463) and the recorded table keeps it there —
         a second icon already widens it to 172 */
      ...BADGE_MIX[(rank - 1) % BADGE_MIX.length],
    };
  };

  /* ── the team, as TeamPerformanceTable.js:24 reads it ─────────────────── */
  const BADGE_FLAG = { tru_broker: 'is_tru_broker', quality_lister: 'is_quality_lister',
                       responsive_broker: 'is_responsive_broker', super_lister: 'is_super_lister' };
  const BADGE_NAME = { is_quality_lister: 'Quality Lister', is_responsive_broker: 'Responsive Broker', is_super_lister: 'Super Lister' };
  const teamRow = (u) => {
    const p = perfOf(u.id);
    return {
      id: u.id,
      name: u.name,
      name_l1: u.name_l1,
      email: u.email,
      mobile: u.mobile,
      profile_image: u.profile_image?.sizes?.thumbnail || null,     /* read as an <img src> */
      is_tru_broker: !!u.is_tru_broker,
      /* names, not slugs: getBadgeIcon() matches 'qualitylister' after
         lower-casing and stripping spaces, so 'quality_lister' draws nothing */
      badges: { active: Object.keys(BADGE_NAME).filter((k) => u[k]).map((k) => BADGE_NAME[k]) },
      rank: u.rank || null,
      tru_points: TRUPOINTS[u.id] || 0,
      quality_core: { image_score: p.images, feature_score: p.features },
      /* the table formats these with toFixed, so no nulls here */
      responsiveness: { whatsapp_response_rate: p.waRate ?? 0, call_response_rate: p.callRate ?? 0 },
      total_active_listings: { active_listing_count: activeOf(u.id) },
    };
  };

  /* ── Credits & Packages ─────────────────────────────────────────────────
     Fifteen, as on the real account: seven tiers yearly and half-yearly plus
     Titanium, which is yearly only and comes first. Each mode's own package
     is read off users/current (credits.bayut.current_package): the owner's
     Platinum Plus Yearly, the staff member's Titanium (profile.mjs). The two
     records are also the price list — Titanium and Platinum Plus Yearly carry
     the id, credits, price and discount users/:id's package states for them,
     so the page and the account agree.

     `applicable` is "you can move to this": a higher tier, or the same tier
     for longer. The CURRENT package is not applicable either — the recorded
     staff account, on Titanium, drew all eight yearly cards disabled
     (opacity .54, packageCard.js:163) with Titanium's among them. So the
     owner sees Titanium enabled ("Get Titanium", "Pay … to Upgrade") and the
     rest disabled; the staff member sees everything disabled.

     The benefit rows are the FIRST package's option keys
     (bayut/apis/packages.js:59) and every card walks its own options in key
     order, so all fifteen share one order — the `order` field's. Yes/no are
     lower case: the card draws an icon only for 'yes' / 'no'
     (packageCard.js:222), and the recorded cards draw icons in those four
     rows. */
  const OPTION = {
    basic_listing:               ['Basic Listings',               'إعلانات أساسية'],
    hot_listing:                 ['Hot Listings',                 'إعلانات مميزة'],
    signature_listing:           ['Signature Listings',           'إعلانات سيغنتشر'],
    photography:                 ['Photography Services',         'خدمات التصوير الاحترافي'],
    videography:                 ['Videography Services',         'خدمات تصوير الفيديو'],
    credit_allocation_to_staff:  ['Credit Allocation to Staff',   'توزيع الرصيد على الموظفين'],
    dedicated_account_manager:   ['Dedicated Account Manager',    'مدير حساب مخصص'],
    featured_tag_for_agency:     ['Featured Tag for Your Agency', 'علامة مميزة للوكالة'],
    listing_collection_by_bayut: ['Listing Collection by Bayut',  'جمع الإعلانات عبر بيوت'],
  };
  /* [stem, name, name_l1, yearly credits, yearly net SAR, discount %,
      basic, hot, signature, photography, videography (0 = not included)] —
     Titanium's counts are the staff member's package (users/:id) */
  const TIERS = [
    ['titanium',      'Titanium',      'التيتانيوم',    150000, 250000, 8, 1000, 300, 60, 12, 10],
    ['platinum-plus', 'Platinum Plus', 'بلاتينيوم بلس',  75000, 150000, 10, 800, 200, 40,  8,  6],
    ['platinum',      'Platinum',      'بلاتينيوم',      60000, 120000, 10, 600, 150, 30,  6,  4],
    ['gold',          'Gold',          'جولد',           45000,  90000, 10, 450, 100, 20,  4,  2],
    ['silver',        'Silver',        'سيلفر',          30000,  60000, 10, 300,  60, 10,  2,  0],
    ['bronze',        'Bronze',        'برونز',          18000,  36000, 10, 200,  40,  5,  0,  0],
    ['starter-pro',   'Starter Pro',   'ستارتر برو',     12000,  24000, 10, 120,  20,  2,  0,  0],
    ['starter',       'Starter',       'ستارتر',          6000,  12000, 10,  60,  10,  0,  0,  0],
  ];
  const RANK = Object.fromEntries(TIERS.map(([stem], i) => [stem, TIERS.length - i]));
  const stemOf = (slug) => String(slug || '').replace(/-(half-)?yearly$/, '');
  const yes = (on) => (on ? ['yes', 'نعم'] : ['no', 'لا']);
  const count = (n) => (n > 0 ? [String(n), String(n)] : ['no', 'لا']);
  const optionsFor = (stem, counts) => {
    const r = RANK[stem];
    const values = {
      basic_listing: count(counts[0]), hot_listing: count(counts[1]), signature_listing: count(counts[2]),
      photography: count(counts[3]), videography: count(counts[4]),
      credit_allocation_to_staff: yes(r >= RANK.bronze),
      dedicated_account_manager: yes(r >= RANK.platinum),
      featured_tag_for_agency: yes(r >= RANK.gold),
      listing_collection_by_bayut: yes(r >= RANK['platinum-plus']),
    };
    return Object.fromEntries(Object.entries(OPTION).map(([key, [name, name_l1]], i) =>
      [key, { name, order: i + 1, value: values[key][0], name_l1, value_l1: values[key][1] }]));
  };
  /* the two packages the account's users hold, as users/:id records them */
  const HELD = [ask('/api/surge/users/1', null)?.user?.package, ask('/api/surge/users/1', 'staff')?.user?.package]
    .filter((p) => p?.slug);
  const heldAs = (slug) => HELD.find((p) => p.slug === slug);
  const pkg = (slug, [stem, name, name_l1, credits, net, discount, ...counts], months) => {
    const held = heldAs(slug);
    const c = held?.total_credits ?? credits;
    const n = held ? Number(held.net_amount) : net;
    const d = held?.additional_info?.discount ?? discount;
    const cpm = Math.round(c / months);
    return {
      id: held?.id ?? null,
      name, name_l1, slug,
      net_amount: n,
      /* list price before the discount: Platinum Plus 150,000 → 165,000 */
      total_amount: held ? Number(held.total_amount) : Math.round((n * (1 + d / 100)) / 100) * 100,
      total_credits: c,
      description: null,
      additional_info: { options: optionsFor(stem, months === 12 ? counts : counts.map((x) => Math.round(x / 2))), discount: d },
      platforms: { ksa: { credits_per_month: cpm } },
      credits_per_month: cpm,
      months,
    };
  };
  const CATALOGUE = [
    pkg('titanium', TIERS[0], 12),
    ...TIERS.slice(1).map((t) => pkg(`${t[0]}-yearly`, t, 12)),
    ...TIERS.slice(1).map((t) => pkg(`${t[0]}-half-yearly`, [...t.slice(0, 3), t[3] / 2, Math.round((t[4] / 2) * 1.1), 5, ...t.slice(6)], 6)),
  ];
  /* ids for the thirteen nobody holds, clear of the held ones */
  let nextId = 2;
  const taken = new Set(CATALOGUE.map((p) => p.id).filter(Boolean));
  for (const p of CATALOGUE) if (!p.id) { while (taken.has(nextId)) nextId++; p.id = nextId; taken.add(nextId); }
  const packagesFor = (mode) => {
    const current = me(mode)?.credits?.bayut?.current_package;
    const slug = current?.slug || 'platinum-plus-yearly';
    const curRank = RANK[stemOf(slug)] || 0;
    const curMonths = current?.duration_in_months || 12;
    return CATALOGUE.map(({ months, ...p }) => ({
      ...p,
      applicable: p.slug !== slug && (RANK[stemOf(p.slug)] > curRank || (RANK[stemOf(p.slug)] === curRank && months > curMonths)),
    })).map(({ id, name, name_l1, slug: s, net_amount, total_amount, total_credits, description, additional_info, applicable, platforms, credits_per_month }) =>
      ({ id, name, name_l1, slug: s, net_amount, total_amount, total_credits, description, additional_info, applicable, platforms, credits_per_month }));
  };

  /* ── Licenses: the agency's two FAL licences and its agents' ────────────
     Four, in the recorded list's order and mix: an agent's licence whose
     contact row is the mobile alone, the agency's brokerage licence (the
     "Agency · CR Number" row, both contacts), its property-management
     licence (agency again, no contact row at all), another agent's with
     both. Abdullah has none — profile.mjs gives the staff account
     `license: null`, as recorded — so in mode 'staff' no card is his and no
     "Share with agency staff" switch draws (license-card.js:209 shows it
     only on the viewer's own licence), exactly as on the recorded staff
     page; the owner sees it on both agency licences. */
  const CITY = { id: 1, name: 'Riyadh', name_l1: 'الرياض' };
  const VERIFIED = { id: 2, name: 'Verified', slug: 'verified' };
  const LICENSES = [
    NOURA && { u: NOURA, id: 6120, number: '1100387642', end: '2027-01-14', type: 'user', shareable: false,
      advertiser: '4418207', email: null, location: { id: 1447, name: 'Al Malqa', name_l1: 'الملقا' } },
    { u: OWNER, id: 6134, number: U.license?.number || '7201000001', end: '2027-03-31', type: 'agency',
      shareable: true, advertiser: '1010458213', broker: [AGENCY.name, AGENCY.name_l1],
      mobile: AGENCY_FULL.mobile || OWNER.mobile, email: AGENCY_FULL.email || OWNER.email,
      location: { id: 1402, name: 'Al Olaya', name_l1: 'العليا' } },
    { u: OWNER, id: 6141, number: '7201004417', end: '2026-11-30', type: 'agency',
      shareable: false, advertiser: '1010458213', broker: [AGENCY.name, AGENCY.name_l1],
      mobile: null, email: null, location: { id: 1402, name: 'Al Olaya', name_l1: 'العليا' } },
    REEM && { u: REEM, id: 6158, number: '1100455318', end: '2027-06-20', type: 'user', shareable: false,
      advertiser: '4452738', location: { id: 1439, name: 'Hittin', name_l1: 'حطين' } },
  ].filter(Boolean).map((l) => ({
    id: l.id,
    number: l.number,
    end_date: `${l.end}T00:00:00.000+03:00`,
    certificate_link: null,
    license_type: l.type,
    is_shareable: l.shareable,
    mobile: 'mobile' in l ? l.mobile : l.u.mobile,
    email: 'email' in l ? l.email : l.u.email,
    broker_name: l.broker?.[0] || l.u.name,
    broker_name_l1: l.broker?.[1] || l.u.name_l1,
    advertiser_id: l.advertiser,
    is_rega_verified: true,
    status: VERIFIED,
    location: l.location,
    city: CITY,
    user: { id: l.u.id, name: l.u.name, name_l1: l.u.name_l1, mobile: l.u.mobile },
  }));

  /* ── mode 'individual': the owner's own licence card, as an individual ──
     An independent broker has no agency, so Licenses asks for HIS licences —
     users/:id/licenses (license.js:19, type 'User') — not the agency's. One:
     his own FAL licence, the number profile.mjs gives him (INDIVIDUAL_LICENSE,
     read from users/current here so the two agree), with his own contacts. */
  const individualLicences = () => {
    const me = ask('/api/surge/users/current', 'individual')?.user;
    const lic = me?.license;
    if (!me || !lic?.number) return [];
    return [{
      id: lic.id, number: lic.number, end_date: `${lic.end_date}T00:00:00.000+03:00`, certificate_link: null,
      license_type: 'user', is_shareable: false, mobile: me.mobile, email: me.email,
      broker_name: me.name, broker_name_l1: me.name_l1, advertiser_id: '4460193', is_rega_verified: true,
      status: VERIFIED, location: { id: 1402, name: 'Al Olaya', name_l1: 'العليا' }, city: CITY,
      user: { id: me.id, name: me.name, name_l1: me.name_l1, mobile: me.mobile },
    }];
  };

  /* ── mode 'empty': a brand-new account ────────────────────────────────
     No listing has been live, no call or chat tracked, no task done: every
     badge is locked at zero (calls and WhatsApp null, as the API sends an
     untracked figure), no TruPoints and no activity, a team of one — the
     owner — with nothing on his row, and no licence on file yet. The
     leaderboard is other agencies' TruBrokers and does not change. */
  const EMPTY_BADGES = {
    quality_lister: { listing_images: 0, listing_features: 0 },
    responsive_broker: { call_response_rate: null, whatsapp_response_rate: null, whatsapp_count: null, call_count: null,
      whatsapp_criteria: CRITERIA.whatsapp, call_criteria: CRITERIA.calls },
    super_lister: { active_listing_count: 0 },
  };
  const emptyTeamRow = (u) => ({
    ...teamRow(u), badges: { active: [] }, rank: null, tru_points: 0,
    quality_core: { image_score: 0, feature_score: 0 },
    responsiveness: { whatsapp_response_rate: 0, call_response_rate: 0 },
    total_active_listings: { active_listing_count: 0 },
  });

  return [
    [/^\/api\/surge\/users\/user_badge_eligibility$/, (search, mode) => {
      if (mode === 'empty') return EMPTY_BADGES;
      const who = me(mode);
      const p = perfOf(who.id);
      return {
        quality_lister: { listing_images: p.images, listing_features: p.features },
        responsive_broker: {
          call_response_rate: p.callRate, whatsapp_response_rate: p.waRate,
          whatsapp_count: p.wa, call_count: p.calls,
          whatsapp_criteria: CRITERIA.whatsapp, call_criteria: CRITERIA.calls,
        },
        super_lister: { active_listing_count: activeOf(who.id) },
      };
    }],
    [/^\/api\/surge\/users\/tru_points$/, (search, mode) => {
      const done = mode === 'empty' ? new Set() : doneBy(me(mode).id);
      return { tru_points: TASKS.map((t) => ({ ...t, is_completed: done.has(t.slug) })) };
    }],
    [/^\/api\/surge\/users\/\d+\/trubroker\/tru_point_activities$/, (search, mode, pathname) => {
      const id = Number((pathname || '').match(/users\/(\d+)\//)?.[1]) || me(mode).id;
      const all = mode === 'empty' ? [] : activitiesOf(id);
      const { page: p, per } = pageOf(search, 10);
      return { tru_point_activities: all.slice((p - 1) * per, p * per), pagination: pagination(p, per, all.length) };
    }],
    [/^\/api\/surge\/users\/trubroker\/leader_board$/, (search) => {
      const { page: p, per } = pageOf(search, 10);
      const from = (p - 1) * per + 1;
      const users = [];
      for (let r = from; r < from + per && r <= TRUBROKERS; r++) users.push(leader(r));
      return { users, pagination: pagination(p, per, TRUBROKERS) };
    }],
    [/^\/api\/surge\/users\/team_performance$/, (search, mode) => {
      /* the staff member is refused, exactly as the recorded one was */
      if (isStaff(mode)) return { errors: ['You are not authorized to perform this action'], success: false };
      const { page: p, per, q } = pageOf(search, 5);
      const wanted = q.getAll('badge[]').map((b) => BADGE_FLAG[b]).filter(Boolean);
      /* a brand-new agency is its owner alone, and nobody has a badge yet */
      const rows = mode === 'empty'
        ? (wanted.length ? [] : [emptyTeamRow(OWNER)])
        : USERS
          .filter((u) => wanted.every((flag) => !!u[flag]))
          .map(teamRow)
          .sort((a, b) => b.tru_points - a.tru_points);
      return { team_performance: rows.slice((p - 1) * per, p * per), pagination: pagination(p, per, rows.length) };
    }],
    [/^\/api\/surge\/packages$/, (search, mode) => {
      const packages = packagesFor(mode);
      return { packages, refundable_amount: null, pagination: pagination(1, 50, packages.length) };
    }],
    [/^\/api\/surge\/agencies\/\d+\/licenses$/, (search, mode) => ({ licenses: mode === 'empty' ? [] : LICENSES })],
    /* the signed-in user's own licences — asked only by an account with no
       agency (license.js:19). An agency member's own licence is one of the
       agency's LICENSES above, so any other mode answers those that are his. */
    [/^\/api\/surge\/users\/\d+\/licenses$/, (search, mode) => ({
      licenses: mode === 'empty' ? []
        : mode === 'individual' ? individualLicences()
          : LICENSES.filter((l) => l.license_type === 'user' && l.user.id === me(mode)?.id),
    })],
  ];
};
