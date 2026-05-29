import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
let browser, page;
const results = [];
let screenshotN = 0;

const BROWSER_OPTS = {
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
};
const VIEWPORT = { width: 390, height: 844, isMobile: true, hasTouch: true };

async function shot(label) {
  screenshotN++;
  const file = `/tmp/${String(screenshotN).padStart(2,'0')}-${label.replace(/[^a-z0-9]/gi,'_')}.png`;
  await page.screenshot({ path: file });
  console.log(`📸 [${screenshotN}] ${label}`);
  return file;
}
function pass(msg) { results.push({ ok: true, msg }); console.log(`  ✅ ${msg}`); }
function fail(msg) { results.push({ ok: false, msg }); console.log(`  ❌ ${msg}`); }
async function check(label, fn) {
  try { await fn(); pass(label); }
  catch(e) { fail(`${label}: ${e.message.split('\n')[0]}`); }
}
async function waitText(text, timeout = 8000) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout });
}
async function clearData() {
  await page.evaluate(() =>
    Object.keys(localStorage).filter(k => k.startsWith('omniworx')).forEach(k => localStorage.removeItem(k))
  );
}
// Enter PIN on lock screen — no-op if dashboard is already showing
async function enterPin(pin = '1234') {
  const lockVisible = await page.getByText('Voer PIN in', { exact: false }).isVisible().catch(() => false)
    || await page.getByText('Stel een PIN in', { exact: false }).isVisible().catch(() => false);
  if (!lockVisible) return;
  for (const d of pin.split('')) {
    await page.getByRole('button', { name: d, exact: true }).click();
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(1500);
}
// SPA navigate — pushes route without full reload (keeps React state/PIN)
async function spaNav(path) {
  await page.evaluate((p) => window.history.pushState({}, '', p), path);
  // Trigger React Router re-render by dispatching popstate
  await page.evaluate((p) => window.dispatchEvent(new PopStateEvent('popstate', { state: {} })), path);
  await page.waitForTimeout(600);
}
// Navigate via bottom nav label (safe in-app navigation)
async function navTo(label) {
  // BottomNav is a <nav class="fixed bottom-0 ..."> — use it directly
  await page.locator('nav').getByText(label, { exact: false }).first().click();
  await page.waitForTimeout(600);
}
// Navigate to Settings via the gear icon on the Dashboard header
async function navToSettings() {
  // If not on dashboard, go there first via nav
  const gearVisible = await page.locator('[aria-label="Instellingen"]').isVisible().catch(() => false);
  if (!gearVisible) await navTo('Dashboard');
  await page.locator('[aria-label="Instellingen"]').click();
  await page.waitForTimeout(600);
}

(async () => {
  browser = await chromium.launch({ ...BROWSER_OPTS, defaultViewport: VIEWPORT });
  page = await browser.newPage();
  page.setDefaultTimeout(10000);

  console.log('\n════════════════════════════════════════');
  console.log('   OMNIWORX FACTUUR — FULL FEATURE TEST');
  console.log('════════════════════════════════════════\n');

  // ── 1. PIN SETUP ────────────────────────────────────────────────────────
  console.log('── 1. PIN SETUP ──');
  await page.goto(BASE);
  await clearData();
  await page.reload();
  await page.waitForTimeout(1500);

  await check('PIN setup screen shows logo', async () =>
    page.waitForSelector('img[alt="Omniworx logo"]')
  );
  await check('"Stel een PIN in" title', async () => waitText('Stel een PIN in'));
  await shot('01-pin-setup');

  for (const d of ['1','2','3','4']) {
    await page.getByRole('button', { name: d, exact: true }).click();
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(500);
  await check('Confirm step shows', async () => waitText('Bevestig PIN'));

  for (const d of ['1','2','3','4']) {
    await page.getByRole('button', { name: d, exact: true }).click();
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(2000);
  await check('Dashboard reached after setup', async () => waitText('Dashboard'));
  await shot('02-dashboard-after-setup');

  // ── 2. DASHBOARD EMPTY STATE ────────────────────────────────────────────
  console.log('\n── 2. DASHBOARD EMPTY ──');
  await check('Empty invoice message', async () => waitText('Nog geen facturen'));
  await check('Empty state CTA button', async () => {
    const n = await page.getByRole('button').filter({ hasText: /Nieuwe Factuur/i }).count();
    if (n < 1) throw new Error('No Nieuwe Factuur CTA button found');
  });
  await check('Stats section visible', async () => waitText('Openstaand'));

  // ── 3. WRONG PIN + FORGOT PIN ────────────────────────────────────────────
  console.log('\n── 3. WRONG PIN + FORGOT PIN ──');
  await page.reload();
  await page.waitForTimeout(1500);
  await check('"Voer PIN in" after reload', async () => waitText('Voer PIN in'));
  await check('"PIN vergeten?" button visible', async () =>
    page.getByRole('button').filter({ hasText: /vergeten/i }).waitFor()
  );

  for (const d of ['9','9','9','9']) {
    await page.getByRole('button', { name: d, exact: true }).click();
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(1500);
  await shot('03-wrong-pin');
  await check('Wrong PIN error shows', async () => waitText('Onjuiste PIN'));

  await page.getByRole('button').filter({ hasText: /vergeten/i }).click();
  await page.waitForTimeout(500);
  await shot('04-forgot-pin-dialog');
  await check('Forgot PIN warning text', async () => waitText('ALLE facturen'));
  await check('Forgot PIN reset button', async () => waitText('alles wissen'));
  // Cancel
  await page.getByRole('button').filter({ hasText: /Annuleren/i }).last().click();
  await page.waitForTimeout(300);
  // Re-enter correct PIN
  await enterPin('1234');
  await check('Dashboard after correct PIN', async () => waitText('Dashboard'));

  // ── 4. CLIENTS ────────────────────────────────────────────────────────────
  console.log('\n── 4. CLIENTS ──');
  await navTo('Klanten');
  await shot('05-clients-empty');
  await check('Clients empty state', async () => waitText('Nog geen klanten'));

  await page.getByRole('button').filter({ hasText: /Klant toevoegen/i }).click();
  await page.waitForTimeout(500);
  // Validation
  await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).click();
  await page.waitForTimeout(300);
  await shot('06-client-validation');
  await check('Client name required error', async () => waitText('verplicht'));
  // Fill & save
  const inputs = page.locator('input:not([type=hidden])');
  await inputs.nth(0).fill('Jan de Vries');
  await inputs.nth(1).fill('Teststraat 1');
  await inputs.nth(2).fill('5701AA');
  await inputs.nth(3).fill('Helmond');
  await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).click();
  await page.waitForTimeout(600);
  await shot('07-client-saved');
  await check('Client saved toast', async () => waitText('opgeslagen', 4000));
  await page.waitForTimeout(2500);
  await check('Client appears in list', async () => waitText('Jan de Vries'));
  // Search empty
  await page.locator('input[placeholder*="Zoeken"]').fill('zzznietbestaand');
  await page.waitForTimeout(300);
  await shot('08-search-empty');
  await check('Search empty state (i18n)', async () => waitText('Geen klanten gevonden'));
  await page.locator('input[placeholder*="Zoeken"]').fill('');
  // Edit client
  await page.getByText('Jan de Vries').click();
  await page.waitForTimeout(400);
  await check('Edit client form', async () => waitText('Klant Bewerken'));
  await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).click();
  await page.waitForTimeout(600);
  await check('Edit client saved toast', async () => waitText('opgeslagen', 4000));
  await page.waitForTimeout(2500);

  // ── 5. NEW INVOICE ────────────────────────────────────────────────────────
  console.log('\n── 5. NEW INVOICE ──');
  // Use the "+ Nieuw" center button in bottom nav
  const centerBtn = page.locator('.fixed').getByRole('link').filter({ hasText: /Nieuw/i });
  await centerBtn.click();
  await page.waitForTimeout(800);
  await shot('09-new-invoice');
  await check('New invoice form loads', async () => waitText('Werkzaamheden'));
  await check('Required fields legend', async () => waitText('* = verplicht veld'));

  // Validate: save with nothing
  await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).click();
  await page.waitForTimeout(300);
  await shot('10-invoice-validation');
  await check('Validation errors shown', async () => {
    const n = await page.locator('.text-red-600').count();
    if (n === 0) throw new Error('No errors');
  });

  // Date validation
  const dateInputs = page.locator('input[type="date"]');
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  await dateInputs.first().fill(today);
  await dateInputs.nth(1).fill(yesterday);
  await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).click();
  await page.waitForTimeout(300);
  await shot('11-date-validation');
  await check('Date order validation error', async () => waitText('na de factuurdatum'));

  // Fix date & pick client
  const future = new Date(Date.now() + 14*86400000).toISOString().split('T')[0];
  await dateInputs.nth(1).fill(future);
  await page.waitForTimeout(800);
  await shot('12-after-date-fix');
  // Switch from manual → saved client mode, then open the picker
  await page.getByRole('button').filter({ hasText: /^📋 Klant kiezen$|^Klant kiezen$/i }).first().click();
  await page.waitForTimeout(400);
  await page.getByRole('button').filter({ hasText: /Bestaande klant kiezen/i }).click();
  await page.waitForTimeout(500);
  await shot('13-client-picker');
  await check('Client picker opens', async () => waitText('Klant Kiezen'));
  await page.getByText('Jan de Vries').first().click();
  await page.waitForTimeout(500);

  // Fill first line item (form starts with one empty item)
  await page.locator('select').first().selectOption('renovatie');
  await page.waitForTimeout(200);
  await page.locator('input[inputmode="decimal"]').first().fill('3');
  await page.locator('input[inputmode="decimal"]').nth(1).fill('100');
  await page.waitForTimeout(300);
  await shot('13-invoice-with-items');
  await check('Running total shows euro', async () => {
    // Totals section has bg-primary-700; grand total is the last text with €
    const txt = await page.locator('.bg-primary-700').last().textContent();
    if (!txt || !txt.includes('€')) throw new Error(`No € total in totals section`);
  });

  // Cancel warning
  await page.getByRole('button').filter({ hasText: /^Annuleren$/i }).click();
  await page.waitForTimeout(400);
  await shot('14-cancel-warning');
  await check('Unsaved changes warning', async () => waitText('Wijzigingen gaan verloren'));
  await page.getByText('Nee, doorgaan', { exact: false }).click();
  await page.waitForTimeout(300);
  // Save
  await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).click();
  await page.waitForTimeout(800);
  await shot('15-invoice-saved');
  await check('Invoice saved toast', async () => waitText('Factuur opgeslagen', 4000));
  await page.waitForTimeout(2500);

  // ── 6. INVOICE DETAIL ────────────────────────────────────────────────────
  console.log('\n── 6. INVOICE DETAIL ──');
  await shot('16-invoice-detail');
  // Mark paid
  await page.getByRole('button').filter({ hasText: /✅ Betaald/i }).click();
  await page.waitForTimeout(600);
  await shot('17-marked-paid');
  await check('Mark paid toast', async () => waitText('betaald', 4000));
  await page.waitForTimeout(2500);
  // Mark unpaid
  await page.getByRole('button').filter({ hasText: /Onbetaald/i }).first().click();
  await page.waitForTimeout(600);
  await check('Mark unpaid toast', async () => waitText('onbetaald', 4000));
  await page.waitForTimeout(2500);
  // Edit
  await page.getByRole('button').filter({ hasText: /Bewerken/i }).click();
  await page.waitForTimeout(600);
  await check('Edit invoice form loads', async () => waitText('Factuur Bewerken'));
  await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).click();
  await page.waitForTimeout(800);
  await shot('18-invoice-updated');
  await check('Invoice updated toast', async () => waitText('bijgewerkt', 4000));
  await page.waitForTimeout(2500);
  // Delete confirm (then cancel)
  await page.getByRole('button').filter({ hasText: /Verwijderen/i }).last().click();
  await page.waitForTimeout(400);
  await shot('19-invoice-delete-confirm');
  await check('Delete confirm dialog', async () => waitText('wilt verwijderen'));
  await page.getByRole('button').filter({ hasText: /Annuleren/i }).last().click();
  await page.waitForTimeout(300);

  // ── 7. INVOICE LIST FILTERS ──────────────────────────────────────────────
  console.log('\n── 7. INVOICE LIST ──');
  await navTo('Facturen');
  await check('Invoice in list', async () => waitText('Jan de Vries'));
  await page.getByRole('button').filter({ hasText: /^Betaald$/i }).first().click();
  await page.waitForTimeout(400);
  await shot('20-invoice-list-paid');
  await check('Paid filter empty state', async () => waitText('Geen facturen'));
  await page.getByRole('button').filter({ hasText: /^Alle$/i }).first().click();
  await page.waitForTimeout(300);

  // ── 8. NEW QUOTE ─────────────────────────────────────────────────────────
  console.log('\n── 8. NEW QUOTE ──');
  await navTo('Offerten');
  await shot('21-quotes-empty');
  await check('Quotes empty state', async () => waitText('Nog geen offertes'));

  await page.getByRole('button').filter({ hasText: /Nieuwe Offerte/i }).first().click();
  await page.waitForTimeout(600);
  await page.getByRole('button').filter({ hasText: /^📋 Klant kiezen$|^Klant kiezen$/i }).first().click();
  await page.waitForTimeout(300);
  await page.getByRole('button').filter({ hasText: /Bestaande klant kiezen/i }).click();
  await page.waitForTimeout(400);
  await page.getByText('Jan de Vries').first().click();
  await page.waitForTimeout(400);
  // Fill first line item using the service dropdown (no textarea needed)
  await page.locator('select').first().selectOption('renovatie');
  await page.waitForTimeout(200);
  await page.locator('input[inputmode="decimal"]').first().fill('2');
  await page.locator('input[inputmode="decimal"]').nth(1).fill('500');
  await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).click();
  await page.waitForTimeout(800);
  await shot('22-quote-saved');
  await check('Quote saved toast', async () => waitText('Offerte opgeslagen', 4000));
  await page.waitForTimeout(2500);

  // ── 9. QUOTE DETAIL ──────────────────────────────────────────────────────
  console.log('\n── 9. QUOTE DETAIL ──');
  await shot('23-quote-detail');
  await check('Quote shows pending status', async () => waitText('In behandeling'));
  // Accept
  await page.getByRole('button').filter({ hasText: /Geaccepteerd/i }).first().click();
  await page.waitForTimeout(800);
  await shot('24-quote-accepted');
  await check('Accept toast', async () => waitText('geaccepteerd', 4000));
  await page.waitForTimeout(2500);
  await check('"Maak Factuur" button appears', async () =>
    page.getByRole('button').filter({ hasText: /Maak Factuur/i }).waitFor()
  );
  // Convert
  await page.getByRole('button').filter({ hasText: /Maak Factuur/i }).click();
  await page.waitForTimeout(400);
  await shot('25-convert-dialog');
  await check('Convert dialog shows', async () => waitText('omzetten naar factuur'));
  await check('"Ja, omzetten" in dialog', async () => waitText('Ja, omzetten'));
  await page.getByText('Ja, omzetten', { exact: false }).click();
  await page.waitForTimeout(1500);
  await shot('26-converted');
  await check('Convert toast + navigates to invoice', async () => waitText('aangemaakt', 4000));
  await page.waitForTimeout(2500);

  // ── 10. QUOTE REJECT ─────────────────────────────────────────────────────
  console.log('\n── 10. QUOTE REJECT ──');
  await navTo('Offerten');
  // Use the + header button (always visible, not just in empty state)
  await page.locator('[aria-label="Nieuwe Offerte"]').click();
  await page.waitForTimeout(600);
  await page.getByRole('button').filter({ hasText: /^📋 Klant kiezen$|^Klant kiezen$/i }).first().click();
  await page.waitForTimeout(300);
  await page.getByRole('button').filter({ hasText: /Bestaande klant kiezen/i }).click();
  await page.waitForTimeout(400);
  await page.getByText('Jan de Vries').first().click();
  await page.waitForTimeout(400);
  // Fill first line item using the service dropdown
  await page.locator('select').first().selectOption('renovatie');
  await page.waitForTimeout(200);
  await page.locator('input[inputmode="decimal"]').first().fill('1');
  await page.locator('input[inputmode="decimal"]').nth(1).fill('100');
  await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).click();
  await page.waitForTimeout(1500);
  // Reject with confirm
  await page.getByRole('button').filter({ hasText: /Afwijzen/i }).first().click();
  await page.waitForTimeout(400);
  await shot('27-reject-confirm');
  await check('Reject confirm shows', async () => waitText('ongedaan'));
  await check('"Ja, afwijzen" in dialog', async () => waitText('Ja, afwijzen'));
  await page.getByText('Ja, afwijzen', { exact: false }).click();
  await page.waitForTimeout(800);
  await shot('28-rejected');
  await check('Reject toast fires', async () => waitText('afgewezen', 4000));
  await page.waitForTimeout(2500);
  // Delete quote with confirm
  await page.getByRole('button').filter({ hasText: /Verwijderen/i }).last().click();
  await page.waitForTimeout(400);
  await shot('29-quote-delete-confirm');
  await check('Quote delete confirm dialog', async () => waitText('wilt verwijderen'));
  await page.getByRole('button').filter({ hasText: /Ja, verwijderen/i }).click();
  await page.waitForTimeout(800);
  await shot('30-quote-deleted');
  await check('Quote deleted toast', async () => waitText('Offerte verwijderd', 4000));
  await page.waitForTimeout(2500);

  // ── 11. SETTINGS ─────────────────────────────────────────────────────────
  console.log('\n── 11. SETTINGS ──');
  await navToSettings();
  await shot('31-settings');
  await check('Settings loads', async () => waitText('Instellingen'));

  await page.getByRole('button').filter({ hasText: /PIN wijzigen/i }).click();
  await page.waitForTimeout(400);
  // PIN length validation
  await page.locator('input[type="password"]').first().fill('12');
  await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).click();
  await page.waitForTimeout(300);
  await shot('32-pin-length-error');
  await check('PIN length error (translated)', async () => waitText('4 cijfers'));
  // Valid change
  await page.locator('input[type="password"]').first().fill('1234');
  await page.locator('input[type="password"]').last().fill('1234');
  await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).click();
  await page.waitForTimeout(800);
  await shot('33-pin-changed');
  await check('PIN changed success (translated)', async () => waitText('PIN gewijzigd'));

  // Arabic
  await page.getByRole('button').filter({ hasText: /عربي/i }).click();
  await page.waitForTimeout(1000);
  await shot('34-arabic');
  await check('Arabic UI active', async () => waitText('الإعدادات'));
  await check('RTL direction set', async () => {
    const dir = await page.evaluate(() => document.documentElement.dir);
    if (dir !== 'rtl') throw new Error(`dir=${dir}, expected rtl`);
  });
  await page.getByRole('button').filter({ hasText: /Nederlands/i }).click();
  await page.waitForTimeout(800);
  await check('Back to Dutch', async () => waitText('Instellingen'));

  // ── 12. DASHBOARD WITH DATA ────────────────────────────────────────────
  console.log('\n── 12. DASHBOARD WITH DATA ──');
  await page.locator('nav').getByText('Dashboard', { exact: false }).first().click();
  await page.waitForTimeout(600);
  await page.waitForTimeout(500);
  await shot('35-dashboard-with-data');
  await check('Recent invoice shows in dashboard', async () => waitText('Jan de Vries'));
  await check('Outstanding count > 0', async () => {
    const els = await page.locator('.text-3xl.font-bold').all();
    const nums = await Promise.all(els.map(el => el.textContent()));
    if (!nums.some(n => parseInt(n) > 0)) throw new Error(`All zeros: ${nums.join(', ')}`);
  });

  // ── FINAL REPORT ─────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════');
  console.log('            TEST RESULTS');
  console.log('════════════════════════════════════════');
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  results.forEach(r => console.log(`${r.ok ? '✅' : '❌'} ${r.msg}`));
  console.log(`\n${passed} passed, ${failed} failed out of ${results.length} checks`);
  if (failed === 0) console.log('\n🎉 All checks passed!');
  else {
    console.log('\n❌ FAILURES:');
    results.filter(r => !r.ok).forEach(r => console.log(`   • ${r.msg}`));
  }
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})().catch(async e => {
  console.error('\nFATAL:', e.message.split('\n')[0]);
  if (page) await page.screenshot({ path: '/tmp/fatal-error.png' }).catch(() => {});
  if (browser) await browser.close();
  process.exit(1);
});
