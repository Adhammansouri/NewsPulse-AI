async page => {
  const failures = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  await page.route('**/api/openai/usage?**', async route => {
    const url = new URL(route.request().url());
    const start = url.searchParams.get('start'); const end = url.searchParams.get('end');
    const project = url.searchParams.get('project'); const projectId = project === 'organization' ? null : project || 'proj_newsplus';
    const ready = data => ({ status: 'ready', data });
    const dates = [];
    for (let time = Date.parse(start); time <= Date.parse(end); time += 86400000) dates.push(new Date(time).toISOString().slice(0, 10));
    const usage = Object.fromEntries(['completions','images','embeddings','moderations','audioSpeeches','audioTranscriptions','vectorStores','codeInterpreterSessions','fileSearchCalls','webSearchCalls'].map(key => [key, ready([])]));
    usage.completions = ready(dates.map((date, i) => ({ date, model: i % 2 ? 'gpt-5.6-sol' : 'gpt-5.4-mini', dimensions: {}, metrics: { input_tokens: 12500 * (i + 1), input_cached_tokens: 2500 * (i + 1), output_tokens: 2500 * (i + 1), num_model_requests: 8 * (i + 1) } })));
    usage.images = ready([{ date: start, model: 'gpt-image-1', dimensions: { size:'1024x1536', source:'image.generation' }, metrics:{ images:12,num_model_requests:4 } }]);
    usage.audioSpeeches = {status:'unauthorized',data:null};
    const costs = ready(dates.map((date, i) => ({ date, lineItem:'Text generation',projectId,amount: .75 * (i + 1),currency:'USD' })));
    const month = ready([{date:start,lineItem:'API',projectId,amount:84.25,currency:'USD'}]);
    await route.fulfill({json:{status:'success',data:{ configured:true,fetchedAt:new Date().toISOString(),timezone:'UTC',range:{start,end},scope:{projectId},defaultProjectId:'proj_newsplus',projects:ready([{id:'proj_newsplus',name:'Newsplus'}]),usage,costs,monthCosts:month,organizationMonthCosts:ready([{date:start,lineItem:'API',projectId:null,amount:125.5,currency:'USD'}]),organizationLimit:ready({amount:500,currency:'USD',enforcement:'enforcing'}),projectLimit:projectId ? ready({amount:200,currency:'USD',enforcement:'enforcing'}) : {status:'project-required',data:null},rateLimits:projectId ? ready([{model:'gpt-5.6-sol',requestsPerMinute:500,tokensPerMinute:200000,requestsPerDay:10000,imagesPerMinute:null,audioMegabytesPerMinute:null,batchTokensPerDay:1000000}]) : {status:'project-required',data:null} }}});
  });
  await page.getByRole('button', {name:'آخر 7 أيام',exact:true}).click();
  await page.getByRole('button', {name:'تحديث',exact:true}).click();
  await page.locator('.usage-hero-number').filter({hasText:'$21.00'}).waitFor();
  assert(await page.locator('.usage-stat-stack').innerText().then(text=>text.includes('12')), 'Images field is displayed');
  await page.evaluate(()=>document.fonts.ready);
  for (const theme of ['light','dark']) {
    await page.evaluate(theme=>{ document.documentElement.dataset.theme=theme; localStorage.setItem('newsplus-theme',theme); }, theme);
    for (const width of [1440,768,390,360]) {
      await page.setViewportSize({width,height:1000});
      await page.locator('.usage-heading').scrollIntoViewIfNeeded();
      const overflow = await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth);
      assert(!overflow, `No page overflow at ${width} ${theme}`);
      const clipped = await page.evaluate(() => [...document.querySelectorAll('.usage-page,.usage-heading,.usage-toolbar,.usage-overview,.usage-panel')].map(el=>el.getBoundingClientRect()).some(rect=>rect.left < -1 || rect.right > innerWidth+1));
      assert(!clipped, `No clipped sections at ${width} ${theme}`);
      await page.screenshot({path:`.playwright-cli/usage-${theme}-${width}.png`});
      failures.push({width,theme,overflow});
    }
  }
  await page.setViewportSize({width:1440,height:1100});
  await page.evaluate(()=>{document.documentElement.dataset.theme='light';localStorage.setItem('newsplus-theme','light');});
  await page.getByRole('button',{name:'التوكنز',exact:true}).click();
  await page.locator('.usage-chart-day').first().click();
  assert((await page.locator('.usage-day-readout').innerText()).includes('15,000'), 'Cached tokens are not double-counted in the daily chart');
  await page.locator('.usage-chart-section').scrollIntoViewIfNeeded();
  await page.screenshot({path:'.playwright-cli/usage-chart-desktop.png'});
  const downloadEvent=page.waitForEvent('download');
  await page.getByRole('button',{name:'تصدير CSV',exact:true}).click();
  const download=await downloadEvent;
  assert(download.suggestedFilename().endsWith('.csv'), 'CSV download');
  await download.saveAs('.playwright-cli/usage-fixture.csv');
  await Promise.all([page.waitForResponse(response=>response.url().includes('/api/openai/usage') && response.ok()),page.getByRole('button',{name:'اليوم',exact:true}).click()]);
  await page.locator('.usage-chart-day').first().waitFor();
  assert(await page.locator('.usage-chart-day').count() === 1, 'Today selects one UTC day');
  await page.locator('.usage-project select').selectOption('organization');
  await page.getByText('اختر مشروعاً لعرض هذه البيانات',{exact:true}).waitFor();
  assert(!(await page.locator('.usage-budget').allTextContents()).some(text=>text.includes('المشروع المحدد')), 'Organization view does not mix project spend limit');
  await page.getByRole('button',{name:'آخر 7 أيام',exact:true}).click();
  await page.getByRole('heading',{name:'حدود السرعة لكل نموذج'}).scrollIntoViewIfNeeded();
  await page.screenshot({path:'.playwright-cli/usage-details-desktop.png'});
  assert(errors.length === 0, `No runtime errors: ${errors.join(',')}`);
  await page.unroute('**/api/openai/usage?**');
  await page.reload();
  return {checks:failures,interactions:['daily chart','CSV export','UTC today','organization scope'],errors};
}
