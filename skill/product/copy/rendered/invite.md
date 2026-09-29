# Rendered copy — invite

Every string the compiled files of `pages/invite` draw — 5 web, 5 phone (@375) — in the order first drawn; the header and the rail are in `_shell.md`. Quote a string as it is here, with its file. `is`: **t** a translation · **t+** translations joined with values — ⟨pattern⟩: {{x}} the translation's placeholder, {n} a number ("75,000" is one), {date}, {time}, {x} a fixture value; ×N strings of one pattern; Arabic part by part · **code** drawn by the product, not in the translation files — spelled in its code or its data files (the Arabic beside it is the data file's own twin, `label` / `label_l1`; else "not in translations") · **data** the fixture's data, a mocked response or a value — not copy (copied unchanged into a design, it stays unmarked) · **note** quoted by a state note, drawn nowhere. A suffix says how the string is drawn: **(placeholder)** an input's placeholder attribute · **(value)** what a field holds, an input's or a textarea's value (the fixture's, unless a translation). The class is the first word — `t (placeholder)` is a **t** row: grep `| t |` and `| t (` for every t row. data-pf-src: without `src/`. files, per layout (web · @375): `all`, `all but` the states named, the states named, or `none`; `page` = `pages/invite.html` (`.mobile.html` for @375), a state = `pages/invite/<state>.html`.

| English | Arabic | is | data-pf-src | files |
|---|---|---|---|---|
| © 2026 – All Rights Reserved ⟨© {n} – All Rights Reserved⟩ | {n} + كل الحقوق محفوظة | t+ | layout/withAdminLayout.js:477 | all |
| Invitation | دعوة | t | components/common/modals/antd-modals.js:33 · components/common/drawer/drawer.js:90 | all but message-invite-expired (web and @375) |
| You have been invited to join Al Masar Real Estate by Sultan Al-Dosari | fixture: fixtures/settings.mjs | data | container/pages/invite-user/invite-user.js:155 | all but message-invite-expired (web and @375) |
| If you want to be a part of this agency. Please accept this invitation. | للانضمام الى حساب الشركة على منصة بيوت السعودية . يرجى قبول الدعوة. | t | container/pages/invite-user/invite-user.js:158 | all but message-invite-expired (web and @375) |
| Reject | رفض | t | components/common/button/button.js:40 | all but message-invite-expired (web and @375) |
| Accept | قبول | t | components/common/button/button.js:40 | all but message-invite-expired (web and @375) |
| This invitation has already been used | fixture: fixtures/forms.mjs | data | — | message-accept-failed (web and @375) |
| Invite Accepted Successfully | not in translations | code | — | message-accept (web and @375) |
| FEEDBACK | ملاحظاتك | t | components/feedback/FeedbackTab.js:98 | message-invite-expired (web and @375) |
| This invitation has expired | fixture: fixtures/settings.mjs | data | — | message-invite-expired (web and @375) |
| Invite Rejected Successfully | not in translations | code | — | message-reject (web and @375) |
