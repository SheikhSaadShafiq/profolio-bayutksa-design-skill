/**
 * Fixture answers for the lms area, in the real API's shape.
 * See harness/fixtures.mjs (answer) for how these are loaded, and
 * scripts/check-fixtures.mjs for what they are held to.
 *
 * ── what the page is, and why the three LMS routes look alike ─────────────
 * On Bayut KSA /lms/truleads and /lms/lms-dashboard are NOT pages any more:
 * appRoutes.js:187 and :197 mount TruLeadsRedirect when
 * LMS_ENABLED.IS_UNIFIED_LEADS_PAGE is set, and truleads-redirect.js sends
 * both to /lms/leads. Three captures of one page is the product's behaviour,
 * not a harness fault. What made that one page thin (461 nodes against the
 * real account's 692) was this file being empty: /lms/leads and
 * /lms/leads/leads_summary went unanswered, so the table drew its empty
 * placeholder, the tab strip had no tabs and "Rows per page" never rendered.
 *
 * ── what the page reads ───────────────────────────────────────────────────
 *   leads_summary      leads-summary-header.js — the Total Leads card and its
 *                      TruLeads / Bayut Match split (apis/lms.js:243 maps
 *                      total_leads_count, truleads_count, bayut_match_count)
 *   leads              lead-listings.js through getLeadsMapper
 *                      (transformers/leads.js:815): `leads` → the rows,
 *                      `pagination.total_count` → the card's fallback total,
 *                      `sources` → the All Leads / Bayut Match tabs
 *   leads/stats        apis/common.js:61 — the sidebar's unseen-leads badge
 *   leads/:id, interests, tasks
 *                      the lead detail drawer a row click opens — see the
 *                      note above those three routes
 *
 * Row by row (transformers/leads.js:457 leadsDataMapper):
 *   Lead Details      name, client.email, client.mobile, created_at,
 *                     user.name, is_viewed (false tints the row), and
 *                     interest.source === 'bayut_match' draws the badge
 *   Last Interaction  interest.source → the icon, source_title → the label,
 *                     message_body → the grey line (wraps at 250px),
 *                     recorded_at → the date; a recording_url would add the
 *                     call-analysis tag
 *   Interested in     interest.listing, normalised by
 *                     utility.js:972 normalizeSurgeListingItem — the headline
 *                     is listing_category.name + "for" + .purpose, the grey
 *                     line is location.breadcrumbs (level > 1, reversed), the
 *                     thumbnail is cover_image.sizes.thumbnail; listings_count
 *                     > 1 adds "+ n more properties."
 *   Next Planned Task task null → the "Add Task" button; a task with a
 *                     `child` → the planned task, its date and a timeline
 *                     popover (lead 0 — see the tasks note below)
 *   Actions           client email / mobile / whatsapp → three circles, plus
 *                     Add Task
 *
 * ── what the real account shows, and what these rows copy ─────────────────
 * data/live/lms-leads.real.capture.json: three leads, one page (no pager, the
 * rows-per-page select alone), tabs "All Leads (3)" and a second tab, the
 * Total Leads card holding one digit, no row tinted (all viewed), no Bayut
 * Match tag on any row, no call-analysis tag, "Add Task" on every row. Row 1
 * is a Call with a two-line message and one listing; rows 2 and 3 are
 * WhatsApp with a one-line message and "+ n more properties.". The three rows
 * below are those three rows, on invented people and the account's own
 * invented listings — with ONE deliberate difference: row 1's lead has tasks
 * (so the drawer's All Tasks tab has content), and a lead with tasks carries
 * the latest one on the list row, so row 1 draws its planned task where the
 * real row 1 draws "Add Task". Rows 2 and 3 keep "Add Task".
 *
 * `sources` in the real shape carries only name / name_l1 / count on its
 * FIRST item. The second tab needs a slug: lead-listings.js keys each tab
 * `source.slug || 'all'`, and the real page shows exactly one active tab, so
 * the two keys differ — the Bayut Match entry carries `slug: 'bayut_match'`,
 * the same value onChangeLeadsTab writes to ?tab=.
 *
 * @param h  the shared invented account — user, listings, credits, dates
 * @returns  [[RegExp over the pathname, (search, mode, pathname, method) => body], …]
 */

/* The real API answers in Riyadh time: "2026-09-24T10:12:33.000+03:00", 29 chars */
const riyadh = (d) => new Date(d.getTime() + 3 * 36e5).toISOString().replace('Z', '+03:00');

/* invented category / purpose records, in the shape listing_category carries */
const CATEGORY = {
  Apartment: { id: 4,  slug: 'apartment', name_l1: 'شقة',   external_id: '4' },
  Floor:     { id: 7,  slug: 'floor',     name_l1: 'دور',   external_id: '7' },
  Villa:     { id: 3,  slug: 'villa',     name_l1: 'فيلا',  external_id: '3' },
  Chalet:    { id: 12, slug: 'chalet',    name_l1: 'شاليه', external_id: '9' },
};
const PURPOSE = {
  sale: { id: 1, name: 'Sale', slug: 'sale', name_l1: 'للبيع' },
  rent: { id: 2, name: 'Rent', slug: 'rent', name_l1: 'إيجار' },
};

export default (h) => {
  const { U, day, num } = h;
  const at = (offsetDays, hh, mm) => { const d = day(offsetDays); d.setUTCHours(hh - 3, mm, 17, 0); return riyadh(d); };

  /* One of the account's ten invented listings, in the shape
     interest.listing arrives in — the Surge listing card, not the
     my-listings row the listings area answers with. */
  const surgeListing = (l, i) => {
    const r = l._row;
    const [type] = r.title.split(' for ');
    const cat = CATEGORY[type] || CATEGORY.Apartment;
    const purpose = /Rent/i.test(r.title) ? PURPOSE.rent : PURPOSE.sale;
    const crumbs = l.location.breadcrumbs;
    const spec = (id, v) => ({ id, slug: String(v), label: String(v), value: String(v), label_l1: String(v), value_l1: String(v) });
    const img = `/harness-img/${r.bayutId}.svg`;
    const locId = 6100 + i * 7;
    return {
      dynamic_data: {
        dynamic_fields: {
          beds: spec(300 + num(r.beds), r.beds),
          baths: spec(320 + num(r.baths), r.baths),
          /* product data: dynamicFieldsResponse.json option 215 */
          area_unit: { id: 215, slug: 'square-meters', label: 'Square Meters', value: 'sqm', label_l1: 'متر مربع', value_l1: 'متر مربع' },
          area_unit_value: num(r.area),
        },
      },
      listing_category: {
        id: cat.id,
        name: type,
        slug: cat.slug,
        level: 3,
        name_l1: cat.name_l1,
        purpose: purpose.name,
        logo_url: null,
        parent_id: 1,
        purpose_l1: purpose.name_l1,
        breadcrumbs: [
          { id: 1, name: 'Residential Units', level: 1, name_l1: 'وحدات سكنية' },
          { id: cat.id, name: type, level: 2, name_l1: cat.name_l1 },
        ],
        external_id: cat.external_id,
        name_plural: '',
        purpose_hash: purpose,
        allow_posting: true,
        display_order: cat.id,
        name_plural_l1: '',
        dynamic_section: { id: 3, name: 'Residential', slug: 'residential', name_l1: 'سكني', display_order: 1, secondary_display_order: 1 },
        classification_scope: [1, 2],
      },
      cover_image: {
        id: 7700 + i,
        main: 1,
        uuid: `0f3c${String(r.bayutId).padStart(8, '0')}-4a1e-4c2b-9d7e-${String(1e11 + i).slice(1)}`,
        order: 0,
        sizes: { full: img, large: img, small: img, medium: img, thumbnail: img },
        status: 'on',
        is_unique: true,
        image_type: 'listing_image',
      },
      id: l.id,
      price: l.price,
      ad_license: num(r.regaId),
      permit_number: null,
      location: {
        id: locId + 3,
        slug: null,
        level: 4,
        loc_1: locId, loc_2: locId + 1, loc_3: locId + 2, loc_4: locId + 3, loc_5: locId + 3,
        loc_6: null, loc_7: null,
        title: l.location.title,
        latitude: 24.71 + i * 0.013,
        title_l1: l.location.title_l1,
        longitude: 46.67 + i * 0.011,
        /* the top crumb is dropped by the mapper (level > 1), then reversed:
           "Al Rawabi, East Riyadh, Riyadh" */
        breadcrumbs: crumbs.map((c, k) => ({
          id: locId + k, level: c.level,
          title: k === 0 ? 'KSA' : c.title,
          title_l1: c.title_l1,
        })),
        external_id: null,
      },
      platform_listings: [{
        url: `https://www.bayut.sa/en/property/details-${l.id}.html`,
        url_l1: `https://www.bayut.sa/property/details-${l.id}.html`,
        status: { id: 1, name: 'Active', slug: 'active', name_l1: 'نشط' },
        disposition: { id: 1, name: 'Live', slug: 'live', name_l1: 'مباشر', description: null, description_l1: null },
        platform: { id: 1, slug: 'bayut', title: 'KSA' },
      }],
      unit_no: null,
      wafi_license: null,
      is_unit_type_listing: false,
    };
  };

  /* ── the three leads ────────────────────────────────────────────────────
     Invented people; the numbers are the +966 5X shape with digits nobody
     owns (0000xxx), and the addresses are on .example.

     `said` is every interaction the lead has had, NEWEST FIRST. The first is
     the row's Last Interaction (`interest` on /lms/leads); all of them are the
     drawer's Interactions tab (/lms/interests); the per-channel counts, the
     interests_count and the listings_count (distinct listings — what "+ n more
     properties." counts) are derived from them, so the table, the drawer's
     source cards and the Interactions list cannot disagree. `on` indexes
     h.listings. */
  const CALL = { source: 'call', source_title: 'Call', source_title_l1: 'اتصال' };
  const WHATSAPP = { source: 'whatsapp', source_title: 'WhatsApp', source_title_l1: 'واتساب' };
  const EMAIL = { source: 'email', source_title: 'Email', source_title_l1: 'البريد الإلكتروني' };
  const PEOPLE = [
    {
      name: 'Abdullah Saleh',
      email: 'abdullah.s@mail.example',
      mobile: '+966500000184',
      created: [6, 11, 42],
      said: [
        /* two lines at the 250px measure, like the real row 1 */
        { ...CALL, on: 3, at: [1, 16, 5], response_time: 42,
          message_body: 'Asked about viewing times and parking options.',
          message_body_l1: 'استفسر عن مواعيد المعاينة والمواقف' },
        { ...WHATSAPP, on: 3, at: [3, 21, 14], response_time: 310,
          message_body: 'Is the apartment in Al Rawabi still available?',
          message_body_l1: 'هل شقة الروابي لا تزال متاحة؟' },
        { ...EMAIL, on: 3, at: [5, 9, 37], response_time: 1840,
          message_body: 'Please send me the floor plan and the service charges.',
          message_body_l1: 'أرجو إرسال المخطط ورسوم الخدمات' },
      ],
    },
    {
      name: 'Khalid Al-Shammari',
      email: 'khalid.alshammari1990@mail.example',
      mobile: '+966500000527',
      created: [12, 9, 20],
      said: [
        { ...WHATSAPP, on: 0, at: [3, 20, 48], response_time: 180,
          message_body: 'Is this floor still available?',
          message_body_l1: 'هل الدور لا يزال متاحاً؟' },
        { ...CALL, on: 0, at: [8, 13, 2], response_time: 25,
          message_body: 'Called about the floor in Al Wurud.',
          message_body_l1: 'اتصل بخصوص الدور في الورود' },
        { ...WHATSAPP, on: 1, at: [11, 18, 30], response_time: 95,
          message_body: 'Does the Al Masif floor have a separate entrance?',
          message_body_l1: 'هل دور المصيف بمدخل مستقل؟' },
      ],
    },
    {
      name: 'Nourah Al-Qahtani',
      email: 'nourah.qahtani@mail.example',
      mobile: '+966500000963',
      created: [19, 14, 3],
      said: [
        { ...WHATSAPP, on: 4, at: [5, 10, 31], response_time: 615,
          message_body: 'Can I get the final price please?',
          message_body_l1: 'ممكن السعر النهائي؟' },
        { ...WHATSAPP, on: 5, at: [9, 19, 12], response_time: 240,
          message_body: 'Is the villa in As Sulaymaniyah furnished?',
          message_body_l1: 'هل فيلا السليمانية مؤثثة؟' },
        { ...EMAIL, on: 6, at: [13, 8, 55], response_time: 2710,
          message_body: 'I am interested in the Al Yarmuk apartment, is the price negotiable?',
          message_body_l1: 'مهتمة بشقة اليرموك، هل السعر قابل للتفاوض؟' },
        { ...WHATSAPP, on: 4, at: [18, 17, 40], response_time: 130,
          message_body: 'Hello, is the villa in Al Nahdah still for sale?',
          message_body_l1: 'مرحباً، هل فيلا النهضة لا تزال للبيع؟' },
      ],
    },
  ];

  const leadId = (i) => 5104210 + i * 37;
  const interestsOf = PEOPLE.map((p, i) => p.said.map((s, k) => ({
    id: 9120400 + i * 53 + k,
    lead_id: leadId(i),
    source: s.source,
    source_title: s.source_title,
    source_title_l1: s.source_title_l1,
    message_title: null,
    message_body: s.message_body,
    message_body_l1: s.message_body_l1,
    recorded_at: at(...s.at),
    recording_url: null,
    listing: surgeListing(h.listings[s.on], s.on),
    call_duration: null,
    call_status: null,
    call_total_duration: null,
    response_time: s.response_time,
    call_analysis_score: 0,
    project: null,
  })));

  /* ── the tasks: lead 0, the row the drawer steps open ────────────────────
     A task is a COMPLETED step plus, optionally, the next one planned (`child`,
     payloads/leads.js:23). The two below are the two
     states the All Tasks tab can show (tasksMapper, transformers/leads.js:754):
       · the newer one is done and its follow-up is still PENDING — a planned
         task due in two days, so it is not drawn overdue;
       · the older one is DONE with nothing left planned from it — Planned
         Task renders "-".
     The newer one is also the lead's `task` on /lms/leads: leadsDataMapper
     reads it for Next Planned Task, so that row draws the planned task and its
     timeline popover instead of "Add Task". Leads 1 and 2 have no tasks. */
  const agent = { id: U.id, name: U.name, name_l1: U.name_l1 };
  const TYPE = {
    contact: { id: 1, name: 'Contact', name_l1: 'تواصل' },
    meeting: { id: 2, name: 'Meeting', name_l1: 'اجتماع' },
  };
  const PURPOSE_OF_TASK = {
    intro:    { id: 11, name: 'Introductory Call', name_l1: 'مكالمة تعريفية' },
    viewing:  { id: 21, name: 'Property Viewing',  name_l1: 'معاينة العقار' },
    followUp: { id: 12, name: 'Follow-up Call',    name_l1: 'مكالمة متابعة' },
  };
  const tasksOf = PEOPLE.map(() => []);
  {
    const lead = leadId(0);
    const viewedAt = at(1, 12, 30);
    const due = at(-2, 11, 0);
    tasksOf[0] = [
      {
        id: 7310552, taskable_id: lead, taskable_type: 'Lead',
        task_type: TYPE.meeting, task_purpose: PURPOSE_OF_TASK.viewing,
        notes: 'Liked the layout and the parking; wants to discuss the final price.',
        completed_at: viewedAt, due_date: null, created_at: viewedAt, updated_at: viewedAt,
        assignee: agent, images: [],
        child: {
          id: 7310553, taskable_id: lead, taskable_type: 'Lead',
          task_type: TYPE.contact, task_purpose: PURPOSE_OF_TASK.followUp,
          notes: null, completed_at: null, due_date: due, created_at: viewedAt, updated_at: viewedAt,
          assignee: agent,
        },
      },
      {
        id: 7310418, taskable_id: lead, taskable_type: 'Lead',
        task_type: TYPE.contact, task_purpose: PURPOSE_OF_TASK.intro,
        notes: 'Shared the floor plan and the price list on WhatsApp.',
        completed_at: at(5, 15, 10), due_date: null, created_at: at(5, 15, 10), updated_at: at(5, 15, 10),
        assignee: agent, images: [],
        child: null,
      },
    ];
  }

  const leads = PEOPLE.map((p, i) => {
    const said = interestsOf[i];
    const count = (src) => said.filter((s) => s.source === src).length;
    return {
      id: leadId(i),
      name: p.name,
      created_at: at(...p.created),
      updated_at: said[0].recorded_at,
      interests_count: said.length,
      listings_count: new Set(said.map((s) => s.listing.id)).size,
      call_leads_count: count('call'),
      whatsapp_leads_count: count('whatsapp'),
      email_leads_count: count('email'),
      sms_leads_count: count('sms'),
      manual_leads_count: count('manual'),
      matching_leads_count: count('bayut_match'),
      user: { id: U.id, name: U.name },
      is_viewed: true,
      client: { id: 3302190 + i * 11, mobile: p.mobile, email: p.email, name_l1: null, whatsapp: p.mobile },
      interest: said[0],
      task: tasksOf[i][0] ?? null,
    };
  });

  const bayutMatch = leads.filter((l) => l.interest.source === 'bayut_match');
  const sources = [
    { name: 'All Leads', name_l1: 'جميع الاستفسارات', count: leads.length },
    { name: 'Bayut Match', name_l1: 'بيوت ماتش', count: bayutMatch.length, slug: 'bayut_match' },
  ];

  /* one page of a list, in the pagination block every /lms/ index answers with */
  const paged = (list, search, perPageDefault = 10) => {
    const q = new URLSearchParams(search || '');
    const perPage = Number(q.get('per_page')) || perPageDefault;
    const page = Math.max(1, Number(q.get('page')) || 1);
    const totalPages = Math.max(1, Math.ceil(list.length / perPage));
    return {
      items: list.slice((page - 1) * perPage, page * perPage),
      pagination: {
        current_page: page,
        next_page: page < totalPages ? page + 1 : null,
        prev_page: page > 1 ? page - 1 : null,
        total_pages: totalPages,
        total_count: list.length,
      },
    };
  };
  /* which lead a drawer query is about; no filter means the whole account */
  const forLead = (search, key, perLead) => {
    const id = Number(new URLSearchParams(search || '').get(key));
    const i = leads.findIndex((l) => l.id === id);
    return id ? (perLead[i] ?? []) : perLead.flat();
  };

  return [
    /* the sidebar badge. Every lead above is viewed, and the real shell
       draws no badge on the Leads item, so this stays 0. */
    [/^\/api\/surge\/lms\/leads\/stats$/, () => ({
      stats: { unseen_leads_count: leads.filter((l) => !l.is_viewed).length },
    })],

    [/^\/api\/surge\/lms\/leads\/leads_summary$/, () => ({
      total_leads_count: leads.length,
      bayut_match_count: bayutMatch.length,
      truleads_count: leads.length - bayutMatch.length,
    })],

    /* The Bayut Match tab asks with f[bayut_match]=true (lead-listings.js),
       and the tabs keep their counts whichever one is open. */
    [/^\/api\/surge\/lms\/leads$/, (search) => {
      const set = new URLSearchParams(search || '').get('f[bayut_match]') === 'true' ? bayutMatch : leads;
      const { items, pagination } = paged(set, search);
      return { leads: items, pagination, sources };
    }],

    /* ── the lead detail drawer (lead-detail-drawer.js) ──────────────────
       Opening a row asks for three things: the lead (getLeadDetail →
       leadDetailMapper, transformers/leads.js:866 — the header and the
       Call / Whatsapp / Email / Manual source cards), its interactions
       (getLeadInterests → leadInterestsMapper, the "Interactions" tab) and,
       on the second tab, its tasks (getTasks → tasksMapper, "All Tasks").
       The detail carries fewer keys than the list row — no interest, no
       task, no interests/listings counts — which is the real shape. An
       unknown id answers with the first lead, as the listings drawer does. */
    [/^\/api\/surge\/lms\/leads\/\d+$/, (search, mode, pathname) => {
      const id = Number(pathname.match(/leads\/(\d+)$/)[1]);
      const l = leads.find((x) => x.id === id) || leads[0];
      return { leads: {
        id: l.id, name: l.name, created_at: l.created_at, updated_at: l.updated_at,
        call_leads_count: l.call_leads_count, whatsapp_leads_count: l.whatsapp_leads_count,
        email_leads_count: l.email_leads_count, sms_leads_count: l.sms_leads_count,
        manual_leads_count: l.manual_leads_count,
        user: l.user, is_viewed: l.is_viewed, client: l.client,
      } };
    }],

    /* ?q[lead_id_eq]=<lead>&page=n */
    [/^\/api\/surge\/lms\/interests$/, (search) => {
      const { items, pagination } = paged(forLead(search, 'q[lead_id_eq]', interestsOf), search);
      return { interests: items, pagination };
    }],

    /* The Add Task drawer mounted inside the lead drawer asks for the task
       types as soon as it has a lead id (leads-add-task-drawer.js:56) and
       reads `tasks` as {id, name, name_l1} options. NOT in api-shapes.json —
       the names are the product's own (leads-metrics-mock.js:26), the ids
       invented. The drawer stays closed in every capture. */
    [/^\/api\/surge\/task_types$/, () => ({ tasks: [
      TYPE.contact, TYPE.meeting,
      { id: 3, name: 'Lead Confirm', name_l1: 'تأكيد العميل' },
      { id: 4, name: 'Listing Preparation & Posting', name_l1: 'تجهيز الإعلان ونشره' },
      { id: 5, name: 'Lead Converted', name_l1: 'تم تحويل العميل' },
      { id: 6, name: 'Lead Lost', name_l1: 'فقدان العميل' },
    ] })],

    /* ?q[taskable_id_eq]=<lead>&page=n */
    [/^\/api\/surge\/lms\/tasks$/, (search) => {
      const { items, pagination } = paged(forLead(search, 'q[taskable_id_eq]', tasksOf), search);
      return { lead_tasks: items, pagination };
    }],
  ];
};
