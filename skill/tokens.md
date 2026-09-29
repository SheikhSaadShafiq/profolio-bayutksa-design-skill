# Tokens

token · value · provenance · what it controls. [src] named in the product's theme (src/theme/index.js) or antd's resolved tokens; [px] measured from the compiled pages; [TBC] not sourced. css/tokens.css holds the [src] ones as custom properties.

| token | value | tag | controls |
|---|---|---|---|
| `--pf-gray-900` | `#4f4f4f` | [src] theme gray900 | text 1534 — drawer body, modal body, content, cover chip |
| `--pf-gray-800` | `#626262` | [src] theme gray800 | text 1561 — gray box, tabs tab btn, label |
| `--pf-gray-700` | `#707070` | [src] theme gray700, grayDarkColor | text 36476 — menu title content, group, drawer title, drawer body |
| `--pf-gray-600` | `#9D9D9D` | [src] theme gray600, lightColor | text 14845 · fill 102 — layout footer, card body, select selection placeholder, group |
| `--pf-gray-550` | `#BABABA` | [src] theme | text 64 — label, heading styled heading |
| `--pf-gray-500` | `#C2C2C2` | [src] theme gray500 | border 269 · text 52 — checkbox inner, circular border, layout content |
| `--pf-gray-400` | `#DEDEDE` | [src] theme gray400, borderColorNormal | border 4854 · text 14 · fill 8 — layout sider, user dropdown, input, input affix wrapper |
| `--pf-gray-300` | `#E6E6E6` | [src] theme gray300 | border 2382 · fill 42 — button, icon, layout sider children, leaderboard table content |
| `--pf-gray-200` | `#f5f5f5` | [src] theme gray200, colorBgLayout | fill 6496 · border 380 · text 33 — drawer footer, radio wrapper, select selector, tag |
| `--pf-gray-100` | `#f0f0f0` | [src] theme gray100, dashColor | border 9103 · fill 86 — button, card, modal header, link |
| `--pf-primary` | `#006169` | [src] theme primaryColor, primaryHover | text 20871 · fill 8212 · border 1307 — button, layout, drawer body, menu title content |
| `--pf-primary-hover` | `#006169` | [src] theme primaryColor, primaryHover | text 20871 · fill 8212 · border 1307 — button, layout, drawer body, menu title content |
| `--pf-primary-light` | `#F7FCFC` | [src] theme primaryLight | fill 451 — card, pagination item, nav, tru points section |
| `--pf-primary-light-1` | `#A6C8CA` | [src] theme primaryLight1 | border 1862 · text 18 — button, radio wrapper, text, card |
| `--pf-primary-light-2` | `#CCDFE1` | [src] theme primaryLight2 | border 372 — button, segmented, card, sc ecpegm |
| `--pf-primary-light-3` | `#E1F2F0` | [src] theme primaryLight3 | fill 3742 · border 1462 — layout, tag, drawer body, radio wrapper |
| `--pf-primary-light-4` | `#F2FAFA` | [src] theme primaryLight4 | fill 7443 · border 33 — menu item, button, card, tag |
| `--pf-secondary` | `#28b16d` | [src] theme secondaryColor, secondaryHover | fill 2404 · text 1473 — tag, typography success, scroll number, badge status dot |
| `--pf-secondary-hover` | `#28b16d` | [src] theme secondaryColor, secondaryHover | fill 2404 · text 1473 — tag, typography success, scroll number, badge status dot |
| `--pf-link` | `#1890ff` | [src] theme linkColor, colorLink | text 17 — typography secondary, alert message, picker now btn |
| `--pf-link-hover` | `#0D79DF` | [src] theme linkHover, infoHover | declared; not painted on the compiled pages |
| `--pf-base` | `#222` | [src] theme baseColor, headingColor | text 19305 · fill 15 — tag, drawer body, drawer footer, text |
| `--pf-heading` | `#222` | [src] theme baseColor, headingColor | text 19305 · fill 15 — tag, drawer body, drawer footer, text |
| `--pf-success` | `#28b16d` | [src] theme secondaryColor, secondaryHover | fill 2404 · text 1473 — tag, typography success, scroll number, badge status dot |
| `--pf-success-hover` | `#0CAB7C` | [src] theme successHover | text 38 — message custom content |
| `--pf-warning` | `#f0a742` | [src] theme warningColor, colorWarning | text 960 · fill 49 · border 2 — progress bg, tag, scroll number, alert |
| `--pf-warning-hover` | `#D47407` | [src] theme | declared; not painted on the compiled pages |
| `--pf-danger` | `#f73131` | [src] theme dangerColor, errorColor | text 1937 · fill 408 · border 92 — new chip, text, input, tag |
| `--pf-error` | `#f73131` | [src] theme dangerColor, errorColor | text 1937 · fill 408 · border 92 — new chip, text, input, tag |
| `--pf-error-hover` | `#df4d4f` | [src] theme | declared; not painted on the compiled pages |
| `--pf-info` | `#2C99FF` | [src] theme infoColor, colorInfo | border 24 · text 2 — alert, tag |
| `--pf-info-hover` | `#0D79DF` | [src] theme linkHover, infoHover | declared; not painted on the compiled pages |
| `--pf-info-color-alt` | `#479eeb` | [src] theme infoColorAlt | fill 64 — icon, tag |
| `--pf-dark` | `#272B41` | [src] theme darkColor | text 1818 — card meta title, group, heading styled heading, PreviewArea |
| `--pf-dark-hover` | `#131623` | [src] theme | declared; not painted on the compiled pages |
| `--pf-gray` | `#5A5F7D` | [src] theme grayColor, whiteHover | text 1454 — button, button group, pagination item, badge status text |
| `--pf-gray-lightest` | `#bdbdbd` | [src] theme grayLightestColor | declared; not painted on the compiled pages |
| `--pf-gray-dark` | `#707070` | [src] theme gray700, grayDarkColor | text 36476 — menu title content, group, drawer title, drawer body |
| `--pf-gray-hover` | `#363A51` | [src] theme | declared; not painted on the compiled pages |
| `--pf-light` | `#9D9D9D` | [src] theme gray600, lightColor | text 14845 · fill 102 — layout footer, card body, select selection placeholder, group |
| `--pf-light-hover` | `#e2e6ea` | [src] theme | declared; not painted on the compiled pages |
| `--pf-white` | `#fff` | [src] theme whiteColor, colorBgBase | fill 27578 · text 10193 — button, layout header, scroll number, layout sider |
| `--pf-dash` | `#f0f0f0` | [src] theme gray100, dashColor | border 9103 · fill 86 — button, card, modal header, link |
| `--pf-white-hover` | `#5A5F7D` | [src] theme grayColor, whiteHover | text 1454 — button, button group, pagination item, badge status text |
| `--pf-extra-light` | `#ADB4D2` | [src] theme extraLightColor | declared; not painted on the compiled pages |
| `--pf-border-color-light` | `#F1F2F6` | [src] theme borderColorLight | border 6393 · fill 979 — skeleton button, skeleton avatar, skeleton paragraph, skeleton input |
| `--pf-border-color-normal` | `#DEDEDE` | [src] theme gray400, borderColorNormal | border 4854 · text 14 · fill 8 — layout sider, user dropdown, input, input affix wrapper |
| `--pf-border-color-deep` | `#C6D0DC` | [src] theme | declared; not painted on the compiled pages |
| `--pf-bg-gray-color-deep` | `#EFF0F3` | [src] theme | declared; not painted on the compiled pages |
| `--pf-bg-gray-color-light` | `#F8F9FB` | [src] theme bgGrayColorLight | fill 1350 — table cell |
| `--pf-bg-gray-color-normal` | `#F4F5F7` | [src] theme bgGrayColorNormal | fill 6175 — icon, button, field icon box |
| `--pf-light-gray` | `#868EAE` | [src] theme lightGrayColor | text 548 — group |
| `--pf-slider-rail` | `rgba(95,99,242,0.2)` | [src] theme sliderRailColor | fill 32 — form item control input content, modal body |
| `--pf-gray-solid` | `#9D9D9D` | [src] theme gray600, lightColor | text 14845 · fill 102 — layout footer, card body, select selection placeholder, group |
| `--pf-health-color-low` | `#FF7258` | [src] theme | declared; not painted on the compiled pages |
| `--pf-health-color-avg` | `#FFDC65` | [src] theme | declared; not painted on the compiled pages |
| `--pf-health-color-good` | `#98DAB9` | [src] theme | declared; not painted on the compiled pages |
| `--pf-health-color-default` | `#C1BFBF` | [src] theme healthColorDefault | border 25 · text 7 — checkbox inner, footer, button |
| `--pf-placeholder` | `#9D9D9D` | [src] theme gray600, lightColor | text 14845 · fill 102 — layout footer, card body, select selection placeholder, group |
| `--pf-label-muted` | `#707070` | [src] theme gray700, grayDarkColor | text 36476 — menu title content, group, drawer title, drawer body |
| `--pf-dubizzle-primary` | `#E00000` | [src] theme | declared; not painted on the compiled pages |
| `--pf-color-primary` | `#006169` | [src] antd primaryColor, primaryHover | text 20871 · fill 8212 · border 1307 — button, layout, drawer body, menu title content |
| `--pf-color-success` | `#28b16d` | [src] antd secondaryColor, secondaryHover | fill 2404 · text 1473 — tag, typography success, scroll number, badge status dot |
| `--pf-color-warning` | `#f0a742` | [src] antd warningColor, colorWarning | text 960 · fill 49 · border 2 — progress bg, tag, scroll number, alert |
| `--pf-color-error` | `#f73131` | [src] antd dangerColor, errorColor | text 1937 · fill 408 · border 92 — new chip, text, input, tag |
| `--pf-color-info` | `#2c99ff` | [src] antd infoColor, colorInfo | border 24 · text 2 — alert, tag |
| `--pf-color-link` | `#1890ff` | [src] antd linkColor, colorLink | text 17 — typography secondary, alert message, picker now btn |
| `--pf-color-text-base` | `#000` | [src] antd colorTextBase, colorBgSolid | text 6460 · border 73 — layout sider children, layout header, label, heading styled heading |
| `--pf-color-bg-base` | `#fff` | [src] antd whiteColor, colorBgBase | fill 27578 · text 10193 — button, layout header, scroll number, layout sider |
| `--pf-font-family` | `Figtree, Droid Arabic Kufi, sans-serif` | [src] antd | every text: Figtree, then Droid Arabic Kufi for Arabic |
| `--pf-font-size` | `14px` | [src] antd | text size — 5468 uses, weights 400/600/700/500/900, line height 22px |
| `--pf-motion-ease-out-circ` | `cubic-bezier(0.08, 0.82, 0.17, 1)` | [src] antd | easing curve |
| `--pf-motion-ease-in-out-circ` | `cubic-bezier(0.78, 0.14, 0.15, 0.86)` | [src] antd | easing curve |
| `--pf-motion-ease-out` | `cubic-bezier(0.215, 0.61, 0.355, 1)` | [src] antd | easing curve |
| `--pf-motion-ease-in-out` | `cubic-bezier(0.645, 0.045, 0.355, 1)` | [src] antd | easing curve |
| `--pf-motion-ease-out-back` | `cubic-bezier(0.12, 0.4, 0.29, 1.46)` | [src] antd | easing curve |
| `--pf-motion-ease-in-back` | `cubic-bezier(0.71, -0.46, 0.88, 0.6)` | [src] antd | easing curve |
| `--pf-motion-ease-in-quint` | `cubic-bezier(0.755, 0.05, 0.855, 0.06)` | [src] antd | easing curve |
| `--pf-motion-ease-out-quint` | `cubic-bezier(0.23, 1, 0.32, 1)` | [src] antd | easing curve |
| `--pf-border-radius` | `6px` | [src] antd | corner radius — 424 uses: button, menu item, skeleton button |
| `--pf-control-height` | `32px` | [src] antd | height of inputs, selects and buttons |
| `--pf-border-radius-lg` | `8px` | [src] antd | corner radius — 262 uses: drawer body, drawer footer, message notice content |
| `--pf-box-shadow` | `0 2px 8px rgba(0, 0, 0, 0.15)` | [src] antd | elevation |
| `--pf-color-text-disabled` | `rgba(0, 0, 0, 0.25)` | [src] antd colorTextDisabled, colorTextQuaternary | text 138 · fill 112 · border 94 — switch, PhoneInputCountrySelectArrow, select selection item, picker cell inner |
| `--pf-font-size-heading-1` | `38px` | [src] antd | text size |
| `--pf-font-size-heading-2` | `30px` | [src] antd | text size |
| `--pf-font-size-heading-3` | `24px` | [src] antd | text size — 35 uses, weights 600/700, line height 37.7px |
| `--pf-font-size-heading-4` | `20px` | [src] antd | text size — 175 uses, weights 700/600/500, line height 24px |
| `--pf-font-size-heading-5` | `16px` | [src] antd | text size — 719 uses, weights 600/700/500/400/800, line height 24px |
| `--pf-color-text-placeholder` | `#9D9D9D` | [src] antd gray600, lightColor | text 14845 · fill 102 — layout footer, card body, select selection placeholder, group |
| `--pf-color-text` | `rgba(0, 0, 0, 0.88)` | [src] antd colorText, colorTextHeading | text 29818 · border 177 — drawer title, drawer body, group, modal title |
| `--pf-color-text-secondary` | `rgba(0, 0, 0, 0.65)` | [src] antd colorTextSecondary, colorTextLabel | declared; not painted on the compiled pages |
| `--pf-color-text-tertiary` | `rgba(0, 0, 0, 0.45)` | [src] antd colorTextTertiary, colorBgMask | fill 782 · text 81 — drawer mask, modal mask, layout, chrome scrim |
| `--pf-color-text-quaternary` | `rgba(0, 0, 0, 0.25)` | [src] antd colorTextDisabled, colorTextQuaternary | text 138 · fill 112 · border 94 — switch, PhoneInputCountrySelectArrow, select selection item, picker cell inner |
| `--pf-color-fill` | `rgba(0, 0, 0, 0.15)` | [src] antd colorFill, colorFillContentHover | border 2 — form item control input content |
| `--pf-color-fill-secondary` | `rgba(0, 0, 0, 0.06)` | [src] antd colorFillSecondary, colorFillContent | fill 210 — progress inner, pagination item |
| `--pf-color-fill-tertiary` | `rgba(0, 0, 0, 0.04)` | [src] antd colorFillTertiary, colorBgContainerDisabled | fill 252 — input, button, picker |
| `--pf-color-fill-quaternary` | `rgba(0, 0, 0, 0.02)` | [src] antd colorFillQuaternary, colorFillAlter | declared; not painted on the compiled pages |
| `--pf-color-bg-solid` | `rgb(0, 0, 0)` | [src] antd colorTextBase, colorBgSolid | text 6460 · border 73 — layout sider children, layout header, label, heading styled heading |
| `--pf-color-bg-solid-hover` | `rgba(0, 0, 0, 0.75)` | [src] antd colorBgSolidHover | declared; not painted on the compiled pages |
| `--pf-color-bg-solid-active` | `rgba(0, 0, 0, 0.95)` | [src] antd colorBgSolidActive | declared; not painted on the compiled pages |
| `--pf-color-bg-layout` | `#f5f5f5` | [src] antd gray200, colorBgLayout | fill 6496 · border 380 · text 33 — drawer footer, radio wrapper, select selector, tag |
| `--pf-color-bg-container` | `#ffffff` | [src] antd whiteColor, colorBgBase | fill 27578 · text 10193 — button, layout header, scroll number, layout sider |
| `--pf-color-bg-elevated` | `#ffffff` | [src] antd whiteColor, colorBgBase | fill 27578 · text 10193 — button, layout header, scroll number, layout sider |
| `--pf-color-bg-spotlight` | `rgba(0, 0, 0, 0.85)` | [src] antd | declared; not painted on the compiled pages |
| `--pf-color-border` | `#d9d9d9` | [src] antd colorBorder | border 4748 — radio inner, button, message container, select selector |
| `--pf-color-border-secondary` | `#f0f0f0` | [src] antd gray100, dashColor | border 9103 · fill 86 — button, card, modal header, link |
| `--pf-color-primary-bg` | `#97a8a7` | [src] antd colorPrimaryBg | declared; not painted on the compiled pages |
| `--pf-color-primary-bg-hover` | `#649c99` | [src] antd colorPrimaryBgHover | declared; not painted on the compiled pages |
| `--pf-color-primary-border` | `#458f8e` | [src] antd colorPrimaryBorder | declared; not painted on the compiled pages |
| `--pf-color-primary-border-hover` | `#2a8182` | [src] antd colorPrimaryBorderHover | declared; not painted on the compiled pages |
| `--pf-color-primary-hover` | `#137075` | [src] antd colorPrimaryHover, colorPrimaryTextHover | border 42 · fill 13 · text 7 — button, switch, select selector, checkbox inner |
| `--pf-color-primary-active` | `#003b42` | [src] antd colorPrimaryActive, colorPrimaryTextActive | declared; not painted on the compiled pages |
| `--pf-color-primary-text-hover` | `#137075` | [src] antd colorPrimaryHover, colorPrimaryTextHover | border 42 · fill 13 · text 7 — button, switch, select selector, checkbox inner |
| `--pf-color-primary-text` | `#006169` | [src] antd primaryColor, primaryHover | text 20871 · fill 8212 · border 1307 — button, layout, drawer body, menu title content |
| `--pf-color-primary-text-active` | `#003b42` | [src] antd colorPrimaryActive, colorPrimaryTextActive | declared; not painted on the compiled pages |
| `--pf-color-success-bg` | `#e1f0e6` | [src] antd colorSuccessBg | fill 244 — tag |
| `--pf-color-success-bg-hover` | `#c5e3d0` | [src] antd colorSuccessBgHover | declared; not painted on the compiled pages |
| `--pf-color-success-border` | `#98d6b1` | [src] antd colorSuccessBorder | declared; not painted on the compiled pages |
| `--pf-color-success-border-hover` | `#6fc996` | [src] antd colorSuccessBorderHover, colorSuccessHover | declared; not painted on the compiled pages |
| `--pf-color-success-hover` | `#6fc996` | [src] antd colorSuccessBorderHover, colorSuccessHover | declared; not painted on the compiled pages |
| `--pf-color-success-active` | `#198a55` | [src] antd colorSuccessActive, colorSuccessTextActive | declared; not painted on the compiled pages |
| `--pf-color-success-text-hover` | `#4abd7f` | [src] antd colorSuccessTextHover | declared; not painted on the compiled pages |
| `--pf-color-success-text` | `#28b16d` | [src] antd secondaryColor, secondaryHover | fill 2404 · text 1473 — tag, typography success, scroll number, badge status dot |
| `--pf-color-success-text-active` | `#198a55` | [src] antd colorSuccessActive, colorSuccessTextActive | declared; not painted on the compiled pages |
| `--pf-color-error-bg` | `#fff2f0` | [src] antd colorErrorBg | fill 1355 — tag, alert |
| `--pf-color-error-bg-hover` | `#ffdcd6` | [src] antd colorErrorBgHover | declared; not painted on the compiled pages |
| `--pf-color-error-bg-filled-hover` | `#ffd4cf` | [src] antd colorErrorBgFilledHover | declared; not painted on the compiled pages |
| `--pf-color-error-bg-active` | `#ffb6ad` | [src] antd colorErrorBgActive, colorErrorBorder | declared; not painted on the compiled pages |
| `--pf-color-error-border` | `#ffb6ad` | [src] antd colorErrorBgActive, colorErrorBorder | declared; not painted on the compiled pages |
| `--pf-color-error-border-hover` | `#ff8d85` | [src] antd colorErrorBorderHover | border 4 — input, input affix wrapper |
| `--pf-color-error-hover` | `#ff615c` | [src] antd colorErrorHover, colorErrorTextHover | declared; not painted on the compiled pages |
| `--pf-color-error-active` | `#d11f25` | [src] antd colorErrorActive, colorErrorTextActive | declared; not painted on the compiled pages |
| `--pf-color-error-text-hover` | `#ff615c` | [src] antd colorErrorHover, colorErrorTextHover | declared; not painted on the compiled pages |
| `--pf-color-error-text` | `#f73131` | [src] antd dangerColor, errorColor | text 1937 · fill 408 · border 92 — new chip, text, input, tag |
| `--pf-color-error-text-active` | `#d11f25` | [src] antd colorErrorActive, colorErrorTextActive | declared; not painted on the compiled pages |
| `--pf-color-warning-bg` | `#fffbf0` | [src] antd colorWarningBg | fill 962 — tag, alert |
| `--pf-color-warning-bg-hover` | `#fff9eb` | [src] antd colorWarningBgHover | declared; not painted on the compiled pages |
| `--pf-color-warning-border` | `#ffebbf` | [src] antd | declared; not painted on the compiled pages |
| `--pf-color-warning-border-hover` | `#ffda96` | [src] antd | declared; not painted on the compiled pages |
| `--pf-color-warning-hover` | `#ffda96` | [src] antd | declared; not painted on the compiled pages |
| `--pf-color-warning-active` | `#c9832c` | [src] antd colorWarningActive, colorWarningTextActive | declared; not painted on the compiled pages |
| `--pf-color-warning-text-hover` | `#fcc66f` | [src] antd colorWarningTextHover | declared; not painted on the compiled pages |
| `--pf-color-warning-text` | `#f0a742` | [src] antd warningColor, colorWarning | text 960 · fill 49 · border 2 — progress bg, tag, scroll number, alert |
| `--pf-color-warning-text-active` | `#c9832c` | [src] antd colorWarningActive, colorWarningTextActive | declared; not painted on the compiled pages |
| `--pf-color-info-bg` | `#f0faff` | [src] antd colorInfoBg | fill 24 — alert |
| `--pf-color-info-bg-hover` | `#cfeeff` | [src] antd colorInfoBgHover | declared; not painted on the compiled pages |
| `--pf-color-info-border` | `#a6ddff` | [src] antd colorInfoBorder | declared; not painted on the compiled pages |
| `--pf-color-info-border-hover` | `#7dc9ff` | [src] antd colorInfoBorderHover, colorInfoHover | declared; not painted on the compiled pages |
| `--pf-color-info-hover` | `#7dc9ff` | [src] antd colorInfoBorderHover, colorInfoHover | declared; not painted on the compiled pages |
| `--pf-color-info-active` | `#1a76d9` | [src] antd colorInfoActive, colorInfoTextActive | declared; not painted on the compiled pages |
| `--pf-color-info-text-hover` | `#54b2ff` | [src] antd colorInfoTextHover | declared; not painted on the compiled pages |
| `--pf-color-info-text` | `#2c99ff` | [src] antd infoColor, colorInfo | border 24 · text 2 — alert, tag |
| `--pf-color-info-text-active` | `#1a76d9` | [src] antd colorInfoActive, colorInfoTextActive | declared; not painted on the compiled pages |
| `--pf-color-link-hover` | `#69c0ff` | [src] antd colorLinkHover | text 1 — learn more |
| `--pf-color-link-active` | `#096dd9` | [src] antd colorLinkActive | declared; not painted on the compiled pages |
| `--pf-color-bg-mask` | `rgba(0, 0, 0, 0.45)` | [src] antd colorTextTertiary, colorBgMask | fill 782 · text 81 — drawer mask, modal mask, layout, chrome scrim |
| `--pf-color-white` | `#fff` | [src] antd whiteColor, colorBgBase | fill 27578 · text 10193 — button, layout header, scroll number, layout sider |
| `--pf-font-size-sm` | `12px` | [src] antd | text size — 2058 uses, weights 400/500/300/600/700/900, line height 18.9px |
| `--pf-font-size-lg` | `16px` | [src] antd | text size — 719 uses, weights 600/700/500/400/800, line height 24px |
| `--pf-font-size-xl` | `20px` | [src] antd | text size — 175 uses, weights 700/600/500, line height 24px |
| `--pf-control-height-sm` | `24px` | [src] antd | height of inputs, selects and buttons |
| `--pf-control-height-lg` | `40px` | [src] antd | height of inputs, selects and buttons |
| `--pf-border-radius-xs` | `2px` | [src] antd | corner radius — 10 uses: PhoneInputCountryIcon |
| `--pf-border-radius-sm` | `4px` | [src] antd | corner radius — 57 uses: tag, checkbox inner, skeleton button |
| `--pf-color-fill-content` | `rgba(0, 0, 0, 0.06)` | [src] antd colorFillSecondary, colorFillContent | fill 210 — progress inner, pagination item |
| `--pf-color-fill-content-hover` | `rgba(0, 0, 0, 0.15)` | [src] antd colorFill, colorFillContentHover | border 2 — form item control input content |
| `--pf-color-fill-alter` | `rgba(0, 0, 0, 0.02)` | [src] antd colorFillQuaternary, colorFillAlter | declared; not painted on the compiled pages |
| `--pf-color-bg-container-disabled` | `rgba(0, 0, 0, 0.04)` | [src] antd colorFillTertiary, colorBgContainerDisabled | fill 252 — input, button, picker |
| `--pf-color-border-bg` | `#ffffff` | [src] antd whiteColor, colorBgBase | fill 27578 · text 10193 — button, layout header, scroll number, layout sider |
| `--pf-color-split` | `rgba(5, 5, 5, 0.06)` | [src] antd colorSplit | border 6218 — divider, drawer footer, drawer header, list item |
| `--pf-color-text-heading` | `rgba(0, 0, 0, 0.88)` | [src] antd colorText, colorTextHeading | text 29818 · border 177 — drawer title, drawer body, group, modal title |
| `--pf-color-text-label` | `rgba(0, 0, 0, 0.65)` | [src] antd colorTextSecondary, colorTextLabel | declared; not painted on the compiled pages |
| `--pf-color-text-description` | `rgba(0, 0, 0, 0.45)` | [src] antd colorTextTertiary, colorBgMask | fill 782 · text 81 — drawer mask, modal mask, layout, chrome scrim |
| `--pf-color-text-light-solid` | `#fff` | [src] antd whiteColor, colorBgBase | fill 27578 · text 10193 — button, layout header, scroll number, layout sider |
| `--pf-color-highlight` | `#f73131` | [src] antd dangerColor, errorColor | text 1937 · fill 408 · border 92 — new chip, text, input, tag |
| `--pf-color-bg-text-hover` | `rgba(0, 0, 0, 0.06)` | [src] antd colorFillSecondary, colorFillContent | fill 210 — progress inner, pagination item |
| `--pf-color-bg-text-active` | `rgba(0, 0, 0, 0.15)` | [src] antd colorFill, colorFillContentHover | border 2 — form item control input content |
| `--pf-color-icon` | `rgba(0, 0, 0, 0.45)` | [src] antd colorTextTertiary, colorBgMask | fill 782 · text 81 — drawer mask, modal mask, layout, chrome scrim |
| `--pf-color-icon-hover` | `rgba(0, 0, 0, 0.88)` | [src] antd colorText, colorTextHeading | text 29818 · border 177 — drawer title, drawer body, group, modal title |
| `--pf-color-error-outline` | `rgba(255, 38, 5, 0.06)` | [src] antd colorErrorOutline | declared; not painted on the compiled pages |
| `--pf-color-warning-outline` | `rgba(255, 188, 5, 0.06)` | [src] antd colorWarningOutline | declared; not painted on the compiled pages |
| `--pf-padding-xxs` | `4px` | [src] antd | antd spacing step (padding-xxs) |
| `--pf-padding-xs` | `8px` | [src] antd | antd spacing step (padding-xs) |
| `--pf-padding-sm` | `12px` | [src] antd | antd spacing step (padding-sm) |
| `--pf-padding` | `16px` | [src] antd | antd spacing step (padding) |
| `--pf-padding-md` | `20px` | [src] antd | antd spacing step (padding-md) |
| `--pf-padding-lg` | `24px` | [src] antd | antd spacing step (padding-lg) |
| `--pf-padding-xl` | `32px` | [src] antd | antd spacing step (padding-xl) |
| `--pf-margin-xxs` | `4px` | [src] antd | antd spacing step (margin-xxs) |
| `--pf-margin-xs` | `8px` | [src] antd | antd spacing step (margin-xs) |
| `--pf-margin-sm` | `12px` | [src] antd | antd spacing step (margin-sm) |
| `--pf-margin` | `16px` | [src] antd | antd spacing step (margin) |
| `--pf-margin-md` | `20px` | [src] antd | antd spacing step (margin-md) |
| `--pf-margin-lg` | `24px` | [src] antd | antd spacing step (margin-lg) |
| `--pf-margin-xl` | `32px` | [src] antd | antd spacing step (margin-xl) |
| `--pf-box-shadow-secondary` | `0 6px 16px 0 rgba(0, 0, 0, 0.08),
      0 3px 6px -4px rgba(0, 0, 0, 0.12),
      0 9px 28px 8px rgba(0, 0, 0, 0.05)` | [src] antd | elevation |
| `--pf-box-shadow-tertiary` | `0 1px 2px 0 rgba(0, 0, 0, 0.03),
      0 1px 6px -1px rgba(0, 0, 0, 0.02),
      0 2px 4px 0 rgba(0, 0, 0, 0.02)` | [src] antd | elevation |
| `type-24` | `24px / 37.7px · 600/700` | [px] | text drawn at 24px — 35 uses (fontSizeHeading3); e.g. 13 · 5 · 0 |
| `type-22` | `22px / 30.8px · 700/800` | [px] | text drawn at 22px — 12 uses; e.g. 20 · 0 |
| `type-20` | `20px / 24px · 700/600/500` | [px] | text drawn at 20px — 175 uses (fontSizeHeading4, fontSizeXL); e.g. Settings · Post Listing · TruLeads |
| `type-18` | `18px / 22px · 600/700/800/400/500` | [px] | text drawn at 18px — 120 uses; e.g. All Listings · Manage Staff · Najd Horizon Real Estate |
| `type-17` | `17px / 25.5px · 700` | [px] | text drawn at 17px — 40 uses; e.g. Send us feedback |
| `type-16` | `16px / 24px · 600/700/500/400/800` | [px] | text drawn at 16px — 719 uses (fontSizeHeading5, fontSizeLG); e.g. Save Changes · Additional Information · Continue |
| `type-15` | `15px / 17.3px · 500/400/700` | [px] | text drawn at 15px — 8 uses; e.g. Rows per page |
| `type-14` | `14px / 22px · 400/600/700/500/900` | [px] | text drawn at 14px — 5468 uses (fontSize); e.g. Posted on · REGA Ad Licence Expiry Date: · Credits |
| `type-13` | `13px / 15px · 600/500/700/400` | [px] | text drawn at 13px — 480 uses; e.g. What kind of feedback is this? · Feedback · Feature request |
| `type-12` | `12px / 18.9px · 400/500/300/600/700/900` | [px] | text drawn at 12px — 2058 uses (fontSizeSM); e.g. Views · Clicks · Leads |
| `type-11` | `11px / 12.7px · 500/400/600/700` | [px] | text drawn at 11px — 19 uses; e.g. faisal@najdhorizon.example · abdullah@najdhorizon.example · noura@najdhorizon.example |
| `type-10` | `10px / 15.7px · 400/700/600/500/800` | [px] | text drawn at 10px — 325 uses; e.g. Bayut ID: · REGA ID: · Expiring on |
| `radius-2px` | `2px` | [src] antd borderRadiusXS | corners — 10 uses: PhoneInputCountryIcon |
| `radius-4px` | `4px` | [src] antd borderRadiusSM | corners — 57 uses: tag, checkbox inner, skeleton button |
| `radius-5px` | `5px` | [px] | corners — 10 uses: button, radio group |
| `radius-6px` | `6px` | [src] antd borderRadius | corners — 424 uses: button, menu item, skeleton button |
| `radius-8px` | `8px` | [src] antd borderRadiusLG | corners — 262 uses: drawer body, drawer footer, message notice content |
| `radius-10px` | `10px` | [px] | corners — 108 uses: card, drawer body, popover inner |
| `radius-12px` | `12px` | [px] | corners — 23 uses: modal content, rega card card, stage |
| `radius-10pct` | `10%` | [px] | corners — 8 uses: modal body, drawer body |
| `radius-30pct` | `30%` | [px] | corners — 56 uses: icon, icon, icon |
| `radius-pill` | `999px` | [px] | corners — 253 uses: scroll number, tag, new chip |
| `radius-circle` | `50%` | [px] | corners — 333 uses: button, layout, scroll number |
| `space-0.1` | `0.1px` | [px] | padding, margin or gap — 1 rules |
| `space-1` | `1px` | [px] | padding, margin or gap — 5 rules |
| `space-2` | `2px` | [px] | padding, margin or gap — 15 rules |
| `space-2.5` | `2.5px` | [px] | padding, margin or gap — 1 rules |
| `space-2.86` | `2.86px` | [px] | padding, margin or gap — 1 rules |
| `space-3` | `3px` | [px] | padding, margin or gap — 18 rules |
| `space-3.5` | `3.5px` | [px] | padding, margin or gap — 1 rules |
| `space-4` | `4px` | [px] | padding, margin or gap — 54 rules |
| `space-4.5` | `4.5px` | [px] | padding, margin or gap — 1 rules |
| `space-5` | `5px` | [px] | padding, margin or gap — 13 rules |
| `space-5.35` | `5.35px` | [px] | padding, margin or gap — 1 rules |
| `space-6` | `6px` | [px] | padding, margin or gap — 48 rules |
| `space-7` | `7px` | [px] | padding, margin or gap — 5 rules |
| `space-8` | `8px` | [px] | padding, margin or gap — 74 rules |
| `space-9` | `9px` | [px] | padding, margin or gap — 3 rules |
| `space-9.5` | `9.5px` | [px] | padding, margin or gap — 1 rules |
| `space-10` | `10px` | [px] | padding, margin or gap — 57 rules |
| `space-10.5` | `10.5px` | [px] | padding, margin or gap — 1 rules |
| `space-11` | `11px` | [px] | padding, margin or gap — 4 rules |
| `space-11.5` | `11.5px` | [px] | padding, margin or gap — 1 rules |
| `space-12` | `12px` | [px] | padding, margin or gap — 79 rules |
| `space-13` | `13px` | [px] | padding, margin or gap — 3 rules |
| `space-13.26` | `13.26px` | [px] | padding, margin or gap — 1 rules |
| `space-13.9` | `13.9px` | [px] | padding, margin or gap — 1 rules |
| `space-14` | `14px` | [px] | padding, margin or gap — 5 rules |
| `space-15` | `15px` | [px] | padding, margin or gap — 8 rules |
| `space-16` | `16px` | [px] | padding, margin or gap — 67 rules |
| `space-17` | `17px` | [px] | padding, margin or gap — 1 rules |
| `space-18` | `18px` | [px] | padding, margin or gap — 1 rules |
| `space-19` | `19px` | [px] | padding, margin or gap — 2 rules |
| `space-20` | `20px` | [px] | padding, margin or gap — 51 rules |
| `space-22` | `22px` | [px] | padding, margin or gap — 2 rules |
| `space-24` | `24px` | [px] | padding, margin or gap — 30 rules |
| `space-25` | `25px` | [px] | padding, margin or gap — 5 rules |
| `space-30` | `30px` | [px] | padding, margin or gap — 2 rules |
| `space-32` | `32px` | [px] | padding, margin or gap — 3 rules |
| `space-36` | `36px` | [px] | padding, margin or gap — 2 rules |
| `space-38` | `38px` | [px] | padding, margin or gap — 1 rules |
| `space-40` | `40px` | [px] | padding, margin or gap — 12 rules |
| `space-42` | `42px` | [px] | padding, margin or gap — 1 rules |
| `space-44` | `44px` | [px] | padding, margin or gap — 1 rules |
| `space-50` | `50px` | [px] | padding, margin or gap — 1 rules |
| `space-54` | `54px` | [px] | padding, margin or gap — 1 rules |
| `space-60` | `60px` | [px] | padding, margin or gap — 2 rules |
| `space-62` | `62px` | [px] | padding, margin or gap — 1 rules |
| `space-64` | `64px` | [px] | padding, margin or gap — 3 rules |
| `space-68` | `68px` | [px] | padding, margin or gap — 1 rules |
| `space-77` | `77px` | [px] | padding, margin or gap — 1 rules |
| `shadow-269` | `0px 0px` | [px] | box-shadow — 30 rules |
| `shadow-270` | `var(--pf-box-shadow-secondary)` | [px] | box-shadow — 5 rules |
| `shadow-271` | `rgb(255, 255, 255) 0px 16px 0px -1px, rgba(65, 65, 65, 0.392) 2px 0px 21px -10px` | [px] | box-shadow — 4 rules |
| `shadow-272` | `var(--pf-box-shadow-popover-arrow)` | [px] | box-shadow — 3 rules |
| `shadow-273` | `var(--pf-box-shadow-tertiary)` | [px] | box-shadow — 3 rules |
| `shadow-274` | `0 0 0 2px var(--input-shadow,transparent)` | [px] | box-shadow — 3 rules |
| `shadow-275` | `inset -10px 0 8px -8px var(--pf-color-split)` | [px] | box-shadow — 2 rules |
| `shadow-276` | `rgba(146, 153, 184, 0.125) 0px 5px 20px` | [px] | box-shadow — 2 rules |
| `shadow-277` | `rgba(0, 0, 0, 0.05) 0px -2px 6px 0px` | [px] | box-shadow — 2 rules |
| `shadow-278` | `rgba(0, 0, 0, 0.12) 0px 1px 6px` | [px] | box-shadow — 2 rules |
| `shadow-279` | `rgba(0, 0, 0, 0.18) 0px 1px 4px` | [px] | box-shadow — 2 rules |
| `shadow-280` | `rgba(0, 0, 0, 0.1) 0px -4px 10px 0px` | [px] | box-shadow — 2 rules |
| `shadow-281` | `rgba(0, 0, 0, 0.14) 0px 0px 12px 0px` | [px] | box-shadow — 2 rules |
| `shadow-282` | `rgba(15, 23, 42, 0.03) 0px 14px 40px, rgba(15, 23, 42, 0.02) 0px 2px 4px` | [px] | box-shadow — 2 rules |
| `shadow-283` | `rgba(146, 153, 184, 0.082) 0px 8px 10px` | [px] | box-shadow — 2 rules |
| `shadow-284` | `var(--pf-button-default-shadow)` | [px] | box-shadow — 1 rules |
| `shadow-285` | `var(--pf-button-primary-shadow)` | [px] | box-shadow — 1 rules |
| `shadow-286` | `var(--pf-box-shadow)` | [px] | box-shadow — 1 rules |
| `shadow-287` | `currentcolor 0px 0px 0px 0px` | [px] | box-shadow — 1 rules |
| `shadow-288` | `currentcolor 0px 0px 0px 6px` | [px] | box-shadow — 1 rules |
| `z--9999` | `-9999` | [px] | stacking — 1 rules |
| `z--1` | `-1` | [px] | stacking — 3 rules |
| `z-0` | `0` | [px] | stacking — 4 rules |
| `z-1` | `1` | [px] | stacking — 30 rules |
| `z-2` | `2` | [px] | stacking — 18 rules |
| `z-3` | `3` | [px] | stacking — 4 rules |
| `z-10` | `10` | [px] | stacking — 8 rules |
| `z-var(--pf-drawer-z-index-popup)` | `var(--pf-drawer-z-index-popup)` | [px] | stacking — 3 rules |
| `z-4` | `4` | [px] | stacking — 1 rules |
| `z-20` | `20` | [px] | stacking — 2 rules |
| `z-99` | `99` | [px] | stacking — 1 rules |
| `z-222` | `222` | [px] | stacking — 2 rules |
| `z-998` | `998` | [px] | stacking — 2 rules |
| `z-999` | `999` | [px] | stacking — 3 rules |
| `z-1000` | `1000` | [px] | stacking — 1 rules |
| `z-1100` | `1100` | [px] | stacking — 3 rules |
| `z-var(--pf-z-index-popup-base)` | `var(--pf-z-index-popup-base)` | [px] | stacking — 2 rules |
| `z-calc(var(--pf-z-index-popup-base) + 10)` | `calc(var(--pf-z-index-popup-base) + 10)` | [px] | stacking — 1 rules |
| `z-var(--pf-badge-indicator-z-index)` | `var(--pf-badge-indicator-z-index)` | [px] | stacking — 1 rules |
| `z-var(--pf-popover-z-index-popup)` | `var(--pf-popover-z-index-popup)` | [px] | stacking — 1 rules |
| `z-var(--pf-tooltip-z-index-popup)` | `var(--pf-tooltip-z-index-popup)` | [px] | stacking — 1 rules |
| `z-var(--pf-dropdown-z-index-popup)` | `var(--pf-dropdown-z-index-popup)` | [px] | stacking — 1 rules |
| `z-var(--pf-select-z-index-popup)` | `var(--pf-select-z-index-popup)` | [px] | stacking — 1 rules |
| `z-calc(4)` | `calc(4)` | [px] | stacking — 1 rules |
| `z-var(--pf-tour-z-index-popup)` | `var(--pf-tour-z-index-popup)` | [px] | stacking — 1 rules |
| `z-1001` | `1001` | [px] | stacking — 1 rules |
| `z-1003` | `1003` | [px] | stacking — 1 rules |
| `z-2010` | `2010` | [px] | stacking — 1 rules |
| `z-var(--pf-date-picker-z-index-popup)` | `var(--pf-date-picker-z-index-popup)` | [px] | stacking — 1 rules |
| `z-99999` | `99999` | [px] | stacking — 1 rules |
| `bp-767` | `only screen and (max-width: 767px)` | [px] | media query — 20 rules |
| `bp-991` | `screen and (max-width: 991px)` | [px] | media query — 17 rules |
| `bp-991` | `only screen and (max-width: 991px)` | [px] | media query — 15 rules |
| `bp-991` | `(max-width: 991px)` | [px] | media query — 10 rules |
| `bp-768` | `(min-width: 768px)` | [px] | media query — 8 rules |
| `bp-640` | `(max-width: 640px)` | [px] | media query — 7 rules |
| `bp-992` | `(min-width: 992px)` | [px] | media query — 6 rules |
| `bp-x` | `print` | [px] | media query — 6 rules |
| `bp-575` | `only screen and (max-width: 575px)` | [px] | media query — 6 rules |
| `bp-1199` | `only screen and (max-width: 1199px)` | [px] | media query — 6 rules |
| `bp-992` | `only screen and (min-width: 992px)` | [px] | media query — 6 rules |
| `bp-1600` | `(min-width: 1600px)` | [px] | media query — 5 rules |
| `bp-767` | `(max-width: 767px)` | [px] | media query — 5 rules |
| `bp-768` | `(max-width: 768px)` | [px] | media query — 5 rules |
| `bp-992` | `screen and (min-width: 992px)` | [px] | media query — 5 rules |
| `bp-641` | `(min-width: 641px)` | [px] | media query — 5 rules |
| `bp-400` | `(max-width: 400px)` | [px] | media query — 5 rules |
| `bp-400` | `only screen and (max-width: 400px)` | [px] | media query — 4 rules |
| `bp-767` | `only screen and (min-width: 767px)` | [px] | media query — 4 rules |
| `bp-640` | `(min-width: 640px)` | [px] | media query — 4 rules |
| `#e0e0e0` | `#e0e0e0` | [px] unnamed | border 225 — drawer body, drawer footer, cover |
| `#e0eef2` | `#e0eef2` | [px] unnamed | fill 61 — cover |
| `#00000014` | `rgba(0, 0, 0, 0.08)` | [px] unnamed | 11 rules: shadow 11 |
| `#000000b3` | `rgba(0, 0, 0, 0.7)` | [px] unnamed | fill 8 — retry |
| `#ffffff33` | `rgba(255, 255, 255, 0.2)` | [px] unnamed | 10 rules: ground 10 |
| `#0000001f` | `rgba(0, 0, 0, 0.12)` | [px] unnamed | 9 rules: shadow 9 |
| `#0000000d` | `rgba(0, 0, 0, 0.05)` | [px] unnamed | 9 rules: shadow 9 |
| `#fafafa` | `#fafafa` | [px] unnamed | fill 251 — table cell, gray box, layout content |
| `#eff2f7` | `#eff2f7` | [px] unnamed | border 27 — PreviewArea |
| `#012b2869` | `rgba(1, 43, 40, 0.41)` | [px] unnamed | 6 rules: shadow 4 · edge 2 |
| `#0000001a` | `rgba(0, 0, 0, 0.1)` | [px] unnamed | fill 271 — PhoneInputCountryIcon |
| `#af6fff` | `#af6fff` | [px] unnamed | fill 1505 — tag, icon |
| `#ffffff00` | `rgba(255, 255, 255, 0)` | [px] unnamed | 5 rules: ground 3 · other 2 |
| `#64b7e3` | `#64b7e3` | [px] unnamed | fill 84 — fill |
| `#eb2f96` | `#eb2f96` | [px] unnamed | 4 rules: other 4 |
| `#001529` | `#001529` | [px] unnamed | 4 rules: other 4 |
| `#002140` | `#002140` | [px] unnamed | 4 rules: other 4 |
| `#767676` | `#767676` | [px] unnamed | text 2303 — link, text, table cell |
| `#e3e6ef` | `#e3e6ef` | [px] unnamed | border 129 — button, picker, radio group |
| `#5462af` | `#5462af` | [px] unnamed | fill 48 — icon, tag |
| `#ffffff80` | `rgba(255, 255, 255, 0.5)` | [px] unnamed | fill 10 · border 2 — loader overlay, modal body |
| `#41414164` | `rgba(65, 65, 65, 0.392)` | [px] unnamed | 4 rules: shadow 4 |
| `#52c41a` | `#52c41a` | [px] unnamed | 3 rules: other 2 · ink 1 |
| `#faad14` | `#faad14` | [px] unnamed | 3 rules: other 2 · ink 1 |
| `#ffffffa6` | `rgba(255, 255, 255, 0.65)` | [px] unnamed | 3 rules: other 3 |
| `#dbdbdb` | `#dbdbdb` | [px] unnamed | fill 12 — button |
| `#849095` | `#849095` | [px] unnamed | text 378 — PreviewArea |
| `#a3a3a3` | `#a3a3a3` | [px] unnamed | text 127 — card meta description, card body, upgrade listing action button, agency staff mobile action button |
| `#9299b815` | `rgba(146, 153, 184, 0.082)` | [px] unnamed | 3 rules: shadow 3 |
| `#9299b820` | `rgba(146, 153, 184, 0.125)` | [px] unnamed | 3 rules: shadow 3 |
| `#af6fff1a` | `rgba(175, 111, 255, 0.102)` | [px] unnamed | fill 1596 — button |
| `#f731311a` | `rgba(247, 49, 49, 0.102)` | [px] unnamed | fill 1596 — button |
| `#479eeb1a` | `rgba(71, 158, 235, 0.102)` | [px] unnamed | fill 1399 — button |
| `#5462af1a` | `rgba(84, 98, 175, 0.102)` | [px] unnamed | fill 1383 — button |
| `#ffa9001a` | `rgba(255, 169, 0, 0.102)` | [px] unnamed | fill 1383 — button |
| `#ffa900` | `#ffa900` | [px] unnamed | fill 26 — icon |
| `#79cdd11a` | `rgba(121, 205, 209, 0.102)` | [px] unnamed | fill 1383 — button |
| `#79cdd1` | `#79cdd1` | [px] unnamed | fill 26 — icon |
| `#444444` | `#444444` | [px] unnamed | text 183 — nav arrow, price text |
| `#00616910` | `rgba(0, 97, 105, 0.063)` | [px] unnamed | fill 1211 — PreviewArea |
| `#ffffffcc` | `rgba(255, 255, 255, 0.8)` | [px] unnamed | 3 rules: ground 3 |
| `#efc468` | `#efc468` | [px] unnamed | fill 42 — fill |
| `#1f1f1f` | `#1f1f1f` | [px] unnamed | text 343 — heading styled heading, requirement item, title with lock, agent bages info drawer header |
| `#1677ff` | `#1677ff` | [px] unnamed | 2 rules: other 2 |
| `#722ed1` | `#722ed1` | [px] unnamed | 2 rules: other 2 |
| `#13c2c2` | `#13c2c2` | [px] unnamed | 2 rules: other 2 |
| `#f5222d` | `#f5222d` | [px] unnamed | fill 1181 · border 43 — scroll number, ribbon, ribbon corner, new ribbon |
| `#fa8c16` | `#fa8c16` | [px] unnamed | 2 rules: other 2 |
| `#fadb14` | `#fadb14` | [px] unnamed | 2 rules: other 2 |
| `#fa541c` | `#fa541c` | [px] unnamed | 2 rules: other 2 |
| `#2f54eb` | `#2f54eb` | [px] unnamed | 2 rules: other 2 |
| `#a0d911` | `#a0d911` | [px] unnamed | 2 rules: other 2 |
| `#fff0f6` | `#fff0f6` | [px] unnamed | 2 rules: other 2 |
| `#ffd6e7` | `#ffd6e7` | [px] unnamed | 2 rules: other 2 |
| `#ffadd2` | `#ffadd2` | [px] unnamed | 2 rules: other 2 |
| `#ff85c0` | `#ff85c0` | [px] unnamed | 2 rules: other 2 |
| `#f759ab` | `#f759ab` | [px] unnamed | 2 rules: other 2 |
| `#c41d7f` | `#c41d7f` | [px] unnamed | 2 rules: other 2 |
| `#9e1068` | `#9e1068` | [px] unnamed | 2 rules: other 2 |
| `#780650` | `#780650` | [px] unnamed | 2 rules: other 2 |
| `#520339` | `#520339` | [px] unnamed | 2 rules: other 2 |
| `#ff4d4f` | `#ff4d4f` | [px] unnamed | 2 rules: other 1 · ink 1 |
| `#ffdb99` | `#ffdb99` | [px] unnamed | 2 rules: edge 1 · other 1 |
| `#f6f7fb` | `#f6f7fb` | [px] unnamed | fill 2408 — layout, agancy staff main, card body |
| `#ffffff40` | `rgba(255, 255, 255, 0.25)` | [px] unnamed | 2 rules: other 2 |
| `#0061691a` | `rgba(0, 97, 105, 0.102)` | [px] unnamed | 2 rules: shadow 2 |
| `#ffffffd9` | `rgba(255, 255, 255, 0.85)` | [px] unnamed | fill 3 — dropdown trigger |
| `#00616933` | `rgba(0, 97, 105, 0.2)` | [px] unnamed | 2 rules: edge 1 · shadow 1 |
| `#bfbfbf` | `#bfbfbf` | [px] unnamed | 2 rules: other 1 · ink 1 |
| `#00000080` | `rgba(0, 0, 0, 0.5)` | [px] unnamed | fill 21 — select dropdown, content wrapper, group, sheet overlay |
| `#68c898` | `#68c898` | [px] unnamed | fill 2 — bayut ksa header wrapper |
| `#1d2429` | `#1d2429` | [px] unnamed | text 625 — PreviewArea |
| `#34495e` | `#34495e` | [px] unnamed | border 54 — PreviewArea |
| `#5f63f205` | `rgba(95, 99, 242, 0.02)` | [px] unnamed | fill 26 — select item |
| `#e83a3a` | `#e83a3a` | [px] unnamed | text 60 — message custom content |
| `#d0021b` | `#d0021b` | [px] unnamed | border 8 · text 2 — modal body, drawer body |
| `#00616914` | `rgba(0, 97, 105, 0.078)` | [px] unnamed | fill 6439 — button, icon |
| `#cfae19` | `#cfae19` | [px] unnamed | 2 rules: other 2 |
| `#479eeb14` | `rgba(71, 158, 235, 0.078)` | [px] unnamed | fill 1891 — icon |
| `#28b16d14` | `rgba(40, 177, 109, 0.078)` | [px] unnamed | fill 1754 — icon |
| `#0000008c` | `rgba(0, 0, 0, 0.55)` | [px] unnamed | fill 69 — image counter, stage counter |
| `#ffffffeb` | `rgba(255, 255, 255, 0.92)` | [px] unnamed | fill 122 — nav arrow |
| `#0000002e` | `rgba(0, 0, 0, 0.18)` | [px] unnamed | 2 rules: shadow 2 |
| `#e7f3ff` | `#e7f3ff` | [px] unnamed | fill 63 — tag |
| `#e5f7eb` | `#e5f7eb` | [px] unnamed | fill 850 — tag |
| `#0000004d` | `rgba(0, 0, 0, 0.3)` | [px] unnamed | 2 rules: edge 2 |
| `#0061690a` | `rgba(0, 97, 105, 0.04)` | [px] unnamed | fill 119 — card |
| `#00000024` | `rgba(0, 0, 0, 0.14)` | [px] unnamed | 2 rules: shadow 2 |
| `#eeeff2` | `#eeeff2` | [px] unnamed | border 27 — button group |
| `#0f172a08` | `rgba(15, 23, 42, 0.03)` | [px] unnamed | 2 rules: shadow 2 |
| `#0f172a05` | `rgba(15, 23, 42, 0.02)` | [px] unnamed | 2 rules: shadow 2 |
| `#005158` | `#005158` | [px] unnamed | text 44 — public profile link |
| `#00000077` | `rgba(0, 0, 0, 0.467)` | [px] unnamed | 2 rules: ground 2 |
| `#e6f4ff` | `#e6f4ff` | [px] unnamed | 1 rules: other 1 |
| `#bae0ff` | `#bae0ff` | [px] unnamed | 1 rules: other 1 |
| `#91caff` | `#91caff` | [px] unnamed | 1 rules: other 1 |
| `#69b1ff` | `#69b1ff` | [px] unnamed | 1 rules: other 1 |
| `#4096ff` | `#4096ff` | [px] unnamed | 1 rules: other 1 |
| `#0958d9` | `#0958d9` | [px] unnamed | 1 rules: other 1 |
| `#003eb3` | `#003eb3` | [px] unnamed | 1 rules: other 1 |
| `#002c8c` | `#002c8c` | [px] unnamed | 1 rules: other 1 |
| `#001d66` | `#001d66` | [px] unnamed | 1 rules: other 1 |
| `#f9f0ff` | `#f9f0ff` | [px] unnamed | 1 rules: other 1 |
| `#efdbff` | `#efdbff` | [px] unnamed | 1 rules: other 1 |
| `#d3adf7` | `#d3adf7` | [px] unnamed | 1 rules: other 1 |
| `#b37feb` | `#b37feb` | [px] unnamed | 1 rules: other 1 |
| `#9254de` | `#9254de` | [px] unnamed | 1 rules: other 1 |
| `#531dab` | `#531dab` | [px] unnamed | 1 rules: other 1 |
| `#391085` | `#391085` | [px] unnamed | 1 rules: other 1 |
| `#22075e` | `#22075e` | [px] unnamed | 1 rules: other 1 |
| `#120338` | `#120338` | [px] unnamed | 1 rules: other 1 |
| `#e6fffb` | `#e6fffb` | [px] unnamed | 1 rules: other 1 |
| `#b5f5ec` | `#b5f5ec` | [px] unnamed | 1 rules: other 1 |
| `#87e8de` | `#87e8de` | [px] unnamed | 1 rules: other 1 |
| `#5cdbd3` | `#5cdbd3` | [px] unnamed | 1 rules: other 1 |
| `#36cfc9` | `#36cfc9` | [px] unnamed | 1 rules: other 1 |
| `#08979c` | `#08979c` | [px] unnamed | 1 rules: other 1 |
| `#006d75` | `#006d75` | [px] unnamed | 1 rules: other 1 |
| `#00474f` | `#00474f` | [px] unnamed | 1 rules: other 1 |
| `#002329` | `#002329` | [px] unnamed | 1 rules: other 1 |
| `#f6ffed` | `#f6ffed` | [px] unnamed | 1 rules: other 1 |
| `#d9f7be` | `#d9f7be` | [px] unnamed | 1 rules: other 1 |
| `#b7eb8f` | `#b7eb8f` | [px] unnamed | 1 rules: other 1 |
| `#95de64` | `#95de64` | [px] unnamed | 1 rules: other 1 |
| `#73d13d` | `#73d13d` | [px] unnamed | 1 rules: other 1 |
| `#389e0d` | `#389e0d` | [px] unnamed | 1 rules: other 1 |
| `#237804` | `#237804` | [px] unnamed | 1 rules: other 1 |
| `#135200` | `#135200` | [px] unnamed | 1 rules: other 1 |
| `#092b00` | `#092b00` | [px] unnamed | 1 rules: other 1 |
| `#fff1f0` | `#fff1f0` | [px] unnamed | 1 rules: other 1 |
| `#ffccc7` | `#ffccc7` | [px] unnamed | 1 rules: other 1 |
| `#ffa39e` | `#ffa39e` | [px] unnamed | 1 rules: other 1 |
| `#ff7875` | `#ff7875` | [px] unnamed | 1 rules: other 1 |
| `#cf1322` | `#cf1322` | [px] unnamed | 1 rules: other 1 |
| `#a8071a` | `#a8071a` | [px] unnamed | 1 rules: other 1 |
| `#820014` | `#820014` | [px] unnamed | 1 rules: other 1 |
| `#5c0011` | `#5c0011` | [px] unnamed | 1 rules: other 1 |
| `#fff7e6` | `#fff7e6` | [px] unnamed | 1 rules: other 1 |
| `#ffe7ba` | `#ffe7ba` | [px] unnamed | 1 rules: other 1 |
| `#ffd591` | `#ffd591` | [px] unnamed | 1 rules: other 1 |
| `#ffc069` | `#ffc069` | [px] unnamed | 1 rules: other 1 |
| `#ffa940` | `#ffa940` | [px] unnamed | 1 rules: other 1 |
| `#d46b08` | `#d46b08` | [px] unnamed | 1 rules: other 1 |
| `#ad4e00` | `#ad4e00` | [px] unnamed | 1 rules: other 1 |
| `#873800` | `#873800` | [px] unnamed | 1 rules: other 1 |
| `#612500` | `#612500` | [px] unnamed | 1 rules: other 1 |
| `#feffe6` | `#feffe6` | [px] unnamed | 1 rules: other 1 |
| `#ffffb8` | `#ffffb8` | [px] unnamed | 1 rules: other 1 |
| `#fffb8f` | `#fffb8f` | [px] unnamed | 1 rules: other 1 |
| `#fff566` | `#fff566` | [px] unnamed | 1 rules: other 1 |
| `#ffec3d` | `#ffec3d` | [px] unnamed | 1 rules: other 1 |
| `#d4b106` | `#d4b106` | [px] unnamed | 1 rules: other 1 |
| `#ad8b00` | `#ad8b00` | [px] unnamed | 1 rules: other 1 |
| `#876800` | `#876800` | [px] unnamed | 1 rules: other 1 |
| `#614700` | `#614700` | [px] unnamed | 1 rules: other 1 |
| `#fff2e8` | `#fff2e8` | [px] unnamed | 1 rules: other 1 |
| `#ffd8bf` | `#ffd8bf` | [px] unnamed | 1 rules: other 1 |
| `#ffbb96` | `#ffbb96` | [px] unnamed | 1 rules: other 1 |
| `#ff9c6e` | `#ff9c6e` | [px] unnamed | 1 rules: other 1 |
| `#ff7a45` | `#ff7a45` | [px] unnamed | 1 rules: other 1 |
| `#d4380d` | `#d4380d` | [px] unnamed | 1 rules: other 1 |
| `#ad2102` | `#ad2102` | [px] unnamed | 1 rules: other 1 |
| `#871400` | `#871400` | [px] unnamed | 1 rules: other 1 |
| `#610b00` | `#610b00` | [px] unnamed | 1 rules: other 1 |
| `#f0f5ff` | `#f0f5ff` | [px] unnamed | 1 rules: other 1 |
| `#d6e4ff` | `#d6e4ff` | [px] unnamed | 1 rules: other 1 |
| `#adc6ff` | `#adc6ff` | [px] unnamed | 1 rules: other 1 |
| `#85a5ff` | `#85a5ff` | [px] unnamed | 1 rules: other 1 |
| `#597ef7` | `#597ef7` | [px] unnamed | 1 rules: other 1 |
| `#1d39c4` | `#1d39c4` | [px] unnamed | 1 rules: other 1 |
| `#10239e` | `#10239e` | [px] unnamed | 1 rules: other 1 |
| `#061178` | `#061178` | [px] unnamed | 1 rules: other 1 |
| `#030852` | `#030852` | [px] unnamed | 1 rules: other 1 |
| `#fffbe6` | `#fffbe6` | [px] unnamed | 1 rules: other 1 |
| `#fff1b8` | `#fff1b8` | [px] unnamed | 1 rules: other 1 |
| `#ffe58f` | `#ffe58f` | [px] unnamed | 1 rules: other 1 |
| `#ffd666` | `#ffd666` | [px] unnamed | 1 rules: other 1 |
| `#ffc53d` | `#ffc53d` | [px] unnamed | 1 rules: other 1 |
| `#d48806` | `#d48806` | [px] unnamed | 1 rules: other 1 |
| `#ad6800` | `#ad6800` | [px] unnamed | 1 rules: other 1 |
| `#874d00` | `#874d00` | [px] unnamed | 1 rules: other 1 |
| `#613400` | `#613400` | [px] unnamed | 1 rules: other 1 |
| `#fcffe6` | `#fcffe6` | [px] unnamed | 1 rules: other 1 |
| `#f4ffb8` | `#f4ffb8` | [px] unnamed | 1 rules: other 1 |
| `#eaff8f` | `#eaff8f` | [px] unnamed | 1 rules: other 1 |
| `#d3f261` | `#d3f261` | [px] unnamed | 1 rules: other 1 |
| `#bae637` | `#bae637` | [px] unnamed | 1 rules: other 1 |
| `#7cb305` | `#7cb305` | [px] unnamed | 1 rules: other 1 |
| `#5b8c00` | `#5b8c00` | [px] unnamed | 1 rules: other 1 |
| `#3f6600` | `#3f6600` | [px] unnamed | 1 rules: other 1 |
| `#254000` | `#254000` | [px] unnamed | 1 rules: other 1 |
| `#ffecc2` | `#ffecc2` | [px] unnamed | 1 rules: edge 1 |
| `#00000008` | `rgba(0, 0, 0, 0.03)` | [px] unnamed | 1 rules: shadow 1 |
| `#00000029` | `rgba(0, 0, 0, 0.16)` | [px] unnamed | 1 rules: shadow 1 |
| `#00000017` | `rgba(0, 0, 0, 0.09)` | [px] unnamed | 1 rules: shadow 1 |
| `#000c17` | `#000c17` | [px] unnamed | 1 rules: other 1 |
| `#0000004a` | `rgba(0, 0, 0, 0.29)` | [px] unnamed | 1 rules: other 1 |
| `#00000091` | `rgba(0, 0, 0, 0.57)` | [px] unnamed | 1 rules: other 1 |
| `#ffffff26` | `rgba(255, 255, 255, 0.15)` | [px] unnamed | 1 rules: other 1 |
| `#00230b33` | `rgba(0, 35, 11, 0.2)` | [px] unnamed | 1 rules: shadow 1 |
| `#1ceeff` | `#1ceeff` | [px] unnamed | 1 rules: other 1 |
| `#00bfcf` | `#00bfcf` | [px] unnamed | 1 rules: edge 1 |
| `#00000000` | `rgba(0, 0, 0, 0)` | [px] unnamed | 1 rules: other 1 |
| `#03b2cb` | `#03b2cb` | [px] unnamed | 1 rules: other 1 |
| `#23394236` | `rgba(35, 57, 66, 0.21)` | [px] unnamed | 1 rules: shadow 1 |
| `#7d888d` | `#7d888d` | [px] unnamed | 1 rules: ink 1 |
| `#3e484f` | `#3e484f` | [px] unnamed | 1 rules: ink 1 |
| `#00000012` | `rgba(0, 0, 0, 0.07)` | [px] unnamed | border 182 — button |
| `#e1e7f0` | `#e1e7f0` | [px] unnamed | 1 rules: ground 1 |
| `#3d91ff` | `#3d91ff` | [px] unnamed | 1 rules: ground 1 |
| `#d5dce0` | `#d5dce0` | [px] unnamed | text 310 — PreviewArea |
| `#f8f8f8` | `#f8f8f8` | [px] unnamed | fill 308 · text 3 — PreviewArea, segmented item label |
| `#aeb9bf` | `#aeb9bf` | [px] unnamed | text 308 — PreviewArea |
| `#0091ba` | `#0091ba` | [px] unnamed | 1 rules: other 1 |
| `#007aff` | `#007aff` | [px] unnamed | 1 rules: other 1 |
| `#9299b803` | `rgba(146, 153, 184, 0.01)` | [px] unnamed | 1 rules: shadow 1 |
| `#222222e6` | `rgba(34, 34, 34, 0.9)` | [px] unnamed | 1 rules: ground 1 |
| `#9299b859` | `rgba(146, 153, 184, 0.35)` | [px] unnamed | 1 rules: shadow 1 |
| `#9299b8` | `#9299b8` | [px] unnamed | 1 rules: ink 1 |
| `#e7f3ef` | `#e7f3ef` | [px] unnamed | 1 rules: ground 1 |
| `#fceaea` | `#fceaea` | [px] unnamed | 1 rules: ground 1 |
| `#ffffff0d` | `rgba(255, 255, 255, 0.05)` | [px] unnamed | fill 9 — agancy staff main, text field |
| `#ededed` | `#ededed` | [px] unnamed | border 41 · text 2 — drawer header, segmented item label |
| `#c0c0c0` | `#c0c0c0` | [px] unnamed | 1 rules: ground 1 |
| `#cdcdcd` | `#cdcdcd` | [px] unnamed | border 62 — modal body, drawer body |
| `#4a4a4a` | `#4a4a4a` | [px] unnamed | 1 rules: ink 1 |
| `#20c4f4` | `#20c4f4` | [px] unnamed | border 2 — modal body, drawer body |
| `#aa6afa` | `#aa6afa` | [px] unnamed | 1 rules: other 1 |
| `#f12a2d` | `#f12a2d` | [px] unnamed | 1 rules: other 1 |
| `#4099e6` | `#4099e6` | [px] unnamed | 1 rules: other 1 |
| `#4f5eaa` | `#4f5eaa` | [px] unnamed | 1 rules: other 1 |
| `#f9a400` | `#f9a400` | [px] unnamed | 1 rules: other 1 |
| `#74c8cc` | `#74c8cc` | [px] unnamed | 1 rules: other 1 |
| `#00000022` | `rgba(0, 0, 0, 0.133)` | [px] unnamed | 1 rules: shadow 1 |
| `#55969b` | `#55969b` | [px] unnamed | fill 8 — badge status dot |
| `#28609f14` | `rgba(40, 96, 159, 0.078)` | [px] unnamed | 1 rules: other 1 |
| `#28609f` | `#28609f` | [px] unnamed | 1 rules: other 1 |
| `#4caf5014` | `rgba(76, 175, 80, 0.078)` | [px] unnamed | 1 rules: other 1 |
| `#4caf50` | `#4caf50` | [px] unnamed | 1 rules: other 1 |
| `#388b9114` | `rgba(56, 139, 145, 0.078)` | [px] unnamed | 1 rules: other 1 |
| `#388b91` | `#388b91` | [px] unnamed | 1 rules: other 1 |
| `#2cb27014` | `rgba(44, 178, 112, 0.078)` | [px] unnamed | 1 rules: other 1 |
| `#2cb270` | `#2cb270` | [px] unnamed | 1 rules: other 1 |
| `#cfae1914` | `rgba(207, 174, 25, 0.078)` | [px] unnamed | 1 rules: other 1 |
| `#2d3e9b14` | `rgba(45, 62, 155, 0.078)` | [px] unnamed | fill 267 — icon |
| `#2d3e9b` | `#2d3e9b` | [px] unnamed | 1 rules: other 1 |
| `#af6fff14` | `rgba(175, 111, 255, 0.078)` | [px] unnamed | fill 209 — icon |
| `#f7313114` | `rgba(247, 49, 49, 0.078)` | [px] unnamed | fill 209 — icon |
| `#5462af14` | `rgba(84, 98, 175, 0.078)` | [px] unnamed | fill 33 — icon |
| `#ffa90014` | `rgba(255, 169, 0, 0.078)` | [px] unnamed | fill 33 — icon |
| `#79cdd114` | `rgba(121, 205, 209, 0.078)` | [px] unnamed | fill 33 — icon |
| `#cfae1924` | `rgba(207, 174, 25, 0.141)` | [px] unnamed | fill 33 — icon |
| `#f0a74214` | `rgba(240, 167, 66, 0.078)` | [px] unnamed | fill 1559 — icon |
| `#ffffff14` | `rgba(255, 255, 255, 0.078)` | [px] unnamed | 1 rules: other 1 |
| `#006169b3` | `rgba(0, 97, 105, 0.7)` | [px] unnamed | 1 rules: other 1 |
| `#0061690d` | `rgba(0, 97, 105, 0.05)` | [px] unnamed | 1 rules: other 1 |
| `#f3f4f5` | `#f3f4f5` | [px] unnamed | fill 17 — stage |
| `#1d1d1f` | `#1d1d1f` | [px] unnamed | text 61 — status bar |
| `#ffffff99` | `rgba(255, 255, 255, 0.6)` | [px] unnamed | fill 244 — dots |
| `#e9f1f1` | `#e9f1f1` | [px] unnamed | fill 122 — pill btn |
| `#e7f6ec` | `#e7f6ec` | [px] unnamed | fill 61 — pill btn |
| `#1da851` | `#1da851` | [px] unnamed | 1 rules: ink 1 |
| `#e8e8e8` | `#e8e8e8` | [px] unnamed | border 30 — card |
| `#262626` | `#262626` | [px] unnamed | 1 rules: ink 1 |
| `#ffe9e9` | `#ffe9e9` | [px] unnamed | fill 94 — tag |
| `#cccccc` | `#cccccc` | [px] unnamed | fill 111 · text 16 — list item, history dot |
| `#ffffff22` | `rgba(255, 255, 255, 0.133)` | [px] unnamed | 1 rules: other 1 |
| `#00000099` | `rgba(0, 0, 0, 0.6)` | [px] unnamed | 1 rules: other 1 |
| `#0061698f` | `rgba(0, 97, 105, 0.56)` | [px] unnamed | 1 rules: ground 1 |
| `#00616900` | `rgba(0, 97, 105, 0)` | [px] unnamed | 1 rules: ground 1 |
| `#666666` | `#666666` | [px] unnamed | text 164 — message text, tooltip inner, drawer body |
| `#f2f2f2` | `#f2f2f2` | [px] unnamed | 1 rules: ink 1 |
| `#2d2d2d` | `#2d2d2d` | [px] unnamed | 1 rules: other 1 |
| `#3051f1` | `#3051f1` | [px] unnamed | 1 rules: other 1 |
| `#c92bb7` | `#c92bb7` | [px] unnamed | 1 rules: other 1 |
| `#f73344` | `#f73344` | [px] unnamed | 1 rules: other 1 |
| `#fa8e37` | `#fa8e37` | [px] unnamed | 1 rules: other 1 |
| `#fcdf8f` | `#fcdf8f` | [px] unnamed | 1 rules: other 1 |
| `#fbd377` | `#fbd377` | [px] unnamed | 1 rules: other 1 |
| `#4141412e` | `rgba(65, 65, 65, 0.18)` | [px] unnamed | 1 rules: shadow 1 |
| `#f3daff4f` | `rgba(243, 218, 255, 0.31)` | [px] unnamed | 1 rules: ground 1 |
| `#f7ecfd1a` | `rgba(247, 236, 253, 0.1)` | [px] unnamed | 1 rules: ground 1 |
| `#f3d9ff` | `#f3d9ff` | [px] unnamed | border 37 — card |
| `#bb51eb` | `#bb51eb` | [px] unnamed | 1 rules: ground 1 |
| `#dd94ff` | `#dd94ff` | [px] unnamed | 1 rules: ground 1 |
| `#0000001c` | `rgba(0, 0, 0, 0.11)` | [px] unnamed | 1 rules: shadow 1 |
| `#0e8073` | `#0e8073` | [px] unnamed | fill 188 — table cell, user avatar, layout content |
| `#0093cb` | `#0093cb` | [px] unnamed | text 131 — learn more |
| `#c796d8` | `#c796d8` | [px] unnamed | fill 40 — fill |
| `#e8f5fb66` | `rgba(232, 245, 251, 0.4)` | [px] unnamed | fill 2 — badge section |
| `#f4e9f566` | `rgba(244, 233, 245, 0.4)` | [px] unnamed | fill 2 — badge section |
| `#fffbe366` | `rgba(255, 251, 227, 0.4)` | [px] unnamed | fill 2 — badge section |
| `#0a6158` | `#0a6158` | [px] unnamed | 1 rules: ink 1 |
| `#e6f7ff` | `#e6f7ff` | [px] unnamed | fill 14 — user avatar |
| `#fff8e2` | `#fff8e2` | [px] unnamed | fill 88 — icon box |
| `#fbfbfb` | `#fbfbfb` | [px] unnamed | fill 48 · text 33 — tru broker banner container, tag |
| `#e6f5f5` | `#e6f5f5` | [px] unnamed | 1 rules: ground 1 |
| `#2b7b82` | `#2b7b82` | [px] unnamed | text 36 — task points |
| `#e8f5fb` | `#e8f5fb` | [px] unnamed | fill 44 — title pill |
| `#888888` | `#888888` | [px] unnamed | 1 rules: ink 1 |
| `#00a174` | `#00a174` | [px] unnamed | fill 197 — tag |
| `#595959` | `#595959` | [px] unnamed | 1 rules: ink 1 |
| `#1f1f1f99` | `rgba(31, 31, 31, 0.6)` | [px] unnamed | fill 2 — button |
| `#e1f6edfe` | `rgba(225, 246, 237, 0.996)` | [px] unnamed | 1 rules: other 1 |
| `#e1f6edee` | `rgba(225, 246, 237, 0.933)` | [px] unnamed | 1 rules: other 1 |
| `#e1f6edae` | `rgba(225, 246, 237, 0.682)` | [px] unnamed | 1 rules: other 1 |
| `#e1f5ec` | `#e1f5ec` | [px] unnamed | 1 rules: ground 1 |
| `#cfe7e8` | `#cfe7e8` | [px] unnamed | 1 rules: ground 1 |
| `#e1f6ed` | `#e1f6ed` | [px] unnamed | 1 rules: other 1 |
| `#00616905` | `rgba(0, 97, 105, 0.02)` | [px] unnamed | 1 rules: ground 1 |
| `#9d9d9d10` | `rgba(157, 157, 157, 0.063)` | [px] unnamed | 1 rules: shadow 1 |
| `#9299b810` | `rgba(146, 153, 184, 0.063)` | [px] unnamed | 1 rules: shadow 1 |
| `#333333` | `#333333` | [px] unnamed | 1 rules: ink 1 |
| `#ebebeb` | `#ebebeb` | [px] unnamed | border 171 — card |

## My Listings — new theme

**My Listings only** (Profolio 2.0, not yet live) — the designer's `tokens.json` (Bayut KSA Profolio 2.0: My Listings mobile, base 360pt, 2026-09-16), **following the build** where the two disagreed (the designer's decision, 29 Sep 2026), measured off the new My Listings' 136 compiled states. As CSS: `css/new-theme/tokens.css`; tokens.json's own values: `css/new-theme/tokens.resolved.json` → `$adjusted`. [design] = the designer's, as declared; [adjusted] = changed to what the build paints. Every other page uses the table above.

| token | css | value | tag | measured |
|---|---|---|---|---|
| `color.primary.0` | `--pf-ml-primary-0` | `#E9F7F0` | [design] | painted — 14 uses |
| `color.primary.1` | `--pf-ml-primary-1` | `#D4EFE2` | [design] | painted — 17 uses |
| `color.primary.2` | `--pf-ml-primary-2` | `#BEE8D3` | [design] | painted — 7 uses |
| `color.primary.3` | `--pf-ml-primary-3` | `#A9E0C5` | [design] | painted — 2 uses |
| `color.primary.4` | `--pf-ml-primary-4` | `#93D8B6` | [design] | declared, not painted |
| `color.primary.5` | `--pf-ml-primary-5` | `#7ED0A7` | [design] | declared, not painted |
| `color.primary.6` | `--pf-ml-primary-6` | `#69C899` | [design] | painted — 2 uses |
| `color.primary.7` | `--pf-ml-primary-7` | `#53C18A` | [design] | declared, not painted |
| `color.primary.8` | `--pf-ml-primary-8` | `#28B16D` | [design] | painted — 36 uses |
| `color.primary.9` | `--pf-ml-primary-9` | `#249F62` | [design] | painted — 31 uses |
| `color.primary.10` | `--pf-ml-primary-10` | `#208E57` | [design] | painted — 20 uses |
| `color.primary.11` | `--pf-ml-primary-11` | `#10603A` | [design] | painted — 22 uses |
| `color.primary.-1` | `--pf-ml-primary-m1` | `#F0FAF5` | [design] | painted — 16 uses |
| `color.brand.green` | `--pf-ml-brand-green` | `#28B16D` | [design] | painted — 36 uses |
| `color.brand.greenPressed` | `--pf-ml-brand-green-pressed` | `#208E57` | [design] | painted — 20 uses |
| `color.brand.greenInk` | `--pf-ml-brand-green-ink` | `#249F62` | [design] | painted — 31 uses |
| `color.brand.greenDeep` | `--pf-ml-brand-green-deep` | `#10603A` | [design] | painted — 22 uses |
| `color.tint.green050` | `--pf-ml-tint-green-050` | `#F0FAF5` | [design] | painted — 16 uses |
| `color.tint.green100` | `--pf-ml-tint-green-100` | `#E9F7F0` | [design] | painted — 14 uses |
| `color.tint.green200` | `--pf-ml-tint-green-200` | `#D4EFE2` | [design] | painted — 17 uses |
| `color.tint.teal050` | `--pf-ml-tint-teal-050` | `#F7FCFC` | [design] | painted — 2 uses |
| `color.tint.blue050` | `--pf-ml-tint-blue-050` | `#F0F7FC` | [design] | painted — 3 uses |
| `color.tint.amber050` | `--pf-ml-tint-amber-050` | `#FEF8F0` | [design] | painted — 6 uses |
| `color.tint.amber100` | `--pf-ml-tint-amber-100` | `#FCEDD9` | [design] | painted — 4 uses |
| `color.tint.red050` | `--pf-ml-tint-red-050` | `#FFF2F2` | [design] | painted — 6 uses |
| `color.tint.red100` | `--pf-ml-tint-red-100` | `#FFE0E0` | [design] | painted — 4 uses |
| `color.status.good` | `--pf-ml-status-good` | `#249F62` | [design] | painted — 31 uses |
| `color.status.warn` | `--pf-ml-status-warn` | `#C88B37` | [design] | painted — 12 uses |
| `color.status.bad` | `--pf-ml-status-bad` | `#CE2929` | [design] | painted — 10 uses |
| `color.status.info` | `--pf-ml-status-info` | `#3B84C4` | [design] | painted — 6 uses |
| `color.status.neutral` | `--pf-ml-status-neutral` | `#707070` | [design] | painted — 31 uses |
| `color.text.primary` | `--pf-ml-text-primary` | `#222222` | [design] | painted — 49 uses |
| `color.text.secondary` | `--pf-ml-text-secondary` | `#4F4F4F` | [design] | painted — 26 uses |
| `color.text.tertiary` | `--pf-ml-text-tertiary` | `#626262` | [design] | painted — 23 uses |
| `color.text.muted` | `--pf-ml-text-muted` | `#707070` | [design] | painted — 31 uses |
| `color.text.faint` | `--pf-ml-text-faint` | `#9D9D9D` | [design] | painted — 34 uses |
| `color.text.onBrand` | `--pf-ml-text-on-brand` | `#FFFFFF` | [design] | painted — 81 uses |
| `color.border.strong` | `--pf-ml-border-strong` | `#DEDEDE` | [design] | painted — 14 uses |
| `color.border.base` | `--pf-ml-border-base` | `#E6E6E6` | [design] | painted — 23 uses |
| `color.border.soft` | `--pf-ml-border-soft` | `#F0F0F0` | [design] | painted — 32 uses |
| `color.surface.page` | `--pf-ml-surface-page` | `#F6F7FB` | [adjusted] | follows the build — tokens.json: `#F3F4F5`; the phone's page, 70 states (tokens.json is the phone's) |
| `color.surface.card` | `--pf-ml-surface-card` | `#FFFFFF` | [design] | painted — 81 uses |
| `color.surface.sheet` | `--pf-ml-surface-sheet` | `#FFFFFF` | [design] | painted — 81 uses |
| `color.surface.scrim` | `--pf-ml-surface-scrim` | `rgba(23,26,31,0.42)` | [adjusted] | follows the build — tokens.json: `rgba(0,0,0,0.42)`; the build's 42% layer, 3 uses |
| `color.gradient.signature` | `--pf-ml-gradient-signature` | `linear-gradient(46deg,#696EFF 0%,#D466DE 100%)` | [design] | painted — 4 uses |
| `color.gradient.hot` | `--pf-ml-gradient-hot` | `linear-gradient(244deg,#DD5050 0%,#AB251D 100%)` | [design] | painted — 4 uses |
| `radius.xs` | `--pf-ml-radius-xs` | `4px` | [design] | corner radius |
| `radius.sm` | `--pf-ml-radius-sm` | `6px` | [design] | corner radius |
| `radius.md` | `--pf-ml-radius-md` | `8px` | [design] | corner radius |
| `radius.lg` | `--pf-ml-radius-lg` | `12px` | [design] | corner radius |
| `radius.sheet` | `--pf-ml-radius-sheet` | `20px` | [adjusted] | follows the build — tokens.json: `20px`; 20px on How to Earn Quality Score sheet, Listing Performance bottom sheet, Filters sheet, Mark as Booked sheet, Request Services sheet — as declared |
| `radius.pill` | `--pf-ml-radius-pill` | `999px` | [design] | corner radius |
| `space.xxs` | `--pf-ml-space-xxs` | `2px` | [design] | padding, margin or gap |
| `space.xs` | `--pf-ml-space-xs` | `4px` | [design] | padding, margin or gap |
| `space.sm` | `--pf-ml-space-sm` | `6px` | [design] | padding, margin or gap |
| `space.md` | `--pf-ml-space-md` | `8px` | [design] | padding, margin or gap |
| `space.lg` | `--pf-ml-space-lg` | `12px` | [design] | padding, margin or gap |
| `space.xl` | `--pf-ml-space-xl` | `16px` | [design] | padding, margin or gap |
| `space.xxl` | `--pf-ml-space-xxl` | `20px` | [design] | padding, margin or gap |
| `space.section` | `--pf-ml-space-section` | `24px` | [design] | padding, margin or gap |
| `type.family.ui` | `--pf-ml-font-ui` | `Geist` | [design] | 90.4% of the text |
| `type.family.app` | `--pf-ml-font-app` | `Lato` | [design] | kept — painted nowhere — nothing to follow |
| `type.family.chrome` | `--pf-ml-font-chrome` | `Figtree` | [design] | 9.5% of the text |
| `type.family.mono` | `--pf-ml-font-mono` | `JetBrains Mono` | [design] | kept — painted nowhere — nothing to follow |
| `type.locationNotLive` | `--pf-ml-type-location-not-live` | `12/normal · 400 · Geist · #222222` | [design] | variant of `type.location` — the list (tab-draft, tab-pending, tab-removed) |
| `type.statPerformance` | `--pf-ml-type-stat-performance` | `16/normal · 700 · Geist` | [design] | variant of `type.stat` — Listing Performance bottom sheet (sheet-case-happy, sheet-case-daily-rental, sheet-improve-quality) |
| `type.labelPerformance` | `--pf-ml-type-label-performance` | `11/normal · 400 · Geist · #626262` | [design] | variant of `type.label` — Listing Performance bottom sheet |
| `type.sheetTitlePerformance` | `--pf-ml-type-sheet-title-performance` | `18/normal · 700 · Geist` | [design] | variant of `type.sheetTitle` — Listing Performance bottom sheet |
| `radius.sheetAction` | `--pf-ml-radius-sheet-action` | `16px` | [design] | variant of `radius.sheet` — Filter value sheet, Delete listing sheet, Share sheet, Listing actions sheet, Date range sheet, Sort sheet, TruCheck sheet |
| `target.iconButtonHeader` | `--pf-ml-target-icon-button-header` | `32px` | [design] | variant of `target.iconButton` — the list header (filter, sort) |
| `target.iconButtonSheet` | `--pf-ml-target-icon-button-sheet` | `24px` | [design] | variant of `target.iconButton` — the How to Earn Quality Score sheet |
| `surface.pageWeb` | `--pf-ml-surface-page-web` | `#F3F4F5` | [design] | variant of `color.surface.page` — the web page, 66 states |
| currency | — | the riyal glyph | [product] | the screens draw the build's riyal glyph wherever the handover wrote "SAR" (the designer's decision) |
| `type.price` | `--pf-ml-type-price` | `16/normal · 700 · Geist` | [adjusted] | follows the build — tokens.json: `Geist 17/22 · 700`; the phone draws it so ×129 (screen, Listing Performance bottom sheet; "1,500,000"); also, rarely, Geist 13/normal · 700 ×3 (Delete listing sheet, TruCheck sheet) |
| `type.subtype` | `--pf-ml-type-subtype` | `11/normal · 600 · Geist · #10603A` | [adjusted] | follows the build — tokens.json: `Geist 12/16 · 600 · #249F62`; the phone draws it so ×182 (screen, Listing Performance bottom sheet; "Apartment for Sale"); also, rarely, Geist 12/normal · 600 · #249F62 ×3 (Delete listing sheet, TruCheck sheet); Geist 10/normal · 700 · #10603A ×8 (screen) |
| `type.location` | `--pf-ml-type-location` | `12/normal · 400 · Geist · #626262` | [adjusted] | follows the build — tokens.json: `Geist 12/16 · 400 · #707070`; the phone draws it so ×159 (screen, Listing Performance bottom sheet; "Al Hazm, West Riyadh"); also, rarely, Geist 12/normal · 400 · #707070 ×3 (Delete listing sheet, TruCheck sheet); Geist 11/normal · 400 · #222222 ×7 (screen) |
| `type.stat` | `--pf-ml-type-stat` | `12/normal · 700 · Geist` | [adjusted] | follows the build — tokens.json: `Geist 14/18 · 700`; the phone draws it so ×132 (screen; "1,288") |
| `type.label` | `--pf-ml-type-label` | `11/normal · 300 · Geist · #4F4F4F` | [adjusted] | follows the build — tokens.json: `Geist 11/14 · 500 · #9D9D9D`; the phone draws it so ×468 (screen; "Views") |
| `type.sheetTitle` | `--pf-ml-type-sheet-title` | `17/normal · 700 · Figtree` | [adjusted] | follows the build — tokens.json: `Figtree 18/24 · 700`; the phone draws it so ×13 (Delete listing sheet, Filters sheet, Mark as Booked sheet, Share sheet, Request Services sheet, Listing actions sheet, Date range sheet, Sort sheet, TruCheck sheet; "Delete this listing?"); also, rarely, Figtree 17/24 · 700 ×2 (How to Earn Quality Score sheet) |
| `type.body` | `--pf-ml-type-body` | `13/20 · 400` | [design] | type role (phone, 360pt) — drawn as declared |
| `motion.sheetIn` | `--pf-ml-motion-sheet-in` | `340ms cubic-bezier(.32,.72,0,1)` | [design] | motion |
| `motion.sheetOut` | `--pf-ml-motion-sheet-out` | `260ms cubic-bezier(.32,.72,0,1)` | [design] | motion |
| `motion.chipPress` | `--pf-ml-motion-chip-press` | `120ms ease-out` | [design] | motion |
| `motion.scoreBar` | `--pf-ml-motion-score-bar` | `640ms cubic-bezier(.22,1,.36,1)` | [design] | motion |
| `motion.skeleton` | `--pf-ml-motion-skeleton` | `1800ms linear` | [design] | filter simulation hold |
| `motion.toast` | `--pf-ml-motion-toast` | `3200ms ease` | [design] | in 200 / hold 2800 / out 200 |
| `elevation.sheet` | `--pf-ml-elevation-sheet` | `0 -8px 40px rgba(23,26,31,0.18)` | [adjusted] | follows the build — tokens.json: `0 -8px 32px rgba(0,0,0,0.16)`; the build paints it on Listing Performance bottom sheet, Filter value sheet, Delete listing sheet, Filters sheet, Mark as Booked sheet, Share sheet, Request Services sheet, Listing actions sheet, Date range sheet, Sort sheet, TruCheck sheet |
| `elevation.card` | `--pf-ml-elevation-card` | `none` | [adjusted] | follows the build — tokens.json: `0 1px 2px rgba(0,0,0,0.04)`; no listing card paints a shadow |
| `elevation.toast` | `--pf-ml-elevation-toast` | `0 10px 30px rgba(23,26,31,0.22)` | [adjusted] | follows the build — tokens.json: `0 14px 34px rgba(0,0,0,0.22)`; the build paints it on screen |
| `elevation.rankBad` | `--pf-ml-elevation-rank-bad` | `0 0 2px rgba(255,0,0,0.12) inset` | [design] | elevation — painted as declared |
| `target.min` | `--pf-ml-target-min` | `44px` | [design] | kept — a rule, not a size: the build's icon buttons are below it (32, 40, 24px) — accessibility, [TBC] with the designer |
| `target.iconButton` | `--pf-ml-target-icon-button` | `40px` | [adjusted] | follows the build — tokens.json: `44px`; the build draws a listing card's icon buttons at 40x40 ×22; elsewhere 32x32 ×136 (the list header (filter, sort)), 24x24 ×2 (the How to Earn Quality Score sheet) |
| `target.chip` | `--pf-ml-target-chip` | `32px` | [design] | touch target |
| `target.row` | `--pf-ml-target-row` | `88px` | [design] | touch target |
