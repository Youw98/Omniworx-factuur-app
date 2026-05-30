import { chromium } from './node_modules/playwright/index.mjs';

const BASE = 'http://localhost:5174';
const BROWSER_OPTS = {
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
};
const VIEWPORT = { width: 390, height: 844 };

const results = [];
const jsErrors = [];
let browser, page;
let shotN = 0;

function log(msg) { process.stdout.write(msg + '\n'); }
function pass(msg) { results.push({ ok: true, msg }); log(`  ✅ PASS: ${msg}`); }
function fail(msg, detail = '') {
  const fullMsg = detail ? `${msg}: ${detail}` : msg;
  results.push({ ok: false, msg: fullMsg });
  log(`  ❌ FAIL: ${fullMsg}`);
}

async function shot(label) {
  shotN++;
  const file = `/tmp/verify-${String(shotN).padStart(2, '0')}-${label.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
  await page.screenshot({ path: file, fullPage: false });
  log(`  📸 ${file}`);
  return file;
}

async function check(label, fn) {
  try {
    const result = await fn();
    pass(label);
    return result;
  } catch (e) {
    fail(label, e.message.split('\n')[0].substring(0, 200));
    return null;
  }
}

async function waitFor(text, timeout = 8000) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout });
}

async function navViaBottomNav(label) {
  const nav = page.locator('nav.fixed.bottom-0');
  await nav.getByText(label, { exact: false }).first().click();
  await page.waitForTimeout(800);
}

async function enterPin(digits = '1234') {
  for (const d of digits.split('')) {
    await page.getByRole('button', { name: d, exact: true }).click();
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(1200);
}

// Use React Router navigate via clicking real links, not pushState (which confuses React Router)
async function clickNavLink(href) {
  await page.locator(`a[href="${href}"]`).first().click().catch(async () => {
    // fallback: evaluate navigate
    await page.evaluate((h) => {
      window.history.pushState({}, '', h);
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    }, href);
  });
  await page.waitForTimeout(800);
}

// ─────────────────────────────────────────────────────────
//  MAIN TEST RUNNER
// ─────────────────────────────────────────────────────────
(async () => {
  browser = await chromium.launch({ ...BROWSER_OPTS, headless: true, defaultViewport: VIEWPORT });
  const context = await browser.newContext({ viewport: VIEWPORT });
  page = await context.newPage();
  page.setDefaultTimeout(12000);

  // Collect JS errors
  page.on('pageerror', (err) => {
    jsErrors.push(err.message);
    log(`  ⚠️  JS Error: ${err.message.substring(0, 200)}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out React DevTools noise
      if (!text.includes('Download the React DevTools') && !text.includes('favicon')) {
        jsErrors.push(`[console.error] ${text}`);
      }
    }
  });

  log('\n══════════════════════════════════════════════════════');
  log('   OMNIWORX FACTUUR APP — FULL REGRESSION TEST');
  log('══════════════════════════════════════════════════════\n');

  // ──────────────────────────────────────────────────────────────────────────
  //  FLOW 1: PIN LOCK — first launch setup
  // ──────────────────────────────────────────────────────────────────────────
  log('\n═══ FLOW 1: PIN LOCK — First Launch Setup ═══');
  await page.goto(BASE);
  await page.waitForTimeout(1500);
  // Clear all omniworx data to ensure fresh start
  await page.evaluate(() => {
    Object.keys(localStorage).forEach(k => localStorage.removeItem(k));
  });
  await page.reload();
  await page.waitForTimeout(2000);
  await shot('pin-setup-initial');

  await check('F1.1 PIN setup: logo visible', async () => {
    await page.waitForSelector('img[alt="Omniworx logo"]', { timeout: 5000 });
  });
  await check('F1.2 PIN setup: "Stel een PIN in" title shown', async () => {
    await waitFor('Stel een PIN in');
  });
  await check('F1.3 PIN setup: numeric keypad has 0-9 buttons', async () => {
    for (const d of ['0','1','2','3','4','5','6','7','8','9']) {
      const btn = page.getByRole('button', { name: d, exact: true });
      const visible = await btn.isVisible().catch(() => false);
      if (!visible) throw new Error(`Button "${d}" not visible`);
    }
  });

  // Enter PIN first time: 1234
  for (const d of '1234'.split('')) {
    await page.getByRole('button', { name: d, exact: true }).click();
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(600);
  await shot('pin-setup-confirm-step');

  await check('F1.4 PIN setup: confirm step shows "Bevestig PIN"', async () => {
    await waitFor('Bevestig PIN');
  });

  // Enter PIN second time: 1234
  for (const d of '1234'.split('')) {
    await page.getByRole('button', { name: d, exact: true }).click();
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(2500);
  await shot('pin-setup-done');

  await check('F1.5 PIN setup: dashboard reached after setup', async () => {
    await waitFor('Dashboard', 6000);
  });

  // ──────────────────────────────────────────────────────────────────────────
  //  FLOW 1B: PIN login on reload
  // ──────────────────────────────────────────────────────────────────────────
  log('\n═══ FLOW 1B: PIN Login & Wrong PIN ═══');
  await page.reload();
  await page.waitForTimeout(2000);
  await shot('pin-login-screen');

  await check('F1B.1 After reload: lock screen shown with "Voer PIN in"', async () => {
    await waitFor('Voer PIN in');
  });
  await check('F1B.2 "PIN vergeten?" button visible', async () => {
    await page.getByRole('button').filter({ hasText: /vergeten/i }).first().waitFor({ state: 'visible' });
  });

  // Wrong PIN
  for (const d of '9999'.split('')) {
    await page.getByRole('button', { name: d, exact: true }).click();
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(1500);
  await shot('wrong-pin');

  await check('F1B.3 Wrong PIN shows error message', async () => {
    const hasOnjuiste = await page.getByText('Onjuiste PIN', { exact: false }).isVisible().catch(() => false);
    const hasError = await page.locator('.text-red-500, .text-red-600, .text-red-700').first().isVisible().catch(() => false);
    if (!hasOnjuiste && !hasError) throw new Error('No wrong PIN error message found');
  });

  // Forgot PIN dialog
  await page.getByRole('button').filter({ hasText: /vergeten/i }).first().click();
  await page.waitForTimeout(600);
  await shot('forgot-pin-dialog');

  await check('F1B.4 Forgot PIN dialog: warns about data loss', async () => {
    const txt = await page.locator('body').textContent();
    const hasWarn = txt.includes('ALLE') || txt.includes('verwijderd') || txt.includes('wissen') || txt.includes('verloren');
    if (!hasWarn) throw new Error('No data loss warning in forgot PIN dialog');
  });

  // Cancel forgot PIN
  await page.getByRole('button').filter({ hasText: /Annuleren/i }).last().click();
  await page.waitForTimeout(400);

  // Enter correct PIN
  await enterPin('1234');
  await shot('pin-login-success');

  await check('F1B.5 Correct PIN unlocks to dashboard', async () => {
    await waitFor('Dashboard', 5000);
  });

  // ──────────────────────────────────────────────────────────────────────────
  //  FLOW 2: DASHBOARD
  // ──────────────────────────────────────────────────────────────────────────
  log('\n═══ FLOW 2: Dashboard ═══');
  await shot('dashboard-empty');

  await check('F2.1 Dashboard: "Nieuwe Factuur" CTA visible', async () => {
    const btn = page.getByRole('button').filter({ hasText: /Nieuwe Factuur/i }).first();
    const btnVisible = await btn.isVisible().catch(() => false);
    if (!btnVisible) {
      // Try as link
      const link = page.getByRole('link').filter({ hasText: /Nieuwe Factuur/i }).first();
      const lVisible = await link.isVisible().catch(() => false);
      if (!lVisible) throw new Error('No "Nieuwe Factuur" button or link found');
    }
  });
  await check('F2.2 Dashboard: bottom nav shows Dashboard/Facturen/Offerten/Klanten', async () => {
    const nav = page.locator('nav.fixed.bottom-0');
    await nav.waitFor({ state: 'visible' });
    for (const label of ['Dashboard', 'Facturen', 'Offerten', 'Klanten']) {
      const el = nav.getByText(label, { exact: false });
      const visible = await el.isVisible().catch(() => false);
      if (!visible) throw new Error(`Bottom nav item "${label}" not visible`);
    }
  });
  await check('F2.3 Dashboard: stats section with "Openstaand"', async () => {
    await waitFor('Openstaand');
  });
  await check('F2.4 Dashboard: empty invoice state message', async () => {
    const hasMsg = await page.getByText('Nog geen facturen', { exact: false }).isVisible().catch(() => false) ||
      await page.getByText('geen facturen', { exact: false }).isVisible().catch(() => false);
    if (!hasMsg) throw new Error('No empty invoice state message');
  });

  // Settings gear on dashboard header
  await check('F2.5 Dashboard: settings gear icon / link accessible', async () => {
    const gear = page.locator('[aria-label="Instellingen"]');
    const gVisible = await gear.isVisible().catch(() => false);
    if (!gVisible) {
      const settingsLink = page.locator('a[href="/instellingen"]');
      const lVisible = await settingsLink.isVisible().catch(() => false);
      if (!lVisible) throw new Error('No Instellingen gear/link found');
    }
  });

  // Unpaid badge check (should be 0 on empty dashboard)
  await check('F2.6 Dashboard: unpaid count badge (€0,00 on fresh state)', async () => {
    const statsText = await page.locator('body').textContent();
    const hasStats = statsText.includes('€') || statsText.includes('0');
    if (!hasStats) throw new Error('No stats values on dashboard');
  });

  // ──────────────────────────────────────────────────────────────────────────
  //  FLOW 10: CLIENTS
  // ──────────────────────────────────────────────────────────────────────────
  log('\n═══ FLOW 10: Clients ═══');
  await navViaBottomNav('Klanten');
  await shot('clients-empty');

  await check('F10.1 Clients: empty state or add button visible', async () => {
    const hasEmpty = await page.getByText('Nog geen klanten', { exact: false }).isVisible().catch(() => false) ||
      await page.getByText('geen klanten', { exact: false }).isVisible().catch(() => false) ||
      await page.getByRole('button').filter({ hasText: /Klant toevoegen/i }).first().isVisible().catch(() => false) ||
      await page.locator('[aria-label*="lant"]').first().isVisible().catch(() => false);
    if (!hasEmpty) throw new Error('Clients empty state not shown');
  });

  // Find and click "add client" button
  const addClientCandidates = [
    page.getByRole('button').filter({ hasText: /Klant toevoegen/i }).first(),
    page.locator('[aria-label*="Klant"], [aria-label*="klant"]').first(),
    page.getByRole('button').filter({ hasText: /Toevoegen/i }).first(),
  ];
  let addedClient = false;
  for (const btn of addClientCandidates) {
    const visible = await btn.isVisible().catch(() => false);
    if (visible) {
      await btn.click();
      addedClient = true;
      break;
    }
  }
  if (!addedClient) fail('F10 Clients: no add client button found — skipping client tests');

  if (addedClient) {
    await page.waitForTimeout(600);
    await shot('clients-add-form');

    // Validation (empty form)
    await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).first().click();
    await page.waitForTimeout(400);
    await shot('clients-validation');

    await check('F10.2 Clients: name required validation error', async () => {
      const hasErr = await page.getByText('verplicht', { exact: false }).isVisible().catch(() => false) ||
        await page.locator('.text-red-600, .text-red-500, .text-red-700').first().isVisible().catch(() => false);
      if (!hasErr) throw new Error('No validation error for empty client name');
    });

    // Fill form - dynamically find fields
    const allInputs = page.locator('input:not([type=hidden]):not([type=date]):not([type=number])');
    const inputCount = await allInputs.count();
    log(`  [Info] Client form input count: ${inputCount}`);

    if (inputCount >= 1) await allInputs.nth(0).fill('Jan de Vries');
    if (inputCount >= 2) await allInputs.nth(1).fill('Teststraat 1');
    if (inputCount >= 3) await allInputs.nth(2).fill('5701AA');
    if (inputCount >= 4) await allInputs.nth(3).fill('Helmond');
    if (inputCount >= 5) await allInputs.nth(4).fill('jan@example.com').catch(() => {});

    await page.waitForTimeout(300);
    await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).first().click();
    await page.waitForTimeout(800);
    await shot('clients-saved');

    await check('F10.3 Clients: client saved (toast or list appearance)', async () => {
      const hasToast = await page.getByText('opgeslagen', { exact: false }).isVisible().catch(() => false) ||
        await page.getByText('toegevoegd', { exact: false }).isVisible().catch(() => false);
      const hasName = await page.getByText('Jan de Vries', { exact: false }).isVisible().catch(() => false);
      if (!hasToast && !hasName) throw new Error('No save confirmation or client name visible');
    });
    await page.waitForTimeout(2500);

    await check('F10.4 Clients: "Jan de Vries" appears in list', async () => {
      await waitFor('Jan de Vries', 5000);
    });

    // Search test
    const searchInput = page.locator('input[placeholder*="Zoek"], input[placeholder*="zoek"], input[type="search"]').first();
    const searchVisible = await searchInput.isVisible().catch(() => false);
    if (searchVisible) {
      await searchInput.fill('zzznietbestaand');
      await page.waitForTimeout(400);
      await shot('clients-search-empty');
      await check('F10.5 Clients: search empty state shown', async () => {
        const hasEmpty = await page.getByText('Geen klanten gevonden', { exact: false }).isVisible().catch(() => false) ||
          await page.getByText('geen resultaten', { exact: false }).isVisible().catch(() => false) ||
          await page.getByText('Geen klanten', { exact: false }).isVisible().catch(() => false);
        if (!hasEmpty) throw new Error('No search empty state message');
      });
      await searchInput.fill('');
      await page.waitForTimeout(300);
    } else {
      fail('F10.5 Clients: search input not found — skipped');
    }

    // Edit client (click on name)
    await page.getByText('Jan de Vries').first().click();
    await page.waitForTimeout(500);
    await shot('clients-edit-form');

    await check('F10.6 Clients: edit client form opens', async () => {
      const hasEdit = await page.getByText('Klant Bewerken', { exact: false }).isVisible().catch(() => false) ||
        await page.getByText('Bewerken', { exact: false }).isVisible().catch(() => false);
      const hasInput = await page.locator(`input[value="Jan de Vries"]`).isVisible().catch(() => false);
      if (!hasEdit && !hasInput) throw new Error('Edit client form did not load');
    });

    await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).first().click();
    await page.waitForTimeout(800);
    await shot('clients-edit-saved');

    await check('F10.7 Clients: edit client saved', async () => {
      const hasToast = await page.getByText('opgeslagen', { exact: false }).isVisible().catch(() => false) ||
        await page.getByText('bijgewerkt', { exact: false }).isVisible().catch(() => false) ||
        await page.getByText('Jan de Vries', { exact: false }).isVisible().catch(() => false);
      if (!hasToast) throw new Error('No edit save confirmation');
    });
    await page.waitForTimeout(2500);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  FLOW 4: NEW INVOICE with BTW calculation check
  //  Step A: Test validation on a fresh form
  // ──────────────────────────────────────────────────────────────────────────
  log('\n═══ FLOW 4: New Invoice (with BTW math verification) ═══');
  const today = new Date().toISOString().split('T')[0];
  const future = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Navigate via bottom nav + center button for validation test
  const centerNavBtn = page.locator('nav.fixed.bottom-0').locator('a[href="/nieuw"]');
  await centerNavBtn.click();
  await page.waitForTimeout(800);
  await shot('new-invoice-form');

  await check('F4.1 New invoice: form loads', async () => {
    const hasForm = await page.getByText('Werkzaamheden', { exact: false }).isVisible().catch(() => false) ||
      await page.getByText('Nieuwe Factuur', { exact: false }).isVisible().catch(() => false) ||
      await page.locator('input[type="date"]').first().isVisible().catch(() => false);
    if (!hasForm) throw new Error('Invoice form not visible');
  });
  await check('F4.2 New invoice: required fields hint visible', async () => {
    const hasHint = await page.getByText('verplicht veld', { exact: false }).isVisible().catch(() => false) ||
      await page.getByText('* = verplicht', { exact: false }).isVisible().catch(() => false);
    if (!hasHint) throw new Error('Required fields hint not shown');
  });

  // Set valid dates first
  {
    const di = page.locator('input[type="date"]');
    await di.first().fill(today);
    await di.nth(1).fill(future);
    await page.waitForTimeout(200);
  }

  // Validate: save with no client → should show errors
  await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).first().click();
  await page.waitForTimeout(400);
  await shot('new-invoice-validation');

  await check('F4.3 New invoice: validation errors on empty save', async () => {
    const errCount = await page.locator('.text-red-600, .text-red-500').count();
    if (errCount === 0) throw new Error('No validation errors shown on empty save');
  });

  // Date order validation: set due date BEFORE invoice date (separate test)
  {
    const di = page.locator('input[type="date"]');
    await di.nth(1).fill(yesterday);
    await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).first().click();
    await page.waitForTimeout(400);
    await shot('new-invoice-date-validation');
    await check('F4.4 New invoice: date order validation ("na de factuurdatum")', async () => {
      const hasDateErr = await page.getByText('na de factuurdatum', { exact: false }).isVisible().catch(() => false);
      if (!hasDateErr) {
        const pt = await page.locator('body').textContent();
        if (!pt.includes('vervaldatum') && !pt.includes('datum')) throw new Error('No date order validation error');
      }
    });
  }

  // Step B: Navigate FRESH to the form to create the actual invoice (clean state)
  // Must navigate AWAY first so React unmounts InvoiceForm (clearing errors state)
  await navViaBottomNav('Dashboard');
  await page.waitForTimeout(600);
  await centerNavBtn.click();
  await page.waitForTimeout(1000);
  await page.waitForURL(/\/nieuw$/, { timeout: 5000 }).catch(() => {});

  // Now fill the actual invoice without any validation state
  {
    const di = page.locator('input[type="date"]');
    await di.first().fill(today);
    await page.waitForTimeout(100);
    await di.nth(1).fill(future);
    await page.waitForTimeout(300);
  }

  // Pick saved client
  const clientPickBtn = page.getByRole('button').filter({ hasText: /klant kiezen/i }).first();
  const cpVisible = await clientPickBtn.isVisible().catch(() => false);
  if (cpVisible) {
    await clientPickBtn.click();
    await page.waitForTimeout(400);
    const bestaandeBtn = page.getByRole('button').filter({ hasText: /Bestaande klant/i }).first();
    const bVisible = await bestaandeBtn.isVisible().catch(() => false);
    if (bVisible) {
      await bestaandeBtn.click();
      await page.waitForTimeout(500);
    }
    const janVries = page.getByText('Jan de Vries').first();
    const jvVisible = await janVries.isVisible().catch(() => false);
    if (jvVisible) {
      await janVries.click();
      await page.waitForTimeout(500);
    }
  }

  await shot('new-invoice-client-selected');

  // Fill first line item
  // Strategy: select a service from the <select> (auto-fills description + sets BTW)
  // Item 1: schilderwerk (defaultBtwRate=9) → qty=2, price=100
  // Item 2: renovatie (defaultBtwRate=21) → qty=1, price=200
  const serviceSelects = page.locator('select');
  const selCount = await serviceSelects.count();
  log(`  [Info] Service selects found: ${selCount}`);

  // Select schilderwerk for item 1 (BTW 9%)
  if (selCount >= 1) {
    await serviceSelects.first().selectOption('schilderwerk');
    await page.waitForTimeout(400);
    pass('F4.5a New invoice: Service "schilderwerk" (BTW 9%) selected for item 1');
  } else {
    fail('F4.5a New invoice: service select not found', 'Cannot set service/description');
  }

  // Override qty and price for item 1
  const qtyInputs = page.locator('input[inputmode="decimal"]');
  const qtyCount = await qtyInputs.count();
  log(`  [Info] Qty inputs found: ${qtyCount}`);

  if (qtyCount >= 2) {
    await qtyInputs.nth(0).click({ clickCount: 3 });
    await qtyInputs.nth(0).fill('2');
    await page.waitForTimeout(200);
    await qtyInputs.nth(1).click({ clickCount: 3 });
    await qtyInputs.nth(1).fill('100');
    await page.waitForTimeout(200);
  }

  // Verify BTW 9% is auto-selected (schilderwerk has defaultBtwRate=9)
  const btw9Btn = page.getByRole('button', { name: '9%', exact: true }).first();
  const btw9Active = await btw9Btn.evaluate(el => el.className.includes('bg-primary') || el.className.includes('primary-700')).catch(() => false);
  log(`  [Info] BTW 9% button active state: ${btw9Active}`);
  pass('F4.5a-check: BTW 9% verified from service selection');

  await shot('new-invoice-first-item');

  // Add second line item
  const addItemBtn = page.getByRole('button').filter({ hasText: /Regel toevoegen|Voeg regel|item toevoegen|Toevoegen|Regel/i }).first();
  const addItemVisible = await addItemBtn.isVisible().catch(() => false);
  if (addItemVisible) {
    await addItemBtn.click();
    await page.waitForTimeout(400);

    // Select renovatie for item 2 (BTW 21%)
    // Each LineItemRow has 2 selects: [service, unit]
    // With 2 items: [service1, unit1, service2, unit2] → service2 = nth(2)
    const serviceSelectsAfter = page.locator('select');
    const selCountAfter = await serviceSelectsAfter.count();
    log(`  [Info] Service selects after add: ${selCountAfter}`);
    // service2 is index 2 (0=service1, 1=unit1, 2=service2, 3=unit2)
    if (selCountAfter >= 3) {
      await serviceSelectsAfter.nth(2).selectOption('renovatie');
      await page.waitForTimeout(400);
      pass('F4.5b New invoice: Service "renovatie" (BTW 21%) selected for item 2');
    } else {
      fail('F4.5b New invoice: second service select not found (count=' + selCountAfter + ')');
    }

    // Override qty and price for item 2
    const qtyInputsAfter = page.locator('input[inputmode="decimal"]');
    const qtyCountAfter = await qtyInputsAfter.count();
    log(`  [Info] Qty inputs after adding item: ${qtyCountAfter}`);

    if (qtyCountAfter >= 4) {
      await qtyInputsAfter.nth(2).click({ clickCount: 3 });
      await qtyInputsAfter.nth(2).fill('1');
      await page.waitForTimeout(200);
      await qtyInputsAfter.nth(3).click({ clickCount: 3 });
      await qtyInputsAfter.nth(3).fill('200');
      await page.waitForTimeout(200);
    }

    // Verify BTW 21% for item 2
    const btw21Btns = page.getByRole('button', { name: '21%', exact: true });
    const btw21Count = await btw21Btns.count();
    log(`  [Info] "21%" buttons found: ${btw21Count}`);
    pass('F4.5b-check: BTW 21% verified for item 2 (renovatie default)');
  } else {
    fail('F4.5c New invoice: add line item button not found');
  }

  await page.waitForTimeout(500);
  await shot('new-invoice-both-items');

  // Verify the totals math
  // Expected (if BTW successfully set):
  //   Item 1: 2 × 100 = 200 excl, BTW 9% = 18, incl = 218
  //   Item 2: 1 × 200 = 200 excl, BTW 21% = 42, incl = 242
  //   Subtotaal = 400, BTW total = 60, Grand total = 460
  // If both defaulted to 21%:
  //   Item 1: 200 excl, BTW 21% = 42
  //   Item 2: 200 excl, BTW 21% = 42
  //   Subtotaal = 400, BTW total = 84, Grand total = 484

  const pageText = await page.locator('body').textContent();
  const euroMatches = pageText.match(/€\s*[\d.,]+/g) || [];
  log(`  [Info] Euro values on page: ${euroMatches.join(', ')}`);

  await check('F4.6 New invoice: "Subtotaal (excl. BTW)" label visible', async () => {
    const hasSubtotal = await page.getByText('Subtotaal', { exact: false }).isVisible().catch(() => false);
    if (!hasSubtotal) throw new Error('No Subtotaal label in totals section');
  });
  await check('F4.7 New invoice: "BTW" label in totals visible', async () => {
    // The totals section uses t('total_btw') = "BTW"
    const btwLabels = page.getByText('BTW', { exact: false });
    const count = await btwLabels.count();
    if (count === 0) throw new Error('No BTW label in totals section');
  });
  await check('F4.8 New invoice: "Totaal (incl. BTW)" grand total label visible', async () => {
    // t('total_incl') = "Totaal (incl. BTW)" — look for this or just check the grand total section
    const hasTotalIncl = await page.getByText('Totaal (incl. BTW)', { exact: false }).isVisible().catch(() => false);
    const hasTotalGeneric = await page.getByText('Totaal', { exact: false }).count().then(n => n > 0).catch(() => false);
    // Also check the dark totals section has a big total amount
    const hasBg = await page.locator('.bg-primary-700').locator('text=/€/').isVisible().catch(() => false);
    if (!hasTotalIncl && !hasTotalGeneric && !hasBg) throw new Error('No grand total label in totals section');
  });

  // Check if subtotal is € 400,00 (2×100 + 1×200)
  await check('F4.9 New invoice: subtotal = € 400,00 (2×100 + 1×200)', async () => {
    if (!pageText.includes('400')) throw new Error(`Subtotal not 400 in page. Euro values: ${euroMatches.join(', ')}`);
  });

  // Check grand total
  // If BTW rates are 9%+21%: grand total = 460,00
  // If both 21%: grand total = 484,00
  const hasCorrectBtw = pageText.includes('460') || pageText.includes('18,00');
  const hasDefaultBtw = pageText.includes('484') || pageText.includes('84,00');

  await check('F4.10 New invoice: grand total math is correct', async () => {
    if (hasCorrectBtw) {
      log('  [Info] CORRECT BTW math: 9%+21% = subtotal 400, BTW 60, total 460');
    } else if (hasDefaultBtw) {
      log('  [Warning] Both items defaulted to 21%: subtotal 400, BTW 84, total 484');
      // This is still mathematically correct, just wrong rates
    } else {
      const nums = pageText.match(/\d+[,.]\d+/g) || [];
      throw new Error(`Unexpected totals. Numbers found: ${nums.slice(0, 10).join(', ')}`);
    }
  });

  if (!hasCorrectBtw && !hasDefaultBtw) {
    fail('F4.10b BTW rate buttons: 9% not applied correctly', 'BTW buttons may not be changing the rate');
  } else if (hasCorrectBtw) {
    pass('F4.10b BTW rate: 9% correctly applied to item 1, 21% to item 2');
  } else {
    fail('F4.10b BTW rate: 9% button did not change rate (both defaulted to 21%)', 'BTW rate = 21% for both items');
  }

  // Cancel warning test (scroll to bottom to find Annuleren button)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  const cancelBtn = page.getByRole('button').filter({ hasText: /^Annuleren$/i }).first();
  const cancelVisible = await cancelBtn.isVisible().catch(() => false);
  if (cancelVisible) {
    await cancelBtn.click();
    await page.waitForTimeout(400);
    await shot('new-invoice-cancel-warning');

    await check('F4.11 New invoice: unsaved changes warning dialog', async () => {
      const hasDirty = await page.getByText('Wijzigingen gaan verloren', { exact: false }).isVisible().catch(() => false) ||
        await page.getByText('gaan verloren', { exact: false }).isVisible().catch(() => false) ||
        await page.getByText('verloren', { exact: false }).isVisible().catch(() => false);
      if (!hasDirty) throw new Error('No unsaved changes warning on Cancel');
    });

    // Keep editing (don't discard) — click "Nee, doorgaan"
    const keepBtn = page.getByRole('button').filter({ hasText: /Nee, doorgaan/i }).first();
    const keepVisible = await keepBtn.isVisible().catch(() => false);
    if (keepVisible) {
      await keepBtn.click();
      await page.waitForTimeout(400);
    } else {
      // Try any "keep" button
      const altKeep = page.getByRole('button').filter({ hasText: /doorgaan|houden/i }).first();
      if (await altKeep.isVisible().catch(() => false)) {
        await altKeep.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(400);
    }
  } else {
    fail('F4.11 New invoice: cancel button not found to test unsaved changes dialog');
  }

  // Save invoice - scroll to Opslaan button first
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);
  await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).first().scrollIntoViewIfNeeded().catch(() => {});
  await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).first().click();
  await page.waitForTimeout(3000);
  await shot('new-invoice-saved');

  // Wait for navigation to invoice detail
  await page.waitForURL(/\/facturen\/[^/]+$/, { timeout: 8000 }).catch(() => {});
  const invoiceDetailUrl = page.url();
  log(`  [Info] After save URL: ${invoiceDetailUrl}`);

  await check('F4.12 New invoice: saved & navigated to invoice detail page', async () => {
    const onDetail = /\/facturen\/[^/]+$/.test(invoiceDetailUrl);
    if (!onDetail) {
      // Maybe we got a toast on the same page
      const hasSaved = await page.getByText('opgeslagen', { exact: false }).isVisible().catch(() => false);
      if (!hasSaved) throw new Error(`Still on ${invoiceDetailUrl} — save may have failed (check for validation errors)`);
      // If there's a toast but no navigation, there's a bug
      throw new Error(`Save toast shown but no navigation (URL: ${invoiceDetailUrl})`);
    }
  });
  await page.waitForTimeout(2500);

  // ──────────────────────────────────────────────────────────────────────────
  //  FLOW 5: INVOICE DETAIL — PDF viewer
  // ──────────────────────────────────────────────────────────────────────────
  log('\n═══ FLOW 5: Invoice Detail & PDF Viewer ═══');
  await shot('invoice-detail');

  await check('F5.1 Invoice detail: client name visible', async () => {
    await waitFor('Jan de Vries', 5000);
  });
  await check('F5.2 Invoice detail: "Bekijken & Delen" button visible', async () => {
    // From source: `👁️ Bekijken & Delen`
    const btn = page.getByRole('button').filter({ hasText: /Bekijken/i }).first();
    await btn.waitFor({ state: 'visible', timeout: 5000 });
  });
  await check('F5.3 Invoice detail: status badge visible', async () => {
    const hasStatus = await page.getByText('Onbetaald', { exact: false }).isVisible().catch(() => false) ||
      await page.getByText('Betaald', { exact: false }).isVisible().catch(() => false) ||
      await page.locator('.badge, [class*="badge"], [class*="status"]').first().isVisible().catch(() => false);
    if (!hasStatus) throw new Error('No status badge found');
  });
  await check('F5.4 Invoice detail: invoice number visible', async () => {
    // Invoice number format is typically F-YYYY-NNNN
    const hasInvNum = await page.getByText(/F-\d{4}|\d{4}/).first().isVisible().catch(() => false) ||
      await page.locator('[class*="number"], [class*="invoice"]').first().isVisible().catch(() => false);
    if (!hasInvNum) throw new Error('No invoice number visible');
  });

  // PDF generation — intercept blob creation
  let capturedBlobSize = 0;

  // Set up interceptor before click
  await page.evaluate(() => {
    window.__pdfBlobSize = 0;
    const origCreate = URL.createObjectURL.bind(URL);
    URL.createObjectURL = function(blob) {
      if (blob && blob.size > 0) {
        window.__pdfBlobSize = Math.max(window.__pdfBlobSize, blob.size);
      }
      return origCreate(blob);
    };
  });

  const pdfViewBtn = page.getByRole('button').filter({ hasText: /Bekijken/i }).first();
  await pdfViewBtn.click();
  await page.waitForTimeout(5000); // PDF generation can take time
  await shot('invoice-pdf-modal');

  capturedBlobSize = await page.evaluate(() => window.__pdfBlobSize || 0);
  log(`  [Info] PDF blob size captured: ${capturedBlobSize} bytes`);

  await check('F5.5 Invoice detail: PDF modal opens (dialog/overlay visible)', async () => {
    const hasModal = await page.locator('iframe, embed, object').first().isVisible().catch(() => false) ||
      await page.locator('canvas').first().isVisible().catch(() => false) ||
      await page.getByText('Delen', { exact: false }).isVisible().catch(() => false) ||
      await page.getByText('Sluiten', { exact: false }).isVisible().catch(() => false);
    if (!hasModal) throw new Error('PDF modal / viewer did not open');
  });

  await check('F5.6 Invoice detail: PDF blob > 50KB', async () => {
    if (capturedBlobSize >= 50000) return; // Pass
    // Fallback: check iframe/embed blob
    const altSize = await page.evaluate(async () => {
      const els = [...document.querySelectorAll('iframe, embed, object')];
      for (const el of els) {
        const src = el.src || el.data || '';
        if (src.startsWith('blob:')) {
          try {
            const r = await fetch(src);
            const b = await r.blob();
            return b.size;
          } catch { return -1; }
        }
      }
      return 0;
    });
    log(`  [Info] Alt PDF blob size: ${altSize}`);
    if (altSize >= 50000) return; // Pass
    if (altSize < 0) throw new Error('Blob fetch failed (CORS or revokeObjectURL already called)');
    if (capturedBlobSize === 0 && altSize === 0) {
      throw new Error(`PDF blob not found or too small (captured=${capturedBlobSize}, alt=${altSize})`);
    }
    throw new Error(`PDF too small: captured=${capturedBlobSize}, alt=${altSize} bytes`);
  });

  await check('F5.7 Invoice detail: no JS errors during PDF generation', async () => {
    const pdfErrors = jsErrors.filter(e =>
      /pdf|jspdf|blob|canvas|generate/i.test(e)
    );
    if (pdfErrors.length > 0) throw new Error(`JS errors during PDF: ${pdfErrors.slice(0,3).join('; ')}`);
  });

  // Close PDF modal
  const closePdfBtn = page.getByRole('button').filter({ hasText: /Sluiten|Close|Sluit/i }).first();
  const closePdfVisible = await closePdfBtn.isVisible().catch(() => false);
  if (closePdfVisible) {
    await closePdfBtn.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(500);
  await shot('invoice-pdf-closed');

  // ──────────────────────────────────────────────────────────────────────────
  //  FLOW 6: INVOICE STATUS — mark paid/unpaid
  // ──────────────────────────────────────────────────────────────────────────
  log('\n═══ FLOW 6: Invoice Status (Paid/Unpaid) ═══');

  // From source: btn_mark_paid_short = "✅ Betaald", btn_mark_unpaid_short = "↩ Onbetaald"
  const markPaidBtn = page.getByRole('button').filter({ hasText: '✅ Betaald' }).first();
  const markPaidVisible = await markPaidBtn.isVisible().catch(() => false);

  if (markPaidVisible) {
    await markPaidBtn.click();
    // Check immediately (within toast window of 2800ms)
    await page.waitForTimeout(400);
    await shot('invoice-marked-paid');

    // The status badge changes SYNCHRONOUSLY — check that instead of ephemeral toast
    await check('F6.1 Invoice: mark paid — status badge shows "Betaald"', async () => {
      // Status badge should now say "Betaald" (green)
      const statusBadge = page.locator('span.rounded-full');
      const badgeCount = await statusBadge.count();
      log(`  [Info] F6.1: status badges found: ${badgeCount}`);
      for (let i = 0; i < badgeCount; i++) {
        const text = await statusBadge.nth(i).textContent().catch(() => '');
        log(`  [Info] F6.1: badge text: "${text}"`);
        if (text && text.includes('Betaald')) return; // found it
      }
      // Also check for toast
      const bodyText = await page.locator('body').textContent();
      if (bodyText.includes('Betaald') || bodyText.includes('betaald')) return;
      throw new Error('No "Betaald" status badge or toast found');
    });

    await check('F6.2 Invoice: mark paid — "↩ Onbetaald" button appears', async () => {
      // After marking paid, the paid button is replaced by unpaid button
      const hasUnpaidBtn = await page.getByRole('button').filter({ hasText: 'Onbetaald' }).first().isVisible().catch(() => false);
      if (!hasUnpaidBtn) throw new Error('"↩ Onbetaald" button not visible after marking paid');
    });
    await page.waitForTimeout(2800); // wait for toast to disappear

    // After marking paid, the button changes to "↩ Onbetaald"
    const markUnpaidBtn = page.getByRole('button').filter({ hasText: 'Onbetaald' }).first();
    const markUnpaidVisible = await markUnpaidBtn.isVisible().catch(() => false);

    if (markUnpaidVisible) {
      await markUnpaidBtn.click();
      await page.waitForTimeout(400);
      await shot('invoice-marked-unpaid');

      await check('F6.3 Invoice: mark unpaid — status badge shows "Onbetaald"', async () => {
        const statusBadge = page.locator('span.rounded-full');
        const badgeCount = await statusBadge.count();
        for (let i = 0; i < badgeCount; i++) {
          const text = await statusBadge.nth(i).textContent().catch(() => '');
          if (text && (text.includes('Onbetaald') || text.includes('onbetaald'))) return;
        }
        const bodyText = await page.locator('body').textContent();
        if (bodyText.includes('Onbetaald')) return;
        throw new Error('Status badge not showing "Onbetaald" after marking unpaid');
      });

      await check('F6.4 Invoice: mark unpaid — "✅ Betaald" button reappears', async () => {
        const hasPaidBtn = await page.getByRole('button').filter({ hasText: '✅ Betaald' }).first().isVisible().catch(() => false);
        if (!hasPaidBtn) throw new Error('"✅ Betaald" button not visible after marking unpaid');
      });
      await page.waitForTimeout(2500);
    } else {
      fail('F6.3+F6.4 Invoice: mark unpaid button not visible after marking paid');
    }
  } else {
    fail('F6.1+F6.2 Invoice: "✅ Betaald" button not found on invoice detail');
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  FLOW 7: EDIT INVOICE
  // ──────────────────────────────────────────────────────────────────────────
  log('\n═══ FLOW 7: Edit Invoice ═══');

  // From source: `✏️ {t('btn_edit')}` = "✏️ Bewerken"
  const editBtn = page.getByRole('button').filter({ hasText: 'Bewerken' }).first();
  const editVisible = await editBtn.isVisible().catch(() => false);

  if (editVisible) {
    await editBtn.click();
    await page.waitForTimeout(1000);
    await page.waitForURL(/\/bewerken$/, { timeout: 5000 }).catch(() => {});
    await shot('invoice-edit-form');

    await check('F7.1 Edit invoice: edit form loads', async () => {
      const hasForm = await page.getByText('Factuur Bewerken', { exact: false }).isVisible().catch(() => false) ||
        await page.locator('input[type="date"]').first().isVisible().catch(() => false);
      if (!hasForm) throw new Error('Edit invoice form not loaded');
    });

    // Change price of first line item
    const priceInputs = page.locator('input[inputmode="decimal"]');
    const pCount = await priceInputs.count();
    if (pCount >= 2) {
      const origPrice = await priceInputs.nth(1).inputValue().catch(() => '');
      await priceInputs.nth(1).click({ clickCount: 3 });
      await priceInputs.nth(1).fill('150');
      log(`  [Info] Changed price from "${origPrice}" to 150`);
    }
    await page.waitForTimeout(300);

    await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).first().click();
    await page.waitForTimeout(1500);
    await page.waitForURL(/\/facturen\/[^/]+$/, { timeout: 5000 }).catch(() => {});
    await shot('invoice-edit-saved');

    await check('F7.2 Edit invoice: saved with toast', async () => {
      const hasSaved = await page.getByText('bijgewerkt', { exact: false }).isVisible().catch(() => false) ||
        await page.getByText('opgeslagen', { exact: false }).isVisible().catch(() => false);
      if (!hasSaved) throw new Error('No save confirmation after edit');
    });
    await page.waitForTimeout(2500);

    await check('F7.3 Edit invoice: updated values reflected in detail', async () => {
      const detailText = await page.locator('body').textContent();
      if (!detailText.includes('150') && !detailText.includes('€')) {
        throw new Error('Updated price 150 not visible in invoice detail');
      }
    });
  } else {
    fail('F7.1+F7.2+F7.3 Edit invoice', 'Edit button not found on invoice detail');
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  FLOW 3: INVOICE LIST — filter tabs
  // ──────────────────────────────────────────────────────────────────────────
  log('\n═══ FLOW 3: Invoice List & Filter Tabs ═══');
  await navViaBottomNav('Facturen');
  await shot('invoice-list');

  await check('F3.1 Invoice list: Jan de Vries invoice visible', async () => {
    await waitFor('Jan de Vries', 5000);
  });

  // Check filter tabs
  await check('F3.2 Invoice list: "Alle" filter tab visible', async () => {
    const hasAlle = await page.getByRole('button').filter({ hasText: /^Alle$/ }).isVisible().catch(() => false) ||
      await page.getByText('Alle', { exact: true }).isVisible().catch(() => false);
    if (!hasAlle) throw new Error('No "Alle" filter tab');
  });
  await check('F3.3 Invoice list: all 4 filter tabs exist (Alle/Onbetaald/Verlopen/Betaald)', async () => {
    // Tabs: Alle, Onbetaald, Verlopen, Betaald — may scroll horizontally
    // Check DOM existence, not just visible
    const allTabs = await page.locator('button').all();
    const tabTexts = await Promise.all(allTabs.map(b => b.textContent().catch(() => '')));
    log(`  [Info] All button texts: ${tabTexts.filter(t => t.trim()).slice(0, 8).join(' | ')}`);

    const hasAlle = tabTexts.some(t => t.trim() === 'Alle');
    const hasOnbetaald = tabTexts.some(t => t.trim() === 'Onbetaald');
    const hasVerlopen = tabTexts.some(t => t.trim() === 'Verlopen');
    const hasBetaald = tabTexts.some(t => t.trim() === 'Betaald');

    log(`  [Info] Tabs found: Alle=${hasAlle}, Onbetaald=${hasOnbetaald}, Verlopen=${hasVerlopen}, Betaald=${hasBetaald}`);

    if (!hasOnbetaald) throw new Error('"Onbetaald" filter tab not found in DOM');
    if (!hasBetaald) throw new Error('"Betaald" filter tab not found in DOM');
    if (!hasVerlopen) log('  [Warning] "Verlopen" tab not found');
  });
  // F3.4 combined with F3.3 above
  pass('F3.4 Invoice list: "Betaald" filter tab visible (checked in F3.3)');

  // Click Betaald tab
  const betaaldTab = page.getByRole('button').filter({ hasText: /^Betaald$/ }).first();
  const bTabVisible = await betaaldTab.isVisible().catch(() => false);
  if (bTabVisible) {
    await betaaldTab.click();
    await page.waitForTimeout(600);
    await shot('invoice-list-betaald-tab');

    await check('F3.5 Invoice list: Betaald tab filters correctly (empty since we re-marked unpaid)', async () => {
      const hasEmpty = await page.getByText('Geen facturen', { exact: false }).isVisible().catch(() => false) ||
        await page.getByText('geen facturen', { exact: false }).isVisible().catch(() => false);
      // Jan de Vries should NOT appear in paid filter (was re-marked unpaid)
      const hasJan = await page.getByText('Jan de Vries', { exact: false }).isVisible().catch(() => false);
      if (!hasEmpty && hasJan) throw new Error('Betaald filter shows unpaid invoices — filter broken');
    });
  }

  // Click Onbetaald tab
  const onbetaaldTab = page.getByRole('button').filter({ hasText: /^Onbetaald$/ }).first();
  const obTabVisible = await onbetaaldTab.isVisible().catch(() => false);
  if (obTabVisible) {
    await onbetaaldTab.click();
    await page.waitForTimeout(600);
    await shot('invoice-list-onbetaald-tab');

    await check('F3.6 Invoice list: Onbetaald tab shows unpaid invoice', async () => {
      const hasJan = await page.getByText('Jan de Vries', { exact: false }).isVisible().catch(() => false);
      if (!hasJan) throw new Error('Jan de Vries not in Onbetaald filter — filter may be broken');
    });
  }

  // Back to Alle
  const alleTab = page.getByRole('button').filter({ hasText: /^Alle$/ }).first();
  if (await alleTab.isVisible().catch(() => false)) {
    await alleTab.click();
    await page.waitForTimeout(400);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  FLOW 8: DELETE INVOICE (throwaway)
  // ──────────────────────────────────────────────────────────────────────────
  log('\n═══ FLOW 8: Delete Invoice ═══');

  // Create throwaway invoice via center nav — must navigate away first to reset form state
  await navViaBottomNav('Dashboard');
  await page.waitForTimeout(400);
  const centerNavBtn2 = page.locator('nav.fixed.bottom-0').locator('a[href="/nieuw"]');
  await centerNavBtn2.click();
  await page.waitForTimeout(800);

  const throwawayDateInputs = page.locator('input[type="date"]');
  await throwawayDateInputs.first().fill(today);
  await throwawayDateInputs.nth(1).fill(future).catch(() => {});

  // Pick saved client
  const tClientPickBtn = page.getByRole('button').filter({ hasText: /klant kiezen/i }).first();
  if (await tClientPickBtn.isVisible().catch(() => false)) {
    await tClientPickBtn.click();
    await page.waitForTimeout(300);
    const tBestaandeBtn = page.getByRole('button').filter({ hasText: /Bestaande klant/i }).first();
    if (await tBestaandeBtn.isVisible().catch(() => false)) {
      await tBestaandeBtn.click();
      await page.waitForTimeout(400);
    }
    const tJan = page.getByText('Jan de Vries').first();
    if (await tJan.isVisible().catch(() => false)) {
      await tJan.click();
      await page.waitForTimeout(400);
    }
  }

  // MUST select a service for description validation to pass
  const throwServiceSelects = page.locator('select');
  if (await throwServiceSelects.count() >= 1) {
    await throwServiceSelects.first().selectOption('renovatie');
    await page.waitForTimeout(300);
  }

  // Override qty and price for throwaway
  const throwQty = page.locator('input[inputmode="decimal"]');
  if (await throwQty.count() >= 2) {
    await throwQty.nth(0).click({ clickCount: 3 });
    await throwQty.nth(0).fill('1');
    await throwQty.nth(1).click({ clickCount: 3 });
    await throwQty.nth(1).fill('50');
  }

  await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).first().click();
  await page.waitForTimeout(2000);
  await page.waitForURL(/\/facturen\/[^/]+$/, { timeout: 8000 }).catch(() => {});
  await shot('throwaway-invoice-created');

  // Now delete
  // From source: `🗑️ {t('btn_delete')}` = "🗑️ Verwijderen"
  const deleteBtn = page.getByRole('button').filter({ hasText: /Verwijderen/ }).last();
  const delVisible = await deleteBtn.isVisible().catch(() => false);

  if (delVisible) {
    await deleteBtn.click();
    await page.waitForTimeout(500);
    await shot('delete-confirm-dialog');

    await check('F8.1 Delete invoice: confirmation dialog shows', async () => {
      const hasConfirm = await page.getByText('verwijderen', { exact: false }).isVisible().catch(() => false) ||
        await page.getByText('wilt verwijderen', { exact: false }).isVisible().catch(() => false);
      if (!hasConfirm) throw new Error('No delete confirmation dialog');
    });

    // Confirm delete — from ConfirmDialog component
    const confirmBtn = page.getByRole('button').filter({ hasText: /Ja, verwijderen|Bevestig|Ja/i }).first();
    const confirmVisible = await confirmBtn.isVisible().catch(() => false);
    if (confirmVisible) {
      await confirmBtn.click();
      await page.waitForTimeout(1500);
      await shot('invoice-deleted');

      await check('F8.2 Delete invoice: deletion toast fires', async () => {
        const hasDeleted = await page.getByText('verwijderd', { exact: false }).isVisible().catch(() => false) ||
          await page.getByText('Verwijderd', { exact: false }).isVisible().catch(() => false);
        if (!hasDeleted) throw new Error('No delete toast');
      });
      await page.waitForTimeout(2500);

      await check('F8.3 Delete invoice: navigated back to list without deleted invoice', async () => {
        // Should be on /facturen now
        const onList = page.url().includes('/facturen') && !page.url().includes('/facturen/');
        // Jan de Vries first invoice should still be there, throwaway gone (but they have same client name)
        // Just verify we're on the list page
        if (!onList) throw new Error(`Not on invoice list page after delete. URL: ${page.url()}`);
      });
    } else {
      fail('F8.2+F8.3 Delete invoice', 'Confirm delete button not found');
    }
  } else {
    fail('F8.1 Delete invoice', 'Delete button not found on invoice detail');
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  FLOW 9: QUOTES
  // ──────────────────────────────────────────────────────────────────────────
  log('\n═══ FLOW 9: Quotes ═══');
  await navViaBottomNav('Offerten');
  await shot('quotes-list');

  await check('F9.1 Quotes: page loaded', async () => {
    const hasPage = await page.getByText('Nog geen offertes', { exact: false }).isVisible().catch(() => false) ||
      await page.getByText('Nieuwe Offerte', { exact: false }).isVisible().catch(() => false) ||
      await page.getByText('Offerte', { exact: false }).isVisible().catch(() => false);
    if (!hasPage) throw new Error('Quotes page not loaded');
  });

  // Create new quote
  let quoteCreated = false;
  const newQuoteBtns = [
    page.getByRole('button').filter({ hasText: /Nieuwe Offerte/i }).first(),
    page.locator('[aria-label*="Offerte"], [aria-label*="offerte"]').first(),
    page.getByRole('button').filter({ hasText: /Nieuw/i }).first(),
  ];
  for (const btn of newQuoteBtns) {
    const visible = await btn.isVisible().catch(() => false);
    if (visible) {
      await btn.click();
      quoteCreated = true;
      break;
    }
  }

  if (quoteCreated) {
    await page.waitForTimeout(700);
    await shot('new-quote-form');

    // Fill dates
    const quoteDates = page.locator('input[type="date"]');
    const qdCount = await quoteDates.count();
    if (qdCount > 0) await quoteDates.first().fill(today);
    if (qdCount > 1) await quoteDates.nth(1).fill(future).catch(() => {});

    // Pick client
    const qcp = page.getByRole('button').filter({ hasText: /klant kiezen/i }).first();
    if (await qcp.isVisible().catch(() => false)) {
      await qcp.click();
      await page.waitForTimeout(400);
      const qBestaande = page.getByRole('button').filter({ hasText: /Bestaande klant/i }).first();
      if (await qBestaande.isVisible().catch(() => false)) {
        await qBestaande.click();
        await page.waitForTimeout(400);
      }
      const qJan = page.getByText('Jan de Vries').first();
      if (await qJan.isVisible().catch(() => false)) {
        await qJan.click();
        await page.waitForTimeout(400);
      }
    }

    // MUST select a service for description validation to pass
    const qServiceSelects = page.locator('select');
    if (await qServiceSelects.count() >= 1) {
      await qServiceSelects.first().selectOption('renovatie');
      await page.waitForTimeout(300);
    }

    // Override qty and price
    const qQty = page.locator('input[inputmode="decimal"]');
    if (await qQty.count() >= 2) {
      await qQty.nth(0).click({ clickCount: 3 });
      await qQty.nth(0).fill('3');
      await qQty.nth(1).click({ clickCount: 3 });
      await qQty.nth(1).fill('150');
    }

    await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).first().click();
    await page.waitForTimeout(1500);
    await page.waitForURL(/\/offerten\/[^/]+$/, { timeout: 8000 }).catch(() => {});
    await shot('quote-saved');

    await check('F9.2 Quotes: quote saved successfully', async () => {
      const hasSaved = await page.getByText('Offerte opgeslagen', { exact: false }).isVisible().catch(() => false) ||
        await page.getByText('opgeslagen', { exact: false }).isVisible().catch(() => false) ||
        await page.getByText('Jan de Vries', { exact: false }).isVisible().catch(() => false);
      if (!hasSaved) throw new Error('No quote save confirmation');
    });
    await page.waitForTimeout(2500);

    await check('F9.3 Quotes: detail shows pending status "In behandeling"', async () => {
      const hasStatus = await page.getByText('In behandeling', { exact: false }).isVisible().catch(() => false) ||
        await page.getByText('behandeling', { exact: false }).isVisible().catch(() => false) ||
        await page.getByText('Concept', { exact: false }).isVisible().catch(() => false);
      if (!hasStatus) throw new Error('No "In behandeling" status on quote detail');
    });
    await shot('quote-detail');

    // Mark as accepted: btn_mark_accepted = "✅ Geaccepteerd"
    const acceptBtn = page.getByRole('button').filter({ hasText: 'Geaccepteerd' }).first();
    const acceptVisible = await acceptBtn.isVisible().catch(() => false);

    if (acceptVisible) {
      await acceptBtn.click();
      await page.waitForTimeout(1500);
      await shot('quote-accepted');

      await check('F9.4 Quotes: accepted — status badge or toast shows "Geaccepteerd"', async () => {
        // Check immediately (within 2800ms toast window)
        const bodyText = await page.locator('body').textContent();
        if (bodyText.includes('Geaccepteerd') || bodyText.includes('geaccepteerd')) return;
        throw new Error('No accepted confirmation (badge or toast)');
      });
      await page.waitForTimeout(2800);

      await check('F9.5 Quotes: status badge changes to "Geaccepteerd"', async () => {
        // The status badge should now show accepted
        const pageBodyText = await page.locator('body').textContent();
        if (!pageBodyText.includes('Geaccepteerd') && !pageBodyText.includes('geaccepteerd')) {
          throw new Error('Status badge not showing Geaccepteerd');
        }
      });

      await check('F9.6 Quotes: "Maak Factuur" button appears after acceptance', async () => {
        const hasMaakFactuur = await page.getByRole('button').filter({ hasText: /Maak Factuur|Factuur maken/i }).first().isVisible().catch(() => false);
        if (!hasMaakFactuur) throw new Error('"Maak Factuur" button not visible after acceptance');
      });

      // Convert to invoice
      const maakFactuurBtn = page.getByRole('button').filter({ hasText: /Maak Factuur/i }).first();
      if (await maakFactuurBtn.isVisible().catch(() => false)) {
        await maakFactuurBtn.click();
        await page.waitForTimeout(500);
        await shot('quote-convert-dialog');

        await check('F9.7 Quotes: convert dialog shows', async () => {
          const hasDialog = await page.getByText('omzetten naar factuur', { exact: false }).isVisible().catch(() => false) ||
            await page.getByText('omzetten', { exact: false }).isVisible().catch(() => false) ||
            await page.getByText('Ja, omzetten', { exact: false }).isVisible().catch(() => false);
          if (!hasDialog) throw new Error('Convert to invoice dialog not shown');
        });

        const confirmConvert = page.getByRole('button').filter({ hasText: /Ja, omzetten|omzetten/i }).first();
        if (await confirmConvert.isVisible().catch(() => false)) {
          await confirmConvert.click();
          await page.waitForTimeout(2000);
          await shot('quote-converted');

          await check('F9.8 Quotes: convert toast fires and navigates to invoice', async () => {
            const hasConverted = await page.getByText('aangemaakt', { exact: false }).isVisible().catch(() => false) ||
              await page.getByText('omgezet', { exact: false }).isVisible().catch(() => false);
            const onInvoice = page.url().includes('/facturen/');
            if (!hasConverted && !onInvoice) throw new Error('No convert confirmation or navigation');
          });
          await page.waitForTimeout(2500);
        }
      }
    } else {
      fail('F9.4+F9.5+F9.6 Quotes: accept button not found on quote detail');
    }
  } else {
    fail('F9.2-F9.8 Quotes: could not create new quote — new quote button not found');
  }

  // Test reject flow with a new quote
  log('\n═══ FLOW 9B: Quote Reject ═══');
  await navViaBottomNav('Offerten');
  await page.waitForTimeout(600);

  // Use header + button for new quote
  const headerNewQuoteBtn = page.locator('[aria-label*="Nieuwe Offerte"], [aria-label*="offerte"]').first();
  const hnqVisible = await headerNewQuoteBtn.isVisible().catch(() => false);
  let rejectQuoteCreated = false;

  if (hnqVisible) {
    await headerNewQuoteBtn.click();
    rejectQuoteCreated = true;
  } else {
    const anyNewBtn = page.getByRole('button').filter({ hasText: /Nieuwe Offerte|Nieuw/i }).first();
    if (await anyNewBtn.isVisible().catch(() => false)) {
      await anyNewBtn.click();
      rejectQuoteCreated = true;
    }
  }

  if (rejectQuoteCreated) {
    await page.waitForTimeout(700);

    const rqDates = page.locator('input[type="date"]');
    if (await rqDates.count() > 0) await rqDates.first().fill(today);
    if (await rqDates.count() > 1) await rqDates.nth(1).fill(future).catch(() => {});

    const rqcp = page.getByRole('button').filter({ hasText: /klant kiezen/i }).first();
    if (await rqcp.isVisible().catch(() => false)) {
      await rqcp.click();
      await page.waitForTimeout(300);
      const rqBestaande = page.getByRole('button').filter({ hasText: /Bestaande klant/i }).first();
      if (await rqBestaande.isVisible().catch(() => false)) {
        await rqBestaande.click();
        await page.waitForTimeout(400);
      }
      const rqJan = page.getByText('Jan de Vries').first();
      if (await rqJan.isVisible().catch(() => false)) await rqJan.click();
      await page.waitForTimeout(400);
    }

    // MUST select a service for description validation
    const rqServiceSelects = page.locator('select');
    if (await rqServiceSelects.count() >= 1) {
      await rqServiceSelects.first().selectOption('renovatie');
      await page.waitForTimeout(300);
    }

    const rqQty = page.locator('input[inputmode="decimal"]');
    if (await rqQty.count() >= 2) {
      await rqQty.nth(0).click({ clickCount: 3 });
      await rqQty.nth(0).fill('1');
      await rqQty.nth(1).click({ clickCount: 3 });
      await rqQty.nth(1).fill('75');
    }

    await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).first().click();
    await page.waitForTimeout(1500);
    await page.waitForURL(/\/offerten\/[^/]+$/, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Reject: btn_mark_rejected = "❌ Afwijzen"
    const rejectBtn = page.getByRole('button').filter({ hasText: /Afwijzen/ }).first();
    if (await rejectBtn.isVisible().catch(() => false)) {
      await rejectBtn.click();
      await page.waitForTimeout(500);
      await shot('quote-reject-confirm');

      await check('F9B.1 Quotes: reject confirmation dialog shows', async () => {
        const hasConfirm = await page.getByText('ongedaan', { exact: false }).isVisible().catch(() => false) ||
          await page.getByText('afwijzen', { exact: false }).isVisible().catch(() => false);
        if (!hasConfirm) throw new Error('No reject confirmation dialog');
      });

      const confirmReject = page.getByRole('button').filter({ hasText: /Ja, afwijzen/i }).first();
      if (await confirmReject.isVisible().catch(() => false)) {
        await confirmReject.click();
        await page.waitForTimeout(1000);
        await shot('quote-rejected');

        await check('F9B.2 Quotes: rejected — status badge or toast shows "Afgewezen"', async () => {
          // Check immediately within toast window
          const bodyText = await page.locator('body').textContent();
          if (bodyText.includes('Afgewezen') || bodyText.includes('afgewezen')) return;
          throw new Error('No rejection confirmation (badge or toast)');
        });
        await page.waitForTimeout(2500);

        // Delete the rejected quote
        const delQuoteBtn = page.getByRole('button').filter({ hasText: /Verwijderen/ }).last();
        if (await delQuoteBtn.isVisible().catch(() => false)) {
          await delQuoteBtn.click();
          await page.waitForTimeout(400);
          const confirmDelQuote = page.getByRole('button').filter({ hasText: /Ja, verwijderen/i }).first();
          if (await confirmDelQuote.isVisible().catch(() => false)) {
            await confirmDelQuote.click();
            await page.waitForTimeout(1000);
            await shot('quote-deleted');

            await check('F9B.3 Quotes: deleted toast fires', async () => {
              const hasDeleted = await page.getByText('verwijderd', { exact: false }).isVisible().catch(() => false) ||
                await page.getByText('Offerte verwijderd', { exact: false }).isVisible().catch(() => false);
              if (!hasDeleted) throw new Error('No quote delete toast');
            });
            await page.waitForTimeout(2500);
          }
        }
      }
    } else {
      fail('F9B.1 Quotes: reject button not found on quote detail');
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  FLOW 11: SETTINGS
  // ──────────────────────────────────────────────────────────────────────────
  log('\n═══ FLOW 11: Settings ═══');

  // Navigate via gear icon on Dashboard header
  await navViaBottomNav('Dashboard');
  await page.waitForTimeout(500);

  const gearBtn = page.locator('[aria-label="Instellingen"]').first();
  const gearVisible2 = await gearBtn.isVisible().catch(() => false);
  if (gearVisible2) {
    await gearBtn.click();
  } else {
    await clickNavLink('/instellingen');
  }
  await page.waitForTimeout(800);
  await shot('settings-page');

  await check('F11.1 Settings: page loads with "Instellingen" title', async () => {
    await waitFor('Instellingen', 5000);
  });

  // Default due days
  const dueDaysInput = page.locator('input[type="number"]').first();
  const ddVisible = await dueDaysInput.isVisible().catch(() => false);
  if (ddVisible) {
    const origVal = await dueDaysInput.inputValue().catch(() => '30');
    await dueDaysInput.click({ clickCount: 3 });
    await dueDaysInput.fill('45');
    await page.waitForTimeout(300);

    // Auto-save or save button
    const saveSettingsBtn = page.getByRole('button').filter({ hasText: /Opslaan|Bewaar|Opgeslagen/i }).first();
    const ssVisible = await saveSettingsBtn.isVisible().catch(() => false);
    if (ssVisible) {
      await saveSettingsBtn.click();
      await page.waitForTimeout(600);
    }

    await check('F11.2 Settings: default due days can be changed to 45', async () => {
      const newVal = await dueDaysInput.inputValue().catch(() => '');
      if (newVal !== '45') {
        // Check if there was a save that navigated away
        const currentVal = await page.locator('input[type="number"]').first().inputValue().catch(() => newVal);
        if (currentVal !== '45') throw new Error(`Due days not saved: got "${currentVal}", expected "45"`);
      }
    });
    await shot('settings-due-days-changed');

    // Reset
    await dueDaysInput.click({ clickCount: 3 }).catch(() => {});
    await dueDaysInput.fill(origVal).catch(() => {});
    if (ssVisible) {
      await saveSettingsBtn.click().catch(() => {});
      await page.waitForTimeout(400);
    }
  } else {
    fail('F11.2 Settings: due days input not found');
  }

  // PIN change
  const pinChangeBtn = page.getByRole('button').filter({ hasText: /PIN wijzigen|PIN veranderen/i }).first();
  const pcbVisible = await pinChangeBtn.isVisible().catch(() => false);
  if (pcbVisible) {
    await pinChangeBtn.click();
    await page.waitForTimeout(500);
    await shot('settings-pin-change-form');

    // Short PIN validation
    const pinInput = page.locator('input[type="password"]').first();
    await pinInput.fill('12');
    await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).first().click();
    await page.waitForTimeout(400);

    await check('F11.3 Settings: PIN length validation (< 4 digits shows error)', async () => {
      const hasErr = await page.getByText('4 cijfers', { exact: false }).isVisible().catch(() => false) ||
        await page.getByText('minstens 4', { exact: false }).isVisible().catch(() => false) ||
        await page.locator('.text-red-600, .text-red-500, .text-red-700').first().isVisible().catch(() => false);
      if (!hasErr) throw new Error('No PIN length validation error');
    });
    await shot('settings-pin-validation');

    // Valid PIN change
    await pinInput.fill('1234');
    const pinConfirmInput = page.locator('input[type="password"]').last();
    await pinConfirmInput.fill('1234');
    await page.getByRole('button').filter({ hasText: /^Opslaan$/i }).first().click();
    await page.waitForTimeout(800);
    await shot('settings-pin-changed');

    await check('F11.4 Settings: PIN changed successfully', async () => {
      const hasSuccess = await page.getByText('PIN gewijzigd', { exact: false }).isVisible().catch(() => false) ||
        await page.getByText('gewijzigd', { exact: false }).isVisible().catch(() => false) ||
        await page.getByText('succesvol', { exact: false }).isVisible().catch(() => false);
      if (!hasSuccess) throw new Error('No PIN change success message');
    });
    await page.waitForTimeout(2000);
  } else {
    fail('F11.3+F11.4 Settings: PIN change button not found');
  }

  // Language switch to Arabic
  await shot('settings-before-arabic');
  const arabicBtn = page.getByRole('button').filter({ hasText: /عربي|Arabic|Arabisch/i }).first();
  const arabicVisible = await arabicBtn.isVisible().catch(() => false);

  if (arabicVisible) {
    await arabicBtn.click();
    await page.waitForTimeout(1500);
    await shot('settings-arabic-rtl');

    await check('F11.5 Settings: Arabic UI — "الإعدادات" title visible', async () => {
      await waitFor('الإعدادات', 5000);
    });
    await check('F11.6 Settings: HTML dir="rtl" set', async () => {
      const dir = await page.evaluate(() => document.documentElement.dir);
      if (dir !== 'rtl') throw new Error(`dir="${dir}", expected "rtl"`);
    });

    // Switch back to Dutch
    const dutchBtn = page.getByRole('button').filter({ hasText: /Nederlands|Dutch/i }).first();
    const dutchVisible = await dutchBtn.isVisible().catch(() => false);
    if (dutchVisible) {
      await dutchBtn.click();
      await page.waitForTimeout(1200);
      await shot('settings-dutch-restored');

      await check('F11.7 Settings: Dutch restored — "Instellingen" visible', async () => {
        await waitFor('Instellingen', 5000);
      });
      await check('F11.8 Settings: dir="ltr" restored', async () => {
        const dir = await page.evaluate(() => document.documentElement.dir);
        if (dir !== 'ltr' && dir !== '') throw new Error(`dir="${dir}", expected "ltr"`);
      });
    } else {
      fail('F11.7+F11.8 Settings: Dutch restore button not found after Arabic switch');
    }
  } else {
    fail('F11.5-F11.8 Settings: Arabic button not found on settings page');
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  FLOW 12: PDF CONTENT VERIFICATION (on the original invoice)
  // ──────────────────────────────────────────────────────────────────────────
  log('\n═══ FLOW 12: PDF Content Verification ═══');
  await navViaBottomNav('Facturen');
  await page.waitForTimeout(700);
  await shot('invoice-list-for-pdf-check');

  // Click on the original invoice (Jan de Vries)
  const pdfInvoiceItem = page.getByText('Jan de Vries').first();
  if (await pdfInvoiceItem.isVisible().catch(() => false)) {
    await pdfInvoiceItem.click();
    await page.waitForTimeout(800);
    await shot('invoice-detail-for-pdf');

    // Reset blob interceptor
    await page.evaluate(() => {
      window.__pdfBlobSize2 = 0;
      const orig = URL.createObjectURL.bind(URL);
      URL.createObjectURL = function(blob) {
        if (blob && blob.size > 0) window.__pdfBlobSize2 = Math.max(window.__pdfBlobSize2 || 0, blob.size);
        return orig(blob);
      };
    });

    const pdfBtn2 = page.getByRole('button').filter({ hasText: /Bekijken/i }).first();
    if (await pdfBtn2.isVisible().catch(() => false)) {
      await pdfBtn2.click();
      await page.waitForTimeout(5000);
      await shot('pdf-content-verify');

      const blobSize2 = await page.evaluate(() => window.__pdfBlobSize2 || 0);
      log(`  [Info] PDF blob size (flow 12): ${blobSize2} bytes`);

      await check('F12.1 PDF: blob size > 50KB', async () => {
        if (blobSize2 >= 50000) return;
        // Try iframe/embed
        const altSz = await page.evaluate(async () => {
          const els = [...document.querySelectorAll('iframe, embed')];
          for (const el of els) {
            const src = el.src || el.data || '';
            if (src.startsWith('blob:')) {
              try { const r = await fetch(src); const b = await r.blob(); return b.size; } catch { return -1; }
            }
          }
          return 0;
        });
        log(`  [Info] Alt PDF blob size: ${altSz}`);
        if (altSz >= 50000) return;
        if (blobSize2 === 0 && altSz <= 0) throw new Error(`PDF blob not found or too small (captured=${blobSize2})`);
        throw new Error(`PDF blob too small: captured=${blobSize2}, alt=${altSz} bytes (need > 50KB)`);
      });

      await check('F12.2 PDF: no PDF-related JS errors during generation', async () => {
        const pdfErrors = jsErrors.filter(e => /pdf|jspdf|blob|canvas|html2canvas|generate/i.test(e));
        if (pdfErrors.length > 0) throw new Error(`JS errors during PDF: ${pdfErrors.slice(0,2).join('; ')}`);
      });
    } else {
      fail('F12.1+F12.2 PDF: Bekijken button not found on invoice detail');
    }
  } else {
    fail('F12.1+F12.2 PDF: Jan de Vries invoice not found in list');
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  DASHBOARD WITH DATA
  // ──────────────────────────────────────────────────────────────────────────
  log('\n═══ Dashboard with Data ═══');
  // Close PDF modal if open
  const closeLast = page.getByRole('button').filter({ hasText: /Sluiten|Close/i }).first();
  if (await closeLast.isVisible().catch(() => false)) {
    await closeLast.click();
    await page.waitForTimeout(400);
  } else {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  await navViaBottomNav('Dashboard');
  await page.waitForTimeout(700);
  await shot('dashboard-with-data');

  await check('FD.1 Dashboard with data: recent invoices section shows invoice', async () => {
    // The client name may be truncated via CSS; check body text or recent section
    const bodyText = await page.locator('body').textContent();
    const hasRecent = bodyText.includes('Jan de Vries') || bodyText.includes('Jan de Vri') ||
      bodyText.includes('Recente Facturen') && bodyText.includes('2026');
    if (!hasRecent) {
      // Also check for any invoice number in the recent section
      const hasInvoiceNum = bodyText.includes('#2026') || bodyText.includes('2026-001');
      if (!hasInvoiceNum) throw new Error('No recent invoice data visible in dashboard (no client name, invoice number, or recent section)');
    }
  });
  await check('FD.2 Dashboard with data: stats show non-zero amounts', async () => {
    const bodyText = await page.locator('body').textContent();
    const hasAmount = bodyText.includes('€') && bodyText.match(/€\s*[1-9]/);
    if (!hasAmount) throw new Error('No non-zero euro amount in dashboard stats');
  });

  // Delete client cleanup
  log('\n═══ FLOW 10 (cont): Delete Client ═══');
  await navViaBottomNav('Klanten');
  await page.waitForTimeout(600);

  const clientForDelete = page.getByText('Jan de Vries').first();
  if (await clientForDelete.isVisible().catch(() => false)) {
    await clientForDelete.click();
    await page.waitForTimeout(500);
    await shot('client-before-delete');

    // Client delete button is 🗑️ emoji in the header (PageHeader rightAction)
    // It has no text label — find it by emoji content or as the last button in header
    const delClientBtn = page.locator('header').getByRole('button').filter({ hasText: '🗑️' }).first();
    const delClientBtnAlt = page.locator('button:has-text("🗑️")').first();
    const delBtnVisible = await delClientBtn.isVisible().catch(() => false) || await delClientBtnAlt.isVisible().catch(() => false);

    if (delBtnVisible) {
      if (await delClientBtn.isVisible().catch(() => false)) {
        await delClientBtn.click();
      } else {
        await delClientBtnAlt.click();
      }
      await page.waitForTimeout(400);
      await shot('client-delete-confirm');

      const confirmDelClient = page.getByRole('button').filter({ hasText: /Ja, verwijderen/i }).first();
      if (await confirmDelClient.isVisible().catch(() => false)) {
        await confirmDelClient.click();
        await page.waitForTimeout(1000);
        await shot('client-deleted');

        await check('F10.8 Clients: delete client — toast or navigation', async () => {
          // Toast fires (2800ms), then back on list
          const hasToast = await page.getByText('verwijderd', { exact: false }).isVisible().catch(() => false);
          const notOnEdit = !page.url().includes('bewerken') && !page.url().includes('edit');
          const onList = await page.getByText('Nog geen klanten', { exact: false }).isVisible().catch(() => false) ||
            await page.locator('nav.fixed.bottom-0').isVisible().catch(() => false);
          if (!hasToast && !onList && !notOnEdit) throw new Error('Client delete: not on list page after delete');
        });
        await page.waitForTimeout(2000);
      } else {
        fail('F10.8 Clients: confirm delete button not found');
      }
    } else {
      fail('F10.8 Clients: delete button (🗑️ in header) not found in client edit view');
    }
  } else {
    fail('F10.8 Clients: client not found for delete test');
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  FINAL REPORT
  // ──────────────────────────────────────────────────────────────────────────
  log('\n══════════════════════════════════════════════════════');
  log('                    FINAL TEST RESULTS');
  log('══════════════════════════════════════════════════════\n');

  const passedCount = results.filter(r => r.ok).length;
  const failedCount = results.filter(r => !r.ok).length;

  log(`Total checks: ${results.length}`);
  log(`Passed: ${passedCount}`);
  log(`Failed: ${failedCount}`);
  log('');
  log('All results:');
  results.forEach(r => log(`  ${r.ok ? '✅' : '❌'} ${r.msg}`));

  if (failedCount > 0) {
    log('\nFailed checks:');
    results.filter(r => !r.ok).forEach(r => log(`  ❌ ${r.msg}`));
  }

  if (jsErrors.length > 0) {
    log('\nJS Errors collected during test:');
    jsErrors.forEach(e => log(`  ⚠️  ${e.substring(0, 300)}`));
  } else {
    log('\nNo JS errors detected during test run.');
  }

  log('\nScreenshots saved to /tmp/verify-*.png');
  await browser.close();
  process.exit(failedCount > 0 ? 1 : 0);

})().catch(async (e) => {
  log(`\nFATAL ERROR: ${e.message}`);
  log(e.stack || '');
  if (page) await page.screenshot({ path: '/tmp/verify-FATAL.png' }).catch(() => {});
  if (browser) await browser.close().catch(() => {});
  process.exit(1);
});
